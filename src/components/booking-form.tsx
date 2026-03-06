"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Lang } from "@/lib/lang";

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
    title: "提交预约",
    package: "套餐",
    date: "预约日期",
    addons: "加项",
    slots: "可选时间",
    name: "姓名",
    email: "邮箱",
    styleNote: "款式说明",
    customerNote: "备注",
    submit: "确认预约",
    loadingSlots: "正在计算可预约时间...",
    noSlots: "当天暂无可预约时段",
    selectSlot: "请选择时间",
    success: "预约已创建，正在跳转...",
    fetchError: "获取可预约时间失败",
    submitError: "提交预约失败",
    required: "请填写必填项并选择时间"
  },
  ja: {
    title: "予約を作成",
    package: "メニュー",
    date: "予約日",
    addons: "追加オプション",
    slots: "予約可能時間",
    name: "お名前",
    email: "メール",
    styleNote: "デザイン希望",
    customerNote: "備考",
    submit: "予約する",
    loadingSlots: "空き時間を計算しています...",
    noSlots: "この日は空きがありません",
    selectSlot: "時間を選択してください",
    success: "予約を作成しました。移動中...",
    fetchError: "空き時間の取得に失敗しました",
    submitError: "予約作成に失敗しました",
    required: "必須項目と時間を入力してください"
  }
};

function displayName(lang: Lang, zh: string, ja: string): string {
  return lang === "ja" ? ja : zh;
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

  const selectedPackage = useMemo(
    () => packages.find((item) => item.id === packageId),
    [packages, packageId]
  );

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
    <form className="grid gap-6" onSubmit={onSubmit}>
      <section className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-brand-900">{t.title}</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm text-brand-800">{t.package}</span>
            <select
              className="rounded-lg border border-brand-200 px-3 py-2"
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

          <label className="grid gap-2">
            <span className="text-sm text-brand-800">{t.date}</span>
            <input
              className="rounded-lg border border-brand-200 px-3 py-2"
              type="date"
              value={date}
              onChange={(event) => {
                const nextDate = event.target.value;
                setDate(nextDate);
                void refreshAvailability(nextDate, packageId, addonIds);
              }}
            />
          </label>
        </div>

        <div className="mt-4">
          <p className="text-sm text-brand-800">{t.addons}</p>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {selectedPackage?.addons.map((addon) => {
              const checked = addonIds.includes(addon.id);
              return (
                <label
                  key={addon.id}
                  className={`rounded-lg border px-3 py-2 ${checked ? "border-brand-500 bg-brand-50" : "border-brand-200"}`}
                >
                  <input
                    className="mr-2"
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleAddon(addon.id)}
                  />
                  {displayName(lang, addon.nameZh, addon.nameJa)} (+{addon.priceJpy} JPY / +
                  {addon.durationIncreaseMin}m)
                </label>
              );
            })}
          </div>

          <p className="mt-3 text-sm text-brand-700">
            Total: {totalPrice} JPY / {totalDuration} min
          </p>
        </div>

        <div className="mt-5">
          <p className="text-sm text-brand-800">{t.slots}</p>
          {slotLoading ? <p className="mt-2 text-sm text-brand-700">{t.loadingSlots}</p> : null}
          {!slotLoading && slots.length === 0 ? <p className="mt-2 text-sm text-brand-700">{t.noSlots}</p> : null}

          <div className="mt-2 grid gap-2 md:grid-cols-4">
            {slots.map((slot) => {
              const active = selectedStartAt === slot.startAt;
              return (
                <button
                  key={slot.startAt}
                  type="button"
                  className={`rounded-lg border px-2 py-2 text-sm ${active ? "border-brand-600 bg-brand-600 text-white" : "border-brand-200 bg-white text-brand-900"}`}
                  onClick={() => setSelectedStartAt(slot.startAt)}
                >
                  {new Date(slot.startAt).toLocaleTimeString(lang === "ja" ? "ja-JP" : "zh-CN", {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </button>
              );
            })}
          </div>
          {!selectedStartAt ? <p className="mt-2 text-xs text-brand-700">{t.selectSlot}</p> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm text-brand-800">{t.name}</span>
            <input
              className="rounded-lg border border-brand-200 px-3 py-2"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm text-brand-800">{t.email}</span>
            <input
              className="rounded-lg border border-brand-200 px-3 py-2"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
            />
          </label>
        </div>

        <label className="mt-4 grid gap-2">
          <span className="text-sm text-brand-800">{t.styleNote}</span>
          <textarea
            className="min-h-20 rounded-lg border border-brand-200 px-3 py-2"
            value={styleNote}
            onChange={(event) => setStyleNote(event.target.value)}
          />
        </label>

        <label className="mt-4 grid gap-2">
          <span className="text-sm text-brand-800">{t.customerNote}</span>
          <textarea
            className="min-h-20 rounded-lg border border-brand-200 px-3 py-2"
            value={customerNote}
            onChange={(event) => setCustomerNote(event.target.value)}
          />
        </label>

        {error ? <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        {message ? <p className="mt-4 rounded bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p> : null}

        <button
          disabled={submitting}
          className="mt-4 rounded-lg bg-brand-700 px-4 py-2 font-medium text-white disabled:opacity-60"
          type="submit"
        >
          {submitting ? "..." : t.submit}
        </button>
      </section>
    </form>
  );
}