import React, { useState } from 'react';
import {
  Maximize2,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  GitCommit,
  ShieldCheck,
  CheckCircle2,
  AlertOctagon,
} from 'lucide-react';
import type { UnshortenResult } from '../types';
import { SecurityBadge } from './SecurityBadge';
import { RedirectChainView } from './RedirectChainView';
import { PagePreviewCard } from './PagePreviewCard';
import { QueryParamsTable } from './QueryParamsTable';
import { AiAnalysisCard } from './AiAnalysisCard';
import { QrCodeModal } from './QrCodeModal';

interface ExpandedResultCardProps {
  result: UnshortenResult;
  onClear: () => void;
}

export const ExpandedResultCard: React.FC<ExpandedResultCardProps> = ({
  result,
  onClear,
}) => {
  const [copiedExpanded, setCopiedExpanded] = useState(false);
  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);

  const handleCopyExpanded = () => {
    navigator.clipboard.writeText(result.expandedUrl);
    setCopiedExpanded(true);
    setTimeout(() => setCopiedExpanded(false), 2000);
  };

  const handleCopyOriginal = () => {
    navigator.clipboard.writeText(result.originalUrl);
    setCopiedOriginal(true);
    setTimeout(() => setCopiedOriginal(false), 2000);
  };

  const percentEnlarged =
    result.originalLength > 0
      ? Math.round((result.lengthDelta / result.originalLength) * 100)
      : 0;

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Hero Enlargement Card */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-5 sm:p-7 shadow-xs">
        {/* Top Header stats */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-stone-900 text-amber-400 flex items-center justify-center">
              <Maximize2 className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-extrabold text-stone-900 text-base leading-tight">
                Link Enlarged Successfully
              </h3>
              <p className="text-xs text-stone-500">
                Resolved destination with status {result.finalStatusCode || 'OK'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-stone-100 text-stone-800 border border-stone-200">
              <GitCommit className="w-3.5 h-3.5 text-stone-500" />
              <span>{result.totalRedirects} {result.totalRedirects === 1 ? 'Hop' : 'Hops'}</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-stone-100 text-stone-800 border border-stone-200">
              <Clock className="w-3.5 h-3.5 text-stone-500" />
              <span>{result.totalTimeMs}ms</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>{percentEnlarged >= 0 ? `+${percentEnlarged}%` : `${percentEnlarged}%`}</span>
            </div>
          </div>
        </div>

        {/* Before vs After Display */}
        <div className="mt-5 space-y-4">
          {/* Original Shortened Link */}
          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                  Original Short Link
                </span>
                <span className="text-[11px] font-mono text-stone-700 bg-stone-200/60 px-1.5 py-0.2 rounded">
                  {result.originalLength} characters
                </span>
              </div>
              <div className="font-['JetBrains_Mono',monospace] text-xs sm:text-sm text-stone-700 truncate select-all">
                {result.originalUrl}
              </div>
            </div>

            <button
              type="button"
              id="btn-copy-original"
              onClick={handleCopyOriginal}
              className="self-start sm:self-center p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-200/70 rounded-lg transition-colors text-xs flex items-center gap-1 font-medium"
              title="Copy original link"
            >
              {copiedOriginal ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Large arrow transition indicator */}
          <div className="flex items-center justify-center -my-2 relative z-10">
            <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center shadow-md">
              <ArrowRight className="w-4 h-4 rotate-90 sm:rotate-0" />
            </div>
          </div>

          {/* Final Enlarged Destination Link */}
          <div className="p-4 rounded-xl bg-amber-50/40 border-2 border-stone-900 flex flex-col gap-3 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-stone-900 uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Final Enlarged Destination
                </span>
                <span className="text-[11px] font-mono font-bold text-stone-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                  {result.expandedLength} characters (+{result.lengthDelta} chars)
                </span>
              </div>
            </div>

            {/* Expanded URL full text */}
            <div className="font-['JetBrains_Mono',monospace] text-sm sm:text-base font-semibold text-stone-900 break-all select-all bg-white p-3 rounded-lg border border-stone-200 shadow-2xs leading-relaxed">
              {result.expandedUrl}
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                id="btn-copy-expanded"
                onClick={handleCopyExpanded}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-all shadow-xs"
              >
                {copiedExpanded ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Copied Destination!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-stone-300" />
                    <span>Copy Enlarged Link</span>
                  </>
                )}
              </button>

              <a
                href={result.expandedUrl}
                target="_blank"
                rel="noopener noreferrer"
                id="btn-open-safely"
                className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition-colors border border-stone-200"
              >
                <span>Visit Destination Safely</span>
                <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
              </a>

              <button
                type="button"
                id="btn-qr-code"
                onClick={() => setIsQrOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition-colors border border-stone-200"
              >
                <QrCode className="w-4 h-4 text-stone-600" />
                <span>QR Code</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Security Assessment */}
      <SecurityBadge security={result.security} />

      {/* Redirect Chain Trace View */}
      <RedirectChainView hops={result.hops} />

      {/* Content Meta Preview */}
      <PagePreviewCard meta={result.meta} url={result.expandedUrl} />

      {/* Query Parameters Table */}
      <QueryParamsTable
        queryParams={result.queryParams}
        cleanUrl={result.cleanUrl}
      />

      {/* AI Context and Intelligence */}
      <AiAnalysisCard result={result} />

      {/* QR Code Modal */}
      <QrCodeModal
        url={result.expandedUrl}
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
      />
    </div>
  );
};
