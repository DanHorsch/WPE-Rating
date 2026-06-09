/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Agent } from '../types';
import { Sparkles, Zap, BookOpen, Send, UserPlus, UserCheck, Plus, CheckCircle2, Ticket } from 'lucide-react';

interface ReviewFormProps {
  agents: Agent[];
  onSubmitReview: (formData: {
    agentId: string;
    agentName: string;
    agentDepartment: string;
    speed: number;
    knowledge: number;
    itFactor: number;
    notes: string;
    submittedBy: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

export default function ReviewForm({ agents, onSubmitReview }: ReviewFormProps) {
  // Form States
  const [isNewAgent, setIsNewAgent] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  
  // New Agent Fields
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentDept, setNewAgentDept] = useState('');

  // Rating Fields (Default to 5 for developer convenience)
  const [speed, setSpeed] = useState<number>(5);
  const [knowledge, setKnowledge] = useState<number>(5);
  const [itFactor, setItFactor] = useState<number>(5);

  // Metadata
  const [notes, setNotes] = useState('');
  const [submittedBy, setSubmittedBy] = useState('');

  // Statuses
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // Quick reset logic
  const resetFormState = () => {
    setSelectedAgentId('');
    setNewAgentName('');
    setNewAgentDept('');
    setSpeed(5);
    setKnowledge(5);
    setItFactor(5);
    setNotes('');
    setSubmittedBy('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess(false);

    // Form validation
    if (isNewAgent) {
      if (!newAgentName.trim()) {
        setFormError('Please provide a name for the new support agent.');
        return;
      }
      // Check if duplicate name in existing list
      const duplicateExists = agents.some(
        (a) => a.name.toLowerCase() === newAgentName.trim().toLowerCase()
      );
      if (duplicateExists) {
        setFormError(`An agent named "${newAgentName.trim()}" already exists. Please select them from the dropdown list instead.`);
        return;
      }
    } else {
      if (!selectedAgentId) {
        setFormError('Please select a support agent from the dropdown.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const result = await onSubmitReview({
        agentId: isNewAgent ? '' : selectedAgentId,
        agentName: isNewAgent ? newAgentName : '',
        agentDepartment: isNewAgent ? newAgentDept : '',
        speed,
        knowledge,
        itFactor,
        notes,
        submittedBy,
      });

      if (result.success) {
        setFormSuccess(true);
        resetFormState();
        // Dismiss success message after 3.5 seconds
        setTimeout(() => setFormSuccess(false), 3500);
      } else {
        setFormError(result.error || 'Failed to submit the review.');
      }
    } catch (err) {
      setFormError('A networking error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render a 1-5 button scale helper
  const renderRatingSelector = (
    label: string,
    currentValue: number,
    setValue: (val: number) => void,
    icon: React.ReactNode,
    colorClass: string
  ) => {
    return (
      <div className="space-y-1.5">
        <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          {icon}
          {label}
        </label>
        <div className="grid grid-cols-5 gap-1">
          {[1, 2, 3, 4, 5].map((val) => {
            const isActive = currentValue >= val;
            return (
              <button
                key={val}
                type="button"
                onClick={() => setValue(val)}
                className={`py-1.5 px-2 rounded font-mono font-bold text-xs transition-all border ${
                  isActive
                    ? 'bg-camp-green border-transparent text-white ring-1 ring-camp-green/20'
                    : 'bg-slate-800 border-slate-750 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                }`}
              >
                {val}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-900 text-slate-200 rounded-xl border border-slate-800 p-5 shadow-md">
      
      {/* Title */}
      <div className="pb-3 border-b border-slate-800 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
            Log New Review
          </h2>
          <p className="text-[11px] text-slate-400 font-medium">
            Record interaction metrics for a support session.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
        
        {/* Toggle between select existing or create brand-new support agent */}
        <div className="flex items-center justify-between bg-slate-950/45 p-2 rounded-lg border border-slate-800/80 text-[10px]">
          <span className="text-slate-400 font-medium">Add someone not in system?</span>
          <button
            type="button"
            onClick={() => {
              setIsNewAgent(!isNewAgent);
              setFormError('');
            }}
            className="flex items-center gap-1 px-2 py-0.5 bg-slate-800 hover:bg-slate-750 text-white font-bold rounded text-[10px] border border-slate-700 transition-colors cursor-pointer"
          >
            {isNewAgent ? (
              <>
                <UserCheck className="w-3 h-3 text-camp-green" />
                Select Existing
              </>
            ) : (
              <>
                <UserPlus className="w-3 h-3 text-camp-accent" />
                Add New
              </>
            )}
          </button>
        </div>

        {/* Support Person Identifier Field */}
        {!isNewAgent ? (
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block font-mono">
              WP Engine Agent
            </label>
            <div className="relative">
              <select
                value={selectedAgentId}
                onChange={(e) => {
                  setSelectedAgentId(e.target.value);
                  setFormError('');
                }}
                className="block w-full bg-slate-800 border border-slate-710 text-white rounded-lg py-1.5 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-camp-green transition-all cursor-pointer"
              >
                <option value="">-- Select Support Person --</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} {agent.department ? `(${agent.department})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="space-y-2 bg-slate-950/20 p-2.5 rounded-lg border border-slate-800/60">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block font-mono">
                Agent Name *
              </label>
              <input
                type="text"
                placeholder="e.g., Sarah Jenkins"
                value={newAgentName}
                onChange={(e) => setNewAgentName(e.target.value)}
                className="block w-full bg-slate-800 border border-slate-700 text-white placeholder:text-slate-600 rounded-lg py-1.5 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-camp-green transition-all"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block font-mono">
                Department / Role
              </label>
              <input
                type="text"
                placeholder="e.g., Migration Specialist"
                value={newAgentDept}
                onChange={(e) => setNewAgentDept(e.target.value)}
                className="block w-full bg-slate-800 border border-slate-700 text-white placeholder:text-slate-600 rounded-lg py-1.5 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-camp-green transition-all"
              />
            </div>
          </div>
        )}

        {/* Grid for Ratings: Speed, Knowledge, It Factor */}
        <div className="space-y-2.5 bg-slate-950/10 p-2.5 rounded-lg border border-slate-800/40">
          
          {/* Speed */}
          {renderRatingSelector(
            'Speed',
            speed,
            setSpeed,
            <Zap className="h-3 w-3 text-camp-accent fill-camp-accent/15" />,
            'bg-camp-green'
          )}

          {/* Technical Knowledge */}
          {renderRatingSelector(
            'Knowledge',
            knowledge,
            setKnowledge,
            <BookOpen className="h-3 w-3 text-camp-navy" />,
            'bg-camp-green'
          )}

          {/* It Factor */}
          {renderRatingSelector(
            'It Factor',
            itFactor,
            setItFactor,
            <Sparkles className="h-3 w-3 text-camp-gold" />,
            'bg-camp-green'
          )}

        </div>

        {/* Ticket ID & Interaction Notes */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block font-mono flex items-center gap-1">
            <Ticket className="w-3 h-3 text-slate-500" />
            Ticket ID / Interaction Notes
          </label>
          <textarea
            rows={2}
            placeholder="e.g. #74291 - Excellent PHP debug..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="block w-full bg-slate-800 border border-slate-700 text-white placeholder:text-slate-600 rounded-lg py-1.5 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-camp-green transition-all resize-none font-medium text-slate-200"
          />
        </div>

        {/* Developer Name */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block font-mono">
            Submitted By
          </label>
          <input
            type="text"
            placeholder="Your name or team alias..."
            value={submittedBy}
            onChange={(e) => setSubmittedBy(e.target.value)}
            className="block w-full bg-slate-800 border border-slate-700 text-white placeholder:text-slate-600 rounded-lg py-1.5 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-camp-green transition-all"
          />
        </div>

        {/* Error/Success Feedbacks */}
        {formError && (
          <div className="bg-red-950/75 border border-red-900 rounded-lg p-2 text-xs text-red-350 font-semibold text-center">
            {formError}
          </div>
        )}

        {formSuccess && (
          <div className="bg-emerald-950/70 border border-emerald-900 rounded-lg p-2 text-xs text-emerald-350 font-semibold flex items-center justify-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>Support feedback recorded successfully!</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-mono font-bold bg-camp-green hover:bg-camp-green/90 active:bg-camp-green/80 text-white transition-all focus:outline-none cursor-pointer"
        >
          <Send className="h-3 w-3" />
          {isSubmitting ? 'Evaluating...' : 'Submit Score'}
        </button>

      </form>
    </div>
  );
}
