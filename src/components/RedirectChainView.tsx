import React, { useState } from 'react';
import { GitCommit, ArrowDown, Copy, Check, ExternalLink, Clock, Server, ArrowRight } from 'lucide-react';
import type { HopInfo } from '../types';

interface RedirectChainViewProps {
  hops: HopInfo[];
}

export const RedirectChainView: React.FC<RedirectChainViewProps> = ({ hops }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyUrl = (url: string, index: number) => {
    navigator.clipboard.writeText(url);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getStatusBadgeClass = (status: number) => {
    if (status >= 200 && status < 300) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
    if (status >= 300 && status < 400) {
      return 'bg-amber-100 text-amber-900 border-amber-300';
    }
    if (status >= 400) {
      return 'bg-rose-100 text-rose-800 border-rose-300';
    }
    return 'bg-stone-100 text-stone-700 border-stone-300';
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <GitCommit className="w-4 h-4 text-stone-700" />
            Redirect Chain Trace
          </h4>
          <p className="text-xs text-stone-500">
            Path traversed from shortened link to final enlarged destination ({hops.length} {hops.length === 1 ? 'node' : 'nodes'}, {Math.max(0, hops.length - 1)} {hops.length - 1 === 1 ? 'redirect' : 'redirects'})
          </p>
        </div>
      </div>

      <div className="space-y-3 relative">
        {hops.map((hop, index) => {
          const isFinal = index === hops.length - 1;
          const isInitial = index === 0;

          return (
            <div key={index} className="relative">
              {/* Connector line */}
              {!isFinal && (
                <div className="absolute left-4 top-9 -bottom-4 w-0.5 bg-stone-200 z-0" />
              )}

              <div
                className={`relative z-10 flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
                  isFinal
                    ? 'bg-stone-50/80 border-stone-300 shadow-xs ring-1 ring-stone-900/5'
                    : isInitial
                    ? 'bg-white border-stone-200'
                    : 'bg-white/90 border-stone-200'
                }`}
              >
                {/* Step badge */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                    isFinal
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {index + 1}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md border ${getStatusBadgeClass(
                        hop.statusCode
                      )}`}
                    >
                      {hop.statusCode ? `${hop.statusCode} ${hop.statusText}` : 'Error'}
                    </span>

                    <span className="text-xs font-semibold text-stone-700">
                      {hop.redirectType}
                    </span>

                    {hop.responseTimeMs > 0 && (
                      <span className="text-[11px] font-mono text-stone-500 flex items-center gap-0.5 ml-auto">
                        <Clock className="w-3 h-3" />
                        {hop.responseTimeMs}ms
                      </span>
                    )}
                  </div>

                  {/* URL */}
                  <div className="font-['JetBrains_Mono',monospace] text-xs text-stone-900 break-all select-all py-1">
                    {hop.url}
                  </div>

                  {/* Hop Metadata (Domain, Server, Next Target) */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-stone-500 mt-1 pt-1 border-t border-stone-100">
                    <span>
                      Host: <strong className="text-stone-700">{hop.domain}</strong>
                    </span>
                    {hop.server && (
                      <span className="flex items-center gap-1">
                        <Server className="w-3 h-3 text-stone-400" />
                        Server: <strong className="text-stone-700">{hop.server}</strong>
                      </span>
                    )}
                  </div>

                  {hop.targetUrl && (
                    <div className="mt-2 text-xs text-stone-600 bg-stone-100/80 rounded-lg p-2 flex items-start gap-1.5 font-mono">
                      <ArrowRight className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-stone-500 block uppercase font-bold tracking-wider">
                          Next Redirect Target
                        </span>
                        <span className="break-all text-stone-800">{hop.targetUrl}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Copy button */}
                <button
                  type="button"
                  onClick={() => copyUrl(hop.url, index)}
                  className="p-1.5 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors shrink-0"
                  title="Copy this hop URL"
                >
                  {copiedIndex === index ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
