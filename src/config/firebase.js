import admin from "firebase-admin";
import { env } from "./env.js";

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.firebase.projectId,
      clientEmail: env.firebase.clientEmail,
      privateKey: env.firebase.privateKey,
    }),
    databaseURL: env.firebase.databaseUrl,
  });
}

export const db = admin.database();
