/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { AgentStats } from '../types';
import { Search, ChevronDown, Award, Star, Zap, BookOpen, Sparkles, Filter, SlidersHorizontal, ArrowUpDown, ArrowDown, ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LeaderboardProps {
  statsList: AgentStats[];
  onSelectAgent: (agentId: string | null) => void;
  selectedAgentId: string | null;
}

type SortOption = 
  | 'overall-desc' 
  | 'overall-asc'
  | 'name-asc' 
  | 'name-desc' 
  | 'speed-desc' 
  | 'speed-asc'
  | 'knowledge-desc' 
  | 'knowledge-asc'
  | 'itFactor-desc' 
  | 'itFactor-asc'
  | 'reviews-desc'
  | 'reviews-asc';

export default function Leaderboard({ statsList, onSelectAgent, selectedAgentId }: LeaderboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('overall-desc');

  // Filter and sort the agents
  const processedStats = useMemo(() => {
    let result = [...statsList];

    // Filter by search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.agent.name.toLowerCase().includes(q) ||
          (s.agent.department && s.agent.department.toLowerCase().includes(q))
      );
    }

    // Sort by selected criteria
    result.sort((a, b) => {
      switch (sortBy) {
        case 'overall-desc':
          // Sort primary by overall score; if tie, sort by review count, then name
          return b.overallRating - a.overallRating || b.reviewsCount - a.reviewsCount || a.agent.name.localeCompare(b.agent.name);
        case 'overall-asc':
          return a.overallRating - b.overallRating || a.reviewsCount - b.reviewsCount || a.agent.name.localeCompare(b.agent.name);
        case 'name-asc':
          return a.agent.name.localeCompare(b.agent.name);
        case 'name-desc':
          return b.agent.name.localeCompare(a.agent.name);
        case 'speed-desc':
          return b.avgSpeed - a.avgSpeed || b.overallRating - a.overallRating;
        case 'speed-asc':
          return a.avgSpeed - b.avgSpeed || a.overallRating - b.overallRating;
        case 'knowledge-desc':
          return b.avgKnowledge - a.avgKnowledge || b.overallRating - a.overallRating;
        case 'knowledge-asc':
          return a.avgKnowledge - b.avgKnowledge || a.overallRating - b.overallRating;
        case 'itFactor-desc':
          return b.avgItFactor - a.avgItFactor || b.overallRating - a.overallRating;
        case 'itFactor-asc':
          return a.avgItFactor - b.avgItFactor || a.overallRating - b.overallRating;
        case 'reviews-desc':
          return b.reviewsCount - a.reviewsCount;
        case 'reviews-asc':
          return a.reviewsCount - b.reviewsCount;
        default:
          return 0;
      }
    });

    return result;
  }, [statsList, searchQuery, sortBy]);

  // Color helper for rankings
  const getRankBadgeStyles = (index: number) => {
    if (index === 0) {
      return {
        bg: 'bg-camp-green/10 text-camp-green border-camp-green/20',
        text: 'text-camp-green',
        label: '01',
        glow: 'ring-1 ring-camp-green/15'
      };
    }
    if (index === 1) {
      return {
        bg: 'bg-camp-navy/10 text-camp-navy border-camp-navy/20',
        text: 'text-camp-navy',
        label: '02',
        glow: ''
      };
    }
    if (index === 2) {
      return {
        bg: 'bg-camp-gold/15 text-yellow-800 border-camp-gold/25',
        text: 'text-yellow-700',
        label: '03',
        glow: ''
      };
    }
    const idxFormatted = index + 1 < 10 ? `0${index + 1}` : `${index + 1}`;
    return {
      bg: 'bg-slate-50/50 text-slate-400 border-slate-100/60',
      text: 'text-slate-400',
      label: idxFormatted,
      glow: ''
    };
  };

  // Color helper for average scores
  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-emerald-700 bg-emerald-50 border-emerald-150';
    if (score >= 3.8) return 'text-camp-green bg-camp-green/5 border-camp-green/15';
    if (score >= 3.0) return 'text-amber-700 bg-amber-50 border-amber-100';
    if (score > 0) return 'text-rose-700 bg-rose-50 border-rose-100';
    return 'text-slate-400 bg-slate-50 border-slate-200';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
      
      {/* Title & Introduction */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
            <Award className="h-4 w-4 text-camp-green" />
            Agent Standings
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            Ranked dynamically by the overall mathematical average of all feedback received.
          </p>
        </div>

        {/* Selected Filter Reset */}
        {selectedAgentId && (
          <button
            onClick={() => onSelectAgent(null)}
            className="self-start sm:self-center px-2.5 py-1.5 bg-camp-green/10 text-camp-green font-mono text-[11px] font-bold rounded-lg hover:bg-camp-green/15 transition-colors flex items-center gap-1 border border-camp-green/20 cursor-pointer"
          >
            <Filter className="h-3 w-3" />
            Clear Agent Filter
          </button>
        )}
      </div>

      {/* Search & Sort Controls Panel */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-4 mb-5">
        
        {/* Search Bar */}
        <div className="relative md:col-span-8">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search agents or departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-8.5 pr-4 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 bg-slate-50 border border-slate-250 rounded-lg focus:outline-none focus:ring-2 focus:ring-camp-green/10 focus:border-camp-green transition-all"
          />
        </div>

        {/* Sort Select */}
        <div className="relative md:col-span-4 flex items-center gap-1.5">
          <div className="relative w-full">
            <select
               value={sortBy}
               onChange={(e) => setSortBy(e.target.value as SortOption)}
               className="block w-full appearance-none bg-slate-50 border border-slate-250 text-slate-700 py-1.5 pl-2.5 pr-7 rounded-lg text-xs focus:ring-2 focus:ring-camp-green/10 focus:border-camp-green focus:outline-none transition-all cursor-pointer font-bold"
            >
               <option value="overall-desc">⭐ Overall Rating (High-to-Low)</option>
               <option value="overall-asc">⭐ Overall Rating (Low-to-High)</option>
               <option value="speed-desc">⚡ Speed Rating (High-to-Low)</option>
               <option value="speed-asc">⚡ Speed Rating (Low-to-High)</option>
               <option value="knowledge-desc">🧠 Technical Knowledge (High-to-Low)</option>
               <option value="knowledge-asc">🧠 Technical Knowledge (Low-to-High)</option>
               <option value="itFactor-desc">✨ It Factor charisma (High-to-Low)</option>
               <option value="itFactor-asc">✨ It Factor charisma (Low-to-High)</option>
               <option value="reviews-desc">💬 Feedback Count (High-to-Low)</option>
               <option value="reviews-asc">💬 Feedback Count (Low-to-High)</option>
               <option value="name-asc">🔤 Alphabetical (A-Z)</option>
               <option value="name-desc">🔤 Alphabetical (Z-A)</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-slate-400">
              <ChevronDown className="h-3 w-3" />
            </div>
          </div>
        </div>

      </div>

      {/* Column Headers for Table Layout */}
      <div className="hidden sm:flex items-center justify-between px-3.5 pb-2 text-[10px] font-mono select-none text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 mb-3 mt-1">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 text-center">Rank</div>
          <button 
            type="button"
            onClick={() => setSortBy(prev => prev === 'name-asc' ? 'name-desc' : 'name-asc')}
            className={`hover:text-camp-green flex items-center gap-1 transition-colors group cursor-pointer ${
              sortBy === 'name-asc' || sortBy === 'name-desc' ? 'text-camp-green font-extrabold' : ''
            }`}
          >
            <span>Agent / Department</span>
            {sortBy === 'name-asc' ? (
              <ArrowUp className="w-3.5 h-3.5 text-camp-green shrink-0" />
            ) : sortBy === 'name-desc' ? (
              <ArrowDown className="w-3.5 h-3.5 text-camp-green shrink-0" />
            ) : (
              <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-camp-green transition-colors shrink-0" />
            )}
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="grid grid-cols-3 gap-2 min-w-[190px] text-center">
            
            {/* Speed Sort Button */}
            <button 
              type="button"
              onClick={() => setSortBy(prev => prev === 'speed-desc' ? 'speed-asc' : 'speed-desc')}
              className={`hover:text-camp-green flex items-center justify-center gap-0.5 transition-colors cursor-pointer group ${
                sortBy === 'speed-desc' || sortBy === 'speed-asc' ? 'text-camp-green font-extrabold' : ''
              }`}
              title="Sort by Speed"
            >
              <span>Speed (S)</span>
              {sortBy === 'speed-desc' ? (
                <ArrowDown className="w-3.5 h-3.5 text-camp-green shrink-0" />
              ) : sortBy === 'speed-asc' ? (
                <ArrowUp className="w-3.5 h-3.5 text-camp-green shrink-0" />
              ) : (
                <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-camp-green transition-colors shrink-0" />
              )}
            </button>
            
            {/* Knowledge Sort Button */}
            <button 
              type="button"
              onClick={() => setSortBy(prev => prev === 'knowledge-desc' ? 'knowledge-asc' : 'knowledge-desc')}
              className={`hover:text-camp-green flex items-center justify-center gap-0.5 transition-colors cursor-pointer group ${
                sortBy === 'knowledge-desc' || sortBy === 'knowledge-asc' ? 'text-camp-green font-extrabold' : ''
              }`}
              title="Sort by Knowledge"
            >
              <span>Knowl. (K)</span>
              {sortBy === 'knowledge-desc' ? (
                <ArrowDown className="w-3.5 h-3.5 text-camp-green shrink-0" />
              ) : sortBy === 'knowledge-asc' ? (
                <ArrowUp className="w-3.5 h-3.5 text-camp-green shrink-0" />
              ) : (
                <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-camp-green transition-colors shrink-0" />
              )}
            </button>
            
            {/* It Factor Sort Button */}
            <button 
              type="button"
              onClick={() => setSortBy(prev => prev === 'itFactor-desc' ? 'itFactor-asc' : 'itFactor-desc')}
              className={`hover:text-camp-green flex items-center justify-center gap-0.5 transition-colors cursor-pointer group ${
                sortBy === 'itFactor-desc' || sortBy === 'itFactor-asc' ? 'text-camp-green font-extrabold' : ''
              }`}
              title="Sort by It Factor"
            >
              <span>It Fact. (I)</span>
              {sortBy === 'itFactor-desc' ? (
                <ArrowDown className="w-3.5 h-3.5 text-camp-green shrink-0" />
              ) : sortBy === 'itFactor-asc' ? (
                <ArrowUp className="w-3.5 h-3.5 text-camp-green shrink-0" />
              ) : (
                <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-camp-green transition-colors shrink-0" />
              )}
            </button>
            
          </div>
          
          {/* Overall Rating Sort Button */}
          <div className="min-w-[85px] text-right">
            <button 
              type="button"
              onClick={() => setSortBy(prev => prev === 'overall-desc' ? 'overall-asc' : 'overall-desc')}
              className={`hover:text-camp-green inline-flex items-center gap-0.5 transition-colors cursor-pointer group ${
                sortBy === 'overall-desc' || sortBy === 'overall-asc' ? 'text-camp-green font-extrabold' : ''
              }`}
              title="Sort by Overall Rating"
            >
              <span>Overall Rating</span>
              {sortBy === 'overall-desc' ? (
                <ArrowDown className="w-3.5 h-3.5 text-camp-green shrink-0" />
              ) : sortBy === 'overall-asc' ? (
                <ArrowUp className="w-3.5 h-3.5 text-camp-green shrink-0" />
              ) : (
                <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-camp-green transition-colors shrink-0" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Standings List */}
      <div className="space-y-2.5">
        <AnimatePresence mode="popLayout">
          {processedStats.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200"
            >
              <div className="p-2.5 bg-white inline-block rounded-full shadow-xs">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-slate-600 font-bold text-xs mt-2">No agents match your criteria</p>
              <p className="text-slate-400 text-[11px] mt-0.5">Try resetting filters or searching another keyword.</p>
            </motion.div>
          ) : (
            processedStats.map((stat, index) => {
              const rankInfo = getRankBadgeStyles(index);
              const isSelected = selectedAgentId === stat.agent.id;

              return (
                <motion.div
                  key={stat.agent.id}
                  layoutId={stat.agent.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  onClick={() => onSelectAgent(stat.agent.id === selectedAgentId ? null : stat.agent.id)}
                  className={`group relative p-3.5 border transition-all cursor-pointer rounded-xl ${
                    isSelected
                      ? 'border-camp-green bg-camp-green/5 shadow-xs ring-1 ring-camp-green/25'
                      : 'border-slate-100 bg-white hover:border-slate-250 hover:bg-slate-50/25'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    
                    {/* Left: Rank, Name & Info */}
                    <div className="flex items-center gap-3 shrink-0">
                      {/* Rank Number Circle */}
                      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-mono font-bold text-xs shrink-0 ${rankInfo.bg} ${rankInfo.glow}`}>
                        {rankInfo.label}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-xs font-bold text-slate-800 group-hover:text-camp-green transition-colors">
                            {stat.agent.name}
                          </h3>
                          {stat.agent.department && (
                            <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] bg-slate-100 border border-slate-200/50 text-slate-500">
                              {stat.agent.department}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 font-medium text-[10px] mt-0.5">
                          {stat.reviewsCount === 0 
                            ? 'No evaluation context yet' 
                            : `${stat.reviewsCount} review${stat.reviewsCount > 1 ? 's' : ''}`
                          }
                        </p>
                      </div>
                    </div>

                    {/* Right: Scores & Visual Bars */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
                      
                      {/* Interactive breakdown sliders shown on hover/active */}
                      <div className="grid grid-cols-3 gap-2 min-w-[190px]">
                        
                        {/* Speed metric */}
                        <div className="bg-slate-50/80 rounded p-1 text-center">
                          <p className="text-[8px] text-slate-400 uppercase font-mono tracking-wider flex items-center justify-center gap-0.5">
                            <Zap className="w-2 h-2 text-camp-accent fill-camp-accent" />
                            S
                          </p>
                          <p className="text-[11px] font-bold text-slate-800 mt-0.5">
                            {stat.reviewsCount > 0 ? stat.avgSpeed.toFixed(1) : '—'}
                          </p>
                        </div>

                        {/* Knowledge metric */}
                        <div className="bg-slate-50/80 rounded p-1 text-center">
                          <p className="text-[8px] text-slate-400 uppercase font-mono tracking-wider flex items-center justify-center gap-0.5">
                            <BookOpen className="w-2 h-2 text-camp-navy" />
                            K
                          </p>
                          <p className="text-[11px] font-bold text-slate-800 mt-0.5">
                            {stat.reviewsCount > 0 ? stat.avgKnowledge.toFixed(1) : '—'}
                          </p>
                        </div>

                        {/* It Factor metric */}
                        <div className="bg-slate-50/80 rounded p-1 text-center">
                          <p className="text-[8px] text-slate-400 uppercase font-mono tracking-wider flex items-center justify-center gap-0.5">
                            <Sparkles className="w-2 h-2 text-camp-gold" />
                            I
                          </p>
                          <p className="text-[11px] font-bold text-slate-800 mt-0.5">
                            {stat.reviewsCount > 0 ? stat.avgItFactor.toFixed(1) : '—'}
                          </p>
                        </div>

                      </div>

                      {/* Overall Rating Badge */}
                      <div className="self-end sm:self-center shrink-0 min-w-[85px] text-right flex items-center justify-end">
                        <div className="inline-flex flex-col items-end">
                          <div className={`px-2.5 py-0.5 rounded font-mono font-bold text-xs flex items-center gap-1 border ${getScoreColor(stat.overallRating)}`}>
                            <span>{stat.reviewsCount > 0 ? stat.overallRating.toFixed(2) : '—'}</span>
                            <Star className={`w-3 h-3 ${stat.reviewsCount > 0 ? 'fill-camp-accent text-camp-accent' : 'text-slate-300'}`} />
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
