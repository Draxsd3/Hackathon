import { Camera, CameraOff } from 'lucide-react';
import { useCamera } from '../../hooks/useCamera.js';
import { forwardRef, useEffect, useImperativeHandle } from 'react';
import { Spinner } from '../common/Spinner.jsx';

export const CameraView = forwardRef(function CameraView({ autoStart = true, className = '' }, ref) {
  const { videoRef, status, error, start, stop } = useCamera({ autoStart });

  useImperativeHandle(ref, () => ({
    getVideo: () => videoRef.current,
    start,
    stop,
    status,
  }), [videoRef, start, stop, status]);

  useEffect(() => () => stop(), [stop]);

  return (
    <div className={`relative overflow-hidden rounded-xl bg-slate-900 ${className}`}>
      <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
      {status === 'starting' && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70 text-white">
          <Spinner className="text-white" />
        </div>
      )}
      {status === 'idle' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/80 text-white">
          <Camera className="h-8 w-8" />
          <button type="button" onClick={start} className="btn btn-primary">
            Iniciar camera
          </button>
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900/85 px-4 text-center text-white">
          <CameraOff className="h-8 w-8" />
          <p className="text-sm">Nao foi possivel acessar a camera.</p>
          <p className="text-xs text-slate-300">{error?.message}</p>
          <button type="button" onClick={start} className="btn btn-secondary mt-2">
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  );
});
