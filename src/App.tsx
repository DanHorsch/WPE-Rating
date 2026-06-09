/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import Leaderboard from './components/Leaderboard';
import ReviewForm from './components/ReviewForm';
import ReviewsList from './components/ReviewsList';
import PasswordGate from './components/PasswordGate';
import { Agent, Review, AgentStats } from './types';
import { ShieldCheck, ServerCrash, RefreshCw, Layers } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  // Authorization state
  const [isAuthorized, setIsAuthorized] = useState<boolean>(() => {
    return localStorage.getItem('camp_support_authorized') === 'true';
  });

  // App states
  const [agents, setAgents] = useState<Agent[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [statsList, setStatsList] = useState<AgentStats[]>([]);

  // Selection state
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  // Loading & error states
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Sync / Fetch logic
  const fetchData = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const [agentsRes, reviewsRes, statsRes] = await Promise.all([
        fetch('/api/agents'),
        fetch('/api/reviews'),
        fetch('/api/stats')
      ]);

      if (!agentsRes.ok || !reviewsRes.ok || !statsRes.ok) {
        throw new Error('Server returned unsafe statuses during data fetching.');
      }

      const agentsData = await agentsRes.json();
      const reviewsData = await reviewsRes.json();
      const statsData = await statsRes.json();

      setAgents(agentsData);
      setReviews(reviewsData);
      setStatsList(statsData);
      setErrorText('');
    } catch (err: any) {
      console.warn("Failed fetching from server API, utilizing local fallback.", err);
      setErrorText(
        'Server connection unavailable. Please wait while backend starts or refresh later.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Run on initial mounting
  useEffect(() => {
    fetchData(true);
    
    // Poll the stats and recent logs every 15 seconds to keep the developers' dashboard in sync
    const interval = setInterval(() => {
      fetchData(false);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // Post a new review
  const handleSubmitReview = async (formData: {
    agentId: string;
    agentName: string;
    agentDepartment: string;
    speed: number;
    knowledge: number;
    itFactor: number;
    notes: string;
    submittedBy: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await res.json();
      if (!res.ok) {
        return { success: false, error: result.error || 'Failed to submit review.' };
      }

      // Sync and force state refresh
      await fetchData(false);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error or host is sleeping.' };
    }
  };

  // Reset metrics action
  const handleResetData = async () => {
    if (!window.confirm('Are you sure you want to restore the support database to its initial clean sample state? Any custom reviews added during this session will be replaced.')) {
      return;
    }
    
    setIsResetting(true);
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        await fetchData(false);
        setSelectedAgentId(null);
      } else {
        alert('Could not restore the sample database.');
      }
    } catch (e) {
      alert('Unable to network with the database during reset.');
    } finally {
      setIsResetting(false);
    }
  };

  // Delete a review entry
  const handleDeleteReview = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchData(false);
        return true;
      } else {
        console.error('Could not delete the evaluation log entry.');
        return false;
      }
    } catch (e) {
      console.error('Unable to network with the database during deletion.', e);
      return false;
    }
  };

  // Delete a support user/agent
  const handleDeleteAgent = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/agents/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchData(false);
        if (selectedAgentId === id) {
          setSelectedAgentId(null);
        }
        return true;
      } else {
        console.error('Could not delete the support user.');
        return false;
      }
    } catch (e) {
      console.error('Unable to network with the database during deletion.', e);
      return false;
    }
  };

  // Calculate high level summaries
  const totalReviews = reviews.length;
  const totalAgents = agents.length;
  const globalOverallAverage = useMemo(() => {
    if (statsList.length === 0) return 0;
    const reviewedAgents = statsList.filter(s => s.reviewsCount > 0);
    if (reviewedAgents.length === 0) return 0;
    return reviewedAgents.reduce((sum, s) => sum + s.overallRating, 0) / reviewedAgents.length;
  }, [statsList]);

  if (!isAuthorized) {
    return <PasswordGate onSuccess={() => setIsAuthorized(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col antialiased">
      
      {/* Header component */}
      <Header
        totalAgents={totalAgents}
        totalReviews={totalReviews}
        overallRating={globalOverallAverage}
        onReset={handleResetData}
        isResetting={isResetting}
      />

      {/* Connection notification if backend is loading */}
      {errorText && (
        <div className="bg-amber-500 py-2.5 px-4 text-center text-slate-950 text-xs font-mono font-bold flex items-center justify-center gap-2 border-b border-amber-600 shadow-sm">
          <ServerCrash className="h-4 w-4 shrink-0 animate-bounce" />
          <span>{errorText}</span>
          <button 
            onClick={() => fetchData(true)} 
            className="ml-3 underline hover:text-slate-900 cursor-pointer flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" /> Retry Sync
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <div className="relative flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-camp-green"></div>
            <div className="absolute font-mono text-[8px] text-slate-400 font-bold">WPE</div>
          </div>
          <p className="mt-4 font-mono text-xs text-slate-400 animate-pulse uppercase tracking-widest">
            Loading Support Engine Data...
          </p>
        </div>
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          
          {/* Main layout grids - Sidebar forms and responsive lists */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left side column: Leaderboard & Recent Review timelines */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Leaderboard/Standings list */}
              <Leaderboard
                statsList={statsList}
                onSelectAgent={setSelectedAgentId}
                selectedAgentId={selectedAgentId}
              />

              {/* Comprehensive timeline */}
              <ReviewsList
                reviews={reviews}
                agents={agents}
                selectedAgentId={selectedAgentId}
                onClearFilter={() => setSelectedAgentId(null)}
                onDeleteReview={handleDeleteReview}
                onDeleteAgent={handleDeleteAgent}
              />

            </div>

            {/* Right side column: Sidebar Review Submission and documentation */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Review submit forms */}
              <ReviewForm
                agents={agents}
                onSubmitReview={handleSubmitReview}
              />

              {/* Developer Guidelines Card */}
              <div className="bg-white text-slate-700 rounded-xl border border-slate-200 p-5 shadow-xs font-sans text-xs">
                <h3 className="text-slate-800 font-bold mb-2.5 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <Layers className="h-4 w-4 text-camp-green" />
                  Evaluator Guide
                </h3>
                <ul className="space-y-2 list-disc pl-4 text-slate-500 font-medium text-[11px]">
                  <li>
                    <strong className="text-slate-700">Speed (S)</strong>: Response times, diagnostic turnaround, and agility on SSH or Chat.
                  </li>
                  <li>
                    <strong className="text-slate-700">Knowledge (K)</strong>: Diagnostic accuracy, technical depth on DNS, caching, and database performance.
                  </li>
                  <li>
                    <strong className="text-slate-700">It Factor (I)</strong>: Customer empathy, proactivity, clarity, and overall helper vibe.
                  </li>
                </ul>
                <div className="mt-4 pt-3 border-t border-slate-100 text-[9px] text-slate-400 font-mono text-center">
                  WP Engine Review Standards (v1.0)
                </div>
              </div>

            </div>

          </div>

        </main>
      )}

      {/* Plain, clean developer footer */}
      <footer className="bg-white text-slate-400 border-t border-slate-200 text-xs py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p className="font-mono text-[10px] text-slate-400">
             WPEngine Support Review Tracker — Developer Dashboard
          </p>
          <p className="text-[10px] text-slate-400 font-medium">
             Active Database: SQLite/JSON Persistent Engine.
          </p>
        </div>
      </footer>

    </div>
  );
}
