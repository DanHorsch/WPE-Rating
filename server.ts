/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Agent, Review, AgentStats } from "./src/types.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Persistent state storage file
const DB_FILE_PATH = path.join(process.cwd(), "support_tracker_db.json");

// Define realistic seed data for WPEngine Support Agents
const SEED_AGENTS: Agent[] = [
  { id: "agent-1", name: "Austin B.", department: "Migrations Team", createdAt: new Date("2026-01-10").toISOString() },
  { id: "agent-2", name: "Marissa K.", department: "Senior Server Ops (L2)", createdAt: new Date("2026-02-15").toISOString() },
  { id: "agent-3", name: "Devon S.", department: "Enterprise Support Architecture", createdAt: new Date("2026-03-05").toISOString() },
  { id: "agent-4", name: "Sarah T.", department: "DNS & CDN Integration Specialist", createdAt: new Date("2026-04-12").toISOString() },
  { id: "agent-5", name: "Zachary L.", department: "PHP Performance & Caching pro", createdAt: new Date("2026-05-20").toISOString() },
];

const SEED_REVIEWS: Review[] = [
  {
    id: "rev-1",
    agentId: "agent-2",
    speed: 5,
    knowledge: 5,
    itFactor: 4,
    notes: "Resolved the custom varnish caching issue on high-traffic production in 5 minutes! Super knowledgeable.",
    submittedBy: "Alex (Lead Dev)",
    createdAt: new Date("2026-06-01T10:00:00Z").toISOString(),
  },
  {
    id: "rev-2",
    agentId: "agent-1",
    speed: 4,
    knowledge: 4,
    itFactor: 5,
    notes: "Migrated 15 sites gracefully. Some minor plugin conflicts but handled them with high positivity.",
    submittedBy: "Jessica (Web Developer)",
    createdAt: new Date("2026-06-02T14:30:00Z").toISOString(),
  },
  {
    id: "rev-3",
    agentId: "agent-3",
    speed: 5,
    knowledge: 5,
    itFactor: 5,
    notes: "Ticket-9824: Diagnosed MySQL query bottlenecks that database indexing couldn't solve alone. Masterclass session.",
    submittedBy: "Marcus (Technical Architect)",
    createdAt: new Date("2026-06-03T09:15:00Z").toISOString(),
  },
  {
    id: "rev-4",
    agentId: "agent-4",
    speed: 3,
    knowledge: 5,
    itFactor: 4,
    notes: "Ticket-7812: Helped configured client custom nameservers with Cloudflare. DNS propagation took a bit.",
    submittedBy: "Alex (Lead Dev)",
    createdAt: new Date("2026-06-04T16:45:00Z").toISOString(),
  },
  {
    id: "rev-5",
    agentId: "agent-5",
    speed: 4,
    knowledge: 4,
    itFactor: 4,
    notes: "Aided with custom PHP-FPM pool configurations. Site is 50% faster now.",
    submittedBy: "Daniel (Backend Supervisor)",
    createdAt: new Date("2026-06-05T11:20:00Z").toISOString(),
  },
  {
    id: "rev-6",
    agentId: "agent-2",
    speed: 5,
    knowledge: 5,
    itFactor: 5,
    notes: "Excellent service on SFTP permission lockouts. Resolved instantly.",
    submittedBy: "Ryan (WordPress Designer)",
    createdAt: new Date("2026-06-06T13:10:00Z").toISOString(),
  }
];

// Memory fallback / Initial loader
let database = {
  agents: [...SEED_AGENTS],
  reviews: [...SEED_REVIEWS]
};

// Seed database or read existing
function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const dataStr = fs.readFileSync(DB_FILE_PATH, "utf-8");
      const parsed = JSON.parse(dataStr);
      if (parsed && Array.isArray(parsed.agents) && Array.isArray(parsed.reviews)) {
        database = parsed;
        console.log(`Successfully loaded database from ${DB_FILE_PATH} with ${database.agents.length} agents and ${database.reviews.length} reviews.`);
        return;
      }
    }
  } catch (err) {
    console.error("Failed to read local database file, using fallback state:", err);
  }
  
  // Save initial database if not existing or invalid
  saveDatabase();
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(database, null, 2), "utf-8");
    console.log("Database written to local storage successfully.");
  } catch (err) {
    console.error("Failed to write database to disk:", err);
  }
}

// Initialize database
loadDatabase();

// API Endpoints
// Reset Data (Useful for testing)
app.post("/api/reset", (req, res) => {
  database = {
    agents: JSON.parse(JSON.stringify(SEED_AGENTS)),
    reviews: JSON.parse(JSON.stringify(SEED_REVIEWS))
  };
  saveDatabase();
  res.json({ message: "Database reset to original seed data successful", database });
});

// GET all agents
app.get("/api/agents", (req, res) => {
  res.json(database.agents);
});

// POST new agent
app.post("/api/agents", (req, res) => {
  const { name, department } = req.body;
  if (!name || typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({ error: "Agent name is required" });
  }

  // Check if agent with this name already exists (case insensitive)
  const exists = database.agents.some(a => a.name.toLowerCase() === name.trim().toLowerCase());
  if (exists) {
    return res.status(400).json({ error: "An agent with this name already exists" });
  }

  const newAgent: Agent = {
    id: `agent-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: name.trim(),
    department: department ? department.trim() : "Custom Support",
    createdAt: new Date().toISOString()
  };

  database.agents.push(newAgent);
  saveDatabase();
  return res.status(201).json(newAgent);
});

// GET all reviews
app.get("/api/reviews", (req, res) => {
  res.json(database.reviews);
});

// POST new review
app.post("/api/reviews", (req, res) => {
  const { agentId, agentName, agentDepartment, speed, knowledge, itFactor, notes, submittedBy } = req.body;

  // Type & Value Validations
  const parsedSpeed = parseInt(speed, 10);
  const parsedKnowledge = parseInt(knowledge, 10);
  const parsedItFactor = parseInt(itFactor, 10);

  if (isNaN(parsedSpeed) || parsedSpeed < 1 || parsedSpeed > 5 ||
      isNaN(parsedKnowledge) || parsedKnowledge < 1 || parsedKnowledge > 5 ||
      isNaN(parsedItFactor) || parsedItFactor < 1 || parsedItFactor > 5) {
    return res.status(400).json({ error: "All ratings (Speed, Knowledge, It Factor) must be integers between 1 and 5." });
  }

  let finalAgentId = agentId;

  // If adding a Brand-New Agent inline
  if (!agentId && agentName && typeof agentName === "string" && agentName.trim() !== "") {
    // Check if agent already exists
    const existingAgent = database.agents.find(a => a.name.toLowerCase() === agentName.trim().toLowerCase());
    if (existingAgent) {
      finalAgentId = existingAgent.id;
    } else {
      const newAgent: Agent = {
        id: `agent-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: agentName.trim(),
        department: agentDepartment ? agentDepartment.trim() : "WPEngine Support",
        createdAt: new Date().toISOString()
      };
      database.agents.push(newAgent);
      finalAgentId = newAgent.id;
    }
  }

  if (!finalAgentId) {
    return res.status(400).json({ error: "Selected support agent or new agent name is required." });
  }

  const newReview: Review = {
    id: `rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    agentId: finalAgentId,
    speed: parsedSpeed,
    knowledge: parsedKnowledge,
    itFactor: parsedItFactor,
    notes: notes ? notes.trim() : undefined,
    submittedBy: submittedBy ? submittedBy.trim() : "Developer Partner",
    createdAt: new Date().toISOString()
  };

  database.reviews.push(newReview);
  saveDatabase();

  return res.status(201).json({
    review: newReview,
    agents: database.agents // Return agents list so frontend can sync inline creations
  });
});

// DELETE a review by ID
app.delete("/api/reviews/:id", (req, res) => {
  const { id } = req.params;
  const exists = database.reviews.some((r) => r.id === id);
  if (!exists) {
    return res.status(404).json({ error: "Review not found" });
  }
  database.reviews = database.reviews.filter((r) => r.id !== id);
  saveDatabase();
  return res.json({ message: "Review deleted successfully" });
});

// DELETE an agent by ID (Cascade deletes associated reviews)
app.delete("/api/agents/:id", (req, res) => {
  const { id } = req.params;
  const exists = database.agents.some((a) => a.id === id);
  if (!exists) {
    return res.status(404).json({ error: "Agent not found" });
  }
  // Delete the agent
  database.agents = database.agents.filter((a) => a.id !== id);
  // Delete all their associated reviews
  database.reviews = database.reviews.filter((r) => r.agentId !== id);
  saveDatabase();
  return res.json({ message: "Agent and reviews deleted successfully" });
});

// GET calculated leaderboard stats
// Ranks support agents based on overall dynamic rating
app.get("/api/stats", (req, res) => {
  const stats: AgentStats[] = database.agents.map((agent) => {
    const agentReviews = database.reviews.filter((r) => r.agentId === agent.id);
    
    if (agentReviews.length === 0) {
      return {
        agent,
        reviewsCount: 0,
        avgSpeed: 0,
        avgKnowledge: 0,
        avgItFactor: 0,
        overallRating: 0
      };
    }

    const totalSpeed = agentReviews.reduce((sum, r) => sum + r.speed, 0);
    const totalKnowledge = agentReviews.reduce((sum, r) => sum + r.knowledge, 0);
    const totalItFactor = agentReviews.reduce((sum, r) => sum + r.itFactor, 0);

    const avgSpeed = Number((totalSpeed / agentReviews.length).toFixed(2));
    const avgKnowledge = Number((totalKnowledge / agentReviews.length).toFixed(2));
    const avgItFactor = Number((totalItFactor / agentReviews.length).toFixed(2));

    // Dynamic Overall Rating: mathematical average of ALL scores received across all categories matches:
    // (total of all scores in Speed, Knowledge, It Factor) / (reviewsCount * 3)
    const totalAllScores = totalSpeed + totalKnowledge + totalItFactor;
    const overallRating = Number((totalAllScores / (agentReviews.length * 3)).toFixed(2));

    return {
      agent,
      reviewsCount: agentReviews.length,
      avgSpeed,
      avgKnowledge,
      avgItFactor,
      overallRating
    };
  });

  res.json(stats);
});

// Start dev server (inject Vite) or serve production build
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on info: http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
  });
}

startServer();
