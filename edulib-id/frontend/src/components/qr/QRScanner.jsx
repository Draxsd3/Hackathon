import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { CameraOff, ScanLine } from 'lucide-react';

const SCAN_REGION_ID = 'edulib-qr-region';

export function QRScanner({ onResult, onError, paused = false }) {
  const containerRef = useRef(null);
  const scannerRef = useRef(null);
  const [status, setStatus] = useState('starting');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return undefined;

    const id = `${SCAN_REGION_ID}-${Math.random().toString(36).slice(2, 8)}`;
    containerRef.current.id = id;

    const scanner = new Html5Qrcode(id, { verbose: false });
    scannerRef.current = scanner;

    let alive = true;
    const start = async () => {
      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decoded) => {
            if (!alive) return;
            onResult?.(decoded);
          },
          () => {}
        );
        if (alive) setStatus('ready');
      } catch (err) {
        if (!alive) return;
        console.error('[QRScanner]', err);
        setError(err);
        setStatus('error');
        onError?.(err);
      }
    };

    start();

    return () => {
      alive = false;
      try {
        if (scanner && scanner.isScanning) {
          scanner.stop().then(() => scanner.clear()).catch(() => {});
        }
      } catch (_e) {
        // ignora
      }
    };
  }, [onResult, onError]);

  useEffect(() => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    if (paused && scanner.isScanning) {
      scanner.pause(true);
    } else if (!paused && scanner.isScanning) {
      try {
        scanner.resume();
      } catch (_e) {
        // ignora
      }
    }
  }, [paused]);

  return (
    <div className="relative overflow-hidden rounded-xl bg-slate-900">
      <div ref={containerRef} className="aspect-video w-full" />
      {status === 'starting' && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-900/40 text-white">
          <ScanLine className="h-8 w-8 animate-pulse" />
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900/85 px-4 text-center text-white">
          <CameraOff className="h-8 w-8" />
          <p className="text-sm">Nao foi possivel iniciar o scanner.</p>
          <p className="text-xs text-slate-300">{error?.message}</p>
        </div>
      )}
    </div>
  );
}
