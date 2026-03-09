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
    package: "\u5bf9\u5e94\u5957\u9910",
    date: "\u7b2c 1 \u6b65\uff1a\u9009\u62e9\u65e5\u671f",
    slots: "\u7b2c 2 \u6b65\uff1a\u9009\u62e9\u65f6\u95f4",
    note: "\u7b2c 3 \u6b65\uff1a\u5907\u6ce8\u9700\u6c42",
    submit: "\u63d0\u4ea4\u9884\u7ea6",
    loadingSlots: "\u6b63\u5728\u8ba1\u7b97\u53ef\u7528\u65f6\u95f4...",
    noSlots: "\u5f53\u5929\u6682\u65e0\u53ef\u9884\u7ea6\u65f6\u95f4\uff0c\u8bf7\u5207\u6362\u65e5\u671f\u3002",
    selectSlot: "\u8bf7\u5148\u9009\u62e9\u4e00\u4e2a\u65f6\u95f4\u6bb5",
    success: "\u9884\u7ea6\u63d0\u4ea4\u6210\u529f\uff0c\u6b63\u5728\u8df3\u8f6c...",
    fetchError: "\u83b7\u53d6\u53ef\u7528\u65f6\u95f4\u5931\u8d25",
    submitError: "\u9884\u7ea6\u63d0\u4ea4\u5931\u8d25",
    required: "\u8bf7\u5148\u4ece LINE \u94fe\u63a5\u8fdb\u5165\uff0c\u5e76\u9009\u62e9\u65f6\u95f4",
    notePlaceholder: "\u4f8b\u5982\uff1a\u5e0c\u671b\u504f\u88f8\u7c89\u3001\u907f\u514d\u592a\u95ea\uff0c\u6216\u6709\u5230\u5e97\u65f6\u95f4\u8981\u6c42",
    selectedSlot: "\u5df2\u9009\u65f6\u95f4",
    unselectedSlot: "\u5c1a\u672a\u9009\u62e9",
    totalPrice: "\u4ef7\u683c",
    totalDuration: "\u65f6\u957f",
    lineHint: "\u8fd9\u7b14\u9884\u7ea6\u4f1a\u76f4\u63a5\u7ed1\u5b9a\u5230\u4f60\u7684 LINE \u5ba2\u6237\u8eab\u4efd\uff0c\u63d0\u4ea4\u540e\u901a\u77e5\u4e5f\u4f1a\u4ece LINE \u53d1\u51fa\u3002",
    lineMissing: "\u8fd9\u4e2a\u9875\u9762\u7f3a\u5c11 LINE \u8eab\u4efd\u51ed\u8bc1\uff0c\u8bf7\u4ece LINE \u6d88\u606f\u94fe\u63a5\u91cd\u65b0\u6253\u5f00\u3002",
    customer: "\u5f53\u524d\u987e\u5ba2",
    selectedDesign: "\u5df2\u9009\u6b3e\u5f0f",
    summary: "\u9884\u7ea6\u6458\u8981",
    submitHint: "\u786e\u8ba4\u65f6\u95f4\u540e\u63d0\u4ea4\uff0c\u5e97\u957f\u786e\u8ba4\u540e LINE \u4f1a\u901a\u77e5\u4f60\u3002",
    mobileCta: "\u786e\u8ba4\u65f6\u95f4\u540e\u76f4\u63a5\u63d0\u4ea4",
    packageLabel: "Package"
  },
  ja: {
    sectionTitle: "\u30ae\u30e3\u30e9\u30ea\u30fc\u4e88\u7d04",
    package: "\u9023\u643a\u30e1\u30cb\u30e5\u30fc",
    date: "Step 1 / \u65e5\u4ed8\u3092\u9078\u3076",
    slots: "Step 2 / \u6642\u9593\u3092\u9078\u3076",
    note: "Step 3 / \u8981\u671b\u3092\u5165\u529b",
    submit: "\u4e88\u7d04\u3092\u9001\u4fe1",
    loadingSlots: "\u7a7a\u304d\u6642\u9593\u3092\u8a08\u7b97\u3057\u3066\u3044\u307e\u3059...",
    noSlots: "\u3053\u306e\u65e5\u306f\u4e88\u7d04\u53ef\u80fd\u306a\u6642\u9593\u304c\u3042\u308a\u307e\u305b\u3093\u3002\u65e5\u4ed8\u3092\u5909\u66f4\u3057\u3066\u304f\u3060\u3055\u3044\u3002",
    selectSlot: "\u307e\u305a\u6642\u9593\u3092\u9078\u629e\u3057\u3066\u304f\u3060\u3055\u3044",
    success: "\u4e88\u7d04\u3092\u9001\u4fe1\u3057\u307e\u3057\u305f\u3002\u753b\u9762\u3092\u5207\u308a\u66ff\u3048\u3066\u3044\u307e\u3059...",
    fetchError: "\u7a7a\u304d\u6642\u9593\u306e\u53d6\u5f97\u306b\u5931\u6557\u3057\u307e\u3057\u305f",
    submitError: "\u4e88\u7d04\u9001\u4fe1\u306b\u5931\u6557\u3057\u307e\u3057\u305f",
    required: "LINE \u306e\u30ea\u30f3\u30af\u304b\u3089\u958b\u304d\u3001\u6642\u9593\u3092\u9078\u629e\u3057\u3066\u304f\u3060\u3055\u3044",
    notePlaceholder: "\u4f8b\uff1a\u30cc\u30fc\u30c9\u30d4\u30f3\u30af\u5bc4\u308a\u3001\u5f37\u3044\u30e9\u30e1\u306f\u907f\u3051\u305f\u3044\u3001\u6765\u5e97\u6642\u9593\u306e\u5e0c\u671b\u304c\u3042\u308b\u3001\u306a\u3069",
    selectedSlot: "\u9078\u629e\u4e2d\u306e\u6642\u9593",
    unselectedSlot: "\u672a\u9078\u629e",
    totalPrice: "\u4fa1\u683c",
    totalDuration: "\u6240\u8981\u6642\u9593",
    lineHint: "\u3053\u306e\u4e88\u7d04\u306f LINE \u9867\u5ba2\u60c5\u5831\u306b\u7d10\u3065\u304d\u3001\u9001\u4fe1\u5f8c\u306e\u901a\u77e5\u3082 LINE \u306b\u5c4a\u304d\u307e\u3059\u3002",
    lineMissing: "\u3053\u306e\u30da\u30fc\u30b8\u306b\u306f LINE \u306e\u672c\u4eba\u30c8\u30fc\u30af\u30f3\u304c\u3042\u308a\u307e\u305b\u3093\u3002LINE \u30e1\u30c3\u30bb\u30fc\u30b8\u5185\u306e\u30ea\u30f3\u30af\u304b\u3089\u958b\u304d\u76f4\u3057\u3066\u304f\u3060\u3055\u3044\u3002",
    customer: "\u73fe\u5728\u306e\u9867\u5ba2",
    selectedDesign: "\u9078\u629e\u4e2d\u306e\u30c7\u30b6\u30a4\u30f3",
    summary: "\u4e88\u7d04\u30b5\u30de\u30ea\u30fc",
    submitHint: "\u6642\u9593\u3092\u78ba\u5b9a\u3057\u3066\u9001\u4fe1\u3059\u308b\u3068\u3001\u5e97\u5074\u304c\u78ba\u8a8d\u5f8c\u306b LINE \u3067\u304a\u77e5\u3089\u305b\u3057\u307e\u3059\u3002",
    mobileCta: "\u6642\u9593\u3092\u78ba\u8a8d\u3057\u3066\u305d\u306e\u307e\u307e\u9001\u4fe1",
    packageLabel: "Package"
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

function resolveDescription(lang: Lang, item: ShowcaseItem) {
  const primary = displayName(lang, item.descriptionZh || "", item.descriptionJa || "").trim();
  if (primary) return primary;
  const fallback = displayName(lang, item.packageDescriptionZh || "", item.packageDescriptionJa || "").trim();
  return fallback || "-";
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
  const description = resolveDescription(lang, showcaseItem);

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
    <form className="grid gap-5 lg:grid-cols-[minmax(0,1.08fr)_320px]" onSubmit={onSubmit}>
      <div className="grid gap-5">
        <section className="detail-hero-panel detail-hero-panel-compact">
          <div className="detail-hero-media min-h-[17rem] sm:min-h-[19rem]" style={{ backgroundImage: `linear-gradient(180deg, rgba(47,29,39,0.05), rgba(47,29,39,0.24)), url(${showcaseItem.imageUrl})` }}>
            <span>{displayName(lang, showcaseItem.categoryNameZh, showcaseItem.categoryNameJa)}</span>
          </div>
          <div className="detail-hero-copy">
            <p className="section-eyebrow">{t.selectedDesign}</p>
            <h2 className="section-title text-3xl sm:text-4xl">{displayName(lang, showcaseItem.titleZh, showcaseItem.titleJa)}</h2>
            <p className="section-copy text-sm sm:text-base">{description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="metric-pill">{showcaseItem.priceJpy} JPY {pickText(lang, "起", "〜")}</span>
              <span className="metric-pill metric-pill-soft">{showcaseItem.durationMin} min</span>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-brand-700 sm:grid-cols-2">
              <p>{t.package}: {displayName(lang, showcaseItem.packageNameZh, showcaseItem.packageNameJa)}</p>
              <p>{t.customer}: {customerName || "-"}</p>
            </div>
          </div>
        </section>

        <section className="section-panel section-panel-compact">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_280px]">
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
            <div className="compact-info-card text-sm text-brand-800">
              <p className="font-medium text-brand-900">{entryToken ? t.lineHint : t.lineMissing}</p>
            </div>
          </div>
        </section>

        <section className="section-panel section-panel-compact">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-brand-900">{t.slots}</h2>
            <span className="metric-pill metric-pill-soft">
              {selectedStartAt ? `${t.selectedSlot}: ${formatSlotLabel(lang, selectedStartAt)}` : t.unselectedSlot}
            </span>
          </div>

          {slotLoading ? <p className="ui-state-info" aria-live="polite">{t.loadingSlots}</p> : null}
          {!slotLoading && date && slots.length === 0 ? <p className="ui-state-info" aria-live="polite">{t.noSlots}</p> : null}

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
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

        <section className="section-panel section-panel-compact">
          <label className="grid gap-2" htmlFor="booking-customer-note">
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
        </section>

        <div className="booking-submit-bar lg:hidden">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-500">{t.summary}</p>
            <p className="mt-1 truncate text-sm text-brand-900">{selectedStartAt ? `${t.selectedSlot}: ${formatSlotLabel(lang, selectedStartAt)}` : t.mobileCta}</p>
          </div>
          <button disabled={submitting || !entryToken} className="ui-btn-primary shrink-0" type="submit">
            {submitting ? "..." : t.submit}
          </button>
        </div>
      </div>

      <aside className="booking-summary-card booking-summary-card-compact lg:sticky lg:top-24">
        <p className="section-eyebrow">{t.summary}</p>
        <h3 className="mt-2 text-lg font-semibold text-brand-900">{displayName(lang, showcaseItem.titleZh, showcaseItem.titleJa)}</h3>

        <dl className="mt-4 grid gap-3 text-sm text-brand-800">
          <div className="summary-row">
            <dt>{pickText(lang, "分类", "カテゴリ")}</dt>
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

        <p className="field-hint mt-4">{t.submitHint}</p>
        <button disabled={submitting || !entryToken} className="ui-btn-primary mt-5 hidden w-full lg:inline-flex" type="submit">
          {submitting ? "..." : t.submit}
        </button>
      </aside>
    </form>
  );
}
