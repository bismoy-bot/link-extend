import React, { useState } from 'react';
import { Search, Clipboard, X, ArrowRight, Loader2, Sparkles, HelpCircle } from 'lucide-react';

interface UrlInputFormProps {
  onUnshorten: (url: string) => void;
  isLoading: boolean;
  initialUrl?: string;
}

const SAMPLE_LINKS = [
  { label: 'TinyURL Sample', url: 'https://tinyurl.com/wikipedia-home' },
  { label: 'Bitly Sample', url: 'https://bit.ly/3xyz-test' },
  { label: 'Is.gd Redirect', url: 'https://is.gd/google_home' },
  { label: 'ShortURL Sample', url: 'https://t.co/freecodecamp' },
];

export const UrlInputForm: React.FC<UrlInputFormProps> = ({
  onUnshorten,
  isLoading,
  initialUrl = '',
}) => {
  const [url, setUrl] = useState(initialUrl);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onUnshorten(url.trim());
    }
  };

  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setUrl(text.trim());
          onUnshorten(text.trim());
        }
      }
    } catch {
      // Clipboard permission denied or unsupported
    }
  };

  const handleSelectSample = (sampleUrl: string) => {
    setUrl(sampleUrl);
    onUnshorten(sampleUrl);
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-stone-200/80 p-5 sm:p-7 shadow-xs">
      <div className="mb-4">
        <label
          htmlFor="short-url-input"
          className="block text-sm font-bold text-stone-900 mb-1"
        >
          Enter Shortened Link to Enlarge
        </label>
        <p className="text-xs text-stone-700">
          Paste any shortened URL (Bitly, TinyURL, t.co, is.gd, Rebrandly, etc.) to unshorten and inspect its destination.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
              <Search className="w-5 h-5" />
            </div>

            <input
              id="short-url-input"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g. bit.ly/3x8kY or https://tinyurl.com/sample..."
              disabled={isLoading}
              className="w-full pl-10 pr-20 py-3.5 bg-stone-50 hover:bg-stone-50/80 focus:bg-white border border-stone-300 rounded-xl text-stone-900 placeholder:text-stone-400 text-sm md:text-base font-['JetBrains_Mono',monospace] transition-all focus:outline-hidden focus:ring-2 focus:ring-stone-900 focus:border-transparent disabled:opacity-60"
            />

            <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
              {url && !isLoading && (
                <button
                  type="button"
                  id="btn-clear-input"
                  onClick={() => setUrl('')}
                  className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/60 transition-colors"
                  title="Clear input"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                id="btn-paste-clipboard"
                onClick={handlePaste}
                disabled={isLoading}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-stone-700 hover:text-stone-900 bg-stone-200/70 hover:bg-stone-300/70 rounded-lg transition-colors"
                title="Paste from clipboard and enlarge"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>Paste</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            id="btn-enlarge-link"
            disabled={isLoading || !url.trim()}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-stone-900 hover:bg-stone-800 active:bg-stone-950 disabled:bg-stone-300 text-white rounded-xl font-semibold text-sm transition-all shadow-xs shrink-0 cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                <span>Enlarging Link...</span>
              </>
            ) : (
              <>
                <span>Enlarge Link</span>
                <ArrowRight className="w-4 h-4 text-stone-300" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Quick Test Samples */}
      <div className="mt-4 pt-3.5 border-t border-stone-100 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-stone-600 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Try a sample:
        </span>
        {SAMPLE_LINKS.map((sample) => (
          <button
            key={sample.label}
            type="button"
            onClick={() => handleSelectSample(sample.url)}
            disabled={isLoading}
            className="text-xs px-2.5 py-1 bg-stone-100 hover:bg-stone-200/80 text-stone-700 hover:text-stone-900 rounded-lg border border-stone-200/60 font-mono transition-colors"
          >
            {sample.label}
          </button>
        ))}
      </div>
    </div>
  );
};
