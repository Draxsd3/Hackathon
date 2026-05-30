import { Loader2 } from 'lucide-react';

export function Spinner({ size = 'md', className = '' }) {
  const dim = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' }[size] || 'h-6 w-6';
  return <Loader2 className={`animate-spin text-primary-600 ${dim} ${className}`} />;
}
