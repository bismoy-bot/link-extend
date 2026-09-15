import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { X, QrCode as QrIcon, Download, Copy, Check } from 'lucide-react';

interface QrCodeModalProps {
  url: string;
  isOpen: boolean;
  onClose: () => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ url, isOpen, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && canvasRef.current && url) {
      QRCode.toCanvas(
        canvasRef.current,
        url,
        {
          width: 240,
          margin: 2,
          color: {
            dark: '#1c1917',
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error('QR code generation failed:', error);
        }
      );
    }
  }, [isOpen, url]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `expanded-qr-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-sm w-full p-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-4">
          <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center mx-auto mb-2 text-stone-800">
            <QrIcon className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-stone-900">Scan Expanded URL</h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Scan with your mobile camera to visit this verified destination.
          </p>
        </div>

        <div className="flex justify-center p-3 bg-stone-50 rounded-xl border border-stone-200/80 mb-4">
          <canvas ref={canvasRef} className="rounded-lg shadow-xs" />
        </div>

        <div className="p-2.5 bg-stone-100/70 rounded-lg text-[11px] font-mono text-stone-700 break-all mb-4 max-h-16 overflow-y-auto">
          {url}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className="flex-1 py-2 px-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Download PNG
          </button>
          <button
            type="button"
            onClick={handleCopyUrl}
            className="py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-stone-200"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-stone-500" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
