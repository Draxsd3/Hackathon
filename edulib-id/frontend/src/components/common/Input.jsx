export function Input({ label, hint, error, id, className = '', ...rest }) {
  const inputId = id || `input-${rest.name || Math.random().toString(36).slice(2, 8)}`;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
        </label>
      )}
      <input id={inputId} className={`input ${error ? 'border-red-400 focus:ring-red-200' : ''}`} {...rest} />
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function Select({ label, hint, error, id, className = '', children, ...rest }) {
  const inputId = id || `select-${rest.name || Math.random().toString(36).slice(2, 8)}`;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
        </label>
      )}
      <select id={inputId} className={`input ${error ? 'border-red-400 focus:ring-red-200' : ''}`} {...rest}>
        {children}
      </select>
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function TextArea({ label, hint, error, id, className = '', ...rest }) {
  const inputId = id || `ta-${rest.name || Math.random().toString(36).slice(2, 8)}`;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
        </label>
      )}
      <textarea id={inputId} className={`input ${error ? 'border-red-400 focus:ring-red-200' : ''}`} {...rest} />
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
