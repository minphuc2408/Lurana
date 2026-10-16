import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

interface ComboboxProps {
  name: string;
  label: string;
  placeholder: string;
  emptyText: string;
  value: string;
  options: { value: string; label: string }[];
  onValueChange: (value: string) => void;
  normalize: (value: string) => string;
  disabled?: boolean;
}

/** Search text is local; only selecting an option commits its value. */
export function Combobox({ name, label, placeholder, emptyText, value, options, onValueChange, normalize, disabled }: ComboboxProps) {
  const id = useId();
  const [query, setQuery] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const list = useRef<HTMLUListElement>(null);
  const selected = options.find(option => option.value === value);
  const visible = options.filter(option => normalize(option.label).includes(normalize(query || '')));
  useEffect(() => { if (open) list.current?.children[active]?.scrollIntoView({ block: 'nearest' }); }, [active, open]);
  const choose = (next: string) => { onValueChange(next); setQuery(null); setOpen(false); setActive(0); };
  return <div className="relative min-w-0" onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) { setOpen(false); setQuery(null); }
  }}>
    <label htmlFor={id} className="block text-sm text-lunara-body">{label}</label>
    <div className="relative mt-2">
      <input id={id} name={name} role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={`${id}-list`}
        aria-activedescendant={open && visible[active] ? `${id}-option-${active}` : undefined}
        autoComplete="off" disabled={disabled} placeholder={placeholder} value={query ?? selected?.label ?? ''}
        onFocus={() => { setOpen(true); setActive(0); }} onClick={() => setOpen(true)}
        onChange={event => { setQuery(event.target.value); setOpen(true); setActive(0); if (value) onValueChange(''); }}
        onKeyDown={event => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault(); setOpen(true);
            setActive(previous => !open ? 0 : visible.length ? (previous + (event.key === 'ArrowDown' ? 1 : -1) + visible.length) % visible.length : 0);
          } else if (event.key === 'Enter' && open) {
            event.preventDefault(); if (visible[active]) choose(visible[active].value);
          } else if (event.key === 'Escape') { event.preventDefault(); setOpen(false); setQuery(null); }
        }}
        className="min-h-11 w-full rounded-xl border border-lunara-border bg-lunara-surface py-3 pr-10 pl-4 text-sm text-lunara-ink disabled:opacity-50" />
      <ChevronDown size={16} aria-hidden="true" className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-lunara-body" />
    </div>
    {open && !disabled && <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-lunara-border bg-lunara-cream shadow-lg">
      <ul ref={list} id={`${id}-list`} role="listbox" aria-label={label} className="max-h-60 overflow-y-auto p-1.5">
        {visible.map((option, index) => <li key={option.value} id={`${id}-option-${index}`} role="option" aria-selected={option.value === value}
          onMouseDown={event => event.preventDefault()} onMouseMove={() => setActive(index)} onClick={() => choose(option.value)}
          className={`flex min-h-11 items-center justify-between rounded-lg px-3 py-2 text-sm text-lunara-ink ${index === active ? 'bg-lunara-blush' : ''}`}>
          {option.label}{option.value === value && <Check size={15} aria-hidden="true" />}
        </li>)}
      </ul>
      {!visible.length && <p role="status" className="px-4 py-3 text-sm text-lunara-body">{emptyText}</p>}
    </div>}
  </div>;
}
