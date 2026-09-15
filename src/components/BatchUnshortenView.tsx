import React, { useState } from 'react';
import { Layers, Loader2, ArrowRight, Copy, Check, Download, ExternalLink, ShieldCheck, AlertTriangle } from 'lucide-react';
import type { UnshortenResult } from '../types';

interface BatchUnshortenViewProps {
  onSelectResult: (res: UnshortenResult) => void;
}

export const BatchUnshortenView: React.FC<BatchUnshortenViewProps> = ({
  onSelectResult,
}) => {
  const [inputText, setInputText] = useState(
    'https://tinyurl.com/wikipedia-home\nhttps://is.gd/google_home\nhttps://t.co/freecodecamp'
  );
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<UnshortenResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleBatchUnshorten = async (e: React.FormEvent) => {
    e.preventDefault();
    const urls = inputText
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    if (urls.length === 0) {
      setError('Please provide at least one URL to enlarge.');
      return;
    }

    if (urls.length > 10) {
      setError('Please limit batch unshortening to 10 URLs at a time.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/unshorten-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls }),
      });

      if (!res.ok) {
        throw new Error('Batch enlarge request failed.');
      }

      const data = await res.json();
      setResults(data.results || []);
    } catch (err: any) {
      setError(err.message || 'Failed to enlarge batch links.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAllExpanded = () => {
    const text = results
      .map((r) => r.expandedUrl || r.originalUrl)
      .filter(Boolean)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleExportCsv = () => {
    const escapeCsv = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const headers = 'Original URL,Expanded URL,Hops,Status,Duration (ms)\n';
    const rows = results
      .map(
        (r) =>
          [
            escapeCsv(r.originalUrl),
            escapeCsv(r.expandedUrl),
            r.totalRedirects,
            r.finalStatusCode,
            r.totalTimeMs,
          ].join(',')
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `enlarged-links-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-stone-200/80 p-5 sm:p-7 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-stone-900 text-amber-400 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-stone-900 text-base">
              Batch Link Enlarger
            </h3>
            <p className="text-xs text-stone-500">
              Paste up to 10 shortened links (one URL per line) to enlarge them all in parallel.
            </p>
          </div>
        </div>

        <form onSubmit={handleBatchUnshorten} className="mt-4 space-y-3">
          <div>
            <textarea
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="https://bit.ly/...\nhttps://tinyurl.com/...\nhttps://t.co/..."
              disabled={loading}
              className="w-full p-3.5 bg-stone-50 hover:bg-stone-50/80 focus:bg-white border border-stone-300 rounded-xl text-stone-900 text-xs sm:text-sm font-['JetBrains_Mono',monospace] leading-relaxed transition-all focus:outline-hidden focus:ring-2 focus:ring-stone-900 disabled:opacity-60"
            />
          </div>

          {error && (
            <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-stone-400">
              {inputText.split('\n').filter((l) => l.trim()).length} URLs detected (max 10)
            </span>

            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Enlarging Batch...</span>
                </>
              ) : (
                <>
                  <span>Enlarge All Links</span>
                  <ArrowRight className="w-4 h-4 text-stone-300" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Results Table */}
      {results.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="font-bold text-stone-900 text-sm">
              Enlarged Results ({results.length})
            </h4>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyAllExpanded}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors border border-stone-200"
              >
                {copiedAll ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>All Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-stone-500" />
                    <span>Copy All Expanded</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors border border-stone-200"
              >
                <Download className="w-3.5 h-3.5 text-stone-500" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-stone-200 rounded-xl">
            <table className="w-full text-left text-xs font-['JetBrains_Mono',monospace]">
              <thead className="bg-stone-50 text-stone-700 font-sans border-b border-stone-200 font-bold">
                <tr>
                  <th className="py-2.5 px-3">Original Short Link</th>
                  <th className="py-2.5 px-3">Enlarged Destination</th>
                  <th className="py-2.5 px-3 text-center">Hops</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right font-sans">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {results.map((res, index) => (
                  <tr key={res.id || index} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-3 px-3 max-w-xs truncate text-stone-600 font-medium">
                      {res.originalUrl}
                    </td>
                    <td className="py-3 px-3 max-w-sm truncate font-semibold text-stone-900">
                      {res.expandedUrl || (
                        <span className="text-rose-600 font-sans text-xs">
                          {res.error || 'Failed to resolve'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-stone-700">
                      {res.totalRedirects}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          res.finalStatusCode >= 200 && res.finalStatusCode < 300
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {res.finalStatusCode || 'ERR'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {res.expandedUrl && (
                        <button
                          type="button"
                          onClick={() => onSelectResult(res)}
                          className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded-md text-[11px] font-sans font-medium transition-colors"
                        >
                          Deep Inspect
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
