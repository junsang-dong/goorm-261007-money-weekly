import { cert, getApps, initializeApp, type App } from "firebase-admin/app";

/** 서버 전용. Phase 1 API는 토큰을 검증하지 않고, 키가 있을 때만 초기화한다. */
export function getAdminApp(): App | null {
  if (getApps().length > 0) return getApps()[0] ?? null;

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) return null;

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}
