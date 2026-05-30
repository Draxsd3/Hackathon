import { useEffect } from 'react';
import { X } from 'lucide-react';

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return undefined;

    const handler = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', handler);

    // Trava o scroll do body enquanto o modal estiver aberto pra evitar
    // que o usuario role a pagina atras e perca contexto.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClass = SIZES[size] || SIZES.md;

  return (
    // z-50 garante que o modal fique acima de headers sticky / sidebar.
    // overflow-y-auto no wrapper externo permite scroll quando a viewport
    // for menor que o modal (mobile em landscape, por exemplo).
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={`relative z-10 my-auto flex max-h-[calc(100vh-2rem)] w-full ${sizeClass} flex-col overflow-hidden rounded-xl bg-white shadow-2xl`}
      >
        <header className="flex flex-none items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
          <h2 id="modal-title" className="truncate text-base font-semibold text-slate-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex-none rounded p-1 text-slate-500 transition hover:bg-slate-100"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer && (
          <footer className="flex flex-none flex-wrap justify-end gap-2 border-t border-slate-200 bg-white px-6 py-3">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
