import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import * as Select from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

type OptionProps = { value?: string | number; disabled?: boolean; label?: string; children?: ReactNode };
interface DropdownProps {
  value?: string | number;
  onValueChange: (value: string) => void;
  children: ReactNode;
  name?: string;
  id?: string;
  form?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
  triggerContent?: ReactNode;
  placeholder?: string;
  'aria-label'?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}
const emptyValue = '__lunarra_empty_option__';

/** Native option children keep labels/values close to the owning feature. */
export function Dropdown({ value = '', onValueChange, children, name, id, form, required, disabled, className, contentClassName, triggerContent, placeholder, ...aria }: DropdownProps) {
  const options = Children.toArray(children).filter((child): child is ReactElement<OptionProps> => isValidElement(child) && child.type === 'option');
  const empty = options.find(option => String(option.props.value ?? '') === '');
  const selected = String(value) === '' && empty && !required ? emptyValue : String(value);
  const items = options.filter(option => !required || String(option.props.value ?? '') !== '');
  return <Select.Root value={selected} onValueChange={next => onValueChange(next === emptyValue ? '' : next)} name={name} form={form} required={required} disabled={disabled || !items.length}>
    <Select.Trigger {...aria} id={id} name={name} data-dropdown data-dropdown-name={name} className={cn('flex min-h-11 w-full min-w-0 items-center justify-between gap-3 rounded-full border border-lunara-border bg-lunara-control-surface px-4 py-3 text-left font-body text-sm text-lunara-body shadow-none focus-visible:border-lunara-rose focus-visible:outline-2 focus-visible:outline-lunara-rose-light disabled:opacity-50 [&>span:first-child]:truncate', className)}>
      <Select.Value placeholder={placeholder || empty?.props.label || empty?.props.children}>{triggerContent}</Select.Value>
      <Select.Icon><ChevronDown size={15} aria-hidden="true" className="shrink-0" /></Select.Icon>
    </Select.Trigger>
    <Select.Portal>
      <Select.Content position="popper" sideOffset={8} collisionPadding={12} className={cn("z-[100] max-h-[min(20rem,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-24px)] overflow-hidden rounded-2xl border border-lunara-border bg-lunara-cream p-1.5 font-body text-lunara-body shadow-lg", contentClassName)}>
        <Select.ScrollUpButton className="flex justify-center py-1"><ChevronUp size={16} /></Select.ScrollUpButton>
        <Select.Viewport>
          {items.map((option, index) => <Select.Item key={String(option.props.value ?? index)} value={String(option.props.value ?? '') || emptyValue} disabled={option.props.disabled} data-value={String(option.props.value ?? '')} className="relative flex min-h-11 items-center gap-3 rounded-xl py-2.5 pr-9 pl-4 text-sm outline-none select-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-45 data-[highlighted]:bg-lunara-control-surface data-[state=checked]:bg-lunara-blush data-[state=checked]:font-medium data-[state=checked]:text-lunara-rose-strong">
            <Select.ItemText>{option.props.label || option.props.children}</Select.ItemText>
            <Select.ItemIndicator className="absolute right-3"><Check size={15} aria-hidden="true" /></Select.ItemIndicator>
          </Select.Item>)}
        </Select.Viewport>
        <Select.ScrollDownButton className="flex justify-center py-1"><ChevronDown size={16} /></Select.ScrollDownButton>
      </Select.Content>
    </Select.Portal>
  </Select.Root>;
}
