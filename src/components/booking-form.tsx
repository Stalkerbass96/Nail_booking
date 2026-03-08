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
    sectionTitle: "\u56fe\u5899\u9884\u7ea6",
    category: "\u98ce\u683c\u5206\u7c7b",
    package: "\u5bf9\u5e94\u5957\u9910",
    date: "\u9884\u7ea6\u65e5\u671f",
    slots: "\u53ef\u9009\u65f6\u95f4",
    note: "\u5907\u6ce8\u9700\u6c42",
    submit: "\u63d0\u4ea4\u9884\u7ea6",
    loadingSlots: "\u6b63\u5728\u8ba1\u7b97\u53ef\u7528\u65f6\u95f4...",
    noSlots: "\u5f53\u5929\u6682\u65e0\u53ef\u9884\u7ea6\u65f6\u95f4\uff0c\u8bf7\u5207\u6362\u65e5\u671f\u3002",
    selectSlot: "\u8bf7\u9009\u62e9\u4e00\u4e2a\u65f6\u95f4\u6bb5",
    success: "\u9884\u7ea6\u63d0\u4ea4\u6210\u529f\uff0c\u6b63\u5728\u8df3\u8f6c...",
    fetchError: "\u83b7\u53d6\u53ef\u7528\u65f6\u95f4\u5931\u8d25",
    submitError: "\u9884\u7ea6\u63d0\u4ea4\u5931\u8d25",
    required: "\u8bf7\u5148\u4ece LINE \u94fe\u63a5\u8fdb\u5165\uff0c\u5e76\u9009\u62e9\u65f6\u95f4",
    notePlaceholder: "\u4f8b\u5982\uff1a\u5e0c\u671b\u504f\u88f8\u7c89\u3001\u907f\u514d\u592a\u95ea\uff0c\u6216\u6709\u5230\u5e97\u65f6\u95f4\u8981\u6c42",
    selectedSlot: "\u5df2\u9009\u65f6\u95f4",
    unselectedSlot: "\u5c1a\u672a\u9009\u62e9",
    totalPrice: "\u4ef7\u683c",
    totalDuration: "\u65f6\u957f",
    lineHint: "\u5f53\u524d\u9884\u7ea6\u4f1a\u7ed1\u5b9a\u5230\u4f60\u7684 LINE \u987e\u5ba2\u8eab\u4efd\uff0c\u63d0\u4ea4\u540e\u4f1a\u901a\u8fc7 LINE \u56de\u6d88\u606f\u3002",
    lineMissing: "\u5f53\u524d\u9875\u9762\u6ca1\u6709 LINE \u8eab\u4efd\u51ed\u8bc1\uff0c\u8bf7\u4ece LINE \u6d88\u606f\u4e2d\u7684\u94fe\u63a5\u91cd\u65b0\u6253\u5f00\u3002",
    customer: "\u5f53\u524d\u987e\u5ba2"
  },
  ja: {
    sectionTitle: "\u30ae\u30e3\u30e9\u30ea\u30fc\u4e88\u7d04",
    category: "\u30ab\u30c6\u30b4\u30ea",
    package: "\u9023\u643a\u30e1\u30cb\u30e5\u30fc",
    date: "\u4e88\u7d04\u65e5",
    slots: "\u9078\u629e\u53ef\u80fd\u306a\u6642\u9593",
    note: "\u3054\u8981\u671b\u30e1\u30e2",
    submit: "\u4e88\u7d04\u3092\u9001\u4fe1",
    loadingSlots: "\u7a7a\u304d\u6642\u9593\u3092\u8a08\u7b97\u3057\u3066\u3044\u307e\u3059...",
    noSlots: "\u3053\u306e\u65e5\u306f\u4e88\u7d04\u53ef\u80fd\u306a\u6642\u9593\u304c\u3042\u308a\u307e\u305b\u3093\u3002\u65e5\u4ed8\u3092\u5909\u66f4\u3057\u3066\u304f\u3060\u3055\u3044\u3002",
    selectSlot: "\u6642\u9593\u3092\u9078\u629e\u3057\u3066\u304f\u3060\u3055\u3044",
    success: "\u4e88\u7d04\u3092\u9001\u4fe1\u3057\u307e\u3057\u305f\u3002\u753b\u9762\u3092\u5207\u308a\u66ff\u3048\u3066\u3044\u307e\u3059...",
    fetchError: "\u7a7a\u304d\u6642\u9593\u306e\u53d6\u5f97\u306b\u5931\u6557\u3057\u307e\u3057\u305f",
    submitError: "\u4e88\u7d04\u9001\u4fe1\u306b\u5931\u6557\u3057\u307e\u3057\u305f",
    required: "LINE \u306e\u30ea\u30f3\u30af\u304b\u3089\u958b\u304d\u3001\u6642\u9593\u3092\u9078\u629e\u3057\u3066\u304f\u3060\u3055\u3044",
    notePlaceholder: "\u4f8b\uff1a\u30cc\u30fc\u30c9\u30d4\u30f3\u30af\u5bc4\u308a\u3001\u5f37\u3044\u30e9\u30e1\u306f\u907f\u3051\u305f\u3044\u3001\u6765\u5e97\u6642\u9593\u306e\u5e0c\u671b\u304c\u3042\u308b \u306a\u3069",
    selectedSlot: "\u9078\u629e\u4e2d\u306e\u6642\u9593",
    unselectedSlot: "\u672a\u9078\u629e",
    totalPrice: "\u4fa1\u683c",
    totalDuration: "\u6240\u8981\u6642\u9593",
    lineHint: "\u3053\u306e\u4e88\u7d04\u306f\u3042\u306a\u305f\u306e LINE \u9867\u5ba2\u60c5\u5831\u306b\u7d10\u3065\u304d\u3001\u9001\u4fe1\u5f8c\u306f LINE \u306b\u901a\u77e5\u304c\u5c4a\u304d\u307e\u3059\u3002",
    lineMissing: "\u3053\u306e\u30da\u30fc\u30b8\u306b\u306f LINE \u306e\u672c\u4eba\u30c8\u30fc\u30af\u30f3\u304c\u3042\u308a\u307e\u305b\u3093\u3002LINE \u30e1\u30c3\u30bb\u30fc\u30b8\u5185\u306e\u30ea\u30f3\u30af\u304b\u3089\u958b\u304d\u76f4\u3057\u3066\u304f\u3060\u3055\u3044\u3002",
    customer: "\u73fe\u5728\u306e\u9867\u5ba2"
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
  const [customerNote, setCustomerNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const t = TEXT[lang];

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
    <form className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_340px]" onSubmit={onSubmit}>
      <div className="grid gap-5">
        <section className="detail-hero-panel">
          <div className="detail-hero-media min-h-[20rem]" style={{ backgroundImage: `linear-gradient(180deg, rgba(47,29,39,0.06), rgba(47,29,39,0.26)), url(${showcaseItem.imageUrl})` }}>
            <span>{displayName(lang, showcaseItem.categoryNameZh, showcaseItem.categoryNameJa)}</span>
          </div>
          <div className="detail-hero-copy">
            <p className="section-eyebrow">Selected Design</p>
            <h2 className="section-title text-3xl sm:text-4xl">{displayName(lang, showcaseItem.titleZh, showcaseItem.titleJa)}</h2>
            <p className="section-copy">{displayName(lang, showcaseItem.descriptionZh || "", showcaseItem.descriptionJa || "") || displayName(lang, showcaseItem.packageDescriptionZh || "", showcaseItem.packageDescriptionJa || "") || "-"}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="metric-pill">{showcaseItem.priceJpy} JPY {pickText(lang, "\u8d77", "\u301c")}</span>
              <span className="metric-pill metric-pill-soft">{showcaseItem.durationMin} min</span>
            </div>
            <p className="mt-4 text-sm text-brand-700">{t.package}: {displayName(lang, showcaseItem.packageNameZh, showcaseItem.packageNameJa)}</p>
            <p className="mt-2 text-sm text-brand-700">{t.customer}: {customerName || "-"}</p>
          </div>
        </section>

        <section className="section-panel">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-brand-900">{t.sectionTitle}</h2>
            <div className="flex flex-wrap gap-2">
              <span className="metric-pill">{t.totalPrice}: {showcaseItem.priceJpy} JPY</span>
              <span className="metric-pill metric-pill-soft">{t.totalDuration}: {showcaseItem.durationMin} min</span>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2" htmlFor="booking-date">
              <span className="text-sm font-medium text-brand-800">{t.date}</span>
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
            <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4 text-sm text-brand-800">
              <p className="font-medium text-brand-900">{entryToken ? t.lineHint : t.lineMissing}</p>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-brand-800">{t.slots}</p>
              {selectedStartAt ? <span className="metric-pill metric-pill-soft">{t.selectedSlot}: {formatSlotLabel(lang, selectedStartAt)}</span> : null}
            </div>
            {slotLoading ? <p className="ui-state-info" aria-live="polite">{t.loadingSlots}</p> : null}
            {!slotLoading && date && slots.length === 0 ? <p className="ui-state-info" aria-live="polite">{t.noSlots}</p> : null}
            <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
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
          </div>

          <label className="mt-5 grid gap-2" htmlFor="booking-customer-note">
            <span className="text-sm font-medium text-brand-800">{t.note}</span>
            <textarea
              id="booking-customer-note"
              className="ui-input min-h-24"
              value={customerNote}
              onChange={(event) => setCustomerNote(event.target.value)}
              placeholder={t.notePlaceholder}
            />
          </label>

          {error ? <p className="ui-state-error" aria-live="assertive">{error}</p> : null}
          {message ? <p className="ui-state-success" aria-live="polite">{message}</p> : null}

          <button disabled={submitting || !entryToken} className="ui-btn-primary mt-5 w-full sm:w-auto" type="submit">
            {submitting ? "..." : t.submit}
          </button>
        </section>
      </div>

      <aside className="booking-summary-card lg:sticky lg:top-24">
        <p className="section-eyebrow">Summary</p>
        <h3 className="text-lg font-semibold text-brand-900">{displayName(lang, showcaseItem.titleZh, showcaseItem.titleJa)}</h3>

        <dl className="mt-4 grid gap-3 text-sm text-brand-800">
          <div className="summary-row">
            <dt>{t.category}</dt>
            <dd>{displayName(lang, showcaseItem.categoryNameZh, showcaseItem.categoryNameJa)}</dd>
          </div>
          <div className="summary-row">
            <dt>{t.package}</dt>
            <dd>{displayName(lang, showcaseItem.packageNameZh, showcaseItem.packageNameJa)}</dd>
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
            <dd>{selectedStartAt ? formatSlotLabel(lang, selectedStartAt) : t.unselectedSlot}</dd>
          </div>
        </dl>
      </aside>
    </form>
  );
}
