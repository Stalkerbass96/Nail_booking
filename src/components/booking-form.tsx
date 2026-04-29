"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Lang } from "@/lib/lang";
import { pickText } from "@/lib/lang";

type ShowcaseItem = {
  id: string;
  titleZh: string;
  titleJa: string;
  descriptionZh?: string | null;
  descriptionJa?: string | null;
  imageUrl: string;
  categoryNameZh: string;
  categoryNameJa: string;
  packageNameZh: string;
  packageNameJa: string;
  packageDescriptionZh?: string | null;
  packageDescriptionJa?: string | null;
  priceJpy: number;
  durationMin: number;
};

type Slot = {
  startAt: string;
  endAt: string;
};

type Props = {
  lang: Lang;
  showcaseItem: ShowcaseItem;
  entryToken?: string;
  customerName?: string | null;
};

const TEXT = {
  zh: {
    date: "选择日期",
    slots: "选择时间",
    name: "预约姓名",
    namePlaceholder: "请输入您的姓名",
    nameRequired: "请填写预约姓名",
    note: "备注需求",
    submit: "提交预约",
    loadingSlots: "正在计算可预约时间...",
    noSlots: "当天暂无可预约时间，请切换日期。",
    selectSlot: "请选择一个时间段",
    success: "预约提交成功，正在跳转...",
    fetchError: "获取可用时间失败",
    submitError: "预约提交失败",
    required: "请从 LINE 链接进入并选择时间后再提交",
    notePlaceholder: "例如：偏裸粉、不要太闪，或到店时间有特别要求",
    selectedSlot: "已选时间",
    unselectedSlot: "未选择",
    totalPrice: "价格",
    totalDuration: "时长",
    lineHint: "提交后，确认结果会继续通过 LINE 通知你。",
    lineMissing: "当前页面缺少 LINE 身份信息，请从 LINE 消息中的链接重新打开。",
    customer: "当前顾客",
    selectedDesign: "已选款式",
    summary: "预约确认",
    submitHint: "确认时间后直接提交，店长确认后会在 LINE 中回复。",
    mobileCta: "选好时间后直接提交",
    packageLabel: "套餐",
    categoryLabel: "分类",
    backToGallery: "返回图墙"
  },
  ja: {
    date: "日付を選ぶ",
    slots: "時間を選ぶ",
    name: "お名前",
    namePlaceholder: "お名前を入力してください",
    nameRequired: "お名前を入力してください",
    note: "要望メモ",
    submit: "予約を送信",
    loadingSlots: "空き時間を確認しています...",
    noSlots: "この日は予約可能な時間がありません。日付を変更してください。",
    selectSlot: "時間を選択してください",
    success: "予約を送信しました。画面を切り替えています...",
    fetchError: "空き時間の取得に失敗しました",
    submitError: "予約送信に失敗しました",
    required: "LINE のリンクから開き、時間を選択してから送信してください",
    notePlaceholder: "例：ヌードピンク寄り、ラメ控えめ、来店時間の希望あり など",
    selectedSlot: "選択中の時間",
    unselectedSlot: "未選択",
    totalPrice: "価格",
    totalDuration: "所要時間",
    lineHint: "送信後の確認結果は LINE に届きます。",
    lineMissing: "LINE の本人情報がないため、このページは LINE メッセージ内リンクから開き直してください。",
    customer: "現在の顧客",
    selectedDesign: "選択中のデザイン",
    summary: "予約確認",
    submitHint: "時間を選んで送信すると、確認結果を LINE で返信します。",
    mobileCta: "時間を選んでそのまま送信",
    packageLabel: "メニュー",
    categoryLabel: "カテゴリ",
    backToGallery: "ギャラリーに戻る"
  }
} as const;

function displayName(lang: Lang, zh: string, ja: string): string {
  return lang === "ja" ? ja : zh;
}

function formatSlotLabel(lang: Lang, startAt: string): string {
  return new Intl.DateTimeFormat(lang === "ja" ? "ja-JP" : "zh-CN", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(startAt));
}

export default function BookingForm({ lang, showcaseItem, entryToken, customerName }: Props) {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotLoading, setSlotLoading] = useState(false);
  const [selectedStartAt, setSelectedStartAt] = useState("");
  const [bookingName, setBookingName] = useState(customerName ?? "");
  const [customerNote, setCustomerNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const t = TEXT[lang];
  const packageName = displayName(lang, showcaseItem.packageNameZh, showcaseItem.packageNameJa);
  const categoryName = displayName(lang, showcaseItem.categoryNameZh, showcaseItem.categoryNameJa);
  const selectedSlotLabel = selectedStartAt ? formatSlotLabel(lang, selectedStartAt) : t.unselectedSlot;
  const slotCountLabel = date ? `${t.slots}: ${slots.length}` : t.selectSlot;
  const todayYmd = useMemo(() => {
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    return today.toISOString().slice(0, 10);
  }, []);

  async function refreshAvailability(nextDate: string) {
    if (!nextDate) {
      setSlots([]);
      setSelectedStartAt("");
      return;
    }

    setSlotLoading(true);
    setError("");

    const qs = new URLSearchParams({
      date: nextDate,
      showcaseItemId: showcaseItem.id
    });

    try {
      const res = await fetch(`/api/public/availability?${qs.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || t.fetchError);
      }

      setSlots(data.slots ?? []);
      setSelectedStartAt("");
    } catch (err) {
      setSlots([]);
      setSelectedStartAt("");
      setError(err instanceof Error ? err.message : t.fetchError);
    } finally {
      setSlotLoading(false);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!entryToken || !selectedStartAt) {
      setError(t.required);
      return;
    }

    if (!bookingName.trim()) {
      setError(t.nameRequired);
      return;
    }

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/public/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entry: entryToken,
          showcaseItemId: showcaseItem.id,
          startAt: selectedStartAt,
          name: bookingName.trim(),
          customerNote,
          lang
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || t.submitError);
      }

      setMessage(t.success);
      const params = new URLSearchParams({ lang });
      if (entryToken) params.set("entry", entryToken);
      router.push(`/booking/success/${data.bookingNo}?${params.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.submitError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="booking-flow-shell" onSubmit={onSubmit}>
      <section className="booking-design-strip">
        <div className="booking-design-media" style={{ backgroundImage: `linear-gradient(180deg, rgba(47,29,39,0.05), rgba(47,29,39,0.18)), url(${showcaseItem.imageUrl})` }} />
        <div className="booking-design-meta">
          <div className="booking-design-heading">
            <div className="min-w-0">
              <p className="booking-design-package">{packageName}</p>
              <p className="booking-design-meta-copy">{categoryName} · {showcaseItem.durationMin} min</p>
            </div>
            <span className="metric-pill shrink-0">¥{Number(showcaseItem.priceJpy).toLocaleString()}</span>
          </div>
          <p className="booking-design-customer">{customerName || t.customer}</p>
        </div>
      </section>


      <section className="section-panel section-panel-compact booking-step-panel">
        <div className="booking-step-header">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>{t.date}</h2>
            {entryToken && (
              <p className="booking-helper-copy">{t.lineHint}</p>
            )}
          </div>
        </div>

        {!entryToken && (
          <p className="ui-state-error mt-3">{t.lineMissing}</p>
        )}

        <div className="mt-4">
          <label className="grid min-w-0 gap-2" htmlFor="booking-date">
            <span className="text-sm font-medium" style={{ color: "var(--text-2)" }}>{t.date}</span>
            <input
              id="booking-date"
              className="ui-input"
              type="date"
              min={todayYmd}
              value={date}
              onChange={(event) => {
                const nextDate = event.target.value;
                setDate(nextDate);
                void refreshAvailability(nextDate);
              }}
            />
          </label>
        </div>
      </section>

      <section className="section-panel section-panel-compact booking-step-panel">
        <div className="booking-step-header">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>{t.slots}</h2>
            <p className="booking-helper-copy">{slotCountLabel}</p>
          </div>
          <span className="metric-pill metric-pill-soft">
            {selectedStartAt ? `${t.selectedSlot}: ${selectedSlotLabel}` : t.unselectedSlot}
          </span>
        </div>

        {slotLoading ? <p className="ui-state-info" aria-live="polite">{t.loadingSlots}</p> : null}
        {!slotLoading && date && slots.length === 0 ? <p className="ui-state-info" aria-live="polite">{t.noSlots}</p> : null}

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {slots.map((slot) => {
            const active = selectedStartAt === slot.startAt;
            return (
              <button
                key={slot.startAt}
                type="button"
                aria-pressed={active}
                className={`slot-chip ${active ? "slot-chip-active" : ""}`}
                onClick={() => setSelectedStartAt(slot.startAt)}
              >
                {formatSlotLabel(lang, slot.startAt)}
              </button>
            );
          })}
        </div>
        {!selectedStartAt ? <p className="field-hint">{t.selectSlot}</p> : null}
      </section>

      <section className="section-panel section-panel-compact booking-step-panel">
        <div className="grid gap-4">
          <label className="grid gap-2" htmlFor="booking-name">
            <span className="text-sm font-medium" style={{ color: "var(--text-2)" }}>{t.name}</span>
            <input
              id="booking-name"
              className="ui-input"
              type="text"
              maxLength={80}
              value={bookingName}
              onChange={(event) => setBookingName(event.target.value)}
              placeholder={t.namePlaceholder}
            />
          </label>
          <label className="grid gap-2" htmlFor="booking-customer-note">
            <span className="text-sm font-medium" style={{ color: "var(--text-2)" }}>{t.note}</span>
            <textarea
            id="booking-customer-note"
            className="ui-input min-h-24"
            value={customerNote}
            onChange={(event) => setCustomerNote(event.target.value)}
            placeholder={t.notePlaceholder}
          />
          </label>
        </div>
        {error ? <p className="ui-state-error" aria-live="assertive">{error}</p> : null}
        {message ? <p className="ui-state-success" aria-live="polite">{message}</p> : null}
      </section>

      <aside className="booking-summary-card booking-summary-card-compact booking-summary-lite hidden lg:block">
        <p className="section-eyebrow">{t.summary}</p>
        <dl className="mt-3 grid gap-3 text-sm text-brand-800">
          <div className="summary-row">
            <dt>{t.packageLabel}</dt>
            <dd>{packageName}</dd>
          </div>
          <div className="summary-row">
            <dt>{t.totalPrice}</dt>
            <dd>{showcaseItem.priceJpy} JPY</dd>
          </div>
          <div className="summary-row">
            <dt>{t.totalDuration}</dt>
            <dd>{showcaseItem.durationMin} min</dd>
          </div>
          <div className="summary-row">
            <dt>{t.selectedSlot}</dt>
            <dd>{selectedSlotLabel}</dd>
          </div>
        </dl>
        <p className="field-hint mt-4">{t.submitHint}</p>
        <div className="booking-summary-actions">
          <button disabled={submitting || !entryToken} className="ui-btn-primary w-full" type="submit">
            {submitting ? "..." : t.submit}
          </button>
          <button className="ui-btn-secondary w-full" type="button" onClick={() => router.back()}>
            {t.backToGallery}
          </button>
        </div>
      </aside>

      <div className="booking-submit-bar lg:hidden">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-brand-900">{packageName}</p>
          <p className="text-xs text-brand-700">{selectedSlotLabel}</p>
        </div>
        <button disabled={submitting || !entryToken} className="ui-btn-primary shrink-0" type="submit">
          {submitting ? "..." : t.submit}
        </button>
      </div>
    </form>
  );
}
