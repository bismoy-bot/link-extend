/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header, MainNavTab } from './components/Header';
import { UrlInputForm } from './components/UrlInputForm';
import { ExpandedResultCard } from './components/ExpandedResultCard';
import { BatchUnshortenView } from './components/BatchUnshortenView';
import { HistoryDrawer } from './components/HistoryDrawer';
import { CreateShortLinkForm } from './components/CreateShortLinkForm';
import { LinksDashboard } from './components/LinksDashboard';
import { AuthModal } from './components/AuthModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import type { UnshortenResult } from './types';
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  Maximize2,
  Link2,
  BarChart3,
  Layers,
} from 'lucide-react';

const STORAGE_KEY = 'link_expander_history_v1';

function AppContent() {
  const [currentNav, setCurrentNav] = useState<MainNavTab>('enlarge');
  const [unshortenSubTab, setUnshortenSubTab] = useState<'single' | 'batch'>('single');
  const [currentResult, setCurrentResult] = useState<UnshortenResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<UnshortenResult[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Load unshorten history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const saveHistory = (newHistory: UnshortenResult[]) => {
    setHistory(newHistory);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory.slice(0, 30)));
    } catch {
      // ignore
    }
  };

  const handleUnshorten = async (urlToExpand: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/unshorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToExpand }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to enlarge link.');
      }

      setCurrentResult(data);
      const updatedHistory = [data, ...history.filter((h) => h.originalUrl !== data.originalUrl)].slice(0, 30);
      saveHistory(updatedHistory);
    } catch (err: any) {
      setError(err.message || 'Unable to enlarge shortened URL.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const handleSelectFromBatch = (result: UnshortenResult) => {
    setCurrentResult(result);
    setUnshortenSubTab('single');
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans">
      <Header
        currentNav={currentNav}
        setCurrentNav={setCurrentNav}
        unshortenSubTab={unshortenSubTab}
        setUnshortenSubTab={setUnshortenSubTab}
        historyCount={history.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* NAV 1: ENLARGE SHORT LINK */}
        {currentNav === 'enlarge' && (
          <div className="space-y-6">
            {/* Sub-tab switcher between single URL and batch URLs */}
            <div className="flex items-center justify-between">
              <div className="flex items-center p-1 bg-stone-200/70 rounded-xl">
                <button
                  type="button"
                  onClick={() => setUnshortenSubTab('single')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    unshortenSubTab === 'single'
                      ? 'bg-white text-stone-900 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Single Link
                </button>
                <button
                  type="button"
                  onClick={() => setUnshortenSubTab('batch')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    unshortenSubTab === 'batch'
                      ? 'bg-white text-stone-900 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Batch Multi-URL</span>
                </button>
              </div>

              <span className="text-xs text-stone-500 hidden sm:inline">
                Inspect redirect chains, safety rating, & tracking parameters
              </span>
            </div>

            {unshortenSubTab === 'single' ? (
              <>
                <UrlInputForm
                  onUnshorten={handleUnshorten}
                  isLoading={isLoading}
                  initialUrl={currentResult?.originalUrl || ''}
                />

                {error && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3 shadow-xs">
                    <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold block mb-0.5">Resolution Failed</strong>
                      <span>{error}</span>
                      <p className="text-xs text-rose-600 mt-1">
                        Please make sure the link is reachable and starts with a valid domain or scheme.
                      </p>
                    </div>
                  </div>
                )}

                {currentResult && (
                  <ExpandedResultCard
                    result={currentResult}
                    onClear={() => setCurrentResult(null)}
                  />
                )}

                {!currentResult && !isLoading && (
                  <div className="space-y-6 pt-2">
                    <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-900 mb-4 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        How Link Expander Works
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl bg-stone-50 border border-stone-100 flex flex-col justify-between">
                          <div>
                            <span className="w-6 h-6 rounded-md bg-stone-900 text-white font-mono text-xs font-bold flex items-center justify-center mb-2">
                              1
                            </span>
                            <h4 className="font-bold text-stone-900 text-sm mb-1">
                              Server-Side Fetch
                            </h4>
                            <p className="text-xs text-stone-600 leading-relaxed">
                              We send a secure request from our server to the shortener, bypassing browser CORS and keeping your IP private.
                            </p>
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-stone-50 border border-stone-100 flex flex-col justify-between">
                          <div>
                            <span className="w-6 h-6 rounded-md bg-stone-900 text-white font-mono text-xs font-bold flex items-center justify-center mb-2">
                              2
                            </span>
                            <h4 className="font-bold text-stone-900 text-sm mb-1">
                              Trace Redirect Hops
                            </h4>
                            <p className="text-xs text-stone-600 leading-relaxed">
                              We follow every HTTP 301, 302, 307, 308 redirect and HTML meta refresh step by step, recording each hop.
                            </p>
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-stone-50 border border-stone-100 flex flex-col justify-between">
                          <div>
                            <span className="w-6 h-6 rounded-md bg-stone-900 text-white font-mono text-xs font-bold flex items-center justify-center mb-2">
                              3
                            </span>
                            <h4 className="font-bold text-stone-900 text-sm mb-1">
                              Inspect & Preview
                            </h4>
                            <p className="text-xs text-stone-600 leading-relaxed">
                              We inspect page metadata, query parameters, tracking tokens, and security flags before you click.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-stone-100/70 rounded-2xl border border-stone-200/80 p-6">
                      <h4 className="font-bold text-stone-900 text-sm mb-3 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        Why enlarge shortened links before clicking?
                      </h4>

                      <ul className="text-xs text-stone-700 space-y-2 leading-relaxed">
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-600 font-bold">✓</span>
                          <span>
                            <strong>Prevent Phishing & Malware:</strong> Attackers often use short links (bit.ly, tinyurl) to camouflage fraudulent or malicious URLs.
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-600 font-bold">✓</span>
                          <span>
                            <strong>Strip Tracking Tokens:</strong> Reveal and remove aggressive UTM, Facebook (`fbclid`), and Google (`gclid`) tracking tokens to protect your privacy.
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-600 font-bold">✓</span>
                          <span>
                            <strong>Inspect Multi-Hop Redirects:</strong> Detect affiliate redirects, intermediate redirect cloaking, and affiliate cookie-dropping.
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <BatchUnshortenView onSelectResult={handleSelectFromBatch} />
            )}
          </div>
        )}

        {/* NAV 2: SHORTEN & CUSTOM ALIAS */}
        {currentNav === 'shorten' && (
          <CreateShortLinkForm
            onNavigateToDashboard={() => setCurrentNav('dashboard')}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {/* NAV 3: USER DASHBOARD & ANALYTICS */}
        {currentNav === 'dashboard' && (
          <LinksDashboard
            onCreateNewClick={() => setCurrentNav('shorten')}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-6 mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-700">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-800">Link Expander</span>
            <span>—</span>
            <span>Custom URL shortening, click & geo analytics, and safe link inspection</span>
          </div>
          <div className="flex items-center gap-4 text-stone-700">
            <span>HTTP 302 Redirection</span>
            <span>•</span>
            <span>Geo Analytics</span>
            <span>•</span>
            <span>SSL Protected</span>
          </div>
        </div>
      </footer>

      {/* History Drawer for Unshortener */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelect={(item) => {
          setCurrentResult(item);
          setCurrentNav('enlarge');
          setUnshortenSubTab('single');
        }}
        onClear={handleClearHistory}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
