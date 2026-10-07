export function ThemeInsight({ text }: { text: string }) {
  return (
    <aside className="rounded-md border border-line bg-[#FDFCF9] px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-serif text-base text-navy">이번 주 테마</h3>
        <span className="rounded-sm border border-sky/30 bg-sky/10 px-1.5 py-0.5 text-[0.6875rem] font-semibold text-sky">
          AI 요약은 Phase 4
        </span>
      </div>
      <p className="mt-1 text-sm leading-relaxed text-ink">{text}</p>
      <p className="mt-1 text-xs text-muted">관심도가 높다는 것은 주가 상승을 뜻하지 않습니다.</p>
    </aside>
  );
}
