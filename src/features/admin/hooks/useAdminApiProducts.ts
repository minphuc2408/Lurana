import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useCatalog } from '@/features/shop';
import { normalizeSearch } from '@/shared/i18n';
import { ApiError } from '@/shared/api/client';
import { buildVariantPatch, inputInteger, rebaseVariantDraft, variantDraft } from '../admin-api.adapters';
import { createAdminProduct, getAdminProducts, patchAdminProduct, patchAdminVariant, requestImageUploadTicket } from '../admin-api.service';
import { uploadProductImage, validateProductImage } from '../product-image.service';
import type { AdminProduct, AdminVariant, ProductForm, VariantDraft } from '../admin-api.types';

const emptyProduct = (categoryId = ''): ProductForm => ({ name_en: '', name_vi: '', slug: '', category_id: categoryId, image_url: '', status: 'ACTIVE', is_featured: false,
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
  const [form, setForm] = useState<ProductForm>(emptyProduct());
  const [formError, setFormError] = useState<unknown>(null);
  const [formPending, setFormPending] = useState(false);
  const [imagePending, setImagePending] = useState(false);
  const [imageError, setImageError] = useState<unknown>(null);
  const [imageUploaded, setImageUploaded] = useState(false);
  const imageController = useRef<AbortController | null>(null);
  useEffect(() => () => { imageController.current?.abort(); }, []);
  const selectImage = async (file?: File) => {
    if (!file || imageController.current || formInFlight.current) return;
    const controller = new AbortController();
    imageController.current = controller;
    setImagePending(true); setImageError(null); setImageUploaded(false);
    try {
      validateProductImage(file);
      const ticket = await requestImageUploadTicket(file, controller.signal);
      const url = await uploadProductImage(file, ticket, controller.signal);
      if (!controller.signal.aborted) {
        setForm(current => ({ ...current, image_url: url }));
        setImageUploaded(true);
      }
    } catch (cause) { if (!controller.signal.aborted) setImageError(cause); }
    finally {
      imageController.current = null;
      if (!controller.signal.aborted) setImagePending(false);
    }
  };
  const saving = useRef(new Set<number>());
  const formInFlight = useRef(false);
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
  const openCreate = () => { if (saving.current.size > 0 || imageController.current) return; setImageError(null); setImageUploaded(false); setEditing(null); setForm(emptyProduct(String(catalog.categories[0]?.id ?? ''))); setFormError(null); setDialogOpen(true); };
  const openEdit = (product: AdminProduct) => {
    if (saving.current.size > 0 || imageController.current) return;
    setImageError(null); setImageUploaded(false);
    setEditing(product); setForm({ ...emptyProduct(String(product.category_id)), name_en: product.name_en, name_vi: product.name_vi, slug: product.slug,
      image_url: (product.images.find(image => image.is_primary) ?? product.images[0])?.url ?? '', status: product.status, is_featured: product.is_featured });
    setFormError(null); setDialogOpen(true);
  };
  const saveProduct = async (event: FormEvent) => {
    event.preventDefault();
    if (formInFlight.current || imageController.current) return;
    formInFlight.current = true; setFormPending(true); setFormError(null);
    generation.current++;
    try {
      if (editing) {
        const patch: Record<string, unknown> = {};
        for (const field of ['name_en', 'name_vi', 'status', 'is_featured'] as const) if (form[field] !== editing[field]) patch[field] = form[field];
        const oldImage = (editing.images.find(image => image.is_primary) ?? editing.images[0])?.url ?? '';
        if (form.image_url !== oldImage) patch.image = { url: form.image_url };
        if (Object.keys(patch).length > 0) await patchAdminProduct(editing.id, patch);
      } else await createAdminProduct({ name_en: form.name_en, name_vi: form.name_vi, slug: form.slug, category_id: inputInteger(form.category_id),
        status: form.status, is_featured: form.is_featured, image: { url: form.image_url },
        variants: form.variants.map(variant => ({ ...variant, price: inputInteger(variant.price), stock_quantity: inputInteger(variant.stock_quantity), low_stock_threshold: inputInteger(variant.low_stock_threshold) })) });
      await load(undefined, true); catalog.reload(); setDialogOpen(false);
    } catch (cause) { setFormError(cause); }
    finally { formInFlight.current = false; setFormPending(false); }
  };
  const filtered = products.filter(product => [product.name_en, product.name_vi, product.slug, ...product.variants.map(variant => variant.sku)].some(value => normalizeSearch(value).includes(normalizeSearch(search))));
  return { products: filtered, loading, error, reload: () => void load(), search, setSearch, drafts, updateDraft, saveVariant,
    savingIds, variantErrors, savedIds, uncertainIds, reconciledIds, recheckVariant, dialogOpen, setDialogOpen, editing, form, setForm, formError, formPending, openCreate, openEdit, saveProduct,
    imagePending, imageError, imageUploaded, selectImage,
    categories: catalog.categories, categoriesLoading: catalog.loading, categoriesError: catalog.error, retryCategories: catalog.reload };
}
export type AdminApiProductsModel = ReturnType<typeof useAdminApiProducts>;
