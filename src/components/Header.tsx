/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, RefreshCw, BarChart2, Star } from 'lucide-react';

interface HeaderProps {
  totalAgents: number;
  totalReviews: number;
  overallRating: number;
  onReset: () => void;
  isResetting: boolean;
}

export default function Header({ totalAgents, totalReviews, overallRating, onReset, isResetting }: HeaderProps) {
  return (
    <header className="bg-white text-slate-900 border-b border-slate-200 px-6 py-4 shadow-xs flex-shrink-0">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="bg-camp-green p-2 rounded-lg flex items-center justify-center shrink-0 shadow-sm shadow-camp-green/20">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-1">
                WP<span className="text-camp-green">Engine</span> <span className="text-slate-500 font-medium">Support Review Tracker</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">
                Team feedback dashboard & support ranking rankings
              </p>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-4 bg-slate-50 px-3.5 py-1.5 rounded-lg border border-slate-200/60 text-xs text-slate-600 font-medium">
              <div className="text-center">
                <span className="text-slate-400 text-[10px] uppercase font-mono tracking-wider block">Agents</span>
                <span className="font-bold text-slate-900">{totalAgents}</span>
              </div>
              <div className="h-5 w-px bg-slate-200" />
              <div className="text-center">
                <span className="text-slate-400 text-[10px] uppercase font-mono tracking-wider block">Reviews</span>
                <span className="font-bold text-slate-900">{totalReviews}</span>
              </div>
              <div className="h-5 w-px bg-slate-200" />
              <div className="text-center">
                <span className="text-slate-400 text-[10px] uppercase font-mono tracking-wider block">Team Avg</span>
                <span className="font-bold text-camp-green flex items-center justify-center gap-0.5">
                  {overallRating > 0 ? overallRating.toFixed(2) : "—"}
                  <Star className="w-3 h-3 fill-camp-gold text-camp-gold" />
                </span>
              </div>
            </div>

            <button
              onClick={onReset}
              disabled={isResetting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 rounded-lg transition-colors border border-slate-200 text-xs font-mono font-bold disabled:opacity-50 cursor-pointer"
              title="Reset Database to original seeds for testing"
            >
              <RefreshCw className={`h-3 w-3 text-slate-400 ${isResetting ? 'animate-spin' : ''}`} />
              Reset Seeds
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
