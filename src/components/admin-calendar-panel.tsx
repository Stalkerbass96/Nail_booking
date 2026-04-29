"use client";

import { useCallback, useEffect, useState } from "react";
import type { Lang } from "@/lib/lang";

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

type Props = { lang: Lang };

const DISPLAY_START_HOUR = 9;
const DISPLAY_END_HOUR = 21;
const TOTAL_HOURS = DISPLAY_END_HOUR - DISPLAY_START_HOUR;
const PX_PER_HOUR = 64;
const TOTAL_HEIGHT = TOTAL_HOURS * PX_PER_HOUR;
const PX_PER_MIN = PX_PER_HOUR / 60;

const STATUS_STYLE: Record<string, { bg: string; border: string; text: string; dot: string }> = {
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
    dot: "#4ade80"
  },
  completed: {
    bg: "#f3f4f6",
    border: "#d1d5db",
    text: "#6b7280",
    dot: "#9ca3af"
  }
};

const TEXT = {
  zh: {
    title: "预约日历",
    today: "今天",
    loading: "加载中...",
    noAppts: "暂无预约",
    pending: "待确认",
    confirmed: "已确认",
    completed: "已完成",
    days: ["一", "二", "三", "四", "五", "六", "日"]
  },
  ja: {
    title: "予約カレンダー",
    today: "今日",
    loading: "読み込み中...",
    noAppts: "予約なし",
    pending: "未確認",
    confirmed: "確定済み",
    completed: "完了",
    days: ["月", "火", "水", "木", "金", "土", "日"]
  }
} as const;

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toLocalYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function calcTop(startAt: Date): number {
  const h = startAt.getHours() + startAt.getMinutes() / 60;
  return Math.max(0, (h - DISPLAY_START_HOUR) * PX_PER_HOUR);
}

function calcHeight(startAt: Date, endAt: Date): number {
  const durationMin = (endAt.getTime() - startAt.getTime()) / 60000;
  return Math.max(durationMin * PX_PER_MIN, 22);
}

function formatMd(date: Date, lang: Lang): string {
  return lang === "ja"
    ? `${date.getMonth() + 1}/${date.getDate()}`
    : `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatWeekRange(start: Date, lang: Lang): string {
  const end = addDays(start, 6);
  if (lang === "ja") {
    return `${start.getMonth() + 1}月${start.getDate()}日 〜 ${end.getMonth() + 1}月${end.getDate()}日`;
  }
  return `${start.getMonth() + 1}/${start.getDate()} — ${end.getMonth() + 1}/${end.getDate()}`;
}

function formatHour(h: number): string {
  return `${String(h).padStart(2, "0")}:00`;
}

export default function AdminCalendarPanel({ lang }: Props) {
  const t = TEXT[lang];
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => DISPLAY_START_HOUR + i);

  const fetchWeek = useCallback(async (start: Date) => {
    setLoading(true);
    try {
      const from = toLocalYmd(start);
      const to = toLocalYmd(addDays(start, 6));
      const res = await fetch(`/api/admin/calendar?from=${from}&to=${to}`);
      const data = await res.json();
      setAppointments(data.appointments ?? []);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchWeek(weekStart);
  }, [weekStart, fetchWeek]);

  function goToday() {
    setWeekStart(getWeekStart(new Date()));
  }
  function prevWeek() {
    setWeekStart((w) => addDays(w, -7));
  }
  function nextWeek() {
    setWeekStart((w) => addDays(w, 7));
  }

  function aptsByDay(day: Date): CalendarAppointment[] {
    return appointments.filter((a) => isSameDay(new Date(a.startAt), day));
  }

  const totalThisWeek = appointments.length;

  return (
    <article className="section-panel section-panel-compact" style={{ overflow: "hidden" }}>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="admin-section-title">{t.title}</h2>
          {!loading && (
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
            style={{ minHeight: 32, width: 32, padding: 0, fontSize: 16 }}
            onClick={prevWeek}
            aria-label="Previous week"
          >
            ‹
          </button>
          <span className="text-sm font-medium" style={{ color: "var(--text-2)", minWidth: 120, textAlign: "center" }}>
            {formatWeekRange(weekStart, lang)}
          </span>
          <button
            type="button"
            className="ui-btn-secondary"
            style={{ minHeight: 32, width: 32, padding: 0, fontSize: 16 }}
            onClick={nextWeek}
            aria-label="Next week"
          >
            ›
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="mb-3 flex flex-wrap gap-3">
        {(["pending", "confirmed", "completed"] as const).map((s) => (
          <span key={s} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-3)" }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: STATUS_STYLE[s].dot, flexShrink: 0, display: "inline-block" }} />
            {t[s]}
          </span>
        ))}
      </div>

      {/* Grid */}
      <div style={{ overflowX: "auto", overflowY: "hidden" }}>
        <div style={{ minWidth: 560 }}>
          {/* Day header row */}
          <div style={{ display: "grid", gridTemplateColumns: "48px repeat(7, 1fr)", marginBottom: 4 }}>
            <div />
            {days.map((day, i) => {
              const isToday = isSameDay(day, today);
              return (
                <div
                  key={i}
                  style={{
                    textAlign: "center",
                    paddingBottom: 6,
                    borderBottom: isToday ? "2px solid #f59e0b" : "1px solid var(--border)"
                  }}
                >
                  <span
                    className="text-xs font-medium"
                    style={{ color: isToday ? "#92400e" : "var(--text-3)" }}
                  >
                    {t.days[i]}
                  </span>
                  <br />
                  <span
                    className="text-sm font-semibold"
                    style={{ color: isToday ? "#f59e0b" : "var(--text)" }}
                  >
                    {formatMd(day, lang)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Time grid */}
          <div style={{ display: "grid", gridTemplateColumns: "48px repeat(7, 1fr)" }}>
            {/* Time labels */}
            <div style={{ position: "relative", height: TOTAL_HEIGHT }}>
              {hours.map((h) => (
                <div
                  key={h}
                  style={{
                    position: "absolute",
                    top: (h - DISPLAY_START_HOUR) * PX_PER_HOUR - 8,
                    right: 6,
                    fontSize: 10,
                    color: "var(--text-3)",
                    lineHeight: 1
                  }}
                >
                  {formatHour(h)}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((day, di) => {
              const isToday = isSameDay(day, today);
              const dayApts = aptsByDay(day);

              return (
                <div
                  key={di}
                  style={{
                    position: "relative",
                    height: TOTAL_HEIGHT,
                    borderLeft: "1px solid var(--border)",
                    background: isToday ? "rgba(245, 158, 11, 0.03)" : undefined
                  }}
                >
                  {/* Hour grid lines */}
                  {hours.map((h) => (
                    <div
                      key={h}
                      style={{
                        position: "absolute",
                        top: (h - DISPLAY_START_HOUR) * PX_PER_HOUR,
                        left: 0,
                        right: 0,
                        borderTop: h === DISPLAY_START_HOUR ? "none" : "1px dashed var(--border)",
                        opacity: 0.6
                      }}
                    />
                  ))}

                  {/* Appointment blocks */}
                  {loading ? null : dayApts.length === 0 ? null : dayApts.map((apt) => {
                    const start = new Date(apt.startAt);
                    const end = new Date(apt.endAt);
                    const top = calcTop(start);
                    const height = calcHeight(start, end);
                    const style = STATUS_STYLE[apt.status] ?? STATUS_STYLE.pending;
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
                          border: `1px solid ${style.border}`,
                          background: style.bg,
                          color: style.text,
                          overflow: "hidden",
                          textDecoration: "none",
                          padding: "2px 4px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "flex-start",
                          cursor: "pointer",
                          zIndex: 1
                        }}
                      >
                        <span style={{ fontSize: 10, fontWeight: 600, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {apt.customerName}
                        </span>
                        {height >= 36 && (
                          <span style={{ fontSize: 9, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", opacity: 0.85 }}>
                            {pkgName}
                          </span>
                        )}
                      </a>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {loading && (
        <p className="ui-state-info mt-3">{t.loading}</p>
      )}
    </article>
  );
}
