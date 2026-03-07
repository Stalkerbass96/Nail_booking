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
    desc: "这里控制每周工作时间、某一天的特殊营业时段，以及店长手动封锁的预约区间。",
    loading: "加载中...",
    loadFailed: "加载排班失败",
    saveFailed: "保存失败",
    deleteFailed: "删除失败",
    saved: "保存成功",
    deleted: "删除成功",
    weeklyTitle: "每周营业时间",
    weeklyHint: "关闭的日期不会开放预约；开启的日期会按这里的时间生成可预约时段。",
    saveWeekly: "保存每周排班",
    specialTitle: "特殊营业日",
    specialHint: "可覆盖某一天的营业状态和营业时间，例如节假日、临时延长营业。",
    saveSpecial: "保存特殊营业日",
    open: "营业",
    closed: "休息",
    delete: "删除",
    noSpecial: "暂无特殊营业日",
    blockTitle: "封锁预约区间",
    blockHint: "封锁后，顾客在这些时间段内将看不到可预约时段。",
    saveBlock: "新增封锁区间",
    noBlocks: "暂无封锁记录",
    confirmDelete: "确认删除这条记录吗？",
    weeklyInvalid: "营业时间必须填写完整，且结束时间晚于开始时间",
    specialClosedHint: "设为休息后，无需填写开始和结束时间",
    blockReasonPlaceholder: "例如：外出、补货、私人安排",
    specialNotePlaceholder: "例如：节假日、临时营业、提前打烊",
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
    desc: "毎週の営業時間、特定日の特別営業、店長が手動で塞ぐ予約枠をここで管理します。",
    loading: "読み込み中...",
    loadFailed: "スケジュールの読み込みに失敗しました",
    saveFailed: "保存に失敗しました",
    deleteFailed: "削除に失敗しました",
    saved: "保存しました",
    deleted: "削除しました",
    weeklyTitle: "週間営業時間",
    weeklyHint: "休業日にした曜日は予約不可になります。営業日にした曜日はここで設定した時間帯から空き枠を生成します。",
    saveWeekly: "週間スケジュールを保存",
    specialTitle: "特別営業日",
    specialHint: "祝日や臨時延長営業など、特定日の営業時間を通常設定から上書きできます。",
    saveSpecial: "特別営業日を保存",
    open: "営業",
    closed: "休業",
    delete: "削除",
    noSpecial: "特別営業日はありません",
    blockTitle: "予約枠のブロック",
    blockHint: "ブロックした時間帯は、お客様側の空き枠一覧から除外されます。",
    saveBlock: "ブロックを追加",
    noBlocks: "ブロックはありません",
    confirmDelete: "この項目を削除しますか？",
    weeklyInvalid: "営業時間を正しく入力し、終了時間を開始時間より後にしてください",
    specialClosedHint: "休業にする場合は開始/終了時間は不要です",
    blockReasonPlaceholder: "例：外出、仕入れ、私用",
    specialNotePlaceholder: "例：祝日営業、臨時延長、早締め",
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
        <p className="admin-note mt-2">{t.desc}</p>
      </div>

      {loading ? <p className="ui-state-info">{t.loading}</p> : null}
      {error ? <p className="admin-danger">{error}</p> : null}
      {ok ? <p className="ui-state-success">{ok}</p> : null}

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="admin-subsection mt-0">
          <div>
            <h3 className="font-semibold text-brand-900">{t.weeklyTitle}</h3>
            <p className="admin-note mt-1">{t.weeklyHint}</p>
          </div>

          <div className="grid gap-3">
            {weeklyHours.map((item, index) => (
              <div key={item.weekday} className="rounded-2xl border border-brand-100 bg-white p-3">
                <div className="grid gap-3 lg:grid-cols-[0.8fr_0.9fr_0.9fr_auto] lg:items-center">
                  <p className="font-medium text-brand-900">{weekdayLabels[item.weekday]}</p>
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
                <article key={item.id} className="admin-item">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm text-brand-800">
                      <p className="font-medium text-brand-900">{item.date}</p>
                      <p>{item.isOpen ? `${item.openTime ?? "--:--"} - ${item.closeTime ?? "--:--"}` : t.closed}</p>
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
                <article key={item.id} className="admin-item">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm text-brand-800">
                      <p className="font-medium text-brand-900">{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.startAt))}</p>
                      <p>{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.endAt))}</p>
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
