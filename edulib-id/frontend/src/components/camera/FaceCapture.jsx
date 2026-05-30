import { useRef, useState } from 'react';
import { Camera, RotateCcw } from 'lucide-react';
import { CameraView } from './CameraView.jsx';
import { Button } from '../common/Button.jsx';
import { captureFrame, computeDescriptor, detectFacePresence } from '../../utils/facialUtils.js';

/**
 * Componente reutilizavel: mostra preview da camera + botao "Capturar".
 * Retorna { photo (dataURL), descriptor } via onCapture.
 */
export function FaceCapture({ onCapture, label = 'Capturar foto', autoStart = true }) {
  const cameraRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const capture = async () => {
    const video = cameraRef.current?.getVideo();
    if (!video) return;
    setLoading(true);
    setError(null);
    try {
      const probeFrame = captureFrame(video, 480, 0.78);
      const facePresence = await detectFacePresence(probeFrame);
      if (!facePresence?.quality?.ready) {
        throw new Error(facePresence?.quality?.message || 'Centralize o rosto antes de capturar.');
      }

      const dataUrl = captureFrame(video, 960, 0.92);
      const descriptor = await computeDescriptor(dataUrl);
      setPreview(dataUrl);
      onCapture?.({ photo: dataUrl, descriptor });
    } catch (err) {
      setError(err.message || 'Nao foi possivel capturar o FaceID.');
    } finally {
      setLoading(false);
    }
  };

  const retake = () => {
    setPreview(null);
    setError(null);
    onCapture?.(null);
  };

  return (
    <div className="flex flex-col gap-3">
      {preview ? (
        <div className="relative overflow-hidden rounded-xl bg-slate-100">
          <img src={preview} alt="Captura" className="h-full w-full object-cover" />
        </div>
      ) : (
        <CameraView ref={cameraRef} autoStart={autoStart} className="aspect-video" />
      )}
      <div className="flex justify-center gap-2">
        {preview ? (
          <Button variant="secondary" icon={RotateCcw} onClick={retake}>
            Refazer
          </Button>
        ) : (
          <Button onClick={capture} loading={loading} icon={Camera}>
            {label}
          </Button>
        )}
      </div>
      {error && <p className="text-center text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
