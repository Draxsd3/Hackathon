import { useCallback, useEffect, useState } from 'react';
import { storage } from '../utils/storage.js';

/**
 * Hook para reativamente acompanhar uma colecao do storage.
 * Reage a mudancas via evento 'storage' (multi-aba) e a um refresh manual.
 */
export function useLocalCollection(collectionName, mapper = (items) => items) {
  const [items, setItems] = useState(() => mapper(storage.list(collectionName)));

  const refresh = useCallback(() => {
    setItems(mapper(storage.list(collectionName)));
  }, [collectionName, mapper]);

  useEffect(() => {
    const onStorage = (event) => {
      if (!event.key || event.key.includes(collectionName)) refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [collectionName, refresh]);

  return { items, refresh, setItems };
}
