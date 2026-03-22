// Runtime Firebase config for sign-in via emulator or production Firebase.
// Safe defaults for emulator deployment. Override in firebase-config.local.js for production Firebase.
window.CHAMBERAI_FIREBASE_CONFIG = {
  // Emulator-safe defaults (actual values don't matter for emulator auth)
  apiKey: "AIzaSyDummyKeyForEmulator",
  authDomain: "cam-aim-dev.firebaseapp.com",
  projectId: "cam-aim-dev",
  appId: "1:123456789:web:abcdef1234567890",

  // Enable Firebase Emulator Suite in browser
  // Emulator host must match FIREBASE_AUTH_EMULATOR_HOST from server
  useEmulator: true,
  emulatorHost: "localhost:9099"  // Override via firebase-config.local.js for production
};
