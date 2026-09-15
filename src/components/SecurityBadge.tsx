import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Lock, Unlock, Globe, Server } from 'lucide-react';
import type { SecurityAssessment } from '../types';

interface SecurityBadgeProps {
  security: SecurityAssessment;
}

export const SecurityBadge: React.FC<SecurityBadgeProps> = ({ security }) => {
  const isSafe = security.riskLevel === 'safe';
  const isCaution = security.riskLevel === 'caution';
  const isWarning = security.riskLevel === 'warning';

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-stone-700" /> Security Inspection
        </h4>
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
            isSafe
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : isCaution
              ? 'bg-amber-50 text-amber-800 border border-amber-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {isSafe && <ShieldCheck className="w-3.5 h-3.5" />}
          {isCaution && <AlertTriangle className="w-3.5 h-3.5" />}
          {isWarning && <ShieldAlert className="w-3.5 h-3.5" />}
          {isSafe ? 'Low Risk' : isCaution ? 'Moderate Caution' : 'Potential High Risk'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        {/* HTTPS */}
        <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-100 flex flex-col justify-between">
          <span className="text-stone-500 font-medium">Protocol</span>
          <div className="flex items-center gap-1.5 mt-1 font-semibold text-stone-800">
            {security.isHttps ? (
              <>
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>HTTPS (Secure)</span>
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5 text-rose-600" />
                <span className="text-rose-700">HTTP (Unencrypted)</span>
              </>
            )}
          </div>
        </div>

        {/* Shortener Service */}
        <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-100 flex flex-col justify-between">
          <span className="text-stone-500 font-medium">Shortener Detected</span>
          <div className="flex items-center gap-1.5 mt-1 font-semibold text-stone-800 truncate">
            <Globe className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="truncate">{security.shortenerName || 'Generic Link'}</span>
          </div>
        </div>

        {/* Host Type */}
        <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-100 flex flex-col justify-between">
          <span className="text-stone-500 font-medium">Host Type</span>
          <div className="flex items-center gap-1.5 mt-1 font-semibold text-stone-800">
            <Server className="w-3.5 h-3.5 text-purple-500" />
            <span>{security.isIpAddress ? 'Direct IP (Warning)' : 'Standard Domain'}</span>
          </div>
        </div>

        {/* Redirect Depth */}
        <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-100 flex flex-col justify-between">
          <span className="text-stone-500 font-medium">Chain Length</span>
          <div className="flex items-center gap-1.5 mt-1 font-semibold text-stone-800">
            <span>{security.excessiveHops ? 'Deep (5+ hops)' : 'Normal depth'}</span>
          </div>
        </div>
      </div>

      {security.flags.length > 0 && (
        <div className="mt-3 pt-3 border-t border-stone-100 space-y-1.5">
          {security.flags.map((flag, idx) => (
            <div
              key={idx}
              className="text-xs text-amber-800 bg-amber-50/70 border border-amber-200/60 rounded-md px-2.5 py-1.5 flex items-start gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>{flag}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
