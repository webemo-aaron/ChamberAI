/**
 * Organization-scoped Firestore helpers
 * All tenant data lives under organizations/{orgId}/subcollections
 */

/**
 * Get a reference to an organization document
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @param {string} orgId - Organization ID
 * @returns {FirebaseFirestore.DocumentReference}
 */
export function orgRef(db, orgId) {
  return db.collection("organizations").doc(orgId);
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
