import React from 'react';
import { Globe, Image as ImageIcon, ExternalLink, Compass } from 'lucide-react';
import type { PageMeta } from '../types';

interface PagePreviewCardProps {
  meta: PageMeta;
  url: string;
}

export const PagePreviewCard: React.FC<PagePreviewCardProps> = ({ meta, url }) => {
  let hostname = '';
  try {
    hostname = new URL(url).hostname;
  } catch {
    hostname = url;
  }

  const hasContent = Boolean(meta.title || meta.description || meta.ogImage);

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
          <Compass className="w-4 h-4 text-stone-700" />
          Destination Content Preview
        </h4>
        <span className="text-xs text-stone-500 font-mono flex items-center gap-1.5">
          {meta.favicon && (
            <img
              src={meta.favicon}
              alt=""
              className="w-3.5 h-3.5 object-contain rounded-xs"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          )}
          {hostname}
        </span>
      </div>

      {hasContent ? (
        <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-4 flex flex-col md:flex-row gap-4 items-start">
          {meta.ogImage && (
            <div className="w-full md:w-48 h-28 shrink-0 rounded-lg overflow-hidden bg-stone-200 border border-stone-300 relative">
              <img
                src={meta.ogImage}
                alt="Page OpenGraph Preview"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLElement).parentElement!.style.display = 'none';
                }}
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            {meta.title && (
              <h5 className="font-bold text-stone-900 text-sm md:text-base leading-snug mb-1">
                {meta.title}
              </h5>
            )}

            {meta.description && (
              <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed mb-2">
                {meta.description}
              </p>
            )}

            {meta.canonicalUrl && (
              <div className="text-[11px] text-stone-500 font-mono truncate">
                <span className="font-semibold text-stone-600">Canonical: </span>
                {meta.canonicalUrl}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 text-center text-xs text-stone-500">
          No HTML OpenGraph metadata or title was returned by the destination endpoint (it may be a direct asset, API response, or protected page).
        </div>
      )}
    </div>
  );
};
