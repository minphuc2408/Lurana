import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { MAX_PRODUCT_IMAGES, adminProductImageSchema } from '../../../../shared/admin-catalog-schemas';
import { useCatalog } from '@/features/shop';
import { normalizeSearch } from '@/shared/i18n';
import { ApiError } from '@/shared/api/client';
import { buildProductSlug, buildVariantPatch, inputInteger, rebaseVariantDraft, variantDraft } from '../admin-api.adapters';
import { createAdminProduct, getAdminProducts, patchAdminProduct, patchAdminVariant, requestImageUploadTicket } from '../admin-api.service';
import { uploadProductImage, validateProductImage } from '../product-image.service';
import type { AdminProduct, AdminVariant, ProductForm, VariantDraft } from '../admin-api.types';
import { useAdminProductImport } from './useAdminProductImport';

const emptyProduct = (categoryId = ''): ProductForm => ({ name_en: '', name_vi: '', category_id: categoryId, image_url: '', images: [], status: 'ACTIVE', is_featured: false,
  variants: (['S', 'M', 'L'] as const).map(size_code => ({ size_code, sku: '', price: '', stock_quantity: '0', low_stock_threshold: '5' })) });

export function useAdminApiProducts() {
  const catalog = useCatalog();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [drafts, setDrafts] = useState<Record<number, VariantDraft>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [search, setSearch] = useState('');
  const [savingIds, setSavingIds] = useState<number[]>([]);
  const [variantErrors, setVariantErrors] = useState<Record<number, unknown>>({});
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [uncertainIds, setUncertainIds] = useState<number[]>([]);
  const [reconciledIds, setReconciledIds] = useState<number[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [initialSection, setInitialSection] = useState('general');
  const [form, setForm] = useState<ProductForm>(emptyProduct());
  const [formError, setFormError] = useState<unknown>(null);
  const [formPending, setFormPending] = useState(false);
  const [imagePending, setImagePending] = useState(false);
  const [imageError, setImageError] = useState<unknown>(null);
  const [imageUploaded, setImageUploaded] = useState(false);
  const imageController = useRef<AbortController | null>(null);
  useEffect(() => () => { imageController.current?.abort(); }, []);
  const selectImages = async (files: File[]) => {
    if (!files.length || imageController.current || formInFlight.current) return;
    const controller = new AbortController();
    imageController.current = controller;
    setImagePending(true); setImageError(null); setImageUploaded(false);
    try {
      if (form.images.length + files.length > MAX_PRODUCT_IMAGES) throw new ApiError('IMAGE_LIMIT', 'Too many images.');
      files.forEach(validateProductImage);
      for (const file of files) {
        const ticket = await requestImageUploadTicket(file, controller.signal);
        const image = await uploadProductImage(file, ticket, controller.signal);
        if (controller.signal.aborted) return;
        setForm(current => ({ ...current, images: [...current.images, { ...image, is_primary: current.images.length === 0 }] }));
        setFormError(null); setImageUploaded(true);
      }
    } catch (cause) { if (!controller.signal.aborted) setImageError(cause); }
    finally { imageController.current = null; setImagePending(false); }
  };
  const addImageUrl = () => {
    if (imageController.current || formInFlight.current) return;
    const result = adminProductImageSchema.safeParse({ url: form.image_url.trim() });
    if (!result.success) { setImageError(new ApiError('VALIDATION_ERROR', 'Invalid image URL.')); return; }
    if (form.images.length >= MAX_PRODUCT_IMAGES) { setImageError(new ApiError('IMAGE_LIMIT', 'Too many images.')); return; }
    if (form.images.some(image => image.url === result.data.url)) { setImageError(new ApiError('IMAGE_DUPLICATE', 'Duplicate image.')); return; }
    setForm(current => ({ ...current, image_url: '', images: [...current.images, { ...result.data, is_primary: current.images.length === 0 }] }));
    setImageError(null);
  };
  const primaryImage = (index: number) => setForm(current => ({ ...current, images: current.images.map((image, i) => ({ ...image, is_primary: i === index })) }));
  const removeImage = (index: number) => setForm(current => {
    const removed = current.images[index];
    const images = current.images.filter((_, i) => i !== index);
    return { ...current, images: removed?.is_primary ? images.map((image, i) => ({ ...image, is_primary: i === 0 })) : images };
  });
  const moveImage = (index: number, direction: -1 | 1) => setForm(current => {
    const target = index + direction;
    if (target < 0 || target >= current.images.length) return current;
    const images = [...current.images]; [images[index], images[target]] = [images[target], images[index]];
    return { ...current, images };
  });
  const saving = useRef(new Set<number>());
  const formInFlight = useRef(false);
  const productSlug = useRef<string | null>(null);
  const generation = useRef(0);
  const productsRef = useRef(products);
  productsRef.current = products;
  const load = useCallback(async (signal?: AbortSignal, preserveDrafts = false) => {
    const revision = ++generation.current;
    setLoading(true); setError(null);
    try {
      const result = await getAdminProducts(signal);
      if (!signal?.aborted && revision === generation.current) {
        const previous = new Map(productsRef.current.flatMap(product => product.variants.map(variant => [variant.id, variant] as const)));
        setProducts(result.items);
        setDrafts(current => Object.fromEntries(result.items.flatMap(product => product.variants.map(variant => [variant.id,
          preserveDrafts && previous.has(variant.id) && current[variant.id] ? rebaseVariantDraft(previous.get(variant.id)!, current[variant.id], variant) : variantDraft(variant)]))));
        setUncertainIds([]); setVariantErrors({});
      }
    } catch (cause) { if (!signal?.aborted && revision === generation.current) setError(cause); }
    finally { if (!signal?.aborted && revision === generation.current) setLoading(false); }
  }, []);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => { controller.abort(); generation.current++; }; }, [load]);
  const updateDraft = (id: number, change: Partial<VariantDraft>) => { setDrafts(current => ({ ...current, [id]: { ...current[id], ...change } })); setSavedIds(current => current.filter(value => value !== id)); setReconciledIds(current => current.filter(value => value !== id)); };
  const reconcileVariant = async (variant: AdminVariant, draft: VariantDraft, unlock = true) => {
    const result = await getAdminProducts();
    const fresh = result.items.flatMap(product => product.variants).find(item => item.id === variant.id);
    if (!fresh) throw new ApiError('NOT_FOUND', 'Variant unavailable.');
    setProducts(current => current.map(product => ({ ...product, variants: product.variants.map(item => item.id === fresh.id ? fresh : item) })));
    setDrafts(current => ({ ...current, [fresh.id]: rebaseVariantDraft(variant, draft, fresh, true) }));
    if (unlock) {
      setUncertainIds(current => current.filter(id => id !== fresh.id));
      setReconciledIds(current => [...current.filter(id => id !== fresh.id), fresh.id]);
    }
  };
  const recheckVariant = async (variant: AdminVariant) => {
    if (saving.current.has(variant.id)) return;
    saving.current.add(variant.id); setSavingIds(current => [...current, variant.id]);
    try { await reconcileVariant(variant, drafts[variant.id] ?? variantDraft(variant)); setVariantErrors(current => ({ ...current, [variant.id]: null })); }
    catch (cause) { setVariantErrors(current => ({ ...current, [variant.id]: cause })); }
    finally { saving.current.delete(variant.id); setSavingIds(current => current.filter(id => id !== variant.id)); }
  };
  const saveVariant = async (variant: AdminVariant) => {
    if (saving.current.has(variant.id) || uncertainIds.includes(variant.id)) return;
    generation.current++;
    saving.current.add(variant.id); setSavingIds(current => [...current, variant.id]); setVariantErrors(current => ({ ...current, [variant.id]: null }));
    const submittedDraft = drafts[variant.id] ?? variantDraft(variant);
    let submitted = false;
    try {
      const patch = buildVariantPatch(variant, submittedDraft);
      if (Object.keys(patch).length === 0) return;
      submitted = true;
      const saved = await patchAdminVariant(variant.id, patch);
      setProducts(current => current.map(product => ({ ...product, variants: product.variants.map(item => item.id === saved.id ? saved : item) })));
      setDrafts(current => ({ ...current, [saved.id]: variantDraft(saved) }));
      setSavedIds(current => [...current, saved.id]); catalog.reload();
    } catch (cause) {
      setVariantErrors(current => ({ ...current, [variant.id]: cause }));
      if (submitted && cause instanceof ApiError && ['NETWORK', 'TIMEOUT', 'BAD_RESPONSE', 'INTERNAL'].includes(cause.code)) {
        setUncertainIds(current => [...current, variant.id]);
        setDrafts(current => ({ ...current, [variant.id]: { ...submittedDraft, stock_delta: '0' } }));
        try { await reconcileVariant(variant, submittedDraft, false); } catch { /* Keep this row locked until a canonical read succeeds. */ }
      }
    }
    finally { saving.current.delete(variant.id); setSavingIds(current => current.filter(id => id !== variant.id)); }
  };
  const productImport = useAdminProductImport(async () => { await load(undefined, true); catalog.reload(); });
  const openCreate = () => { if (saving.current.size > 0 || imageController.current) return; setInitialSection('general'); productSlug.current = null; setImageError(null); setImageUploaded(false); setEditing(null); setForm(emptyProduct(String(catalog.categories[0]?.id ?? ''))); setFormError(null); setDialogOpen(true); };
  const openEdit = (product: AdminProduct, section = 'general') => {
    if (saving.current.size > 0 || imageController.current) return;
    setInitialSection(section); setImageError(null); setImageUploaded(false);
    setEditing(product); setForm({ ...emptyProduct(String(product.category_id)), name_en: product.name_en, name_vi: product.name_vi,
      image_url: '', images: product.images.map(({ url, alt_vi, alt_en, cloudinary_public_id, is_primary }) => ({ url, alt_vi, alt_en, cloudinary_public_id, is_primary })), status: product.status, is_featured: product.is_featured });
    setFormError(null); setDialogOpen(true);
  };
  const saveProduct = async (event: FormEvent) => {
    event.preventDefault();
    if (formInFlight.current || imageController.current) return;
    const images = form.image_url.trim() ? [...form.images, { url: form.image_url.trim(), is_primary: form.images.length === 0 }] : form.images;
    if (!images.length && (!editing || editing.images.length > 0)) { setFormError(new ApiError('IMAGE_REQUIRED', 'Upload a product image before saving.')); return; }
    if (images.length > MAX_PRODUCT_IMAGES) { setFormError(new ApiError('IMAGE_LIMIT', 'Too many images.')); return; }
    formInFlight.current = true; setFormPending(true); setFormError(null);
    generation.current++;
    try {
      if (editing) {
        const patch: Record<string, unknown> = {};
        for (const field of ['name_en', 'name_vi', 'status', 'is_featured'] as const) if (form[field] !== editing[field]) patch[field] = form[field];
        const original = editing.images.map(({ url, alt_vi, alt_en, cloudinary_public_id, is_primary }) => ({ url, alt_vi, alt_en, cloudinary_public_id, is_primary }));
        if (JSON.stringify(images) !== JSON.stringify(original)) patch.images = images;
        if (Object.keys(patch).length > 0) await patchAdminProduct(editing.id, patch);
      } else await createAdminProduct({ name_en: form.name_en, name_vi: form.name_vi, slug: productSlug.current ??= buildProductSlug(form.name_en || form.name_vi), category_id: inputInteger(form.category_id),
        status: form.status, is_featured: form.is_featured, images,
        variants: form.variants.map(variant => ({ ...variant, price: inputInteger(variant.price), stock_quantity: inputInteger(variant.stock_quantity), low_stock_threshold: inputInteger(variant.low_stock_threshold) })) });
      await load(undefined, true); catalog.reload(); setDialogOpen(false);
    } catch (cause) { setFormError(cause); }
    finally { formInFlight.current = false; setFormPending(false); }
  };
  const filtered = products.filter(product => [product.name_en, product.name_vi, product.slug, ...product.variants.map(variant => variant.sku)].some(value => normalizeSearch(value).includes(normalizeSearch(search))));
  return { products: filtered, loading, error, reload: () => void load(), search, setSearch, drafts, updateDraft, saveVariant,
    savingIds, variantErrors, savedIds, uncertainIds, reconciledIds, recheckVariant, dialogOpen, setDialogOpen, editing, form, setForm, formError, formPending, openCreate, openEdit, saveProduct,
    imagePending, imageError, imageUploaded, selectImages, addImageUrl, primaryImage, removeImage, moveImage,
    initialSection, productImport, categories: catalog.categories, categoriesLoading: catalog.loading, categoriesError: catalog.error, retryCategories: catalog.reload };
}
export type AdminApiProductsModel = ReturnType<typeof useAdminApiProducts>;
