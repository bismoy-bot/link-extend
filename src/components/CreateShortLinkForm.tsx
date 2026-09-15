import React, { useState, useEffect, useRef } from 'react';
import {
  Link2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Loader2,
  RefreshCw,
  Tag,
  ArrowRight,
  BarChart3,
} from 'lucide-react';
import type { ShortLink } from '../types';
import { useAuth } from '../context/AuthContext';

interface CreateShortLinkFormProps {
  onLinkCreated?: (link: ShortLink) => void;
  onNavigateToDashboard?: () => void;
  onOpenAuthModal?: () => void;
}

export const CreateShortLinkForm: React.FC<CreateShortLinkFormProps> = ({
  onLinkCreated,
  onNavigateToDashboard,
  onOpenAuthModal,
}) => {
  const { user, token } = useAuth();
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<ShortLink | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  // Alias validation state
  const [aliasChecking, setAliasChecking] = useState(false);
  const [aliasStatus, setAliasStatus] = useState<{
    status: 'idle' | 'available' | 'taken' | 'invalid';
    message?: string;
  }>({ status: 'idle' });

  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Validate custom alias in real-time as user types
  useEffect(() => {
    const trimmed = customAlias.trim();
    if (!trimmed) {
      setAliasStatus({ status: 'idle' });
      setAliasChecking(false);
      return;
    }

    if (trimmed.length < 3) {
      setAliasStatus({
        status: 'invalid',
        message: 'Alias must be at least 3 characters.',
      });
      setAliasChecking(false);
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      setAliasStatus({
        status: 'invalid',
        message: 'Only letters, numbers, hyphens and underscores.',
      });
      setAliasChecking(false);
      return;
    }

    setAliasChecking(true);
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/links/check-alias?alias=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        if (data.available) {
          setAliasStatus({
            status: 'available',
            message: 'Alias is available!',
          });
        } else {
          setAliasStatus({
            status: 'taken',
            message: data.error || 'Alias is unavailable.',
          });
        }
      } catch {
        setAliasStatus({ status: 'idle' });
      } finally {
        setAliasChecking(false);
      }
    }, 350);

    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [customAlias]);

  const handleGenerateRandomAlias = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCustomAlias(result);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originalUrl.trim()) return;

    if (aliasStatus.status === 'taken' || aliasStatus.status === 'invalid') {
      setError(aliasStatus.message || 'Please provide a valid custom alias.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/links', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          originalUrl: originalUrl.trim(),
          customAlias: customAlias.trim() || undefined,
          title: title.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create short link.');
      }

      setCreatedLink(data.link);
      if (onLinkCreated) {
        onLinkCreated(data.link);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong while shortening.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!createdLink) return;
    const fullUrl = `${window.location.origin}${createdLink.shortUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setCreatedLink(null);
    setOriginalUrl('');
    setCustomAlias('');
    setTitle('');
    setAliasStatus({ status: 'idle' });
    setError(null);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {createdLink ? (
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-6 sm:p-8 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5 text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-4 py-2 rounded-xl mb-6 w-fit">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">
              Short link successfully created and active!
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Your Shortened URL
              </span>
              <div className="mt-1.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 flex items-center justify-between">
                  <span className="font-mono text-sm sm:text-base font-bold text-stone-900 break-all">
                    {window.location.origin}
                    <span className="text-amber-600">{createdLink.shortUrl}</span>
                  </span>
                  <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-md shrink-0">
                    Alias: {createdLink.alias}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex-1 sm:flex-none px-4 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-stone-300" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>

                  <a
                    href={createdLink.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-colors flex items-center justify-center"
                    title="Test 302 Redirection in New Tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <button
                    type="button"
                    onClick={() => setShowQr(!showQr)}
                    className={`p-3 rounded-xl transition-colors flex items-center justify-center cursor-pointer ${
                      showQr ? 'bg-amber-100 text-amber-900' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                    }`}
                    title="Toggle QR Code"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* QR Code preview */}
            {showQr && (
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                    `${window.location.origin}${createdLink.shortUrl}`
                  )}`}
                  alt="QR Code"
                  className="w-28 h-28 bg-white p-2 rounded-lg border border-stone-200 shadow-xs"
                />
                <div>
                  <h4 className="text-sm font-bold text-stone-900">Scan to Redirect</h4>
                  <p className="text-xs text-stone-500 mt-1 max-w-sm">
                    Scan with any smartphone camera to test instant 302 redirection and live location analytics recording.
                  </p>
                </div>
              </div>
            )}

            {/* Destination info */}
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs">
              <span className="text-stone-400 font-medium">Destination URL: </span>
              <span className="font-mono text-stone-700 break-all">{createdLink.originalUrl}</span>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Shorten Another URL
              </button>

              {onNavigateToDashboard && (
                <button
                  type="button"
                  onClick={onNavigateToDashboard}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-stone-600" />
                  <span>View in Dashboard & Track Clicks</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 sm:p-8"
        >
          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-extrabold text-stone-900 flex items-center gap-2">
              <Link2 className="w-5 h-5 text-amber-500" />
              Create Custom Short URL
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Set your own custom alias, track click volume, and analyze visitor geographic locations.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Original URL Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Destination URL <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="url"
                  required
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                  placeholder="https://example.com/very/long/campaign/landing-page-url..."
                  className="w-full pl-4 pr-10 py-3 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-900 transition-all"
                />
              </div>
            </div>

            {/* Custom Alias Input with Live Validation */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                  Custom Alias (Optional)
                </label>
                <button
                  type="button"
                  onClick={handleGenerateRandomAlias}
                  className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Generate Random
                </button>
              </div>

              <div className="relative flex flex-col sm:flex-row items-stretch rounded-xl border border-stone-200 bg-stone-50 overflow-hidden focus-within:ring-2 focus-within:ring-stone-900 focus-within:bg-white transition-all">
                <div className="px-3.5 py-3 bg-stone-100/80 border-b sm:border-b-0 sm:border-r border-stone-200 text-stone-500 text-xs sm:text-sm font-mono flex items-center shrink-0 select-none">
                  {typeof window !== 'undefined' ? `${window.location.host}/s/` : 'domain.com/s/'}
                </div>
                <input
                  type="text"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value)}
                  placeholder="my-custom-name"
                  maxLength={30}
                  className="flex-1 px-4 py-3 bg-transparent text-xs sm:text-sm font-mono text-stone-900 placeholder:text-stone-400 focus:outline-hidden"
                />
                {/* Live validation feedback badge */}
                <div className="px-3 py-2 flex items-center shrink-0">
                  {aliasChecking ? (
                    <div className="flex items-center gap-1.5 text-xs text-stone-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span className="hidden sm:inline">Checking...</span>
                    </div>
                  ) : customAlias.trim().length > 0 ? (
                    aliasStatus.status === 'available' ? (
                      <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Available</span>
                      </div>
                    ) : aliasStatus.status === 'taken' ? (
                      <div className="flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-1 rounded-md border border-rose-200">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Taken</span>
                      </div>
                    ) : aliasStatus.status === 'invalid' ? (
                      <div className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Invalid</span>
                      </div>
                    ) : null
                  ) : (
                    <span className="text-[11px] text-stone-600 hidden sm:inline">
                      3-30 chars, a-z, 0-9, -, _
                    </span>
                  )}
                </div>
              </div>

              {aliasStatus.message && (
                <p
                  className={`text-[11px] mt-1.5 ${
                    aliasStatus.status === 'available'
                      ? 'text-emerald-600 font-medium'
                      : aliasStatus.status === 'taken'
                      ? 'text-rose-600 font-medium'
                      : 'text-stone-500'
                  }`}
                >
                  {aliasStatus.message}
                </p>
              )}
            </div>

            {/* Optional Title/Tag */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Link Title or Campaign Tag (Optional)
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q3 Summer Promo on Twitter"
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-900 transition-all"
                />
              </div>
            </div>

            {/* Account Association Note */}
            {!user && (
              <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl flex items-center justify-between gap-3 text-xs">
                <span className="text-amber-900">
                  You are creating as a guest. Sign in to save links to your personal dashboard and track analytics.
                </span>
                {onOpenAuthModal && (
                  <button
                    type="button"
                    onClick={onOpenAuthModal}
                    className="font-bold text-amber-800 hover:text-amber-950 underline shrink-0 cursor-pointer"
                  >
                    Sign In
                  </button>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || (customAlias.trim().length > 0 && aliasStatus.status !== 'available')}
              className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Creating Short URL...</span>
                </>
              ) : (
                <>
                  <span>Create Short URL</span>
                  <ArrowRight className="w-4 h-4 text-stone-300" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
