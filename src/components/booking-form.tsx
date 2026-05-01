"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Lang } from "@/lib/lang";

// ── types ──────────────────────────────────────────────────────────────────

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

type PackageInfo = {
  id: string;
  nameZh: string;
  nameJa: string;
  descZh?: string | null;
  descJa?: string | null;
  priceJpy: number;
  durationMin: number;
  categoryNameZh: string;
  categoryNameJa: string;
};

type AddonInfo = {
  id: string;
  nameZh: string;
  nameJa: string;
  descZh?: string | null;
  descJa?: string | null;
  priceJpy: number;
  durationIncreaseMin: number;
};

type Slot = { startAt: string; endAt: string };

type Props = {
  lang: Lang;
  entryToken?: string;
  customerName?: string | null;
} & (
  | { mode: "showcase"; showcaseItem: ShowcaseItem }
  | { mode: "package"; pkg: PackageInfo; availableAddons: AddonInfo[] }
);

// ── i18n ───────────────────────────────────────────────────────────────────

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
    totalPrice: "总价",
    totalDuration: "时长",
    lineHint: "提交后，确认结果会继续通过 LINE 通知你。",
    lineMissing: "当前页面缺少 LINE 身份信息，请从 LINE 消息中的链接重新打开。",
    customer: "当前顾客",
    summary: "预约确认",
    submitHint: "确认时间后直接提交，店长确认后会在 LINE 中回复。",
    packageLabel: "套餐",
    categoryLabel: "分类",
    backToGallery: "返回图墙",
    addons: "可选加项",
    addonDuration: "分钟",
    basePrice: "基础价格",
    addonTotal: "加项合计",
    plus: "+"
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
    totalPrice: "合計金額",
    totalDuration: "所要時間",
    lineHint: "送信後の確認結果は LINE に届きます。",
    lineMissing: "LINE の本人情報がないため、このページは LINE メッセージ内リンクから開き直してください。",
    customer: "現在の顧客",
    summary: "予約確認",
    submitHint: "時間を選んで送信すると、確認結果を LINE で返信します。",
    packageLabel: "メニュー",
    categoryLabel: "カテゴリ",
    backToGallery: "ギャラリーに戻る",
    addons: "オプション追加",
    addonDuration: "分",
    basePrice: "ベース料金",
    addonTotal: "オプション合計",
    plus: "+"
  }
} as const;

// ── helpers ────────────────────────────────────────────────────────────────

function pick(lang: Lang, zh: string, ja: string) {
  return lang === "ja" ? ja : zh;
}

function formatSlotLabel(lang: Lang, startAt: string): string {
  return new Intl.DateTimeFormat(lang === "ja" ? "ja-JP" : "zh-CN", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(startAt));
}

// ── component ──────────────────────────────────────────────────────────────

export default function BookingForm(props: Props) {
  const { lang, entryToken, customerName } = props;
  const router = useRouter();
  const t = TEXT[lang];

  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotLoading, setSlotLoading] = useState(false);
  const [selectedStartAt, setSelectedStartAt] = useState("");
  const [bookingName, setBookingName] = useState(customerName ?? "");
  const [customerNote, setCustomerNote] = useState("");
  const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const todayYmd = useMemo(() => {
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    return today.toISOString().slice(0, 10);
  }, []);

  // Derived values for package mode
  const availableAddons = props.mode === "package" ? props.availableAddons : [];
  const selectedAddons = availableAddons.filter((a) => selectedAddonIds.has(a.id));

  const basePrice = props.mode === "showcase"
    ? props.showcaseItem.priceJpy
    : props.pkg.priceJpy;

  const baseDuration = props.mode === "showcase"
    ? props.showcaseItem.durationMin
    : props.pkg.durationMin;

  const addonPriceTotal = selectedAddons.reduce((s, a) => s + a.priceJpy, 0);
  const addonDurationTotal = selectedAddons.reduce((s, a) => s + a.durationIncreaseMin, 0);
  const totalPrice = basePrice + addonPriceTotal;
  const totalDuration = baseDuration + addonDurationTotal;

  const packageName = props.mode === "showcase"
    ? pick(lang, props.showcaseItem.packageNameZh, props.showcaseItem.packageNameJa)
    : pick(lang, props.pkg.nameZh, props.pkg.nameJa);

  const categoryName = props.mode === "showcase"
    ? pick(lang, props.showcaseItem.categoryNameZh, props.showcaseItem.categoryNameJa)
    : pick(lang, props.pkg.categoryNameZh, props.pkg.categoryNameJa);

  const selectedSlotLabel = selectedStartAt
    ? formatSlotLabel(lang, selectedStartAt)
    : t.unselectedSlot;

  // ── availability fetch ──────────────────────────────────────────────────

  async function refreshAvailability(nextDate: string, addonIds?: string[]) {
    if (!nextDate) {
      setSlots([]);
      setSelectedStartAt("");
      return;
    }
    setSlotLoading(true);
    setError("");

    const qs = new URLSearchParams({ date: nextDate });
    if (props.mode === "showcase") {
      qs.set("showcaseItemId", props.showcaseItem.id);
    } else {
      qs.set("packageId", props.pkg.id);
      const ids = addonIds ?? [...selectedAddonIds];
      if (ids.length > 0) qs.set("addonIds", ids.join(","));
    }

    try {
      const res = await fetch(`/api/public/availability?${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t.fetchError);
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

  // Re-fetch slots when add-ons change (package mode only)
  useEffect(() => {
    if (props.mode === "package" && date) {
      void refreshAvailability(date, [...selectedAddonIds]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAddonIds]);

  function toggleAddon(addonId: string) {
    setSelectedAddonIds((prev) => {
      const next = new Set(prev);
      if (next.has(addonId)) {
        next.delete(addonId);
      } else {
        next.add(addonId);
      }
      return next;
    });
  }

  // ── submit ──────────────────────────────────────────────────────────────

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
      const body =
        props.mode === "showcase"
          ? {
              entry: entryToken,
              showcaseItemId: props.showcaseItem.id,
              startAt: selectedStartAt,
              name: bookingName.trim(),
              customerNote,
              lang
            }
          : {
              entry: entryToken,
              packageId: props.pkg.id,
              addonIds: [...selectedAddonIds],
              startAt: selectedStartAt,
              name: bookingName.trim(),
              customerNote,
              lang
            };

      const res = await fetch("/api/public/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t.submitError);

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

  // ── render ──────────────────────────────────────────────────────────────

  return (
    <form className="booking-flow-shell" onSubmit={onSubmit}>

      {/* ── Design / Package strip ── */}
      {props.mode === "showcase" ? (
        <section className="booking-design-strip">
          <div
            className="booking-design-media"
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(47,29,39,0.05), rgba(47,29,39,0.18)), url(${props.showcaseItem.imageUrl})`
            }}
          />
          <div className="booking-design-meta">
            <div className="booking-design-heading">
              <div className="min-w-0">
                <p className="booking-design-package">{packageName}</p>
                <p className="booking-design-meta-copy">
                  {categoryName} · {totalDuration} min
                </p>
              </div>
              <span className="metric-pill shrink-0">
                ¥{Number(totalPrice).toLocaleString()}
              </span>
            </div>
            <p className="booking-design-customer">{customerName || t.customer}</p>
          </div>
        </section>
      ) : (
        <section className="section-panel section-panel-compact">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="section-eyebrow">{categoryName}</p>
              <p className="mt-1 font-semibold" style={{ color: "var(--text)" }}>{packageName}</p>
              {(lang === "ja" ? props.pkg.descJa : props.pkg.descZh) && (
                <p className="mt-1.5 text-sm" style={{ color: "var(--text-2)", lineHeight: 1.7 }}>
                  {lang === "ja" ? props.pkg.descJa : props.pkg.descZh}
                </p>
              )}
            </div>
            <span className="metric-pill shrink-0">¥{Number(totalPrice).toLocaleString()}</span>
          </div>
          <p className="mt-1.5 text-sm" style={{ color: "var(--text-3)" }}>
            {totalDuration} min
          </p>
          <p className="booking-design-customer mt-2">{customerName || t.customer}</p>
        </section>
      )}

      {/* ── Add-ons (package mode only) ── */}
      {props.mode === "package" && availableAddons.length > 0 && (
        <section className="section-panel section-panel-compact">
          <h2 className="text-base font-semibold mb-3" style={{ color: "var(--text)" }}>
            {t.addons}
          </h2>
          <div className="grid gap-2">
            {availableAddons.map((addon) => {
              const checked = selectedAddonIds.has(addon.id);
              const addonName = pick(lang, addon.nameZh, addon.nameJa);
              const addonDesc = lang === "ja" ? addon.descJa : addon.descZh;
              return (
                <label
                  key={addon.id}
                  className="flex cursor-pointer items-start gap-3 rounded-xl px-3 py-3"
                  style={{
                    border: `1px solid ${checked ? "var(--brand-300, #c8bdb2)" : "var(--border)"}`,
                    background: checked ? "var(--surface)" : "var(--bg)",
                    transition: "border-color 0.15s, background 0.15s"
                  }}
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 shrink-0"
                    checked={checked}
                    onChange={() => toggleAddon(addon.id)}
                    style={{ accentColor: "var(--brand-500, #978b82)", width: 16, height: 16 }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                      {addonName}
                    </p>
                    {addonDesc && (
                      <p className="mt-0.5 text-xs" style={{ color: "var(--text-3)", lineHeight: 1.5 }}>
                        {addonDesc}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs" style={{ color: "var(--text-3)" }}>
                      {t.plus}{addon.durationIncreaseMin} {t.addonDuration}
                    </p>
                  </div>
                  <span className="metric-pill metric-pill-soft shrink-0 text-xs">
                    {t.plus}¥{Number(addon.priceJpy).toLocaleString()}
                  </span>
                </label>
              );
            })}
          </div>

          {/* Running total */}
          {selectedAddons.length > 0 && (
            <div
              className="mt-3 flex items-center justify-between rounded-lg px-3 py-2.5 text-sm"
              style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
            >
              <span style={{ color: "var(--text-2)" }}>
                {t.basePrice} ¥{Number(basePrice).toLocaleString()}
                {" + "}
                {t.addonTotal} ¥{Number(addonPriceTotal).toLocaleString()}
              </span>
              <span className="font-semibold" style={{ color: "var(--text)" }}>
                ¥{Number(totalPrice).toLocaleString()} · {totalDuration} min
              </span>
            </div>
          )}
        </section>
      )}

      {/* ── Date ── */}
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
              onChange={(e) => {
                const nextDate = e.target.value;
                setDate(nextDate);
                void refreshAvailability(nextDate, [...selectedAddonIds]);
              }}
            />
          </label>
        </div>
      </section>

      {/* ── Time slots ── */}
      <section className="section-panel section-panel-compact booking-step-panel">
        <div className="booking-step-header">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>{t.slots}</h2>
            <p className="booking-helper-copy">
              {date ? `${t.slots}: ${slots.length}` : t.selectSlot}
            </p>
          </div>
          <span className="metric-pill metric-pill-soft">
            {selectedStartAt ? `${t.selectedSlot}: ${selectedSlotLabel}` : t.unselectedSlot}
          </span>
        </div>

        {slotLoading && <p className="ui-state-info" aria-live="polite">{t.loadingSlots}</p>}
        {!slotLoading && date && slots.length === 0 && (
          <p className="ui-state-info" aria-live="polite">{t.noSlots}</p>
        )}

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
        {!selectedStartAt && <p className="field-hint">{t.selectSlot}</p>}
      </section>

      {/* ── Name + Notes ── */}
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
              onChange={(e) => setBookingName(e.target.value)}
              placeholder={t.namePlaceholder}
            />
          </label>
          <label className="grid gap-2" htmlFor="booking-customer-note">
            <span className="text-sm font-medium" style={{ color: "var(--text-2)" }}>{t.note}</span>
            <textarea
              id="booking-customer-note"
              className="ui-input min-h-24"
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              placeholder={t.notePlaceholder}
            />
          </label>
        </div>
        {error && <p className="ui-state-error" aria-live="assertive">{error}</p>}
        {message && <p className="ui-state-success" aria-live="polite">{message}</p>}
      </section>

      {/* ── Desktop sidebar ── */}
      <aside className="booking-summary-card booking-summary-card-compact booking-summary-lite hidden lg:block">
        <p className="section-eyebrow">{t.summary}</p>
        <dl className="mt-3 grid gap-3 text-sm text-brand-800">
          <div className="summary-row">
            <dt>{t.packageLabel}</dt>
            <dd>{packageName}</dd>
          </div>
          {props.mode === "package" && selectedAddons.length > 0 && (
            <div className="summary-row">
              <dt>{t.addons}</dt>
              <dd>{selectedAddons.map((a) => pick(lang, a.nameZh, a.nameJa)).join("、")}</dd>
            </div>
          )}
          <div className="summary-row">
            <dt>{t.totalPrice}</dt>
            <dd>¥{Number(totalPrice).toLocaleString()}</dd>
          </div>
          <div className="summary-row">
            <dt>{t.totalDuration}</dt>
            <dd>{totalDuration} min</dd>
          </div>
          <div className="summary-row">
            <dt>{t.selectedSlot}</dt>
            <dd>{selectedSlotLabel}</dd>
          </div>
        </dl>
        <p className="field-hint mt-4">{t.submitHint}</p>
        <div className="booking-summary-actions">
          <button
            disabled={submitting || !entryToken}
            className="ui-btn-primary w-full"
            type="submit"
          >
            {submitting ? "..." : t.submit}
          </button>
          <button
            className="ui-btn-secondary w-full"
            type="button"
            onClick={() => router.back()}
          >
            {t.backToGallery}
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom bar ── */}
      <div className="booking-submit-bar lg:hidden">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-brand-900">{packageName}</p>
          <p className="text-xs text-brand-700">
            ¥{Number(totalPrice).toLocaleString()} · {selectedSlotLabel}
          </p>
        </div>
        <button
          disabled={submitting || !entryToken}
          className="ui-btn-primary shrink-0"
          type="submit"
        >
          {submitting ? "..." : t.submit}
        </button>
      </div>

    </form>
  );
}
