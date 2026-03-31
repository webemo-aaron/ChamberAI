// Runtime Firebase config for sign-in via emulator or production Firebase.
// Local development keeps emulator auth; hosted environments use the real web app.
const isLocalDevHost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

window.CHAMBERAI_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAuK2PUSKp4-mewEMHsiF9YRuFQuDNsC4M",
  authDomain: "cam-aim-dev.firebaseapp.com",
  projectId: "cam-aim-dev",
  storageBucket: "cam-aim-dev.firebasestorage.app",
  messagingSenderId: "63262052942",
  appId: "1:63262052942:web:0ab2cf03f065df5e16e91f",
  useEmulator: isLocalDevHost,
  emulatorHost: "localhost:9099"
};
