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
    title: "营业排班与封锁",
    desc: "定义每周营业时间、单日特殊营业安排，并手动封锁不可预约的时间段。",
    loading: "加载中...",
    loadFailed: "加载排班失败",
    saveFailed: "保存失败",
    deleteFailed: "删除失败",
    saved: "保存成功",
    deleted: "删除成功",
    weeklyTitle: "每周营业时间",
    weeklyHint: "这是默认营业时间。前台可预约时段会以这里为基础，再叠加特殊营业日和封锁区间。",
    saveWeekly: "保存每周排班",
    specialTitle: "特殊营业日",
    specialHint: "用于临时调整某一天是否营业，以及当天的营业时间。",
    saveSpecial: "保存特殊营业日",
    open: "营业",
    closed: "休息",
    delete: "删除",
    noSpecial: "还没有特殊营业日设置。",
    blockTitle: "预约封锁区间",
    blockHint: "用于手动封锁某段时间，前台不会展示这些可预约时段，已存在预约也不会被自动删除。",
    saveBlock: "新增封锁区间",
    noBlocks: "当前没有封锁区间。",
    confirmDelete: "确定要删除这条记录吗？",
    weeklyInvalid: "请检查营业时间。营业中的日期必须填写开始和结束时间，且开始时间要早于结束时间。",
    specialClosedHint: "关闭营业时，这一天将不再开放任何预约时段。",
    blockReasonPlaceholder: "填写封锁原因，例如休息、外出、培训",
    specialNotePlaceholder: "填写特殊安排说明，例如节假日、临时缩短营业时间",
    overviewTitle: "概览",
    openDays: "每周营业天数",
    specialCount: "特殊营业日数",
    blockCount: "封锁区间数",
    blockHours: "封锁总小时",
    upcomingLabel: "快速查看未来一段时间的排班结构。",
    refresh: "刷新",
    sunday: "周日",
    monday: "周一",
    tuesday: "周二",
    wednesday: "周三",
    thursday: "周四",
    friday: "周五",
    saturday: "周六"
  },
  ja: {
    title: "営業スケジュールとブロック",
    desc: "週間営業時間、特別営業日、予約不可時間帯を管理し、公開予約枠を正しく制御します。",
    loading: "読み込み中...",
    loadFailed: "スケジュールの取得に失敗しました",
    saveFailed: "保存に失敗しました",
    deleteFailed: "削除に失敗しました",
    saved: "保存しました",
    deleted: "削除しました",
    weeklyTitle: "週間営業時間",
    weeklyHint: "通常の営業時間です。公開予約枠はここを基準に、特別営業日とブロック枠を重ねて計算されます。",
    saveWeekly: "週間設定を保存",
    specialTitle: "特別営業日",
    specialHint: "特定日の営業有無や営業時間を一時的に上書きするために使います。",
    saveSpecial: "特別営業日を保存",
    open: "営業",
    closed: "休業",
    delete: "削除",
    noSpecial: "特別営業日の登録はありません。",
    blockTitle: "予約ブロック枠",
    blockHint: "この時間帯は予約不可になります。既存予約は自動削除されません。",
    saveBlock: "ブロックを追加",
    noBlocks: "ブロック枠はありません。",
    confirmDelete: "この記録を削除しますか。",
    weeklyInvalid: "営業時間を確認してください。営業日に設定する場合、開始時刻と終了時刻が必要で、開始は終了より前である必要があります。",
    specialClosedHint: "休業にすると、その日は予約枠を一切公開しません。",
    blockReasonPlaceholder: "休憩、外出、研修などの理由を入力",
    specialNotePlaceholder: "祝日や時短営業などの補足を入力",
    overviewTitle: "概要",
    openDays: "週間営業日数",
    specialCount: "特別営業日数",
    blockCount: "ブロック件数",
    blockHours: "ブロック時間",
    upcomingLabel: "今後の営業構成をすばやく確認できます。",
    refresh: "再読込",
    sunday: "日",
    monday: "月",
    tuesday: "火",
    wednesday: "水",
    thursday: "木",
    friday: "金",
    saturday: "土"
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
          <button type="button" className="admin-btn-secondary" onClick={() => void load()}>{t.refresh}</button>
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
