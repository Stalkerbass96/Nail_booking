"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Lang } from "@/lib/lang";

type WeeklyHour = {
  weekday: number;
  isOpen: boolean;
  openTime: string | null;
  closeTime: string | null;
};

type SpecialDate = {
  id: string;
  date: string;
  isOpen: boolean;
  openTime: string | null;
  closeTime: string | null;
  note?: string | null;
};

type BookingBlock = {
  id: string;
  startAt: string;
  endAt: string;
  reason?: string | null;
};

type SchedulePayload = {
  weeklyHours: WeeklyHour[];
  specialDates: SpecialDate[];
  bookingBlocks: BookingBlock[];
};

type Props = {
  lang: Lang;
};

const TEXT = {
  zh: {
    title: "???????",
    desc: "????????????????????????????????????",
    loading: "???...",
    loadFailed: "??????",
    saveFailed: "????",
    deleteFailed: "????",
    saved: "????",
    deleted: "????",
    weeklyTitle: "??????",
    weeklyHint: "????????????????????????????????",
    saveWeekly: "??????",
    specialTitle: "?????",
    specialHint: "??????????????????????????????",
    saveSpecial: "???????",
    open: "??",
    closed: "??",
    delete: "??",
    noSpecial: "???????",
    blockTitle: "??????",
    blockHint: "???????????????????????",
    saveBlock: "??????",
    noBlocks: "??????",
    confirmDelete: "??????????",
    weeklyInvalid: "??????????????????????",
    specialClosedHint: "?????????????????",
    blockReasonPlaceholder: "?????????????",
    specialNotePlaceholder: "????????????????",
    overviewTitle: "????",
    openDays: "?????",
    specialCount: "?????",
    blockCount: "????",
    blockHours: "????",
    upcomingLabel: "???????",
    sunday: "??",
    monday: "??",
    tuesday: "??",
    wednesday: "??",
    thursday: "??",
    friday: "??",
    saturday: "??"
  },
  ja: {
    title: "?????????????",
    desc: "??????????????????????????????????????",
    loading: "?????...",
    loadFailed: "??????????????????",
    saveFailed: "?????????",
    deleteFailed: "?????????",
    saved: "??????",
    deleted: "??????",
    weeklyTitle: "??????",
    weeklyHint: "??????????????????????????????????????????????????",
    saveWeekly: "???????????",
    specialTitle: "?????",
    specialHint: "???????????????????????????????????",
    saveSpecial: "????????",
    open: "??",
    closed: "??",
    delete: "??",
    noSpecial: "???????????",
    blockTitle: "????????",
    blockHint: "??????????????????????????????",
    saveBlock: "???????",
    noBlocks: "??????????",
    confirmDelete: "????????????",
    weeklyInvalid: "???????????????????????????????",
    specialClosedHint: "??????????/?????????",
    blockReasonPlaceholder: "???????????",
    specialNotePlaceholder: "???????????????",
    overviewTitle: "??????",
    openDays: "????",
    specialCount: "?????",
    blockCount: "???????",
    blockHours: "??????",
    upcomingLabel: "?????",
    sunday: "?",
    monday: "?",
    tuesday: "?",
    wednesday: "?",
    thursday: "?",
    friday: "?",
    saturday: "?"
  }
} as const;

function toStoreIso(value: string) {
  return `${value}:00+09:00`;
}

function formatDurationHours(startAt: string, endAt: string) {
  const diff = new Date(endAt).getTime() - new Date(startAt).getTime();
  return Math.max(diff / (60 * 60 * 1000), 0);
}

export default function AdminSchedulePanel({ lang }: Props) {
  const t = TEXT[lang];
  const locale = lang === "ja" ? "ja-JP" : "zh-CN";
  const weekdayLabels = useMemo(() => [t.sunday, t.monday, t.tuesday, t.wednesday, t.thursday, t.friday, t.saturday], [t]);

  const [loading, setLoading] = useState(true);
  const [savingWeekly, setSavingWeekly] = useState(false);
  const [savingSpecial, setSavingSpecial] = useState(false);
  const [savingBlock, setSavingBlock] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [weeklyHours, setWeeklyHours] = useState<WeeklyHour[]>([]);
  const [specialDates, setSpecialDates] = useState<SpecialDate[]>([]);
  const [bookingBlocks, setBookingBlocks] = useState<BookingBlock[]>([]);
  const [specialDate, setSpecialDate] = useState("");
  const [specialIsOpen, setSpecialIsOpen] = useState(true);
  const [specialOpenTime, setSpecialOpenTime] = useState("10:00");
  const [specialCloseTime, setSpecialCloseTime] = useState("20:00");
  const [specialNote, setSpecialNote] = useState("");
  const [blockStartAt, setBlockStartAt] = useState("");
  const [blockEndAt, setBlockEndAt] = useState("");
  const [blockReason, setBlockReason] = useState("");

  const applyPayload = useCallback((payload: SchedulePayload) => {
    setWeeklyHours(payload.weeklyHours);
    setSpecialDates(payload.specialDates);
    setBookingBlocks(payload.bookingBlocks);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/schedule");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t.loadFailed);
      applyPayload(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [applyPayload, t.loadFailed]);

  useEffect(() => {
    void load();
  }, [load]);

  const overview = useMemo(() => {
    const openDays = weeklyHours.filter((item) => item.isOpen).length;
    const specialOpen = specialDates.filter((item) => item.isOpen).length;
    const futureBlockHours = bookingBlocks.reduce((acc, item) => acc + formatDurationHours(item.startAt, item.endAt), 0);
    return {
      openDays,
      specialCount: specialDates.length,
      blockCount: bookingBlocks.length,
      futureBlockHours
    };
  }, [bookingBlocks, specialDates, weeklyHours]);

  function updateWeeklyItem(index: number, next: Partial<WeeklyHour>) {
    setWeeklyHours((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, ...next } : item)));
  }

  async function saveWeekly() {
    setError("");
    setOk("");
    const invalid = weeklyHours.some((item) => item.isOpen && (!item.openTime || !item.closeTime || item.openTime >= item.closeTime));
    if (invalid) {
      setError(t.weeklyInvalid);
      return;
    }

    setSavingWeekly(true);
    try {
      const res = await fetch("/api/admin/schedule", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weeklyHours })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t.saveFailed);
      applyPayload(data);
      setOk(t.saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.saveFailed);
    } finally {
      setSavingWeekly(false);
    }
  }

  async function saveSpecialDate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setOk("");
    setSavingSpecial(true);
    try {
      const res = await fetch("/api/admin/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "specialDate",
          date: specialDate,
          isOpen: specialIsOpen,
          openTime: specialIsOpen ? specialOpenTime : null,
          closeTime: specialIsOpen ? specialCloseTime : null,
          note: specialNote
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t.saveFailed);
      applyPayload(data);
      setOk(t.saved);
      setSpecialNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.saveFailed);
    } finally {
      setSavingSpecial(false);
    }
  }

  async function saveBlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setOk("");
    setSavingBlock(true);
    try {
      const res = await fetch("/api/admin/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "block",
          startAt: toStoreIso(blockStartAt),
          endAt: toStoreIso(blockEndAt),
          reason: blockReason
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t.saveFailed);
      applyPayload(data);
      setOk(t.saved);
      setBlockReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.saveFailed);
    } finally {
      setSavingBlock(false);
    }
  }

  async function removeSpecialDate(id: string) {
    if (!window.confirm(t.confirmDelete)) return;
    setError("");
    setOk("");
    try {
      const res = await fetch(`/api/admin/schedule/special-dates/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t.deleteFailed);
      setSpecialDates((prev) => prev.filter((item) => item.id !== id));
      setOk(t.deleted);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.deleteFailed);
    }
  }

  async function removeBlock(id: string) {
    if (!window.confirm(t.confirmDelete)) return;
    setError("");
    setOk("");
    try {
      const res = await fetch(`/api/admin/schedule/blocks/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t.deleteFailed);
      setBookingBlocks((prev) => prev.filter((item) => item.id !== id));
      setOk(t.deleted);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.deleteFailed);
    }
  }

  return (
    <section className="admin-panel-shell">
      <div>
        <h2 className="admin-section-title">{t.title}</h2>
        <p className="admin-note mt-2 max-w-3xl">{t.desc}</p>
      </div>

      {loading ? <p className="ui-state-info">{t.loading}</p> : null}
      {error ? <p className="admin-danger">{error}</p> : null}
      {ok ? <p className="ui-state-success">{ok}</p> : null}

      <section className="mt-5 rounded-[1.65rem] border border-brand-100 bg-[linear-gradient(145deg,rgba(255,248,243,0.95),rgba(255,255,255,0.82))] p-4 shadow-[0_14px_34px_rgba(120,25,55,0.06)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">{t.overviewTitle}</p>
            <p className="mt-1 text-sm text-brand-700">{t.upcomingLabel}</p>
          </div>
          <button type="button" className="admin-btn-secondary" onClick={() => void load()}>{lang === "ja" ? "???" : "????"}</button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[1.25rem] border border-brand-100 bg-gradient-to-br from-rose-100 via-white to-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">{t.openDays}</p>
            <strong className="mt-3 block text-3xl font-semibold text-brand-900">{overview.openDays}</strong>
          </article>
          <article className="rounded-[1.25rem] border border-brand-100 bg-gradient-to-br from-sky-100 via-white to-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">{t.specialCount}</p>
            <strong className="mt-3 block text-3xl font-semibold text-brand-900">{overview.specialCount}</strong>
          </article>
          <article className="rounded-[1.25rem] border border-brand-100 bg-gradient-to-br from-amber-100 via-white to-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">{t.blockCount}</p>
            <strong className="mt-3 block text-3xl font-semibold text-brand-900">{overview.blockCount}</strong>
          </article>
          <article className="rounded-[1.25rem] border border-brand-100 bg-gradient-to-br from-emerald-100 via-white to-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">{t.blockHours}</p>
            <strong className="mt-3 block text-3xl font-semibold text-brand-900">{overview.futureBlockHours.toFixed(1)}</strong>
          </article>
        </div>
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <section className="admin-subsection mt-0">
          <div>
            <h3 className="font-semibold text-brand-900">{t.weeklyTitle}</h3>
            <p className="admin-note mt-1">{t.weeklyHint}</p>
          </div>

          <div className="grid gap-3">
            {weeklyHours.map((item, index) => (
              <div key={item.weekday} className="rounded-[1.2rem] border border-brand-100 bg-white p-3.5 shadow-sm">
                <div className="grid gap-3 lg:grid-cols-[0.7fr_0.8fr_0.9fr_0.9fr] lg:items-center">
                  <div>
                    <p className="font-semibold text-brand-900">{weekdayLabels[item.weekday]}</p>
                    <p className="mt-1 text-xs text-brand-600">{item.isOpen ? t.open : t.closed}</p>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-brand-800">
                    <input className="admin-check" type="checkbox" checked={item.isOpen} onChange={(event) => updateWeeklyItem(index, { isOpen: event.target.checked })} />
                    <span>{item.isOpen ? t.open : t.closed}</span>
                  </label>
                  <input className="admin-input-sm" type="time" value={item.openTime ?? ""} onChange={(event) => updateWeeklyItem(index, { openTime: event.target.value })} disabled={!item.isOpen} />
                  <input className="admin-input-sm" type="time" value={item.closeTime ?? ""} onChange={(event) => updateWeeklyItem(index, { closeTime: event.target.value })} disabled={!item.isOpen} />
                </div>
              </div>
            ))}
          </div>

          <button type="button" className="admin-btn-primary w-full sm:w-auto" onClick={() => void saveWeekly()} disabled={savingWeekly}>
            {savingWeekly ? `${t.saveWeekly}...` : t.saveWeekly}
          </button>
        </section>

        <div className="grid gap-5">
          <section className="admin-subsection mt-0">
            <div>
              <h3 className="font-semibold text-brand-900">{t.specialTitle}</h3>
              <p className="admin-note mt-1">{t.specialHint}</p>
            </div>

            <form className="grid gap-3" onSubmit={saveSpecialDate}>
              <input className="admin-input-sm" type="date" value={specialDate} onChange={(event) => setSpecialDate(event.target.value)} required />
              <label className="flex items-center gap-2 text-sm text-brand-800">
                <input className="admin-check" type="checkbox" checked={specialIsOpen} onChange={(event) => setSpecialIsOpen(event.target.checked)} />
                <span>{specialIsOpen ? t.open : t.closed}</span>
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <input className="admin-input-sm" type="time" value={specialOpenTime} onChange={(event) => setSpecialOpenTime(event.target.value)} disabled={!specialIsOpen} />
                <input className="admin-input-sm" type="time" value={specialCloseTime} onChange={(event) => setSpecialCloseTime(event.target.value)} disabled={!specialIsOpen} />
              </div>
              <textarea className="admin-input min-h-24" value={specialNote} onChange={(event) => setSpecialNote(event.target.value)} placeholder={t.specialNotePlaceholder} />
              {!specialIsOpen ? <p className="field-hint mt-0">{t.specialClosedHint}</p> : null}
              <button className="admin-btn-secondary w-full sm:w-auto" type="submit" disabled={savingSpecial}>
                {savingSpecial ? `${t.saveSpecial}...` : t.saveSpecial}
              </button>
            </form>

            <div className="grid gap-2">
              {specialDates.length === 0 ? <p className="ui-state-info mt-0">{t.noSpecial}</p> : null}
              {specialDates.map((item) => (
                <article key={item.id} className="rounded-[1.2rem] border border-brand-100 bg-white p-3.5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm text-brand-800">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-brand-900">{item.date}</p>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.isOpen ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>{item.isOpen ? t.open : t.closed}</span>
                      </div>
                      <p className="mt-1">{item.isOpen ? `${item.openTime ?? "--:--"} - ${item.closeTime ?? "--:--"}` : t.closed}</p>
                      <p>{item.note || "-"}</p>
                    </div>
                    <button type="button" className="admin-btn-ghost" onClick={() => void removeSpecialDate(item.id)}>
                      {t.delete}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="admin-subsection mt-0">
            <div>
              <h3 className="font-semibold text-brand-900">{t.blockTitle}</h3>
              <p className="admin-note mt-1">{t.blockHint}</p>
            </div>

            <form className="grid gap-3" onSubmit={saveBlock}>
              <input className="admin-input-sm" type="datetime-local" value={blockStartAt} onChange={(event) => setBlockStartAt(event.target.value)} required />
              <input className="admin-input-sm" type="datetime-local" value={blockEndAt} onChange={(event) => setBlockEndAt(event.target.value)} required />
              <textarea className="admin-input min-h-24" value={blockReason} onChange={(event) => setBlockReason(event.target.value)} placeholder={t.blockReasonPlaceholder} />
              <button className="admin-btn-secondary w-full sm:w-auto" type="submit" disabled={savingBlock}>
                {savingBlock ? `${t.saveBlock}...` : t.saveBlock}
              </button>
            </form>

            <div className="grid gap-2">
              {bookingBlocks.length === 0 ? <p className="ui-state-info mt-0">{t.noBlocks}</p> : null}
              {bookingBlocks.map((item) => (
                <article key={item.id} className="rounded-[1.2rem] border border-brand-100 bg-white p-3.5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm text-brand-800">
                      <p className="font-medium text-brand-900">{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.startAt))}</p>
                      <p>{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.endAt))}</p>
                      <p className="mt-1 text-xs text-brand-600">{formatDurationHours(item.startAt, item.endAt).toFixed(1)} h</p>
                      <p>{item.reason || "-"}</p>
                    </div>
                    <button type="button" className="admin-btn-ghost" onClick={() => void removeBlock(item.id)}>
                      {t.delete}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
