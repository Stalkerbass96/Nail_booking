"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Lang } from "@/lib/lang";
import { pickText } from "@/lib/lang";

type AddonOption = {
  id: string;
  nameZh: string;
  nameJa: string;
  priceJpy: number;
  durationIncreaseMin: number;
};

type PackageOption = {
  id: string;
  nameZh: string;
  nameJa: string;
  priceJpy: number;
  durationMin: number;
  addons: AddonOption[];
};

type Slot = {
  startAt: string;
  endAt: string;
};

type Props = {
  lang: Lang;
  packages: PackageOption[];
  initialPackageId?: string;
};

const TEXT = {
  zh: {
    sectionTitle: "预约信息",
    package: "套餐",
    date: "预约日期",
    addons: "加项",
    slots: "可选时间",
    name: "姓名",
    email: "邮箱",
    styleNote: "款式偏好",
    customerNote: "备注",
    submit: "提交预约",
    loadingSlots: "正在计算可用时间...",
    noSlots: "当天暂无可预约时间，请切换日期或更换套餐。",
    selectSlot: "请选择一个具体时间段",
    success: "预约提交成功，正在跳转...",
    fetchError: "获取可用时间失败",
    submitError: "预约提交失败",
    required: "请填写姓名、邮箱、套餐并选择时间",
    packagePlaceholder: "选择套餐",
    namePlaceholder: "请输入你的姓名",
    emailPlaceholder: "name@example.com",
    stylePlaceholder: "例如：裸粉、短甲、简洁法式",
    notePlaceholder: "例如：想避开太闪的装饰，或者需要提前离店",
    selectedSlot: "已选时间",
    unselectedSlot: "尚未选择",
    emptyAddons: "当前套餐没有可选加项",
    totalPrice: "总价",
    totalDuration: "总时长",
    note: "预约提交后会先进入待确认状态，该时段会为你保留。"
  },
  ja: {
    sectionTitle: "予約内容",
    package: "メニュー",
    date: "予約日",
    addons: "追加オプション",
    slots: "選択可能な時間",
    name: "お名前",
    email: "メールアドレス",
    styleNote: "デザイン希望",
    customerNote: "備考",
    submit: "予約を送信",
    loadingSlots: "空き時間を計算しています...",
    noSlots: "この日は予約可能な時間がありません。日付またはメニューを変更してください。",
    selectSlot: "具体的な時間を選択してください",
    success: "予約を送信しました。画面を切り替えています...",
    fetchError: "空き時間の取得に失敗しました",
    submitError: "予約送信に失敗しました",
    required: "お名前、メールアドレス、メニュー、時間を入力してください",
    packagePlaceholder: "メニューを選択",
    namePlaceholder: "お名前を入力してください",
    emailPlaceholder: "name@example.com",
    stylePlaceholder: "例：ヌードピンク、ショート、シンプルフレンチ",
    notePlaceholder: "例：強いラメは避けたい、早めに退店したい など",
    selectedSlot: "選択中の時間",
    unselectedSlot: "未選択",
    emptyAddons: "このメニューに追加オプションはありません",
    totalPrice: "合計金額",
    totalDuration: "合計時間",
    note: "送信後は未確認ステータスになりますが、その時間枠は一時的に確保されます。"
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

export default function BookingForm({ lang, packages, initialPackageId }: Props) {
  const router = useRouter();
  const [packageId, setPackageId] = useState(initialPackageId ?? packages[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotLoading, setSlotLoading] = useState(false);
  const [selectedStartAt, setSelectedStartAt] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [styleNote, setStyleNote] = useState("");
  const [customerNote, setCustomerNote] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const t = TEXT[lang];

  const selectedPackage = useMemo(() => packages.find((item) => item.id === packageId), [packages, packageId]);

  const totalPrice = useMemo(() => {
    if (!selectedPackage) return 0;
    const addonPrice = selectedPackage.addons
      .filter((item) => addonIds.includes(item.id))
      .reduce((sum, item) => sum + item.priceJpy, 0);
    return selectedPackage.priceJpy + addonPrice;
  }, [selectedPackage, addonIds]);

  const totalDuration = useMemo(() => {
    if (!selectedPackage) return 0;
    const addonMinutes = selectedPackage.addons
      .filter((item) => addonIds.includes(item.id))
      .reduce((sum, item) => sum + item.durationIncreaseMin, 0);
    return selectedPackage.durationMin + addonMinutes;
  }, [selectedPackage, addonIds]);

  const todayYmd = useMemo(() => {
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    return today.toISOString().slice(0, 10);
  }, []);

  async function refreshAvailability(nextDate: string, nextPackageId: string, nextAddonIds: string[]) {
    if (!nextDate || !nextPackageId) {
      setSlots([]);
      setSelectedStartAt("");
      return;
    }

    setSlotLoading(true);
    setError("");

    const qs = new URLSearchParams({
      date: nextDate,
      packageId: nextPackageId,
      addonIds: nextAddonIds.join(",")
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

  function toggleAddon(addonId: string) {
    const next = addonIds.includes(addonId)
      ? addonIds.filter((item) => item !== addonId)
      : [...addonIds, addonId];

    setAddonIds(next);
    void refreshAvailability(date, packageId, next);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name || !email || !packageId || !selectedStartAt) {
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
          name,
          email,
          packageId,
          addonIds,
          startAt: selectedStartAt,
          styleNote,
          customerNote,
          lang
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || t.submitError);
      }

      setMessage(t.success);
      router.push(`/booking/success/${data.bookingNo}?lang=${lang}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.submitError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_340px]" onSubmit={onSubmit}>
      <div className="grid gap-5">
        <section className="section-panel">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-brand-900">{t.sectionTitle}</h2>
            <div className="flex flex-wrap gap-2">
              <span className="metric-pill">{t.totalPrice}: {totalPrice} JPY</span>
              <span className="metric-pill metric-pill-soft">{t.totalDuration}: {totalDuration} min</span>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2" htmlFor="booking-package">
              <span className="text-sm font-medium text-brand-800">{t.package}</span>
              <select
                id="booking-package"
                className="ui-input"
                value={packageId}
                onChange={(event) => {
                  const nextPackageId = event.target.value;
                  setPackageId(nextPackageId);
                  setAddonIds([]);
                  void refreshAvailability(date, nextPackageId, []);
                }}
              >
                {packages.map((item) => (
                  <option key={item.id} value={item.id}>
                    {displayName(lang, item.nameZh, item.nameJa)} - {item.priceJpy} JPY
                  </option>
                ))}
              </select>
            </label>

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
                  void refreshAvailability(nextDate, packageId, addonIds);
                }}
              />
            </label>
          </div>

          <div className="mt-5">
            <p className="text-sm font-medium text-brand-800">{t.addons}</p>
            {selectedPackage?.addons.length ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {selectedPackage.addons.map((addon) => {
                  const checked = addonIds.includes(addon.id);
                  return (
                    <label key={addon.id} className={`choice-tile ${checked ? "choice-tile-active" : ""}`}>
                      <input className="admin-check" type="checkbox" checked={checked} onChange={() => toggleAddon(addon.id)} />
                      <span className="choice-tile-main">
                        <strong>{displayName(lang, addon.nameZh, addon.nameJa)}</strong>
                        <small>+{addon.priceJpy} JPY / +{addon.durationIncreaseMin} min</small>
                      </span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className="ui-state-info">{t.emptyAddons}</p>
            )}
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
            {!selectedStartAt ? <p className="field-hint" aria-live="polite">{t.selectSlot}</p> : null}
          </div>
        </section>

        <section className="section-panel">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2" htmlFor="booking-name">
              <span className="text-sm font-medium text-brand-800">{t.name}</span>
              <input
                id="booking-name"
                className="ui-input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                placeholder={t.namePlaceholder}
              />
            </label>

            <label className="grid gap-2" htmlFor="booking-email">
              <span className="text-sm font-medium text-brand-800">{t.email}</span>
              <input
                id="booking-email"
                className="ui-input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder={t.emailPlaceholder}
              />
            </label>
          </div>

          <label className="mt-4 grid gap-2" htmlFor="booking-style-note">
            <span className="text-sm font-medium text-brand-800">{t.styleNote}</span>
            <textarea
              id="booking-style-note"
              className="ui-input min-h-24"
              value={styleNote}
              onChange={(event) => setStyleNote(event.target.value)}
              placeholder={t.stylePlaceholder}
            />
          </label>

          <label className="mt-4 grid gap-2" htmlFor="booking-customer-note">
            <span className="text-sm font-medium text-brand-800">{t.customerNote}</span>
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

          <button disabled={submitting} className="ui-btn-primary mt-5 w-full sm:w-auto" type="submit">
            {submitting ? "..." : t.submit}
          </button>
        </section>
      </div>

      <aside className="booking-summary-card lg:sticky lg:top-24">
        <p className="section-eyebrow">Summary</p>
        <h3 className="text-lg font-semibold text-brand-900">{selectedPackage ? displayName(lang, selectedPackage.nameZh, selectedPackage.nameJa) : t.packagePlaceholder}</h3>

        <dl className="mt-4 grid gap-3 text-sm text-brand-800">
          <div className="summary-row">
            <dt>{t.totalPrice}</dt>
            <dd>{totalPrice} JPY</dd>
          </div>
          <div className="summary-row">
            <dt>{t.totalDuration}</dt>
            <dd>{totalDuration} min</dd>
          </div>
          <div className="summary-row">
            <dt>{t.selectedSlot}</dt>
            <dd>{selectedStartAt ? formatSlotLabel(lang, selectedStartAt) : t.unselectedSlot}</dd>
          </div>
        </dl>

        <div className="subtle-divider" />

        <div className="grid gap-2 text-sm text-brand-700">
          <strong className="text-brand-900">{pickText(lang, "预约说明", "予約メモ")}</strong>
          <p>{t.note}</p>
        </div>
      </aside>
    </form>
  );
}
