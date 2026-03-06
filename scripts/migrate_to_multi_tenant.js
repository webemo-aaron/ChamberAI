#!/usr/bin/env node
/**
 * One-time migration script: Move all documents from top-level collections
 * to organizations/default/{collection}/{docId} for multi-tenancy support.
 *
 * Run once before first production deployment on existing data:
 *   node scripts/migrate_to_multi_tenant.js
 *
 * This script:
 * 1. Creates organizations/default if it doesn't exist
 * 2. Copies all documents from top-level collections to org subcollections
 * 3. Uses batch writes (500 docs/batch) for efficiency
 * 4. Logs progress and reports errors
 */

import admin from "firebase-admin";
import fs from "node:fs";

const DEFAULT_ORG_ID = "default";

// Collections to migrate from top-level to organizations/default/
const COLLECTIONS_TO_MIGRATE = [
  "meetings",
  "motions",
  "actionItems",
  "draftMinutes",
  "draftMinuteVersions",
  "audioSources",
  "auditLogs",
  "publicSummaries",
  "memberships",
  "invites",
  "businessListings",
  "geoProfiles",
  "geoContentBriefs"
];

// Special collections with subcollections
const COLLECTIONS_WITH_SUBCOLLECTIONS = {
  businessListings: ["reviews", "quotes"],
  draftMinutes: ["comments", "revisions"],
  meetings: ["attendees"]
};

let migratedCount = 0;
let errorCount = 0;
const errors = [];

async function initializeFirebase() {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.GCP_PROJECT_ID
    });
  } else {
    admin.initializeApp({
      projectId: process.env.GCP_PROJECT_ID
    });
  }
}

async function createOrgIfNotExists(db) {
  const orgRef = db.collection("organizations").doc(DEFAULT_ORG_ID);
  const orgDoc = await orgRef.get();

  if (!orgDoc.exists) {
    console.log(`Creating organizations/${DEFAULT_ORG_ID}...`);
    await orgRef.set({
      id: DEFAULT_ORG_ID,
      name: "Default Chamber",
      slug: "default",
      plan: "free",
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // Create settings/system
    await orgRef.collection("settings").doc("system").set({
      subscription: {
        tier: "free",
        status: "active",
        created_at: admin.firestore.FieldValue.serverTimestamp()
      }
    });

    console.log(`✓ Organization created at organizations/${DEFAULT_ORG_ID}`);
  } else {
    console.log(`✓ Organization already exists at organizations/${DEFAULT_ORG_ID}`);
  }
}

async function migrateCollection(db, collectionName) {
  console.log(`\nMigrating ${collectionName}...`);

  try {
    const topLevelDocs = await db.collection(collectionName).get();
    console.log(`  Found ${topLevelDocs.size} documents`);

    if (topLevelDocs.empty) {
      return;
    }

    // Process in batches of 500
    let batch = db.batch();
    let batchSize = 0;
    const BATCH_LIMIT = 500;

    for (const doc of topLevelDocs.docs) {
      const data = doc.data();
      const targetRef = db
        .collection("organizations")
        .doc(DEFAULT_ORG_ID)
        .collection(collectionName)
        .doc(doc.id);

      batch.set(targetRef, data);
      batchSize++;
      migratedCount++;

      if (batchSize === BATCH_LIMIT) {
        await batch.commit();
        console.log(`  Committed batch (${batchSize} docs)`);
        batch = db.batch();
        batchSize = 0;
      }
    }

    // Commit remaining
    if (batchSize > 0) {
      await batch.commit();
      console.log(`  Committed batch (${batchSize} docs)`);
    }

    console.log(`✓ ${collectionName}: ${topLevelDocs.size} documents migrated`);
  } catch (error) {
    errorCount++;
    const errorMsg = `Error migrating ${collectionName}: ${error.message}`;
    console.error(`✗ ${errorMsg}`);
    errors.push(errorMsg);
  }
}

async function migrateSubcollections(db, parentCollection, parentDocId, subcollections) {
  try {
    for (const subcoll of subcollections) {
      const docs = await db
        .collection(parentCollection)
        .doc(parentDocId)
        .collection(subcoll)
        .get();

      if (docs.empty) continue;

      let batch = db.batch();
      let batchSize = 0;
      const BATCH_LIMIT = 500;

      for (const doc of docs.docs) {
        const data = doc.data();
        const targetRef = db
          .collection("organizations")
          .doc(DEFAULT_ORG_ID)
          .collection(parentCollection)
          .doc(parentDocId)
          .collection(subcoll)
          .doc(doc.id);

        batch.set(targetRef, data);
        batchSize++;
        migratedCount++;

        if (batchSize === BATCH_LIMIT) {
          await batch.commit();
          batch = db.batch();
          batchSize = 0;
        }
      }

      if (batchSize > 0) {
        await batch.commit();
      }
    }
  } catch (error) {
    errorCount++;
    console.error(
      `✗ Error migrating subcollections of ${parentCollection}/${parentDocId}: ${error.message}`
    );
  }
}

async function migrateCollectionsWithSubcollections(db) {
  console.log(`\nMigrating collections with subcollections...`);

  for (const [parentCollection, subcollections] of Object.entries(
    COLLECTIONS_WITH_SUBCOLLECTIONS
  )) {
    try {
      const parentDocs = await db.collection(parentCollection).get();

      for (const parentDoc of parentDocs.docs) {
        await migrateSubcollections(db, parentCollection, parentDoc.id, subcollections);
      }

      console.log(`✓ ${parentCollection} subcollections migrated`);
    } catch (error) {
      errorCount++;
      console.error(
        `✗ Error with ${parentCollection} subcollections: ${error.message}`
      );
    }
  }
}

async function main() {
  console.log("ChamberAI Multi-Tenancy Migration Script");
  console.log("=========================================\n");

  try {
    await initializeFirebase();
    const db = admin.firestore();

    // Create default organization
    await createOrgIfNotExists(db);

    // Migrate top-level collections
    for (const collectionName of COLLECTIONS_TO_MIGRATE) {
      await migrateCollection(db, collectionName);
    }

    // Migrate subcollections
    await migrateCollectionsWithSubcollections(db);

    console.log("\n=========================================");
    console.log(`Migration Summary:`);
    console.log(`  Total documents migrated: ${migratedCount}`);
    console.log(`  Errors: ${errorCount}`);

    if (errors.length > 0) {
      console.log(`\nErrors encountered:`);
      errors.forEach((err) => console.log(`  - ${err}`));
      process.exit(1);
    } else {
      console.log(`\n✓ Migration completed successfully!`);
      process.exit(0);
    }
  } catch (error) {
    console.error("\n✗ Fatal error:", error.message);
    process.exit(1);
  }
}

main();
