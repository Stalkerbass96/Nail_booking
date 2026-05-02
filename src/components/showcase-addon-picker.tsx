"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Lang } from "@/lib/lang";

type AddonInfo = {
  id: string;
  nameZh: string;
  nameJa: string;
  descZh?: string | null;
  descJa?: string | null;
  priceJpy: number;
  durationIncreaseMin: number;
  maxQty: number;
};

type Props = {
  showcaseItemId: string;
  lang: Lang;
  entryToken?: string;
  customPriceJpy: number | null;
  originalPrice: number;
  baseDuration: number;
  optionalAddons: AddonInfo[];
};

const TEXT = {
  zh: {
    optionalAddons: "可选加项",
    book: "预约此款设计",
    total: "总价",
    duration: "分钟",
    plus: "+",
    originalPrice: "原价"
  },
  ja: {
    optionalAddons: "オプション追加",
    book: "このデザインを予約",
    total: "合計",
    duration: "分",
    plus: "+",
    originalPrice: "元の価格"
  }
} as const;

export default function ShowcaseAddonPicker({
  showcaseItemId,
  lang,
  entryToken,
  customPriceJpy,
  originalPrice,
  baseDuration,
  optionalAddons
}: Props) {
  const router = useRouter();
  const t = TEXT[lang];
  const [addonQtys, setAddonQtys] = useState<Record<string, number>>({});

  const basePrice = customPriceJpy ?? originalPrice;
  const showDiscount = customPriceJpy !== null && customPriceJpy < originalPrice;

  const addonPriceTotal = optionalAddons.reduce((s, a) => s + a.priceJpy * (addonQtys[a.id] ?? 0), 0);
  const addonDurationTotal = optionalAddons.reduce(
    (s, a) => s + a.durationIncreaseMin * (addonQtys[a.id] ?? 0),
    0
  );
  const totalPrice = basePrice + addonPriceTotal;
  const totalDuration = baseDuration + addonDurationTotal;

  function buildBookingHref() {
    const params = new URLSearchParams({ showcaseItemId, lang });
    if (entryToken) params.set("entry", entryToken);
    const addonParam = optionalAddons
      .filter((a) => (addonQtys[a.id] ?? 0) > 0)
      .map((a) => `${a.id}:${addonQtys[a.id]}`)
      .join(",");
    if (addonParam) params.set("addons", addonParam);
    return `/booking?${params.toString()}`;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Optional addons */}
      {optionalAddons.length > 0 && (
        <section className="section-panel section-panel-compact">
          <p className="section-eyebrow mb-3">{t.optionalAddons}</p>
          <div className="grid gap-2">
            {optionalAddons.map((addon) => {
              const qty = addonQtys[addon.id] ?? 0;
              const isSelected = qty > 0;
              const name = lang === "ja" ? addon.nameJa : addon.nameZh;
              const desc = lang === "ja" ? addon.descJa : addon.descZh;
              return (
                <div
                  key={addon.id}
                  className="rounded-xl px-3 py-3"
                  style={{
                    border: `1px solid ${isSelected ? "var(--brand-300, #c8bdb2)" : "var(--border)"}`,
                    background: isSelected ? "var(--surface)" : "var(--bg)",
                    transition: "border-color 0.15s, background 0.15s"
                  }}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-0.5 shrink-0 cursor-pointer"
                      checked={isSelected}
                      onChange={(e) =>
                        setAddonQtys((prev) => ({ ...prev, [addon.id]: e.target.checked ? 1 : 0 }))
                      }
                      style={{ accentColor: "var(--brand-500, #978b82)", width: 16, height: 16 }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{name}</p>
                      {desc && (
                        <p className="mt-0.5 text-xs" style={{ color: "var(--text-3)", lineHeight: 1.5 }}>
                          {desc}
                        </p>
                      )}
                      {addon.durationIncreaseMin > 0 && (
                        <p className="mt-0.5 text-xs" style={{ color: "var(--text-3)" }}>
                          {t.plus}{addon.durationIncreaseMin * Math.max(qty, 1)} {t.duration}
                        </p>
                      )}
                    </div>
                    <span className="metric-pill metric-pill-soft shrink-0 text-xs">
                      {t.plus}¥{Number(isSelected ? addon.priceJpy * qty : addon.priceJpy).toLocaleString()}
                    </span>
                  </div>

                  {isSelected && addon.maxQty > 1 && (
                    <div className="mt-2 flex items-center gap-2 pl-6">
                      <button
                        type="button"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-sm font-semibold"
                        style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)" }}
                        onClick={() =>
                          setAddonQtys((prev) => ({ ...prev, [addon.id]: Math.max(1, qty - 1) }))
                        }
                      >−</button>
                      <span className="w-6 text-center text-sm font-semibold" style={{ color: "var(--text)" }}>
                        {qty}
                      </span>
                      <button
                        type="button"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-sm font-semibold"
                        style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)" }}
                        onClick={() =>
                          setAddonQtys((prev) => ({ ...prev, [addon.id]: Math.min(addon.maxQty, qty + 1) }))
                        }
                      >+</button>
                      <span className="text-xs" style={{ color: "var(--text-3)" }}>/ {addon.maxQty}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Price + Book CTA */}
      <div
        className="section-panel section-panel-compact"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span className="text-xl font-bold" style={{ color: "var(--text)" }}>
              ¥{totalPrice.toLocaleString()}
            </span>
            {showDiscount && (
              <span className="text-sm" style={{ color: "var(--text-3)", textDecoration: "line-through" }}>
                ¥{(originalPrice + addonPriceTotal).toLocaleString()}
              </span>
            )}
          </div>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
            {totalDuration} {t.duration}
          </p>
        </div>
        <button
          type="button"
          className="ui-btn-primary shrink-0"
          style={{ padding: "11px 22px", fontSize: 14 }}
          onClick={() => router.push(buildBookingHref())}
        >
          {t.book}
        </button>
      </div>
    </div>
  );
}
