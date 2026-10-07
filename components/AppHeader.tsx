"use client";

import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "주간 브리핑" },
  { href: "/#top10", label: "KRX 관심도 TOP10" },
  { href: "/rates", label: "예·적금 비교" },
  { href: "/#market", label: "마켓 인디케이터" },
  { href: "/#watchlist", label: "내 관심종목" },
];

const TICKER = ["KOSPI", "KOSDAQ", "기준금리", "국고채 3년", "원/달러"];

export function AppHeader() {
  const pathname = usePathname();
  const { user } = useAuth();
  const label = user?.displayName || user?.email || (user ? "로그인됨" : "게스트");

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-card/95 backdrop-blur">
      <div className="flex h-10 items-center gap-4 overflow-x-auto border-b border-line-strong bg-tint px-4 font-mono text-[0.6875rem] text-muted md:px-10">
        <span className="shrink-0 font-semibold tracking-wider">MARKET</span>
        {TICKER.map((name) => (
          <span key={name} className="shrink-0">
            {name}
            <span className="ml-1 text-ink/70">연동 전</span>
          </span>
        ))}
        <span className="ml-auto hidden shrink-0 xl:inline">KRX 장마감 기준</span>
      </div>
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 md:px-10">
        <div className="flex min-w-0 items-center gap-8">
          <Link href="/" className="shrink-0 font-serif text-xl font-semibold text-navy">
            MoneyWeekly
          </Link>
          <nav className="hidden items-center gap-5 text-sm lg:flex">
            {NAV.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={active ? "font-semibold text-navy" : "text-muted hover:text-ink"}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <Link href="/settings" className="shrink-0 text-right text-sm">
          <span className="block font-semibold text-ink">{label}</span>
          <span className="font-mono text-[0.6875rem] text-muted">설정</span>
        </Link>
      </div>
      <nav className="flex gap-4 overflow-x-auto px-4 pb-3 text-sm lg:hidden">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className="shrink-0 text-muted">
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
