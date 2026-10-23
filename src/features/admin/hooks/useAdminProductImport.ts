import { useRef, useState } from 'react';
import { ApiError } from '@/shared/api/client';
import type { ProductImportFile, ProductImportIssue, ProductImportResult } from '../../../../shared/product-import';
import { downloadProductTemplate, getProductImportTemplate, importProductFile, readProductImportFile } from '../admin-api.service';

export function useAdminProductImport(onImported: () => Promise<void>) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [downloadError, setDownloadError] = useState<unknown>(null);
  const [file, setFile] = useState<ProductImportFile | null>(null);
  const [preview, setPreview] = useState<ProductImportResult | null>(null);
  const [complete, setComplete] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const busy = useRef(false);
  const downloadingRef = useRef(false);
  const download = async () => {
    if (downloadingRef.current) return;
    downloadingRef.current = true; setDownloading(true); setDownloadError(null);
    try { downloadProductTemplate(await getProductImportTemplate()); }
    catch (cause) { setDownloadError(cause); }
    finally { downloadingRef.current = false; setDownloading(false); }
  };
  const choose = async (selected: File) => {
    if (busy.current) return;
    busy.current = true; setPending(true); setError(null); setFile(null); setPreview(null); setComplete(false); setUncertain(false);
    try {
      const input = await readProductImportFile(selected);
      setFile(input);
      setPreview(await importProductFile(input, true));
    } catch (cause) { setError(cause); }
    finally { busy.current = false; setPending(false); }
  };
  const submit = async () => {
    if (busy.current || !file || !preview || complete || uncertain) return;
    busy.current = true; setPending(true); setError(null);
    try {
      const result = await importProductFile(file, false);
      setPreview(result); setComplete(true);
      await onImported();
    } catch (cause) {
      setError(cause);
      if (cause instanceof ApiError && ['NETWORK', 'TIMEOUT', 'BAD_RESPONSE', 'INTERNAL'].includes(cause.code)) setUncertain(true);
      else setPreview(null);
    } finally { busy.current = false; setPending(false); }
  };
  const issues: ProductImportIssue[] = error instanceof ApiError && Array.isArray(error.details)
    ? error.details.filter((item): item is ProductImportIssue => item && typeof item.path === 'string' && typeof item.message === 'string').slice(0, 100) : [];
  const show = () => { if (!busy.current) { setFile(null); setPreview(null); setComplete(false); setUncertain(false); setError(null); setOpen(true); } };
  return { open, setOpen, show, choose, submit, download, pending, downloading, error, downloadError, issues, file, preview, complete, uncertain };
}
