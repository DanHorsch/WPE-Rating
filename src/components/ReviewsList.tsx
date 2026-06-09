/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Agent, Review } from '../types';
import { Sparkles, Zap, BookOpen, MessageSquare, History, User, Calendar, FilterX, HelpCircle, Star, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { useState } from 'react';

interface ReviewsListProps {
  reviews: Review[];
  agents: Agent[];
  selectedAgentId: string | null;
  onClearFilter: () => void;
  onDeleteReview?: (id: string) => Promise<boolean>;
  onDeleteAgent?: (id: string) => Promise<boolean>;
}

export default function ReviewsList({ reviews, agents, selectedAgentId, onClearFilter, onDeleteReview, onDeleteAgent }: ReviewsListProps) {
  const [reviewIdToDelete, setReviewIdToDelete] = useState<string | null>(null);
  const [isConfirmingAgentDelete, setIsConfirmingAgentDelete] = useState<boolean>(false);
  const [lastSelectedAgentId, setLastSelectedAgentId] = useState<string | null>(selectedAgentId);

  // Sync state if selected support person changes
  if (selectedAgentId !== lastSelectedAgentId) {
    setLastSelectedAgentId(selectedAgentId);
    setIsConfirmingAgentDelete(false);
    setReviewIdToDelete(null);
  }

  const handleConfirmDeleteAgent = async (id: string) => {
    if (onDeleteAgent) {
      const success = await onDeleteAgent(id);
      if (success) {
        setIsConfirmingAgentDelete(false);
      }
    }
  };

  const handleConfirmDeleteReview = async (id: string) => {
    if (onDeleteReview) {
      const success = await onDeleteReview(id);
      if (success) {
        setReviewIdToDelete(null);
      }
    }
  };
  
  // Resolve agent name easily
  const agentMap = useMemo(() => {
    const map = new Map<string, Agent>();
    agents.forEach((a) => map.set(a.id, a));
    return map;
  }, [agents]);

  // Filters timeline reviews based on selected agent
  const filteredReviews = useMemo(() => {
    let list = [...reviews];
    
    if (selectedAgentId) {
      list = list.filter((r) => r.agentId === selectedAgentId);
    }
    
    // Sort reviews chronologically (Newest first)
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  }, [reviews, selectedAgentId]);

  const focusedAgent = selectedAgentId ? agentMap.get(selectedAgentId) : null;

  // Render score pill indicator
  const renderMiniPill = (score: number, icon: React.ReactNode, label: string, colorClass: string) => {
    return (
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[10px]" title={`${label}: ${score}/5`}>
        {icon}
        <span className="font-mono text-slate-400 font-bold">{label[0]}</span>
        <span className={`font-bold font-mono ${colorClass}`}>{score}</span>
      </div>
    );
  };

  // Human date parser
  const getFmDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
      
      {/* List Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <History className="h-4 w-4 text-camp-green" />
            Verification Log & Feedback
          </h2>
          {focusedAgent ? (
            <div className="mt-0.5">
              <p className="text-[11px] text-camp-green font-bold">
                Showing reviews for: {focusedAgent.name}
              </p>
              {onDeleteAgent && !isConfirmingAgentDelete && (
                <button
                  type="button"
                  onClick={() => setIsConfirmingAgentDelete(true)}
                  className="text-[10px] text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer mt-1 transition-colors"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                  Delete support person
                </button>
              )}
              {isConfirmingAgentDelete && (
                <div className="mt-2 p-2 px-2.5 bg-rose-50 border border-rose-150 rounded-lg text-[11px] text-rose-800 max-w-sm">
                  <p className="font-bold">Are you sure you want to delete {focusedAgent.name}?</p>
                  <p className="text-[10px] mt-0.5 text-rose-700 font-semibold leading-snug">This will delete their profile and entire reviews history from the database.</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => handleConfirmDeleteAgent(focusedAgent.id)}
                      className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-[9px] uppercase cursor-pointer border border-rose-700 shadow-sm"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingAgentDelete(false)}
                      className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 rounded font-bold text-[9px] uppercase cursor-pointer border border-slate-200 shadow-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
              Historical timeline of interactions and ratings submitted by team devs.
            </p>
          )}
        </div>

        {focusedAgent && (
          <button
            onClick={onClearFilter}
            className="text-[10px] font-bold bg-slate-50 hover:bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-250 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <FilterX className="w-3 h-3" />
            Clear Filter
          </button>
        )}
      </div>

      {/* Reviews Content */}
      <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
        <AnimatePresence mode="popLayout">
          {filteredReviews.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200"
            >
              <div className="p-2.5 bg-white inline-block rounded-full shadow-xs">
                <HelpCircle className="h-4 w-4 text-slate-350" />
              </div>
              <p className="text-slate-500 font-bold text-xs mt-2">No feedback available yet</p>
              <p className="text-slate-400 text-[11px] mt-0.5">Click above to start evaluating this agent.</p>
            </motion.div>
          ) : (
            filteredReviews.map((review) => {
              const agent = agentMap.get(review.agentId);
              const overallScore = Number(((review.speed + review.knowledge + review.itFactor) / 3).toFixed(2));

              return (
                <motion.div
                  key={review.id}
                  layoutId={review.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-slate-50/40 rounded-xl border border-slate-200/60 p-3.5 hover:border-slate-250 transition-colors"
                >
                  
                  {/* Top line: agent info, score & date */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-2.5 mb-2.5">
                    <div>
                      <p className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">Evaluation on</p>
                      <h4 className="text-xs font-bold text-slate-800 mt-0.5">
                        {agent ? agent.name : 'Unknown Support Agent'}
                      </h4>
                      {agent?.department && (
                        <span className="inline-block mt-0.5 px-1 py-0.2 text-[9px] font-medium bg-slate-100 border border-slate-200 text-slate-500 rounded">
                          {agent.department}
                        </span>
                      )}
                    </div>

                    <div className="text-left sm:text-right flex flex-row sm:flex-col items-center sm:items-end justify-between gap-2">
                      {/* Overall badge for this specific review */}
                      <span className="inline-flex items-center gap-1 border border-camp-green/20 bg-camp-green/5 text-camp-green font-mono text-[10px] font-bold px-1.5 py-0.5 rounded">
                        <span>{overallScore.toFixed(1)}</span>
                        <Star className="w-2.5 h-2.5 fill-camp-accent text-camp-accent" />
                      </span>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {getFmDate(review.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Score pills */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                    {renderMiniPill(review.speed, <Zap className="w-2.5 h-2.5 text-camp-accent fill-camp-accent/15" />, 'Speed', 'text-camp-green')}
                    {renderMiniPill(review.knowledge, <BookOpen className="w-2.5 h-2.5 text-camp-navy" />, 'Knowledge', 'text-camp-navy')}
                    {renderMiniPill(review.itFactor, <Sparkles className="w-2.5 h-2.5 text-camp-gold" />, 'It Factor', 'text-camp-gold')}
                  </div>

                  {/* Notes / Comments */}
                  {review.notes ? (
                    <div className="bg-white border border-slate-150 p-2 rounded text-slate-705 text-xs flex items-start gap-1.5">
                      <MessageSquare className="w-3 h-3 mt-0.5 text-slate-400 shrink-0" />
                      <p className="italic leading-relaxed break-words whitespace-pre-wrap">{review.notes}</p>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic text-[10px] leading-relaxed">No custom notes or logs provided.</p>
                  )}

                  {/* Author footer */}
                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-50">
                    {onDeleteReview && (
                      reviewIdToDelete === review.id ? (
                        <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-md text-[10px] text-rose-800 font-semibold">
                          <span>Are you sure?</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfirmDeleteReview(review.id);
                            }}
                            className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-[9px] uppercase cursor-pointer"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReviewIdToDelete(null);
                            }}
                            className="px-1.5 py-0.5 bg-white hover:bg-slate-100 text-slate-700 rounded font-bold text-[9px] uppercase cursor-pointer border border-slate-250 shadow-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReviewIdToDelete(review.id);
                          }}
                          className="text-[9px] font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer transition-colors"
                          title="Delete this verification log entry"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                          Delete Entry
                        </button>
                      )
                    )}
                    <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 ml-auto">
                      <User className="h-2.5 w-2.5" />
                      <span>By:</span>
                      <span className="text-slate-600">{review.submittedBy || 'Team Dev'}</span>
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
