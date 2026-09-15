import React from 'react';
import { X, Trash2, Clock, GitCommit, ExternalLink, ArrowRight, CornerDownRight } from 'lucide-react';
import type { UnshortenResult } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: UnshortenResult[];
  onSelect: (item: UnshortenResult) => void;
  onClear: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelect,
  onClear,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl border-l border-stone-200">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-stone-900 text-base">
              Unshorten History
            </h3>
            <p className="text-xs text-stone-500">
              {history.length} previously enlarged {history.length === 1 ? 'link' : 'links'}
            </p>
          </div>

          <div className="flex items-center gap-1">
            {history.length > 0 && (
              <button
                type="button"
                onClick={onClear}
                className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-stone-100 transition-colors"
                title="Clear history"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
              title="Close history"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List of items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
              <Clock className="w-8 h-8 mb-2 text-stone-300" />
              <p className="text-sm font-semibold text-stone-600">No links enlarged yet</p>
              <p className="text-xs text-stone-400 mt-1">
                Any shortened links you enlarge will be recorded here locally.
              </p>
            </div>
          ) : (
            history.map((item) => {
              const formattedTime = new Date(item.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelect(item);
                    onClose();
                  }}
                  className="p-3 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-amber-50/30 hover:border-stone-400 cursor-pointer transition-all text-xs group"
                >
                  <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1.5">
                    <span className="font-mono">{formattedTime}</span>
                    <div className="flex items-center gap-1 font-mono text-stone-600">
                      <GitCommit className="w-3 h-3 text-stone-400" />
                      <span>{item.totalRedirects} hops</span>
                    </div>
                  </div>

                  <div className="font-mono text-stone-500 truncate mb-1">
                    {item.originalUrl}
                  </div>

                  <div className="flex items-center gap-1.5 text-stone-900 font-semibold font-mono break-all line-clamp-2">
                    <CornerDownRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>{item.expandedUrl}</span>
                  </div>

                  {item.meta.title && (
                    <div className="mt-1.5 text-stone-600 font-sans line-clamp-1 text-[11px]">
                      {item.meta.title}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
