import React, { useState } from 'react';
import { Tag, Sparkles, Copy, Check, Filter } from 'lucide-react';
import type { QueryParam } from '../types';

interface QueryParamsTableProps {
  queryParams: QueryParam[];
  cleanUrl: string;
}

export const QueryParamsTable: React.FC<QueryParamsTableProps> = ({
  queryParams,
  cleanUrl,
}) => {
  const [copiedClean, setCopiedClean] = useState(false);
  const [showOnlyTracking, setShowOnlyTracking] = useState(false);

  const trackingCount = queryParams.filter((q) => q.isTracking).length;
  const filteredParams = showOnlyTracking
    ? queryParams.filter((q) => q.isTracking)
    : queryParams;

  const handleCopyClean = () => {
    navigator.clipboard.writeText(cleanUrl);
    setCopiedClean(true);
    setTimeout(() => setCopiedClean(false), 2000);
  };

  if (queryParams.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-stone-200 p-4 text-xs text-stone-500 shadow-xs flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-medium">
          <Tag className="w-4 h-4 text-stone-400" />
          No Query or Tracking Parameters Found
        </span>
        <span className="text-[11px] text-stone-400">Destination link is already clean</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <Tag className="w-4 h-4 text-stone-700" />
            Query & Tracking Parameters ({queryParams.length})
          </h4>
          <p className="text-xs text-stone-500">
            {trackingCount > 0
              ? `${trackingCount} tracking/marketing token${trackingCount === 1 ? '' : 's'} identified in expanded URL.`
              : 'Standard non-tracking query parameters present.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {trackingCount > 0 && (
            <button
              type="button"
              onClick={() => setShowOnlyTracking(!showOnlyTracking)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors flex items-center gap-1 ${
                showOnlyTracking
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
              }`}
            >
              <Filter className="w-3 h-3" />
              <span>{showOnlyTracking ? 'Showing Tracking Only' : 'Filter Tracking'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyClean}
            className="text-xs px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-medium transition-colors flex items-center gap-1.5 shadow-xs"
            title="Copy URL without tracking parameters"
          >
            {copiedClean ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Clean URL Copied!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Copy Clean URL</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-stone-200 rounded-lg">
        <table className="w-full text-left text-xs font-['JetBrains_Mono',monospace]">
          <thead className="bg-stone-50 text-stone-600 font-sans border-b border-stone-200 font-semibold">
            <tr>
              <th className="py-2.5 px-3">Parameter Key</th>
              <th className="py-2.5 px-3">Value</th>
              <th className="py-2.5 px-3 text-right">Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filteredParams.map((param, i) => (
              <tr key={i} className="hover:bg-stone-50/50 transition-colors">
                <td className="py-2.5 px-3 font-semibold text-stone-900 whitespace-nowrap">
                  {param.key}
                </td>
                <td className="py-2.5 px-3 text-stone-600 break-all max-w-md">
                  {decodeURIComponent(param.value)}
                </td>
                <td className="py-2.5 px-3 text-right whitespace-nowrap font-sans">
                  {param.isTracking ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                      Tracking Token
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-600 border border-stone-200">
                      Standard
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
