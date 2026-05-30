/**
 * Utilitarios de reconhecimento facial.
 *
 * MVP: usamos um "descritor" sintetico baseado num hash da imagem capturada.
 * Isso permite que o fluxo de UX (cadastrar -> entrar pela face) funcione
 * sem depender de um modelo pesado como face-api.js / face-landmarks.
 *
 * Para evoluir para reconhecimento real:
 *  - troque `computeDescriptor` por uma chamada ao face-api.js
 *  - troque `compareDescriptors` por uma metrica de distancia euclidiana
 *  - o resto do codigo (services, paginas) continua igual
 */

const SIMILARITY_THRESHOLD = 0.78;

async function hashImageData(imageDataUrl) {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(imageDataUrl);
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function computeDescriptor(imageDataUrl) {
  if (!imageDataUrl) return null;
  const hash = await hashImageData(imageDataUrl);
  return {
    version: 'mvp-hash-v1',
    vector: hash,
    capturedAt: new Date().toISOString(),
  };
}

export function compareDescriptors(a, b) {
  if (!a || !b || a.version !== b.version) return 0;
  if (a.vector === b.vector) return 1;
  let matches = 0;
  const len = Math.min(a.vector.length, b.vector.length);
  for (let i = 0; i < len; i += 1) {
    if (a.vector[i] === b.vector[i]) matches += 1;
  }
  return matches / len;
}

export function isSameFace(a, b, threshold = SIMILARITY_THRESHOLD) {
  return compareDescriptors(a, b) >= threshold;
}

/**
 * Captura um frame do video como base64 (image/jpeg).
 */
export function captureFrame(videoEl, maxWidth = 480) {
  if (!videoEl || !videoEl.videoWidth) return null;
  const scale = Math.min(1, maxWidth / videoEl.videoWidth);
  const w = Math.round(videoEl.videoWidth * scale);
  const h = Math.round(videoEl.videoHeight * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoEl, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', 0.82);
}
