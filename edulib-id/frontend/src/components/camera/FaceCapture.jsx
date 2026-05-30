import { useRef, useState } from 'react';
import { Camera, RotateCcw } from 'lucide-react';
import { CameraView } from './CameraView.jsx';
import { Button } from '../common/Button.jsx';
import { captureFrame, computeDescriptor } from '../../utils/facialUtils.js';

/**
 * Componente reutilizavel: mostra preview da camera + botao "Capturar".
 * Retorna { photo (dataURL), descriptor } via onCapture.
 */
export function FaceCapture({ onCapture, label = 'Capturar foto', autoStart = true }) {
  const cameraRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const capture = async () => {
    const video = cameraRef.current?.getVideo();
    if (!video) return;
    setLoading(true);
    try {
      const dataUrl = captureFrame(video);
      const descriptor = await computeDescriptor(dataUrl);
      setPreview(dataUrl);
      onCapture?.({ photo: dataUrl, descriptor });
    } finally {
      setLoading(false);
    }
  };

  const retake = () => {
    setPreview(null);
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
    </div>
  );
}
