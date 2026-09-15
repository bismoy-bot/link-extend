import React, { useState } from 'react';
import { Sparkles, Shield, AlertTriangle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import type { AiAnalysisResult, UnshortenResult } from '../types';

interface AiAnalysisCardProps {
  result: UnshortenResult;
}

export const AiAnalysisCard: React.FC<AiAnalysisCardProps> = ({ result }) => {
  const [aiData, setAiData] = useState<AiAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunScan = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/analyze-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      });
      if (!res.ok) {
        throw new Error('Failed to run AI safety scan.');
      }
      const data = await res.json();
      setAiData(data);
    } catch (err: any) {
      setError(err.message || 'AI scan unavailable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-stone-900">
              AI Destination & Safety Intelligence
            </h4>
            <p className="text-xs text-stone-500">
              Inspect intent, misleading redirects, and site authenticity
            </p>
          </div>
        </div>

        {!aiData && (
          <button
            type="button"
            onClick={handleRunScan}
            disabled={loading}
            className="text-xs px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                <span>Analyzing Link...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Run AI Security Scan</span>
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
          {error}
        </div>
      )}

      {aiData && (
        <div className="space-y-3 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                aiData.safetyRating === 'safe'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : aiData.safetyRating === 'caution'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {aiData.safetyRating === 'safe' ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5" />
              )}
              {aiData.safetyRating.toUpperCase()} RATING
            </span>

            <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200 font-medium">
              Category: {aiData.category}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-stone-800 leading-relaxed bg-stone-50 rounded-xl p-3 border border-stone-100 font-medium">
            {aiData.summary}
          </p>

          {aiData.findings.length > 0 && (
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                Key Findings
              </span>
              <ul className="text-xs text-stone-700 space-y-1">
                {aiData.findings.map((f, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-stone-400 mt-0.5">•</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-xs p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 text-amber-900 flex items-start gap-2">
            <Shield className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block mb-0.5">Recommendation:</strong>
              {aiData.recommendation}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
