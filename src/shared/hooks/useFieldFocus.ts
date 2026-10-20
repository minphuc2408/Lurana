import { useEffect, useRef } from 'react';

/** Keep keyboard focus visible while avoiding a pointer-only outline on form fields. */
export function useFieldFocus() {
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const pointer = () => { form.dataset.focusMethod = 'pointer'; };
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Tab') form.dataset.focusMethod = 'keyboard';
    };
    form.addEventListener('pointerdown', pointer, true);
    document.addEventListener('keydown', keyboard, true);
    return () => {
      form.removeEventListener('pointerdown', pointer, true);
      document.removeEventListener('keydown', keyboard, true);
    };
  }, []);
  return formRef;
}
