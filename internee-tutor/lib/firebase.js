"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function withTimeout(promise, ms = 6000, label = "Firebase") {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
    ),
  ]);
}

// Set when Firebase fails at runtime; UI shows it so problems are visible.
export let firebaseError = null;
let firebaseBroken = false;
function markBroken(err) {
  firebaseBroken = true;
  firebaseError = err?.message || String(err);
  console.error("[Firebase problem, falling back to local storage]", err);
}

const hasFirebaseConfig = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app, auth, db;
if (hasFirebaseConfig) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

// Signs the visitor in anonymously so progress can be tied to a stable
// user id without requiring a signup flow. Resolves with the uid.
function localUid() {
  let localId = typeof window !== "undefined" ? localStorage.getItem("tutor_local_uid") : null;
  if (!localId) {
    localId = "local-" + Math.random().toString(36).slice(2, 10);
    if (typeof window !== "undefined") localStorage.setItem("tutor_local_uid", localId);
  }
  return localId;
}

export function ensureSignedIn() {
  if (hasFirebaseConfig && !firebaseBroken) {
    return withTimeout(firebaseSignIn(), 6000, "Firebase sign-in").catch((e) => {
      markBroken(e);
      return localUid();
    });
  }
  return Promise.resolve(localUid());
}

function firebaseSignIn() {
  return new Promise((resolve, reject) => {
    if (!hasFirebaseConfig) {
      // No Firebase configured yet — fall back to a local-only id so the
      // app still works while the developer wires up their Firebase project.
      let localId = typeof window !== "undefined" ? localStorage.getItem("tutor_local_uid") : null;
      if (!localId) {
        localId = "local-" + Math.random().toString(36).slice(2, 10);
        if (typeof window !== "undefined") localStorage.setItem("tutor_local_uid", localId);
      }
      resolve(localId);
      return;
    }
    onAuthStateChanged(auth, (user) => {
      if (user) {
        resolve(user.uid);
      } else {
        signInAnonymously(auth)
          .then((cred) => resolve(cred.user.uid))
          .catch(reject);
      }
    });
  });
}

const LOCAL_KEY = (uid) => `tutor_progress_${uid}`;

function readLocalProgress(uid) {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(LOCAL_KEY(uid));
  return raw ? JSON.parse(raw) : null;
}

function writeLocalProgress(uid, data) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_KEY(uid), JSON.stringify(data));
}

// Reads a user's progress document, creating a blank one if none exists.
export async function getProgress(uid) {
  const blank = { modules: {}, updatedAt: null };
  if (!hasFirebaseConfig || firebaseBroken || uid.startsWith("local-")) {
    return readLocalProgress(uid) || blank;
  }
  try {
    const ref = doc(db, "progress", uid);
    const snap = await withTimeout(getDoc(ref), 6000, "Firestore read");
    if (snap.exists()) return snap.data();
    await withTimeout(setDoc(ref, blank), 6000, "Firestore write");
    return blank;
  } catch (e) {
    markBroken(e);
    return readLocalProgress(uid) || blank;
  }
}

// Merges an update into a user's per-module progress
// (e.g. { lessonPlan, completedTopics, quizScores, weakAreas }).
export async function saveModuleProgress(uid, moduleId, patch) {
  if (!hasFirebaseConfig || firebaseBroken || uid.startsWith("local-")) {
    const current = readLocalProgress(uid) || { modules: {} };
    current.modules = current.modules || {};
    current.modules[moduleId] = { ...(current.modules[moduleId] || {}), ...patch };
    current.updatedAt = new Date().toISOString();
    writeLocalProgress(uid, current);
    return current;
  }
  try {
    const ref = doc(db, "progress", uid);
    const snap = await withTimeout(getDoc(ref), 6000, "Firestore read");
    const current = snap.exists() ? snap.data() : { modules: {} };
    const modules = { ...(current.modules || {}) };
    modules[moduleId] = { ...(modules[moduleId] || {}), ...patch };
    await withTimeout(setDoc(ref, { modules, updatedAt: serverTimestamp() }, { merge: true }), 6000, "Firestore write");
    return { modules };
  } catch (e) {
    markBroken(e);
    return null;
  }
}

// Wipes all saved progress for this user — used by the "Reset progress"
// control so testing/starting over doesn't require opening dev tools.
export async function resetAllProgress(uid) {
  const blank = { modules: {}, updatedAt: null };
  if (!hasFirebaseConfig || firebaseBroken || uid.startsWith("local-")) {
    writeLocalProgress(uid, blank);
    return blank;
  }
  try {
    const ref = doc(db, "progress", uid);
    await withTimeout(setDoc(ref, blank), 6000, "Firestore write");
    return blank;
  } catch (e) {
    markBroken(e);
    writeLocalProgress(uid, blank);
    return blank;
  }
}

export { hasFirebaseConfig };
