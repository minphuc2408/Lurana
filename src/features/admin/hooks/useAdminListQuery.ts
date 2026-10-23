import { useEffect, useRef, useState } from 'react';
export function useAdminListQuery(initialSize: number) {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState<Record<string, string>>({ limit: String(initialSize), offset: '0', filter: 'all' });
  const queryRef = useRef(query); queryRef.current = query;
  useEffect(() => {
    const timer = setTimeout(() => setQuery(current => (current.q ?? '') === search.trim() ? current : { ...current, q: search.trim(), offset: '0' }), 250);
    return () => clearTimeout(timer);
  }, [search]);
  const size = Number(query.limit), offset = Number(query.offset);
  return { query, queryRef, search, setSearch, filter: query.filter,
    setFilter: (filter: string) => setQuery(current => ({ ...current, filter, offset: '0' })),
    page: Math.floor(offset / size), pageSize: size,
    setPage: (page: number) => setQuery(current => ({ ...current, offset: String(Math.max(0, Math.min(10000, page * Number(current.limit)))) })),
    setPageSize: (size: number) => setQuery(current => ({ ...current, limit: String(size), offset: '0' })),
    clamp: (total: number) => { if (offset > 0 && offset >= total) { setQuery(current => ({ ...current, offset: String(Math.floor(Math.max(0, total - 1) / size) * size) })); return true; } return false; },
  };
}
