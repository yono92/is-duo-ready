'use client';

import { useEffect, useRef, useState } from 'react';

// Astryx fields are controlled. Bridge native form reset (including successful
// React server actions) for fields whose value is owned by the form.
export function useFormValue<T, E extends HTMLElement>(value: T | undefined, initial: T) {
  const [local, setLocal] = useState(initial);
  const ref = useRef<E>(null);
  useEffect(() => {
    const form = ref.current?.closest('form');
    const reset = () => setLocal(initial);
    form?.addEventListener('reset', reset);
    return () => form?.removeEventListener('reset', reset);
  }, [initial]);
  return { value: value ?? local, setValue: setLocal, ref };
}
