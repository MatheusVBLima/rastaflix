const monthFmt = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" });
const dayFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" });

/** "2026-11" → "nov" */
export function formatMonthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return monthFmt.format(new Date(Date.UTC(y, m - 1, 1))).replace(".", "");
}

/** "2026-11-21" → "21 de nov" */
export function formatDayLabel(day: string) {
  return dayFmt.format(new Date(`${day}T00:00:00Z`)).replace(".", "");
}

/** "Matheus Lima" → "ML" */
export function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?"
  );
}

/** 754 → "12min 34s" */
export function formatDuration(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h) return `${h}h ${String(m).padStart(2, "0")}min`;
  if (m) return `${m}min ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}
