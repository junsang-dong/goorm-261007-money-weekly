"use client";

import { useAuth } from "@/components/AuthProvider";
import { Disclaimer } from "@/components/Disclaimer";
import { Top10Preview } from "@/components/top10/Top10Preview";
import { isOnboarded } from "@/lib/prefs";
import type { Top10Item } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function authMessage(error: unknown): string {
  const code =
    typeof error === "object" && error && "code" in error && typeof error.code === "string"
      ? error.code
      : "";
  if (code === "auth/popup-blocked") {
    return "팝업이 차단되었습니다. 브라우저에서 팝업을 허용한 뒤 다시 시도해 주세요.";
  }
  if (code === "auth/unauthorized-domain") {
    return "이 도메인이 Firebase 승인 도메인에 없습니다.";
  }
  if (code === "auth/operation-not-allowed") {
    return "Firebase 콘솔에서 Google 로그인을 켜 주세요.";
  }
  if (error instanceof Error && error.message) return error.message;
  return "로그인에 실패했습니다.";
}

export function LoginPanel({ items, asOf }: { items: Top10Item[]; asOf: string }) {
  const { user, ready, firebaseReady, devBypass, signInWithGoogle, signInDev } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!ready || !user) return;
    router.replace(isOnboarded() ? "/" : "/onboarding");
  }, [ready, user, router]);

  async function onGoogle() {
    setError(null);
    setPending(true);
    try {
      await signInWithGoogle();
    } catch (caught) {
      setError(authMessage(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto grid max-w-[1600px] gap-8 px-4 py-8 md:px-10 lg:grid-cols-12">
      <section className="lg:col-span-5">
        <p className="font-serif text-3xl font-semibold text-navy">MoneyWeekly</p>
        <h1 className="mt-3 font-serif text-2xl text-ink">이번 주 시장의 관심을 한 장으로</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          거래량 변동성으로 본 한국 증시 관심도 TOP10과, 로그인 후 만드는 주간 재테크 브리핑입니다.
          관심도는 주가 상승 신호가 아닙니다.
        </p>
        <div className="mt-6 flex flex-col items-start gap-3">
          {firebaseReady ? (
            <button
              type="button"
              onClick={onGoogle}
              disabled={pending}
              className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-blue disabled:opacity-60"
            >
              {pending ? "로그인 중…" : "Google로 로그인"}
            </button>
          ) : (
            <p className="max-w-md rounded-md border border-line bg-card px-3 py-2 text-sm text-muted">
              Google 로그인을 쓰려면 환경 파일에 Firebase 웹 앱 키를 넣어야 합니다.
            </p>
          )}
          {devBypass ? (
            <button
              type="button"
              onClick={signInDev}
              className="rounded-md border border-line bg-card px-4 py-2 text-sm text-navy hover:bg-tint"
            >
              로컬 목업 로그인
            </button>
          ) : null}
          {error ? <p className="text-sm text-up">{error}</p> : null}
        </div>
        <div className="mt-8">
          <Disclaimer />
        </div>
      </section>
      <section className="lg:col-span-7">
        <h2 className="text-sm font-semibold text-ink">관심도 TOP10 미리보기</h2>
        <p className="mt-1 mb-3 text-xs text-muted">기준 {asOf} · 숫자만 공개합니다. 해설은 로그인 후입니다.</p>
        <Top10Preview items={items} />
      </section>
    </main>
  );
}
