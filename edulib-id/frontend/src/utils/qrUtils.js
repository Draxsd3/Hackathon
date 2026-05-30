import QRCode from 'qrcode';

const PAYLOAD_PREFIX = 'edulib:';

export function buildStudentPayload(studentId) {
  return `${PAYLOAD_PREFIX}student:${studentId}`;
}

export function buildBookPayload(bookId) {
  return `${PAYLOAD_PREFIX}book:${bookId}`;
}

export function parsePayload(text) {
  if (!text || !text.startsWith(PAYLOAD_PREFIX)) return null;
  const rest = text.slice(PAYLOAD_PREFIX.length);
  const [kind, id] = rest.split(':');
  if (!kind || !id) return null;
  return { kind, id };
}

export async function generateDataUrl(text, options = {}) {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: 'M',
    margin: 2,
    scale: 6,
    color: { dark: '#0f172a', light: '#ffffff' },
    ...options,
  });
}

export async function generateStudentQrDataUrl(studentId) {
  return generateDataUrl(buildStudentPayload(studentId));
}

export async function generateBookQrDataUrl(bookId) {
  return generateDataUrl(buildBookPayload(bookId));
}
