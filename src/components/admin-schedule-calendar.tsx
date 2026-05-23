"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Lang } from "@/lib/lang";

// ── constants ────────────────────────────────────────────────────────────────

const SLOTS_PER_DAY = 48;
const CELL_H = 22;       // px per cell
const LABEL_W = 52;      // px for time label column
const JST_OFFSET_MS = 9 * 60 * 60_000;

// Hardcoded colors (brand palette is warm taupe, not rose/green)
const COLOR_CLOSED   = "transparent";
const COLOR_OPEN     = "#ef4444";   // red-500: open for business
const COLOR_BOOKED   = "#22c55e";   // green-500: has appointment
const COLOR_DRAG_OPEN  = "#fca5a5"; // red-200: preview while dragging open
const COLOR_DRAG_CLOSE = "#f3f4f6"; // gray-100: preview while dragging close
const COLOR_BORDER   = "#e5e7eb";   // gray-200

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
  const dow = new Date(`${ymd}T12:00:00+09:00`).getUTCDay();
  return addDays(ymd, dow === 0 ? -6 : 1 - dow);
}

function slotLabel(slot: number): string {
  const totalMin = slot * 30;
  return `${String(Math.floor(totalMin / 60)).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")}`;
}

function formatDateHeader(ymd: string, lang: Lang): string {
  const [, m, d] = ymd.split("-").map(Number);
  const dow = new Date(`${ymd}T12:00:00+09:00`).getUTCDay();
  const names = lang === "ja"
    ? ["日", "月", "火", "水", "木", "金", "土"]
    : ["日", "一", "二", "三", "四", "五", "六"];
  return `${m}/${d}(${names[dow]})`;
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

type BookedSlot = {
  slot: number;
  appointmentId: string;
  bookingNo: string;
  customerName: string;
  packageNameZh: string;
  packageNameJa: string;
};

type DayData = {
  date: string;
  slots: number[];
  bookedSlots: BookedSlot[];
};

type DragState = {
  date: string;
  startSlot: number;
  endSlot: number;
  isOpening: boolean;
};

type Props = { lang: Lang };

// ── i18n ─────────────────────────────────────────────────────────────────────

const TEXT = {
  zh: {
    title: "排班日历",
    desc: "拖拽格子设置每天的开放预约时段。红色=开放，绿色=已有预约（点击查看详情）。修改后自动保存。",
    prev: "← 上周",
    next: "下周 →",
    today: "本周",
    saving: "保存中…",
    saved: "已保存",
    saveFailed: "保存失败，请重试",
    loading: "加载中…",
    loadFailed: "加载失败，请刷新",
    legendOpen: "开放预约",
    legendClosed: "未开放",
    legendBooked: "已有预约"
  },
  ja: {
    title: "スケジュールカレンダー",
    desc: "セルをドラッグして予約受付時間を設定します。赤=受付中、緑=予約あり（クリックで詳細）。自動保存されます。",
    prev: "← 前週",
    next: "次週 →",
    today: "今週",
    saving: "保存中…",
    saved: "保存しました",
    saveFailed: "保存に失敗しました",
    loading: "読み込み中…",
    loadFailed: "読み込みに失敗しました",
    legendOpen: "受付中",
    legendClosed: "受付不可",
    legendBooked: "予約あり"
  }
} as const;

// ── component ─────────────────────────────────────────────────────────────────

export default function AdminScheduleCalendar({ lang }: Props) {
  const t = TEXT[lang];
  const router = useRouter();

  const [weekStart, setWeekStart] = useState(() => weekMonday(todayJst()));
  const [weekData, setWeekData] = useState<DayData[]>([]);
  const [localSlots, setLocalSlots] = useState<Record<string, Set<number>>>({});
  const [loading, setLoading] = useState(true);
  const [savingDates, setSavingDates] = useState<Set<string>>(new Set());
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [saveError, setSaveError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [drag, setDrag] = useState<DragState | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const didInitialScroll = useRef(false);
  const gridRef = useRef<HTMLDivElement>(null);

  // ── load ──────────────────────────────────────────────────────────────────

  const loadWeek = useCallback(async (monday: string) => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch(`/api/admin/schedule/week?from=${monday}`);
      const data = await res.json() as { days: DayData[] };
      if (!res.ok) throw new Error();
      setWeekData(data.days);
      const init: Record<string, Set<number>> = {};
      for (const day of data.days) init[day.date] = new Set(day.slots);
      setLocalSlots(init);
    } catch {
      setLoadError(t.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [t.loadFailed]);

  useEffect(() => { void loadWeek(weekStart); }, [weekStart, loadWeek]);

  // Scroll to 08:00 on first load
  useEffect(() => {
    if (!didInitialScroll.current && !loading && scrollRef.current) {
      scrollRef.current.scrollTop = 16 * CELL_H;
      didInitialScroll.current = true;
    }
  }, [loading]);

  // ── save ──────────────────────────────────────────────────────────────────

  const saveDay = useCallback(async (date: string, slots: Set<number>) => {
    setSavingDates((prev) => new Set([...prev, date]));
    setLastSaved(null);
    setSaveError("");
    try {
      const res = await fetch("/api/admin/schedule/week", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, slots: [...slots] })
      });
      if (!res.ok) throw new Error();
      setLastSaved(date);
    } catch {
      setSaveError(t.saveFailed);
    } finally {
      setSavingDates((prev) => { const n = new Set(prev); n.delete(date); return n; });
    }
  }, [t.saveFailed]);

  // ── drag ──────────────────────────────────────────────────────────────────

  function getBookedSlot(date: string, slot: number): BookedSlot | undefined {
    return weekData.find((d) => d.date === date)?.bookedSlots.find((b) => b.slot === slot);
  }

  function getCellFromPoint(clientX: number, clientY: number): { date: string; slot: number } | null {
    const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    const cell = el?.closest("[data-date][data-slot]") as HTMLElement | null;
    if (!cell) return null;
    const date = cell.dataset.date;
    const slot = Number(cell.dataset.slot);
    return date ? { date, slot } : null;
  }

  function handlePointerDown(e: React.PointerEvent, date: string, slot: number) {
    // Don't start drag on booked cells — handled on pointerUp as click
    e.preventDefault();
    const currentlyOpen = localSlots[date]?.has(slot) ?? false;
    setDrag({ date, startSlot: slot, endSlot: slot, isOpening: !currentlyOpen });
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!drag) return;
    const hit = getCellFromPoint(e.clientX, e.clientY);
    if (hit && hit.date === drag.date && hit.slot !== drag.endSlot) {
      setDrag((prev) => prev ? { ...prev, endSlot: hit.slot } : null);
    }
  }

  function commitDrag() {
    if (!drag) return;
    const { date, startSlot, endSlot, isOpening } = drag;
    const lo = Math.min(startSlot, endSlot);
    const hi = Math.max(startSlot, endSlot);
    const isSingleClick = startSlot === endSlot;

    // Single click on a booked slot → navigate to appointments
    if (isSingleClick && getBookedSlot(date, startSlot)) {
      const booked = getBookedSlot(date, startSlot)!;
      setDrag(null);
      router.push(`/admin/appointments?bookingNo=${booked.bookingNo}`);
      return;
    }

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

  // ── visual state per cell ─────────────────────────────────────────────────

  function getCellColor(date: string, slot: number): string {
    // Drag preview overrides everything (except booked cells)
    if (drag?.date === date) {
      const lo = Math.min(drag.startSlot, drag.endSlot);
      const hi = Math.max(drag.startSlot, drag.endSlot);
      if (slot >= lo && slot <= hi) {
        // Don't override booked cells with drag color
        if (!getBookedSlot(date, slot)) {
          return drag.isOpening ? COLOR_DRAG_OPEN : COLOR_DRAG_CLOSE;
        }
      }
    }

    const isBooked = !!getBookedSlot(date, slot);
    if (isBooked) return COLOR_BOOKED;

    const isOpen = localSlots[date]?.has(slot) ?? false;
    if (isOpen) return COLOR_OPEN;

    return COLOR_CLOSED;
  }

  function getCellCursor(date: string, slot: number): string {
    return getBookedSlot(date, slot) ? "pointer" : "crosshair";
  }

  // ── navigation ────────────────────────────────────────────────────────────

  function goToThisWeek() {
    didInitialScroll.current = false;
    setWeekStart(weekMonday(todayJst()));
  }
  function goPrev() { setWeekStart((w) => addDays(w, -7)); }
  function goNext() { setWeekStart((w) => addDays(w, 7)); }

  const dates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = todayJst();

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <section className="admin-panel-shell">
      <div>
        <h2 className="admin-section-title">{t.title}</h2>
        <p className="admin-note mt-2 max-w-3xl">{t.desc}</p>
      </div>

      {/* Legend + status */}
      <div className="flex flex-wrap items-center gap-5 text-xs" style={{ color: "#6b7280" }}>
        <span className="flex items-center gap-1.5">
          <span style={{ display: "inline-block", width: 14, height: 14, borderRadius: 3, background: COLOR_OPEN }} />
          {t.legendOpen}
        </span>
        <span className="flex items-center gap-1.5">
          <span style={{ display: "inline-block", width: 14, height: 14, borderRadius: 3, background: "#e5e7eb", border: "1px solid #d1d5db" }} />
          {t.legendClosed}
        </span>
        <span className="flex items-center gap-1.5">
          <span style={{ display: "inline-block", width: 14, height: 14, borderRadius: 3, background: COLOR_BOOKED }} />
          {t.legendBooked}
        </span>
        {savingDates.size > 0 && (
          <span style={{ color: "#6a5a52", fontWeight: 600 }}>{t.saving}</span>
        )}
        {savingDates.size === 0 && lastSaved && (
          <span style={{ color: "#16a34a", fontWeight: 600 }}>{t.saved}</span>
        )}
        {saveError && <span style={{ color: "#dc2626" }}>{saveError}</span>}
        {loadError && <span style={{ color: "#dc2626" }}>{loadError}</span>}
      </div>

      {/* Week navigation */}
      <div className="flex items-center gap-3">
        <button type="button" className="admin-btn-secondary" onClick={goPrev}>{t.prev}</button>
        <span className="flex-1 text-center text-sm font-semibold" style={{ color: "#1e1612" }}>
          {weekRangeLabel(weekStart, lang)}
        </span>
        <button type="button" className="admin-btn-secondary" onClick={goToThisWeek}>{t.today}</button>
        <button type="button" className="admin-btn-secondary" onClick={goNext}>{t.next}</button>
      </div>

      {loading && <p className="ui-state-info">{t.loading}</p>}

      {!loading && (
        <div
          style={{
            overflowX: "auto",
            borderRadius: "1rem",
            border: `1px solid ${COLOR_BORDER}`,
            background: "#fff"
          }}
        >
          {/* Day headers — sticky top */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `${LABEL_W}px repeat(7, 1fr)`,
              minWidth: 560,
              borderBottom: `2px solid ${COLOR_BORDER}`,
              position: "sticky",
              top: 0,
              zIndex: 10,
              background: "#fff"
            }}
          >
            <div style={{ height: 42 }} />
            {dates.map((date) => {
              const isToday = date === today;
              return (
                <div
                  key={date}
                  style={{
                    height: 42,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    color: isToday ? "#ef4444" : "#374151",
                    borderLeft: `1px solid ${COLOR_BORDER}`,
                    background: isToday ? "#fef2f2" : undefined
                  }}
                >
                  {formatDateHeader(date, lang)}
                </div>
              );
            })}
          </div>

          {/* Scrollable grid */}
          <div
            ref={scrollRef}
            style={{ maxHeight: 560, overflowY: "auto", minWidth: 560 }}
            onPointerMove={handlePointerMove}
            onPointerUp={commitDrag}
            onPointerLeave={commitDrag}
          >
            <div
              ref={gridRef}
              style={{
                display: "grid",
                gridTemplateColumns: `${LABEL_W}px repeat(7, 1fr)`,
                userSelect: "none"
              }}
            >
              {Array.from({ length: SLOTS_PER_DAY }, (_, slot) => (
                <>
                  {/* Time label — touch here scrolls vertically */}
                  <div
                    key={`lbl-${slot}`}
                    style={{
                      height: CELL_H,
                      display: "flex",
                      alignItems: "center",
                      paddingLeft: 8,
                      fontSize: 10,
                      color: "#9ca3af",
                      borderBottom: `1px solid ${COLOR_BORDER}`,
                      background: "#fafafa",
                      flexShrink: 0,
                      touchAction: "pan-y"
                    }}
                  >
                    {slot % 2 === 0 ? slotLabel(slot) : ""}
                  </div>

                  {/* Day cells — touch-action:none so pointer events fire for drag */}
                  {dates.map((date) => {
                    const bg = getCellColor(date, slot);
                    const cursor = getCellCursor(date, slot);
                    const booked = getBookedSlot(date, slot);
                    const isToday = date === today;

                    return (
                      <div
                        key={`${date}-${slot}`}
                        data-date={date}
                        data-slot={slot}
                        title={booked
                          ? `${booked.customerName} / ${lang === "ja" ? booked.packageNameJa : booked.packageNameZh}`
                          : undefined}
                        onPointerDown={(e) => handlePointerDown(e, date, slot)}
                        style={{
                          height: CELL_H,
                          borderLeft: `1px solid ${COLOR_BORDER}`,
                          borderBottom: slot % 2 === 1
                            ? "1px solid #d1d5db"
                            : `1px solid ${COLOR_BORDER}`,
                          background: bg === COLOR_CLOSED && isToday ? "#fffbfb" : bg,
                          cursor,
                          touchAction: "none"
                        }}
                      />
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
