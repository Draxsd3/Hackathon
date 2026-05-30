/**
 * Wrapper sobre Web NFC (NDEFReader).
 *
 * Disponibilidade: Chrome 89+ no Android, sob HTTPS (ou localhost).
 * iOS e desktop nao suportam Web NFC no navegador.
 *
 * Para nosso caso, identificamos o livro pelo `serialNumber` (UID) da
 * etiqueta - nao precisamos escrever dados nela.
 */

export function isNfcSupported() {
  return typeof window !== 'undefined' && 'NDEFReader' in window;
}

/**
 * Normaliza o UID retornado pelo browser (vem em formato hex separado por `:`).
 * Mantemos uppercase + sem `:` para comparacao estavel.
 */
export function normalizeTag(serialNumber) {
  if (!serialNumber) return null;
  let tag = String(serialNumber).trim();

  try {
    const url = new URL(tag);
    tag = url.searchParams.get('tag')
      || url.searchParams.get('nfc')
      || url.searchParams.get('rfid')
      || url.pathname.split('/').filter(Boolean).pop()
      || tag;
  } catch {
    tag = tag.replace(/^nfc:/i, '').trim();
  }

  return tag.replace(/:/g, '').trim().toUpperCase();
}

/**
 * Formata para exibicao (grupos de 2 separados por :).
 */
export function formatTag(tag) {
  if (!tag) return '';
  const clean = String(tag).replace(/:/g, '').toUpperCase();
  return clean.match(/.{1,2}/g)?.join(':') || clean;
}
