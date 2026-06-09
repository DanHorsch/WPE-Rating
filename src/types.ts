/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Agent {
  id: string;
  name: string;
  department?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  agentId: string;
  speed: number; // 1-5
  knowledge: number; // 1-5
  itFactor: number; // 1-5
  notes?: string;   // Ticket ID or interaction notes
  submittedBy?: string; // Web developer name
  createdAt: string;
}

export interface AgentStats {
  agent: Agent;
  reviewsCount: number;
  avgSpeed: number;
  avgKnowledge: number;
  avgItFactor: number;
  overallRating: number; // mathematical average of all scores across Speed, Knowledge, It Factor
}
