"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Lang } from "@/lib/lang";

// ── constants ────────────────────────────────────────────────────────────────

const SLOTS_PER_DAY = 48; // 30-min slots: 0=00:00 … 47=23:30
const CELL_H = 22; // px per cell
const LABEL_W = 52; // px for time label column
const JST_OFFSET_MS = 9 * 60 * 60_000;

// ── date helpers ─────────────────────────────────────────────────────────────

function todayJst(): string {
  return new Date(Date.now() + JST_OFFSET_MS).toISOString().slice(0, 10);
}

function addDays(ymd: string, n: number): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function weekMonday(ymd: string): string {
  const dow = new Date(`${ymd}T12:00:00+09:00`).getUTCDay(); // 0=Sun
  const diff = dow === 0 ? -6 : 1 - dow;
  return addDays(ymd, diff);
}

function slotLabel(slot: number): string {
  const h = Math.floor((slot * 30) / 60);
  const m = (slot * 30) % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatDateHeader(ymd: string, lang: Lang): string {
  const [, m, d] = ymd.split("-").map(Number);
  const dow = new Date(`${ymd}T12:00:00+09:00`).getUTCDay();
  const dayNames = lang === "ja"
    ? ["日", "月", "火", "水", "木", "金", "土"]
    : ["日", "一", "二", "三", "四", "五", "六"];
  return lang === "ja" ? `${m}/${d}(${dayNames[dow]})` : `${m}/${d}(${dayNames[dow]})`;
}

function weekRangeLabel(monday: string, lang: Lang): string {
  const sunday = addDays(monday, 6);
  const [, m1, d1] = monday.split("-").map(Number);
  const [, m2, d2] = sunday.split("-").map(Number);
  return lang === "ja"
    ? `${m1}月${d1}日 〜 ${m2}月${d2}日`
    : `${m1}/${d1} — ${m2}/${d2}`;
}

// ── types ─────────────────────────────────────────────────────────────────────

type DayData = {
  date: string;
  slots: number[];       // open slot indices from DB
  bookedSlots: number[]; // occupied by appointments (read-only display)
};

type DragState = {
  date: string;
  startSlot: number;
  endSlot: number;
  isOpening: boolean; // true = filling open, false = clearing
};

type Props = { lang: Lang };

// ── i18n ─────────────────────────────────────────────────────────────────────

const TEXT = {
  zh: {
    title: "排班日历",
    desc: "点击或拖拽格子来设置每天的开放预约时段（深色=开放，空白=关闭）。修改后自动保存。",
    prev: "← 上一周",
    next: "下一周 →",
    today: "本周",
    saving: "保存中…",
    saved: "已保存",
    saveFailed: "保存失败",
    loading: "加载中…",
    loadFailed: "加载失败",
    booked: "已有预约",
    open: "开放",
    closed: "关闭"
  },
  ja: {
    title: "スケジュールカレンダー",
    desc: "セルをクリック・ドラッグして予約受付時間を設定します（塗りつぶし=受付中、空白=受付不可）。変更は自動保存されます。",
    prev: "← 前の週",
    next: "次の週 →",
    today: "今週",
    saving: "保存中…",
    saved: "保存しました",
    saveFailed: "保存に失敗しました",
    loading: "読み込み中…",
    loadFailed: "読み込みに失敗しました",
    booked: "予約あり",
    open: "受付中",
    closed: "受付不可"
  }
} as const;

// ── main component ────────────────────────────────────────────────────────────

export default function AdminScheduleCalendar({ lang }: Props) {
  const t = TEXT[lang];
  const [weekStart, setWeekStart] = useState(() => weekMonday(todayJst()));
  const [weekData, setWeekData] = useState<DayData[]>([]);
  const [localSlots, setLocalSlots] = useState<Record<string, Set<number>>>({});
  const [loading, setLoading] = useState(true);
  const [savingDates, setSavingDates] = useState<Set<string>>(new Set());
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState<DragState | null>(null);

  // Ref to the scroll container — scroll to ~8:00 on first load
  const scrollRef = useRef<HTMLDivElement>(null);
  const didScroll = useRef(false);

  // ── data loading ────────────────────────────────────────────────────────────

  const loadWeek = useCallback(async (monday: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/schedule/week?from=${monday}`);
      const data = await res.json() as { days: DayData[] };
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "error");
      setWeekData(data.days);
      const init: Record<string, Set<number>> = {};
      for (const day of data.days) {
        init[day.date] = new Set(day.slots);
      }
      setLocalSlots(init);
    } catch (err) {
      setError(t.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [t.loadFailed]);

  useEffect(() => {
    void loadWeek(weekStart);
  }, [weekStart, loadWeek]);

  // Scroll to 8:00 on first mount
  useEffect(() => {
    if (!didScroll.current && !loading && scrollRef.current) {
      scrollRef.current.scrollTop = 16 * CELL_H; // slot 16 = 08:00
      didScroll.current = true;
    }
  }, [loading]);

  // ── save ────────────────────────────────────────────────────────────────────

  const saveDay = useCallback(async (date: string, slots: Set<number>) => {
    setSavingDates((prev) => new Set([...prev, date]));
    setLastSaved(null);
    setError("");
    try {
      const res = await fetch("/api/admin/schedule/week", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, slots: [...slots] })
      });
      if (!res.ok) throw new Error();
      setLastSaved(date);
    } catch {
      setError(t.saveFailed);
    } finally {
      setSavingDates((prev) => {
        const next = new Set(prev);
        next.delete(date);
        return next;
      });
    }
  }, [t.saveFailed]);

  // ── drag interaction ─────────────────────────────────────────────────────────

  const gridRef = useRef<HTMLDivElement>(null);

  function getSlotFromPoint(clientX: number, clientY: number): { date: string; slot: number } | null {
    if (!gridRef.current) return null;
    const el = document.elementFromPoint(clientX, clientY);
    if (!el) return null;
    const cell = (el as HTMLElement).closest("[data-date][data-slot]") as HTMLElement | null;
    if (!cell) return null;
    const date = cell.dataset.date;
    const slot = Number(cell.dataset.slot);
    if (!date || isNaN(slot)) return null;
    return { date, slot };
  }

  function handlePointerDown(e: React.PointerEvent, date: string, slot: number) {
    e.preventDefault();
    const currentlyOpen = localSlots[date]?.has(slot) ?? false;
    setDrag({ date, startSlot: slot, endSlot: slot, isOpening: !currentlyOpen });
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!drag) return;
    const hit = getSlotFromPoint(e.clientX, e.clientY);
    if (!hit || hit.date !== drag.date) return;
    if (hit.slot !== drag.endSlot) {
      setDrag((prev) => prev ? { ...prev, endSlot: hit.slot } : null);
    }
  }

  function commitDrag() {
    if (!drag) return;
    const { date, startSlot, endSlot, isOpening } = drag;
    const lo = Math.min(startSlot, endSlot);
    const hi = Math.max(startSlot, endSlot);
    setLocalSlots((prev) => {
      const next = new Set(prev[date] ?? []);
      for (let s = lo; s <= hi; s++) {
        if (isOpening) next.add(s);
        else next.delete(s);
      }
      void saveDay(date, next);
      return { ...prev, [date]: next };
    });
    setDrag(null);
  }

  // ── derived: what's shown in each cell during drag preview ──────────────────

  function isSlotVisuallyOpen(date: string, slot: number): boolean {
    if (drag && drag.date === date) {
      const lo = Math.min(drag.startSlot, drag.endSlot);
      const hi = Math.max(drag.startSlot, drag.endSlot);
      if (slot >= lo && slot <= hi) return drag.isOpening;
    }
    return localSlots[date]?.has(slot) ?? false;
  }

  function isSlotBooked(date: string, slot: number): boolean {
    const day = weekData.find((d) => d.date === date);
    return day?.bookedSlots.includes(slot) ?? false;
  }

  // ── week navigation ──────────────────────────────────────────────────────────

  function goToThisWeek() { setWeekStart(weekMonday(todayJst())); }
  function goPrev() { setWeekStart((w) => addDays(w, -7)); }
  function goNext() { setWeekStart((w) => addDays(w, 7)); }

  const dates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <section className="admin-panel-shell">
      <div>
        <h2 className="admin-section-title">{t.title}</h2>
        <p className="admin-note mt-2 max-w-3xl">{t.desc}</p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: "var(--text-3)" }}>
        <span className="flex items-center gap-1.5">
          <span style={{ display: "inline-block", width: 14, height: 14, borderRadius: 3, background: "var(--brand-400)" }} />
          {t.open}
        </span>
        <span className="flex items-center gap-1.5">
          <span style={{ display: "inline-block", width: 14, height: 14, borderRadius: 3, background: "#e5e7eb" }} />
          {t.closed}
        </span>
        <span className="flex items-center gap-1.5">
          <span style={{ display: "inline-block", width: 14, height: 14, borderRadius: 3, background: "var(--brand-400)", position: "relative" }}>
            <span style={{ position: "absolute", top: 2, right: 2, width: 5, height: 5, borderRadius: "50%", background: "#fff" }} />
          </span>
          {t.booked}
        </span>
        {savingDates.size > 0 && <span style={{ color: "var(--brand-600)" }}>{t.saving}</span>}
        {savingDates.size === 0 && lastSaved && <span style={{ color: "#16a34a" }}>{t.saved}</span>}
        {error && <span style={{ color: "#dc2626" }}>{error}</span>}
      </div>

      {/* Week navigation */}
      <div className="flex items-center gap-3">
        <button type="button" className="admin-btn-secondary" onClick={goPrev}>{t.prev}</button>
        <span className="flex-1 text-center text-sm font-semibold" style={{ color: "var(--text)" }}>
          {weekRangeLabel(weekStart, lang)}
        </span>
        <button type="button" className="admin-btn-secondary" onClick={goToThisWeek}>{t.today}</button>
        <button type="button" className="admin-btn-secondary" onClick={goNext}>{t.next}</button>
      </div>

      {loading && <p className="ui-state-info">{t.loading}</p>}

      {/* Calendar grid */}
      {!loading && (
        <div
          style={{
            overflowX: "auto",
            overflowY: "hidden",
            borderRadius: "1rem",
            border: "1px solid var(--border)",
            background: "var(--surface)"
          }}
        >
          {/* Column headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `${LABEL_W}px repeat(7, 1fr)`,
              minWidth: 560,
              borderBottom: "2px solid var(--border)",
              background: "var(--surface)"
            }}
          >
            <div style={{ height: 40 }} />
            {dates.map((date) => {
              const isToday = date === todayJst();
              return (
                <div
                  key={date}
                  style={{
                    height: 40,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 600,
                    color: isToday ? "var(--brand-700)" : "var(--text-2)",
                    borderLeft: "1px solid var(--border)",
                    background: isToday ? "var(--brand-50)" : undefined
                  }}
                >
                  {formatDateHeader(date, lang)}
                </div>
              );
            })}
          </div>

          {/* Scrollable body */}
          <div
            ref={scrollRef}
            style={{ maxHeight: 520, overflowY: "auto", minWidth: 560 }}
            onPointerMove={handlePointerMove}
            onPointerUp={commitDrag}
            onPointerLeave={commitDrag}
          >
            <div
              ref={gridRef}
              style={{
                display: "grid",
                gridTemplateColumns: `${LABEL_W}px repeat(7, 1fr)`,
                userSelect: "none",
                touchAction: "none"
              }}
            >
              {Array.from({ length: SLOTS_PER_DAY }, (_, slot) => {
                const showLabel = slot % 2 === 0; // every hour
                return (
                  <>
                    {/* Time label */}
                    <div
                      key={`label-${slot}`}
                      style={{
                        height: CELL_H,
                        display: "flex",
                        alignItems: "center",
                        paddingLeft: 8,
                        fontSize: 10,
                        color: "var(--text-3)",
                        borderBottom: "1px solid var(--border)",
                        background: "var(--surface)",
                        flexShrink: 0
                      }}
                    >
                      {showLabel ? slotLabel(slot) : ""}
                    </div>

                    {/* Day cells */}
                    {dates.map((date) => {
                      const open = isSlotVisuallyOpen(date, slot);
                      const booked = isSlotBooked(date, slot);
                      const isDragging =
                        drag?.date === date &&
                        slot >= Math.min(drag.startSlot, drag.endSlot) &&
                        slot <= Math.max(drag.startSlot, drag.endSlot);

                      return (
                        <div
                          key={`${date}-${slot}`}
                          data-date={date}
                          data-slot={slot}
                          onPointerDown={(e) => handlePointerDown(e, date, slot)}
                          style={{
                            height: CELL_H,
                            borderLeft: "1px solid var(--border)",
                            borderBottom: "1px solid var(--border)",
                            background: isDragging
                              ? drag?.isOpening
                                ? "var(--brand-300)"
                                : "#f3f4f6"
                              : open
                              ? "var(--brand-400)"
                              : "transparent",
                            cursor: "pointer",
                            position: "relative",
                            transition: isDragging ? undefined : "background 0.08s"
                          }}
                        >
                          {booked && open && (
                            <span
                              style={{
                                position: "absolute",
                                top: 3,
                                right: 3,
                                width: 5,
                                height: 5,
                                borderRadius: "50%",
                                background: "#fff",
                                pointerEvents: "none"
                              }}
                            />
                          )}
                          {booked && !open && (
                            <span
                              style={{
                                position: "absolute",
                                top: 3,
                                right: 3,
                                width: 5,
                                height: 5,
                                borderRadius: "50%",
                                background: "var(--brand-300)",
                                pointerEvents: "none"
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
