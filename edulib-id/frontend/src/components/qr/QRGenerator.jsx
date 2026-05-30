import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { generateDataUrl } from '../../utils/qrUtils.js';
import { Spinner } from '../common/Spinner.jsx';
import { Button } from '../common/Button.jsx';

export function QRGenerator({ value, caption, downloadName = 'edulib-qr.png', size = 220 }) {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    let active = true;
    if (!value) {
      setSrc(null);
      return;
    }
    generateDataUrl(value, { width: size }).then((url) => {
      if (active) setSrc(url);
    });
    return () => {
      active = false;
    };
  }, [value, size]);

  const download = () => {
    if (!src) return;
    const a = document.createElement('a');
    a.href = src;
    a.download = downloadName;
    a.click();
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-3"
        style={{ width: size + 24, height: size + 24 }}
      >
        {src ? <img src={src} alt="QR" width={size} height={size} /> : <Spinner />}
      </div>
      {caption && <p className="text-center text-xs text-slate-500">{caption}</p>}
      {src && (
        <Button variant="secondary" icon={Download} onClick={download}>
          Baixar PNG
        </Button>
      )}
    </div>
  );
}
