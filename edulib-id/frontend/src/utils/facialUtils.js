import * as faceapi from 'face-api.js';

/**
 * Utilitarios de reconhecimento facial.
 *
 * O fluxo atual usa face-api.js para detectar rosto, extrair landmarks e gerar
 * um embedding facial de 128 dimensoes. Ainda nao e uma biometria de producao
 * como Face ID, mas ja compara o rosto em vez da imagem inteira.
 */

export const FACE_DESCRIPTOR_VERSION = 'face-api-v1';

const MODEL_URL = '/models/face-api';
const FACE_DISTANCE_THRESHOLD = 0.6;
const FACE_DISTANCE_REJECT = 0.95;
const ACCEPTED_BASE_SCORE = 0.65;

const FACE_QUALITY_RULES = {
  minScore: 0.55,
  minHeightRatio: 0.18,
  maxHeightRatio: 0.82,
  maxHorizontalOffset: 0.24,
  maxVerticalOffset: 0.28,
};

let modelsPromise = null;

export function ensureFaceModelsLoaded() {
  if (!modelsPromise) {
    modelsPromise = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
  }

  return modelsPromise;
}

function loadImage(imageDataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = imageDataUrl;
  });
}

export async function computeDescriptor(imageDataUrl) {
  if (!imageDataUrl) return null;
  await ensureFaceModelsLoaded();

  const image = await loadImage(imageDataUrl);
  const options = new faceapi.TinyFaceDetectorOptions({
    inputSize: 416,
    scoreThreshold: 0.35,
  });
  const result = await faceapi
    .detectSingleFace(image, options)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!result) {
    throw new Error('Nenhum rosto foi detectado. Centralize o rosto, melhore a luz e tente novamente.');
  }

  return {
    version: FACE_DESCRIPTOR_VERSION,
    vector: Array.from(result.descriptor),
    detectionScore: result.detection.score,
    capturedAt: new Date().toISOString(),
  };
}

export async function detectFacePresence(imageDataUrl) {
  if (!imageDataUrl) return null;
  await ensureFaceModelsLoaded();

  const image = await loadImage(imageDataUrl);
  const options = new faceapi.TinyFaceDetectorOptions({
    inputSize: 320,
    scoreThreshold: 0.45,
  });
  const detections = await faceapi.detectAllFaces(image, options);
  if (!detections.length) return null;

  const imageSize = {
    width: image.naturalWidth || image.width,
    height: image.naturalHeight || image.height,
  };
  const detection = detections
    .sort((a, b) => {
      const areaA = a.box.width * a.box.height;
      const areaB = b.box.width * b.box.height;
      return (b.score * areaB) - (a.score * areaA);
    })[0];

  const payload = {
    score: detection.score,
    faceCount: detections.length,
    image: imageSize,
    box: {
      x: detection.box.x,
      y: detection.box.y,
      width: detection.box.width,
      height: detection.box.height,
    },
  };

  return {
    ...payload,
    quality: evaluateFaceCapture(payload),
  };
}

export function evaluateFaceCapture(detection) {
  if (!detection?.box || !detection?.image?.width || !detection?.image?.height) {
    return { ready: false, message: 'Posicione o rosto dentro da area indicada.' };
  }

  if (detection.faceCount > 1) {
    return { ready: false, message: 'Deixe apenas uma pessoa na frente da camera.' };
  }

  if (detection.score < FACE_QUALITY_RULES.minScore) {
    return { ready: false, message: 'Melhore a iluminacao e olhe para a camera.' };
  }

  const { box, image } = detection;
  const faceCenterX = box.x + box.width / 2;
  const faceCenterY = box.y + box.height / 2;
  const horizontalOffset = Math.abs(faceCenterX - image.width / 2) / image.width;
  const verticalOffset = Math.abs(faceCenterY - image.height / 2) / image.height;
  const heightRatio = box.height / image.height;

  if (horizontalOffset > FACE_QUALITY_RULES.maxHorizontalOffset || verticalOffset > FACE_QUALITY_RULES.maxVerticalOffset) {
    return { ready: false, message: 'Centralize o rosto na area indicada.' };
  }

  if (heightRatio < FACE_QUALITY_RULES.minHeightRatio) {
    return { ready: false, message: 'Aproxime um pouco o rosto da camera.' };
  }

  if (heightRatio > FACE_QUALITY_RULES.maxHeightRatio) {
    return { ready: false, message: 'Afaste um pouco o rosto da camera.' };
  }

  return {
    ready: true,
    message: 'Rosto enquadrado. Validando FaceID.',
    metrics: {
      score: detection.score,
      horizontalOffset,
      verticalOffset,
      heightRatio,
    },
  };
}

function euclideanDistance(a, b) {
  const len = Math.min(a.length, b.length);
  let sum = 0;

  for (let i = 0; i < len; i += 1) {
    const diff = (Number(a[i]) || 0) - (Number(b[i]) || 0);
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}

function distanceToConfidence(distance) {
  if (distance <= FACE_DISTANCE_THRESHOLD) {
    return ACCEPTED_BASE_SCORE + ((FACE_DISTANCE_THRESHOLD - distance) / FACE_DISTANCE_THRESHOLD) * 0.35;
  }

  const span = FACE_DISTANCE_REJECT - FACE_DISTANCE_THRESHOLD;
  return Math.max(0, ACCEPTED_BASE_SCORE * (1 - (distance - FACE_DISTANCE_THRESHOLD) / span));
}

export function compareDescriptors(a, b) {
  if (!a || !b || a.version !== b.version) return 0;

  if (a.version === 'mvp-hash-v1') {
    if (a.vector === b.vector) return 1;
    let matches = 0;
    const len = Math.min(a.vector.length, b.vector.length);
    for (let i = 0; i < len; i += 1) {
      if (a.vector[i] === b.vector[i]) matches += 1;
    }
    return matches / len;
  }

  if (a.version === FACE_DESCRIPTOR_VERSION) {
    if (!Array.isArray(a.vector) || !Array.isArray(b.vector)) return 0;
    return distanceToConfidence(euclideanDistance(a.vector, b.vector));
  }

  if (!Array.isArray(a.vector) || !Array.isArray(b.vector)) return 0;

  const len = Math.min(a.vector.length, b.vector.length);
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < len; i += 1) {
    const av = Number(a.vector[i]) || 0;
    const bv = Number(b.vector[i]) || 0;
    dot += av * bv;
    magA += av * av;
    magB += bv * bv;
  }

  if (!magA || !magB) return 0;
  return (dot / Math.sqrt(magA * magB) + 1) / 2;
}

export function isSameFace(a, b, threshold = ACCEPTED_BASE_SCORE) {
  if (a?.version === FACE_DESCRIPTOR_VERSION && b?.version === FACE_DESCRIPTOR_VERSION) {
    return euclideanDistance(a.vector, b.vector) <= FACE_DISTANCE_THRESHOLD;
  }

  return compareDescriptors(a, b) >= threshold;
}

/**
 * Captura um frame do video como base64 (image/jpeg).
 */
export function captureFrame(videoEl, maxWidth = 480, quality = 0.82) {
  if (!videoEl || !videoEl.videoWidth) return null;
  const scale = Math.min(1, maxWidth / videoEl.videoWidth);
  const w = Math.round(videoEl.videoWidth * scale);
  const h = Math.round(videoEl.videoHeight * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoEl, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', quality);
}
