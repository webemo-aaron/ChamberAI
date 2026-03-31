import { orgCollection } from "../db/orgFirestore.js";

const DEFAULT_CONTEXT_TOKEN_LIMIT = 8000;
const TOKENS_PER_CHAR = 0.25; // Rough estimate: 4 chars per token

/**
 * Estimate token count for a string
 * @param {string} text - Text to count
 * @returns {number} - Estimated token count
 */
function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length * TOKENS_PER_CHAR);
}

/**
 * Fetch recent meetings for context
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @param {string} orgId - Organization ID
 * @param {number} limit - Number of meetings to fetch (default: 5)
 * @returns {Promise<Array>} - Array of meeting summaries
 */
export async function fetchRecentMeetings(db, orgId, limit = 5) {
  try {
    const snapshot = await orgCollection(db, orgId, "meetings")
      .orderBy("timestamp", "desc")
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title ?? "Untitled",
        date: data.timestamp ? new Date(data.timestamp).toISOString().split("T")[0] : "Unknown",
        attendees: Array.isArray(data.attendees) ? data.attendees.length : 0,
        motions_count: data.motionsCount ?? 0,
        action_items_count: data.actionItemsCount ?? 0
      };
    });
  } catch (error) {
    console.error("Error fetching meetings:", error.message);
    return [];
  }
}

/**
 * Fetch approved/pending motions for context
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @param {string} orgId - Organization ID
 * @param {number} limit - Number of motions to fetch (default: 10)
 * @returns {Promise<Array>} - Array of motion summaries
 */
export async function fetchApprovedMotions(db, orgId, limit = 10) {
  try {
    const snapshot = await orgCollection(db, orgId, "motions")
      .where("status", "in", ["approved", "pending"])
      .orderBy("status", "desc")
      .orderBy("timestamp", "desc")
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title ?? "Untitled",
        status: data.status ?? "unknown",
        votes_yes: data.votesYes ?? 0,
        votes_no: data.votesNo ?? 0,
        timestamp: data.timestamp ? new Date(data.timestamp).toISOString().split("T")[0] : "Unknown"
      };
    });
  } catch (error) {
    console.error("Error fetching motions:", error.message);
    return [];
  }
}

/**
 * Fetch open action items for context
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @param {string} orgId - Organization ID
 * @param {number} limit - Number of action items to fetch (default: 10)
 * @returns {Promise<Array>} - Array of action item summaries
 */
export async function fetchOpenActionItems(db, orgId, limit = 10) {
  try {
    const snapshot = await orgCollection(db, orgId, "action_items")
      .where("status", "!=", "completed")
      .orderBy("status", "desc")
      .orderBy("dueDate", "asc")
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      const dueDate = data.dueDate ? new Date(data.dueDate).toISOString().split("T")[0] : "No due date";
      return {
        id: doc.id,
        title: data.title ?? "Untitled",
        description: data.description ?? "",
        assignee: data.assignee ?? "Unassigned",
        status: data.status ?? "open",
        due_date: dueDate
      };
    });
  } catch (error) {
    console.error("Error fetching action items:", error.message);
    return [];
  }
}

/**
 * Fetch all public business listings for embedding
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @param {string} orgId - Organization ID
 * @returns {Promise<Array>} - Array of business listing summaries
 */
export async function fetchAllBusinessListings(db, orgId) {
  try {
    const snapshot = await orgCollection(db, orgId, "business_listings").get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name ?? "Unnamed Business",
        city: data.city ?? "Unknown",
        description: data.description ?? ""
      };
    });
  } catch (error) {
    console.error("Error fetching business listings:", error.message);
    return [];
  }
}

/**
 * Fetch all indexable documents for RAG embedding
 * Used by kiosk-embeddings.js to build the embedding cache
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @param {string} orgId - Organization ID
 * @param {string} dataScope - 'public' or 'private'
 * @returns {Promise<Array>} - Array of documents with { id, type, rawData }
 */
export async function fetchAllIndexableDocuments(db, orgId, dataScope = "public") {
  const documents = [];

  try {
    // Always fetch meetings
    const meetingsSnapshot = await orgCollection(db, orgId, "meetings").get();
    meetingsSnapshot.docs.forEach((doc) => {
      documents.push({
        id: doc.id,
        type: "meeting",
        rawData: doc.data()
      });
    });

    // Always fetch business listings (public)
    const businessSnapshot = await orgCollection(db, orgId, "business_listings").get();
    businessSnapshot.docs.forEach((doc) => {
      documents.push({
        id: doc.id,
        type: "business_listing",
        rawData: doc.data()
      });
    });

    // Private scope: fetch motions and action items
    if (dataScope === "private") {
      const motionsSnapshot = await orgCollection(db, orgId, "motions")
        .where("status", "in", ["approved", "pending"])
        .get();
      motionsSnapshot.docs.forEach((doc) => {
        documents.push({
          id: doc.id,
          type: "motion",
          rawData: doc.data()
        });
      });

      const actionItemsSnapshot = await orgCollection(db, orgId, "action_items")
        .where("status", "!=", "completed")
        .get();
      actionItemsSnapshot.docs.forEach((doc) => {
        documents.push({
          id: doc.id,
          type: "action_item",
          rawData: doc.data()
        });
      });
    }

    return documents;
  } catch (error) {
    console.error("Error fetching all indexable documents:", error.message);
    return [];
  }
}

/**
 * Build context for AI Kiosk from organizational data
 * Fetches recent meetings, approved motions, and open action items
 * Returns formatted context string + sources + estimated token count
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @param {string} orgId - Organization ID
 * @param {object} config - Context configuration
 *   - config.tokenLimit: Max tokens for context (default: 8000)
 *   - config.meetingsLimit: Number of meetings (default: 5)
 *   - config.motionsLimit: Number of motions (default: 10)
 *   - config.actionItemsLimit: Number of action items (default: 10)
 *   - config.dataScope: 'public' or 'private' (default: 'public')
 * @returns {Promise<{context: string, sources: object, estimatedTokens: number}>}
 */
export async function buildContext(db, orgId, config = {}) {
  const tokenLimit = config.tokenLimit ?? DEFAULT_CONTEXT_TOKEN_LIMIT;
  const meetingsLimit = config.meetingsLimit ?? 5;
  const motionsLimit = config.motionsLimit ?? 10;
  const actionItemsLimit = config.actionItemsLimit ?? 10;
  const dataScope = config.dataScope ?? "public";

  let contextStr = "";
  let usedTokens = 0;
  const sources = {};

  try {
    // Fetch meetings
    const meetings = await fetchRecentMeetings(db, orgId, meetingsLimit);
    let meetingsSection = "## Recent Meetings\n";
    if (meetings.length > 0) {
      meetingsSection += meetings
        .map((m) => `- ${m.title} (${m.date}): ${m.attendees} attendees, ${m.motions_count} motions, ${m.action_items_count} action items`)
        .join("\n");
    } else {
      meetingsSection += "No recent meetings.\n";
    }
    meetingsSection += "\n";

    const meetingsTokens = estimateTokens(meetingsSection);
    if (usedTokens + meetingsTokens <= tokenLimit) {
      contextStr += meetingsSection;
      usedTokens += meetingsTokens;
      sources.meetings = {
        count: meetings.length,
        fields: ["title", "date", "attendees", "motions_count", "action_items_count"]
      };
    }

    // Fetch motions (only in private mode or if allowed)
    if (dataScope === "private") {
      const motions = await fetchApprovedMotions(db, orgId, motionsLimit);
      let motionsSection = "## Recent Motions\n";
      if (motions.length > 0) {
        motionsSection += motions
          .map((m) => `- ${m.title} (${m.status}): Yes=${m.votes_yes}, No=${m.votes_no} (${m.timestamp})`)
          .join("\n");
      } else {
        motionsSection += "No recent motions.\n";
      }
      motionsSection += "\n";

      const motionsTokens = estimateTokens(motionsSection);
      if (usedTokens + motionsTokens <= tokenLimit) {
        contextStr += motionsSection;
        usedTokens += motionsTokens;
        sources.motions = {
          count: motions.length,
          fields: ["title", "status", "votes_yes", "votes_no", "timestamp"]
        };
      }
    }

    // Fetch action items (only in private mode or if allowed)
    if (dataScope === "private") {
      const actionItems = await fetchOpenActionItems(db, orgId, actionItemsLimit);
      let actionItemsSection = "## Open Action Items\n";
      if (actionItems.length > 0) {
        actionItemsSection += actionItems
          .map((a) => `- ${a.title} (${a.status}): Assigned to ${a.assignee}, Due ${a.due_date}`)
          .join("\n");
      } else {
        actionItemsSection += "No open action items.\n";
      }
      actionItemsSection += "\n";

      const actionItemsTokens = estimateTokens(actionItemsSection);
      if (usedTokens + actionItemsTokens <= tokenLimit) {
        contextStr += actionItemsSection;
        usedTokens += actionItemsTokens;
        sources.actionItems = {
          count: actionItems.length,
          fields: ["title", "status", "assignee", "due_date"]
        };
      }
    }

    return {
      context: contextStr || "No context available.",
      sources,
      estimatedTokens: usedTokens
    };
  } catch (error) {
    console.error("Error building context:", error.message);
    return {
      context: "Unable to load context. Please try again.",
      sources: {},
      estimatedTokens: 0,
      error: error.message
    };
  }
}
