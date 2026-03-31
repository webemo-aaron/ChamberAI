/**
 * Organization-scoped Firestore helpers
 * All tenant data lives under organizations/{orgId}/subcollections
 */

/**
 * Resolve an organization id, guarding against empty strings from env/config.
 * @param {string | null | undefined} orgId - Candidate organization ID
 * @param {string | null | undefined} fallbackOrgId - Optional fallback organization ID
 * @returns {string}
 */
export function resolveOrgId(orgId, fallbackOrgId = process.env.DEFAULT_ORG_ID) {
  const normalizedOrgId = typeof orgId === "string" ? orgId.trim() : "";
  if (normalizedOrgId) {
    return normalizedOrgId;
  }

  const normalizedFallback = typeof fallbackOrgId === "string" ? fallbackOrgId.trim() : "";
  if (normalizedFallback) {
    return normalizedFallback;
  }

  return "default";
}

/**
 * Get a reference to an organization document
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @param {string} orgId - Organization ID
 * @returns {FirebaseFirestore.DocumentReference}
 */
export function orgRef(db, orgId) {
  return db.collection("organizations").doc(resolveOrgId(orgId));
}

/**
 * Get a reference to a collection within an organization
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @param {string} orgId - Organization ID
 * @param {string} collectionName - Collection name (e.g., "meetings", "motions")
 * @returns {FirebaseFirestore.CollectionReference}
 */
export function orgCollection(db, orgId, collectionName) {
  return orgRef(db, orgId).collection(collectionName);
}
