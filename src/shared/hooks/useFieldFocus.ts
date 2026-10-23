import { useEffect, useRef } from 'react';

/** Keep keyboard focus visible while avoiding a pointer-only outline on form fields. */
export function useFieldFocus({ documentScope = false }: { documentScope?: boolean } = {}) {
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const form = documentScope ? document.documentElement : formRef.current;
    if (!form) return;
    const pointer = () => { form.dataset.focusMethod = 'pointer'; };
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Tab' || documentScope && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter', ' ', 'Escape'].includes(event.key)) form.dataset.focusMethod = 'keyboard';
    };
    form.addEventListener('pointerdown', pointer, true);
    document.addEventListener('keydown', keyboard, true);
    return () => {
      form.removeEventListener('pointerdown', pointer, true);
      document.removeEventListener('keydown', keyboard, true);
      if (documentScope) delete form.dataset.focusMethod;
    };
  }, [documentScope]);
  return formRef;
}
