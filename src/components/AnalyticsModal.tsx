import React, { useState, useEffect } from 'react';
import {
  X,
  BarChart3,
  Globe2,
  Smartphone,
  Monitor,
  Tablet,
  ExternalLink,
  Calendar,
  Clock,
  Layers,
  Compass,
  Loader2,
  MousePointerClick,
  Copy,
  Check,
} from 'lucide-react';
import type { LinkAnalytics } from '../types';
import { useAuth } from '../context/AuthContext';

interface AnalyticsModalProps {
  linkId: string | null;
  onClose: () => void;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ linkId, onClose }) => {
  const { token } = useAuth();
  const [data, setData] = useState<LinkAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!linkId) return;

    setLoading(true);
    setError(null);

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch(`/api/links/${linkId}/analytics`, { headers })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load analytics.');
        return res.json();
      })
      .then((json: LinkAnalytics) => {
        setData(json);
      })
      .catch((err) => {
        setError(err.message || 'Could not retrieve link analytics.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [linkId, token]);

  if (!linkId) return null;

  const handleCopy = () => {
    if (!data) return;
    const fullUrl = `${window.location.origin}${data.link.shortUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const maxClickCount = data?.clicksByDate
    ? Math.max(...data.clicksByDate.map((d) => d.count), 1)
    : 1;

  const uniqueCountries = data?.geo
    ? new Set(data.geo.map((g) => g.country)).size
    : 0;

  const topReferrer = data?.referrers
    ? Object.entries(data.referrers).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] || 'Direct'
    : 'None';

  const topDevice = data?.devices
    ? Object.entries(data.devices).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] || 'Desktop'
    : 'None';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-stone-900 truncate">
                  Link Analytics & Tracking
                </h3>
                {data && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-mono font-bold rounded-md">
                    /s/{data.link.alias}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 truncate">
                {data?.link.title || data?.link.originalUrl || 'Real-time click traffic and geography'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading && (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-3" />
              <p className="text-sm font-medium text-stone-600">Loading analytics records...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          {data && (
            <>
              {/* Short Link Bar with copy and test link */}
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-mono font-bold text-stone-800 truncate">
                    {window.location.origin}
                    <span className="text-amber-600">{data.link.shortUrl}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-2.5 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-stone-500" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  <a
                    href={data.link.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <span>Test Link</span>
                    <ExternalLink className="w-3 h-3 text-stone-300" />
                  </a>
                </div>
              </div>

              {/* 4 KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="flex items-center justify-between text-stone-400 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                      Total Clicks
                    </span>
                    <MousePointerClick className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-2xl font-black text-stone-900">
                    {data.totalClicks}
                  </div>
                  <span className="text-[10px] text-stone-600 mt-1 block">
                    All-time recorded redirects
                  </span>
                </div>

                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="flex items-center justify-between text-stone-400 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                      Locations
                    </span>
                    <Globe2 className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-2xl font-black text-stone-900">
                    {uniqueCountries}
                  </div>
                  <span className="text-[10px] text-stone-600 mt-1 block">
                    Unique countries reached
                  </span>
                </div>

                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="flex items-center justify-between text-stone-400 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                      Top Device
                    </span>
                    <Monitor className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="text-lg font-bold text-stone-900 capitalize truncate">
                    {topDevice}
                  </div>
                  <span className="text-[10px] text-stone-600 mt-1 block">
                    Primary traffic platform
                  </span>
                </div>

                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="flex items-center justify-between text-stone-400 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                      Top Referrer
                    </span>
                    <Compass className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-sm font-bold text-stone-900 truncate">
                    {topReferrer}
                  </div>
                  <span className="text-[10px] text-stone-600 mt-1 block">
                    Main inbound source
                  </span>
                </div>
              </div>

              {/* Clicks Timeline Chart */}
              <div className="p-5 bg-stone-50 rounded-xl border border-stone-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-stone-500" />
                    Clicks Over Time (Last 7 Days)
                  </h4>
                  <span className="text-xs text-stone-500 font-mono">
                    {data.clicksByDate.reduce((acc, curr) => acc + curr.count, 0)} clicks this week
                  </span>
                </div>

                <div className="h-32 flex items-end justify-between gap-2 pt-4 px-2">
                  {data.clicksByDate.map((item, idx) => {
                    const heightPercent = Math.max((item.count / maxClickCount) * 100, 6);
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                        <span className="text-[10px] font-mono font-bold text-stone-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.count}
                        </span>
                        <div
                          className="w-full max-w-[36px] bg-amber-500 hover:bg-amber-600 rounded-t-md transition-all relative"
                          style={{ height: `${heightPercent}%` }}
                        />
                        <span className="text-[10px] font-medium text-stone-500 mt-1 text-center whitespace-nowrap">
                          {item.date}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Geographic Distribution */}
              <div className="p-5 bg-stone-50 rounded-xl border border-stone-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5 mb-3">
                  <Globe2 className="w-3.5 h-3.5 text-blue-500" />
                  Geographic Location Breakdown (Country / City)
                </h4>

                {data.geo.length === 0 ? (
                  <p className="text-xs text-stone-400 py-4 text-center">
                    No geographic click data recorded yet.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {data.geo.slice(0, 8).map((g, idx) => {
                      const percent = data.totalClicks > 0
                        ? Math.round((g.count / data.totalClicks) * 100)
                        : 0;
                      return (
                        <div key={idx} className="text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-stone-800 flex items-center gap-1.5">
                              <span className="text-xs text-stone-400 font-mono">[{g.countryCode}]</span>
                              <span>{g.city ? `${g.city}, ` : ''}{g.country}</span>
                            </span>
                            <span className="font-mono text-stone-500 font-bold">
                              {g.count} clicks ({percent}%)
                            </span>
                          </div>
                          <div className="w-full bg-stone-200/80 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Devices & Referrers Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Devices */}
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5 mb-3">
                    <Layers className="w-3.5 h-3.5 text-purple-500" />
                    Devices & Browsers
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-stone-200/60">
                      <span className="text-stone-600 flex items-center gap-1.5">
                        <Monitor className="w-3.5 h-3.5 text-stone-400" /> Desktop
                      </span>
                      <span className="font-mono font-bold text-stone-900">{data.devices.desktop || 0}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-stone-200/60">
                      <span className="text-stone-600 flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-stone-400" /> Mobile
                      </span>
                      <span className="font-mono font-bold text-stone-900">{data.devices.mobile || 0}</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-stone-600 flex items-center gap-1.5">
                        <Tablet className="w-3.5 h-3.5 text-stone-400" /> Tablet
                      </span>
                      <span className="font-mono font-bold text-stone-900">{data.devices.tablet || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Referrers */}
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5 mb-3">
                    <Compass className="w-3.5 h-3.5 text-emerald-500" />
                    Referrer Sources
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    {Object.entries(data.referrers).slice(0, 4).map(([ref, count], idx) => (
                      <div key={idx} className="flex items-center justify-between py-0.5">
                        <span className="text-stone-600 truncate max-w-[170px]">{ref}</span>
                        <span className="font-mono font-bold text-stone-900">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Clicks Log */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5 mb-2.5">
                  <Clock className="w-3.5 h-3.5 text-stone-500" />
                  Recent Click Events Log ({data.recentClicks.length})
                </h4>
                <div className="border border-stone-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-stone-100 text-stone-600 font-semibold text-[11px] border-b border-stone-200">
                        <th className="p-2.5">Time</th>
                        <th className="p-2.5">Location</th>
                        <th className="p-2.5">Platform</th>
                        <th className="p-2.5">Referrer</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {data.recentClicks.map((click) => {
                        const dateStr = new Date(click.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        });
                        return (
                          <tr key={click.id} className="hover:bg-stone-50 transition-colors">
                            <td className="p-2.5 font-mono text-stone-500 whitespace-nowrap">{dateStr}</td>
                            <td className="p-2.5 text-stone-800 font-medium">
                              {click.city ? `${click.city}, ` : ''}{click.country}
                            </td>
                            <td className="p-2.5 text-stone-600 capitalize">
                              {click.device} ({click.browser})
                            </td>
                            <td className="p-2.5 text-stone-500 truncate max-w-[140px]">
                              {click.referrer}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
