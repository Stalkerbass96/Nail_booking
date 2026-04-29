"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Lang } from "@/lib/lang";

// ---------- types ----------

type CalendarAppointment = {
  id: string;
  bookingNo: string;
  startAt: string;
  endAt: string;
  status: "pending" | "confirmed" | "completed";
  customerName: string;
  packageNameZh: string;
  packageNameJa: string;
};

type CalendarBlock = {
  id: string;
  startAt: string;
  endAt: string;
  reason: string | null;
};

type DayWindow = {
  isOpen: boolean;
  openAt?: string;
  closeAt?: string;
};

type CalendarData = {
  appointments: CalendarAppointment[];
  bookingBlocks: CalendarBlock[];
  businessWindows: Record<string, DayWindow>;
};

type Props = { lang: Lang };

// ---------- layout constants ----------

const DISPLAY_START_HOUR = 9;
const DISPLAY_END_HOUR = 21;
const TOTAL_HOURS = DISPLAY_END_HOUR - DISPLAY_START_HOUR;
const PX_PER_HOUR = 64;
const TOTAL_HEIGHT = TOTAL_HOURS * PX_PER_HOUR;
const PX_PER_MIN = PX_PER_HOUR / 60;

// ---------- JST date utilities ----------
// The app operates in JST (+09:00). We never rely on browser local time.

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

function utcToJstYmd(d: Date): string {
  const shifted = new Date(d.getTime() + JST_OFFSET_MS);
  return shifted.toISOString().slice(0, 10);
}

function utcToJstHour(d: Date): number {
  const shifted = new Date(d.getTime() + JST_OFFSET_MS);
  return shifted.getUTCHours() + shifted.getUTCMinutes() / 60;
}

function jstYmdToUtc(ymd: string): Date {
  return new Date(`${ymd}T00:00:00+09:00`);
}

function addDaysToYmd(ymd: string, n: number): string {
  const d = new Date(jstYmdToUtc(ymd).getTime() + n * 24 * 60 * 60 * 1000);
  return utcToJstYmd(d);
}

function getWeekMondayYmd(): string {
  const todayYmd = utcToJstYmd(new Date());
  // Use JST noon to get day-of-week safely
  const dow = new Date(`${todayYmd}T12:00:00+09:00`).getUTCDay(); // 0=Sun
  const diff = dow === 0 ? -6 : 1 - dow;
  return addDaysToYmd(todayYmd, diff);
}

function ymdLabel(ymd: string, lang: Lang): string {
  const [, m, d] = ymd.split("-");
  return lang === "ja" ? `${Number(m)}/${Number(d)}` : `${Number(m)}/${Number(d)}`;
}

function weekRangeLabel(mondayYmd: string, lang: Lang): string {
  const sundayYmd = addDaysToYmd(mondayYmd, 6);
  const [, m1, d1] = mondayYmd.split("-");
  const [, m2, d2] = sundayYmd.split("-");
  if (lang === "ja") {
    return `${Number(m1)}月${Number(d1)}日 〜 ${Number(m2)}月${Number(d2)}日`;
  }
  return `${Number(m1)}/${Number(d1)} — ${Number(m2)}/${Number(d2)}`;
}

function calcTopPx(isoString: string): number {
  const h = utcToJstHour(new Date(isoString));
  return Math.max(0, (h - DISPLAY_START_HOUR) * PX_PER_HOUR);
}

function calcHeightPx(startIso: string, endIso: string): number {
  const durationMin = (new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000;
  return Math.max(durationMin * PX_PER_MIN, 24);
}

function formatHour(h: number): string {
  return `${String(h).padStart(2, "0")}:00`;
}

// ---------- status colours ----------

const STATUS_STYLE = {
  pending: {
    bg: "#fffbeb",
    border: "#fcd34d",
    text: "#92400e",
    dot: "#f59e0b"
  },
  confirmed: {
    bg: "#eef7f1",
    border: "#b0d9be",
    text: "#286040",
    dot: "#22c55e"
  },
  completed: {
    bg: "#f3f4f6",
    border: "#d1d5db",
    text: "#6b7280",
    dot: "#9ca3af"
  }
} as const;

// ---------- i18n ----------

const TEXT = {
  zh: {
    title: "预约日历",
    today: "今天",
    loading: "加载中...",
    error: "加载失败，请刷新重试",
    pending: "待确认",
    confirmed: "已确认",
    completed: "已完成",
    block: "封锁区间",
    closed: "休息",
    days: ["一", "二", "三", "四", "五", "六", "日"]
  },
  ja: {
    title: "予約カレンダー",
    today: "今日",
    loading: "読み込み中...",
    error: "読み込みに失敗しました。ページを更新してください",
    pending: "未確認",
    confirmed: "確定済み",
    completed: "完了",
    block: "ブロック枠",
    closed: "休業",
    days: ["月", "火", "水", "木", "金", "土", "日"]
  }
} as const;

// ---------- component ----------

export default function AdminCalendarPanel({ lang }: Props) {
  const t = TEXT[lang];

  const [mondayYmd, setMondayYmd] = useState<string>(() => getWeekMondayYmd());
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const todayYmd = utcToJstYmd(new Date());
  const nowTop = useRef<number>(0);
  const [, setTick] = useState(0);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDaysToYmd(mondayYmd, i));
  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => DISPLAY_START_HOUR + i);

  const fetchWeek = useCallback(async (monday: string) => {
    setLoading(true);
    setFetchError(null);
    try {
      const from = monday;
      const to = addDaysToYmd(monday, 6);
      const res = await fetch(`/api/admin/calendar?from=${from}&to=${to}`);
      const json = await res.json() as CalendarData & { error?: string; details?: string };
      if (!res.ok) {
        setFetchError(`HTTP ${res.status}: ${json.error ?? "unknown"} — ${json.details ?? ""}`);
        setData(null);
        return;
      }
      setData(json);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : String(err));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchWeek(mondayYmd);
  }, [mondayYmd, fetchWeek]);

  // Update current-time indicator every minute
  useEffect(() => {
    const update = () => {
      const h = utcToJstHour(new Date());
      nowTop.current = (h - DISPLAY_START_HOUR) * PX_PER_HOUR;
      setTick((n) => n + 1);
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  function goToday() { setMondayYmd(getWeekMondayYmd()); }
  function prevWeek() { setMondayYmd((m) => addDaysToYmd(m, -7)); }
  function nextWeek() { setMondayYmd((m) => addDaysToYmd(m, 7)); }

  function aptsByDay(ymd: string): CalendarAppointment[] {
    return (data?.appointments ?? []).filter((a) => utcToJstYmd(new Date(a.startAt)) === ymd);
  }

  function blocksByDay(ymd: string): CalendarBlock[] {
    return (data?.bookingBlocks ?? []).filter((b) => utcToJstYmd(new Date(b.startAt)) === ymd);
  }

  const totalThisWeek = data?.appointments.length ?? 0;

  return (
    <article className="section-panel section-panel-compact" style={{ overflow: "hidden" }}>
      {/* ── Header ── */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="admin-section-title">{t.title}</h2>
          {!loading && data && (
            <span className="metric-pill metric-pill-soft">{totalThisWeek}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="ui-btn-secondary"
            style={{ minHeight: 32, padding: "0 10px", fontSize: 13 }}
            onClick={goToday}
          >
            {t.today}
          </button>
          <button
            type="button"
            className="ui-btn-secondary"
            style={{ minHeight: 32, width: 32, padding: 0, fontSize: 18, lineHeight: 1 }}
            onClick={prevWeek}
            aria-label="Previous week"
          >
            ‹
          </button>
          <span
            className="text-sm font-medium"
            style={{ color: "var(--text-2)", minWidth: 140, textAlign: "center" }}
          >
            {weekRangeLabel(mondayYmd, lang)}
          </span>
          <button
            type="button"
            className="ui-btn-secondary"
            style={{ minHeight: 32, width: 32, padding: 0, fontSize: 18, lineHeight: 1 }}
            onClick={nextWeek}
            aria-label="Next week"
          >
            ›
          </button>
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="mb-3 flex flex-wrap gap-4">
        {(["pending", "confirmed", "completed"] as const).map((s) => (
          <span key={s} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-3)" }}>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: STATUS_STYLE[s].dot, flexShrink: 0 }} />
            {t[s]}
          </span>
        ))}
        <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-3)" }}>
          <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "#fca5a5", flexShrink: 0 }} />
          {t.block}
        </span>
        <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-3)" }}>
          <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "#e5e7eb", flexShrink: 0 }} />
          {t.closed}
        </span>
      </div>

      {fetchError && (
        <p className="ui-state-error mb-3">{t.error}<br /><span style={{ fontSize: 11, opacity: 0.75 }}>{fetchError}</span></p>
      )}

      {/* ── Calendar grid ── */}
      <div style={{ overflowX: "auto", overflowY: "hidden" }}>
        <div style={{ minWidth: 560 }}>

          {/* Day header row */}
          <div style={{ display: "grid", gridTemplateColumns: "44px repeat(7, 1fr)", marginBottom: 2 }}>
            <div />
            {weekDays.map((ymd, i) => {
              const isToday = ymd === todayYmd;
              const win = data?.businessWindows[ymd];
              const isClosed = win ? !win.isOpen : false;
              return (
                <div
                  key={ymd}
                  style={{
                    textAlign: "center",
                    paddingBottom: 6,
                    borderBottom: isToday
                      ? "2px solid #f59e0b"
                      : "1px solid var(--border)"
                  }}
                >
                  <span
                    className="block text-xs font-medium"
                    style={{ color: isToday ? "#b45309" : isClosed ? "var(--text-3)" : "var(--text-3)" }}
                  >
                    {t.days[i]}
                  </span>
                  <span
                    className="block text-sm font-semibold"
                    style={{ color: isToday ? "#f59e0b" : isClosed ? "var(--text-3)" : "var(--text)" }}
                  >
                    {ymdLabel(ymd, lang)}
                  </span>
                  {isClosed && (
                    <span style={{ fontSize: 9, color: "var(--text-3)", lineHeight: 1 }}>{t.closed}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Time + columns */}
          <div style={{ display: "grid", gridTemplateColumns: "44px repeat(7, 1fr)" }}>

            {/* Time labels */}
            <div style={{ position: "relative", height: TOTAL_HEIGHT }}>
              {hours.map((h) => (
                <div
                  key={h}
                  style={{
                    position: "absolute",
                    top: (h - DISPLAY_START_HOUR) * PX_PER_HOUR - 7,
                    right: 4,
                    fontSize: 9,
                    color: "var(--text-3)",
                    lineHeight: 1,
                    userSelect: "none"
                  }}
                >
                  {formatHour(h)}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map((ymd) => {
              const isToday = ymd === todayYmd;
              const win = data?.businessWindows[ymd];
              const isClosed = win ? !win.isOpen : false;
              const dayApts = aptsByDay(ymd);
              const dayBlocks = blocksByDay(ymd);

              const openTopPx = win?.openAt
                ? Math.max(0, (utcToJstHour(new Date(win.openAt)) - DISPLAY_START_HOUR) * PX_PER_HOUR)
                : 0;
              const closeTopPx = win?.closeAt
                ? Math.min(TOTAL_HEIGHT, (utcToJstHour(new Date(win.closeAt)) - DISPLAY_START_HOUR) * PX_PER_HOUR)
                : TOTAL_HEIGHT;

              return (
                <div
                  key={ymd}
                  style={{
                    position: "relative",
                    height: TOTAL_HEIGHT,
                    borderLeft: "1px solid var(--border)",
                    background: isToday ? "rgba(245,158,11,0.03)" : undefined
                  }}
                >
                  {/* Closed / outside-hours overlay */}
                  {isClosed ? (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "repeating-linear-gradient(45deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 4px, transparent 4px, transparent 10px)",
                        backgroundColor: "#f3f4f6"
                      }}
                    />
                  ) : win?.openAt && win?.closeAt ? (
                    <>
                      {/* Before open */}
                      {openTopPx > 0 && (
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            height: openTopPx,
                            background: "rgba(156,163,175,0.15)"
                          }}
                        />
                      )}
                      {/* After close */}
                      {closeTopPx < TOTAL_HEIGHT && (
                        <div
                          style={{
                            position: "absolute",
                            top: closeTopPx,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: "rgba(156,163,175,0.15)"
                          }}
                        />
                      )}
                    </>
                  ) : null}

                  {/* Hour grid lines */}
                  {hours.map((h) => (
                    <div
                      key={h}
                      style={{
                        position: "absolute",
                        top: (h - DISPLAY_START_HOUR) * PX_PER_HOUR,
                        left: 0,
                        right: 0,
                        borderTop: "1px dashed var(--border)",
                        opacity: 0.5,
                        pointerEvents: "none"
                      }}
                    />
                  ))}

                  {/* Booking blocks */}
                  {dayBlocks.map((block) => {
                    const top = calcTopPx(block.startAt);
                    const height = calcHeightPx(block.startAt, block.endAt);
                    return (
                      <div
                        key={block.id}
                        title={block.reason ?? t.block}
                        style={{
                          position: "absolute",
                          top: top + 1,
                          left: 1,
                          right: 1,
                          height: height - 2,
                          borderRadius: 3,
                          border: "1px solid #fca5a5",
                          background: "repeating-linear-gradient(45deg, #fff1f2 0px, #fff1f2 4px, #ffe4e6 4px, #ffe4e6 8px)",
                          overflow: "hidden",
                          zIndex: 1
                        }}
                      >
                        {height >= 20 && (
                          <span style={{ fontSize: 9, color: "#991b1b", padding: "2px 3px", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {block.reason ?? t.block}
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {/* Appointment blocks */}
                  {dayApts.map((apt) => {
                    const top = calcTopPx(apt.startAt);
                    const height = calcHeightPx(apt.startAt, apt.endAt);
                    const cs = STATUS_STYLE[apt.status] ?? STATUS_STYLE.pending;
                    const pkgName = lang === "ja" ? apt.packageNameJa : apt.packageNameZh;
                    return (
                      <a
                        key={apt.id}
                        href={`/admin/appointments?bookingNo=${apt.bookingNo}&lang=${lang}`}
                        title={`${apt.customerName} · ${pkgName}`}
                        style={{
                          position: "absolute",
                          top: top + 1,
                          left: 2,
                          right: 2,
                          height: height - 2,
                          borderRadius: 4,
                          border: `1px solid ${cs.border}`,
                          background: cs.bg,
                          color: cs.text,
                          overflow: "hidden",
                          textDecoration: "none",
                          padding: "2px 4px",
                          display: "flex",
                          flexDirection: "column",
                          cursor: "pointer",
                          zIndex: 2
                        }}
                      >
                        <span style={{ fontSize: 10, fontWeight: 600, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {apt.customerName}
                        </span>
                        {height >= 36 && (
                          <span style={{ fontSize: 9, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", opacity: 0.8 }}>
                            {pkgName}
                          </span>
                        )}
                      </a>
                    );
                  })}

                  {/* Current-time indicator */}
                  {isToday && nowTop.current >= 0 && nowTop.current <= TOTAL_HEIGHT && (
                    <div
                      style={{
                        position: "absolute",
                        top: nowTop.current,
                        left: 0,
                        right: 0,
                        height: 2,
                        background: "#ef4444",
                        zIndex: 3,
                        pointerEvents: "none"
                      }}
                    >
                      <div style={{ position: "absolute", left: -3, top: -3, width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {loading && (
        <p className="ui-state-info mt-3" aria-live="polite">{t.loading}</p>
      )}
    </article>
  );
}
