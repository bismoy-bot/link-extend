import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Link2,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Search,
  Plus,
  Loader2,
  Lock,
  MousePointerClick,
  Sparkles,
  RefreshCw,
  Globe2,
} from 'lucide-react';
import type { ShortLink } from '../types';
import { useAuth } from '../context/AuthContext';
import { AnalyticsModal } from './AnalyticsModal';

interface LinksDashboardProps {
  onCreateNewClick: () => void;
  onOpenAuthModal: () => void;
}

export const LinksDashboard: React.FC<LinksDashboardProps> = ({
  onCreateNewClick,
  onOpenAuthModal,
}) => {
  const { user, token, loginAsDemo } = useAuth();
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedAnalyticsLinkId, setSelectedAnalyticsLinkId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchLinks = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/links', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to retrieve user links');
      const data = await res.json();
      setLinks(data.links || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching links');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, [token]);

  const handleDelete = async (id: string, alias: string) => {
    if (!confirm(`Are you sure you want to delete short link /s/${alias}?`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/links/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete link');
      setLinks((prev) => prev.filter((l) => l.id !== id));
    } catch (err: any) {
      alert(err.message || 'Could not delete link');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopy = (link: ShortLink) => {
    const fullUrl = `${window.location.origin}${link.shortUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Aggregated metrics
  const totalClicksAllLinks = links.reduce((acc, l) => acc + (l.totalClicks || 0), 0);
  const topLink = [...links].sort((a, b) => (b.totalClicks || 0) - (a.totalClicks || 0))[0];

  // Filtered links
  const filteredLinks = links.filter((link) => {
    const q = searchQuery.toLowerCase();
    return (
      link.alias.toLowerCase().includes(q) ||
      link.originalUrl.toLowerCase().includes(q) ||
      (link.title && link.title.toLowerCase().includes(q))
    );
  });

  if (!user) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-stone-900">
            Sign In to Access Your Dashboard
          </h3>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-md mx-auto mb-6">
            View all shortened URLs associated with your account, monitor real-time click volume, and analyze visitor geographic locations.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-xs mx-auto">
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              Sign In or Register
            </button>
            <button
              type="button"
              onClick={loginAsDemo}
              className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Demo Account</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Top Header with Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-amber-500" />
            My Shortened Links Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Manage links created for <span className="font-semibold text-stone-800">{user.email}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchLinks}
            className="p-2.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-600 rounded-xl transition-colors cursor-pointer shadow-2xs"
            title="Refresh links"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={onCreateNewClick}
            className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Shorten New URL</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Shortened Links
            </span>
            <Link2 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-stone-900">{links.length}</div>
          <span className="text-[11px] text-stone-600 mt-0.5 block">
            Active custom aliases
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Total Clicks Tracked
            </span>
            <MousePointerClick className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-stone-900">{totalClicksAllLinks}</div>
          <span className="text-[11px] text-stone-600 mt-0.5 block">
            Across all your shortened links
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Top Performing Link
            </span>
            <Globe2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-base font-bold text-stone-900 truncate">
            {topLink ? `/s/${topLink.alias}` : '—'}
          </div>
          <span className="text-[11px] text-stone-600 mt-0.5 block">
            {topLink ? `${topLink.totalClicks} clicks recorded` : 'No clicks yet'}
          </span>
        </div>
      </div>

      {/* Search & Links Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by alias, title, or destination..."
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-900"
            />
          </div>
          <span className="text-xs font-medium text-stone-600 whitespace-nowrap">
            Showing {filteredLinks.length} of {links.length}
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-7 h-7 animate-spin text-amber-500 mx-auto mb-2" />
            <p className="text-xs font-medium text-stone-500">Loading your shortened links...</p>
          </div>
        ) : filteredLinks.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3">
              <Link2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-stone-900">
              {searchQuery ? 'No matching links found' : 'No shortened links created yet'}
            </h4>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto mb-4">
              {searchQuery
                ? 'Try adjusting your search query or clear the filter.'
                : 'Create your first short link with a custom alias and start tracking visitor clicks!'}
            </p>
            {!searchQuery && (
              <button
                type="button"
                onClick={onCreateNewClick}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Short URL</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50/80 text-stone-600 font-semibold border-b border-stone-200">
                  <th className="py-3 px-4">Short URL & Alias</th>
                  <th className="py-3 px-4">Destination Target</th>
                  <th className="py-3 px-4 text-center">Total Clicks</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredLinks.map((link) => (
                  <tr key={link.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-stone-900">
                          /s/<span className="text-amber-600">{link.alias}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(link)}
                          className="p-1 text-stone-400 hover:text-stone-700 rounded-md hover:bg-stone-100 transition-colors cursor-pointer"
                          title="Copy short URL"
                        >
                          {copiedId === link.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      {link.title && link.title !== link.alias && (
                        <span className="text-[11px] text-stone-500 block truncate max-w-[200px]">
                          {link.title}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <a
                        href={link.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-stone-600 hover:text-stone-900 truncate max-w-[280px] block flex items-center gap-1 group"
                        title={link.originalUrl}
                      >
                        <span className="truncate">{link.originalUrl}</span>
                        <ExternalLink className="w-3 h-3 text-stone-400 group-hover:text-stone-600 shrink-0" />
                      </a>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-800">
                        {link.totalClicks || 0}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-stone-500 whitespace-nowrap font-mono text-[11px]">
                      {new Date(link.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedAnalyticsLinkId(link.id)}
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="View detailed analytics & geographic tracking"
                        >
                          <BarChart3 className="w-3.5 h-3.5 text-amber-700" />
                          <span>Analytics</span>
                        </button>

                        <a
                          href={link.shortUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors cursor-pointer"
                          title="Test 302 Redirection"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        <button
                          type="button"
                          onClick={() => handleDelete(link.id, link.alias)}
                          disabled={deletingId === link.id}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete short link"
                        >
                          {deletingId === link.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Analytics Modal */}
      {selectedAnalyticsLinkId && (
        <AnalyticsModal
          linkId={selectedAnalyticsLinkId}
          onClose={() => setSelectedAnalyticsLinkId(null)}
        />
      )}
    </div>
  );
};
