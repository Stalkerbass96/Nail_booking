"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/lib/lang";

type SettingsDto = {
  slotMinutes: number;
  pendingAutoCancelHours: number;
  cancelCutoffHours: number;
  pointEarnRatioJpy: number;
  pointRedeemRatioJpy: number;
};

type Props = {
  lang: Lang;
};

const TEXT = {
  zh: {
    title: "系统设置",
    desc: "控制预约粒度、待确认自动取消、取消截止时间，以及积分的累计和使用比例。",
    slotMinutes: "预约时间粒度(分钟)",
    pendingAutoCancelHours: "待确认自动取消(小时)",
    cancelCutoffHours: "客户可取消截止(距离到店前小时)",
    pointEarnRatioJpy: "积分累计比例(多少日元 = 1 point)",
    pointRedeemRatioJpy: "积分抵扣比例(多少日元 = 1 point)",
    loading: "加载中...",
    save: "保存设置",
    saved: "设置已保存",
    loadFailed: "加载设置失败",
    saveFailed: "保存设置失败",
    invalidNumber: "请输入有效的整数",
    invalidSlot: "预约时间粒度仅支持 30 / 60 / 90 / 120 分钟",
    invalidPending: "待确认自动取消必须在 1 到 168 小时之间",
    invalidCutoff: "客户取消截止必须在 0 到 168 小时之间",
    invalidEarnRatio: "积分累计比例必须在 1 到 100000 之间",
    invalidRedeemRatio: "积分抵扣比例必须在 1 到 100000 之间",
    slotHint: "当前系统仅支持 30 分钟的倍数，建议保持 30 分钟。"
  },
  ja: {
    title: "システム設定",
    desc: "予約枠の粒度、未確認予約の自動キャンセル、キャンセル締切、ポイント付与/利用比率を設定します。",
    slotMinutes: "予約枠の粒度(分)",
    pendingAutoCancelHours: "未確認予約の自動キャンセル(時間)",
    cancelCutoffHours: "お客様キャンセル締切(来店何時間前まで)",
    pointEarnRatioJpy: "ポイント付与比率(何円で 1 point)",
    pointRedeemRatioJpy: "ポイント利用比率(何円で 1 point)",
    loading: "読み込み中...",
    save: "設定を保存",
    saved: "設定を保存しました",
    loadFailed: "設定の読み込みに失敗しました",
    saveFailed: "設定の保存に失敗しました",
    invalidNumber: "有効な整数を入力してください",
    invalidSlot: "予約枠の粒度は 30 / 60 / 90 / 120 分のみ対応しています",
    invalidPending: "自動キャンセル時間は 1 から 168 時間の範囲で入力してください",
    invalidCutoff: "キャンセル締切は 0 から 168 時間の範囲で入力してください",
    invalidEarnRatio: "ポイント付与比率は 1 から 100000 の範囲で入力してください",
    invalidRedeemRatio: "ポイント利用比率は 1 から 100000 の範囲で入力してください",
    slotHint: "現在の予約モデルでは 30 分単位のみサポートしています。通常は 30 分を推奨します。"
  }
} as const;

function parseWholeNumber(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function validateSettings(
  values: {
    slotMinutes: string;
    pendingAutoCancelHours: string;
    cancelCutoffHours: string;
    pointEarnRatioJpy: string;
    pointRedeemRatioJpy: string;
  },
  t: (typeof TEXT)[Lang]
): { ok: true; body: SettingsDto } | { ok: false; message: string } {
  const slotMinutes = parseWholeNumber(values.slotMinutes);
  const pendingAutoCancelHours = parseWholeNumber(values.pendingAutoCancelHours);
  const cancelCutoffHours = parseWholeNumber(values.cancelCutoffHours);
  const pointEarnRatioJpy = parseWholeNumber(values.pointEarnRatioJpy);
  const pointRedeemRatioJpy = parseWholeNumber(values.pointRedeemRatioJpy);

  if (
    slotMinutes === null ||
    pendingAutoCancelHours === null ||
    cancelCutoffHours === null ||
    pointEarnRatioJpy === null ||
    pointRedeemRatioJpy === null
  ) {
    return { ok: false, message: t.invalidNumber };
  }

  if (slotMinutes < 30 || slotMinutes > 120 || slotMinutes % 30 !== 0) {
    return { ok: false, message: t.invalidSlot };
  }

  if (pendingAutoCancelHours < 1 || pendingAutoCancelHours > 168) {
    return { ok: false, message: t.invalidPending };
  }

  if (cancelCutoffHours < 0 || cancelCutoffHours > 168) {
    return { ok: false, message: t.invalidCutoff };
  }

  if (pointEarnRatioJpy < 1 || pointEarnRatioJpy > 100000) {
    return { ok: false, message: t.invalidEarnRatio };
  }

  if (pointRedeemRatioJpy < 1 || pointRedeemRatioJpy > 100000) {
    return { ok: false, message: t.invalidRedeemRatio };
  }

  return {
    ok: true,
    body: {
      slotMinutes,
      pendingAutoCancelHours,
      cancelCutoffHours,
      pointEarnRatioJpy,
      pointRedeemRatioJpy
    }
  };
}

export default function AdminSettingsPanel({ lang }: Props) {
  const t = TEXT[lang];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const [slotMinutes, setSlotMinutes] = useState("30");
  const [pendingAutoCancelHours, setPendingAutoCancelHours] = useState("24");
  const [cancelCutoffHours, setCancelCutoffHours] = useState("6");
  const [pointEarnRatioJpy, setPointEarnRatioJpy] = useState("100");
  const [pointRedeemRatioJpy, setPointRedeemRatioJpy] = useState("100");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/admin/system-settings");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || t.loadFailed);

        const settings: SettingsDto = data.settings;
        setSlotMinutes(String(settings.slotMinutes));
        setPendingAutoCancelHours(String(settings.pendingAutoCancelHours));
        setCancelCutoffHours(String(settings.cancelCutoffHours));
        setPointEarnRatioJpy(String(settings.pointEarnRatioJpy));
        setPointRedeemRatioJpy(String(settings.pointRedeemRatioJpy));
      } catch (err) {
        setError(err instanceof Error ? err.message : t.loadFailed);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [t.loadFailed]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setOk("");

    const validated = validateSettings(
      {
        slotMinutes,
        pendingAutoCancelHours,
        cancelCutoffHours,
        pointEarnRatioJpy,
        pointRedeemRatioJpy
      },
      t
    );

    if (!validated.ok) {
      setError(validated.message);
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/admin/system-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated.body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t.saveFailed);

      const settings: SettingsDto = data.settings;
      setSlotMinutes(String(settings.slotMinutes));
      setPendingAutoCancelHours(String(settings.pendingAutoCancelHours));
      setCancelCutoffHours(String(settings.cancelCutoffHours));
      setPointEarnRatioJpy(String(settings.pointEarnRatioJpy));
      setPointRedeemRatioJpy(String(settings.pointRedeemRatioJpy));
      setOk(t.saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-panel-shell">
      <h2 className="admin-section-title">{t.title}</h2>
      <p className="mt-1 text-sm text-brand-700">{t.desc}</p>

      {loading ? <p className="ui-state-info" aria-live="polite">{t.loading}</p> : null}

      <form className="mt-5 grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
        <label className="grid gap-1 text-sm text-brand-800" htmlFor="settings-slot-minutes">
          <span>{t.slotMinutes}</span>
          <input id="settings-slot-minutes" className="admin-input" type="number" min="30" max="120" step="30" value={slotMinutes} onChange={(e) => setSlotMinutes(e.target.value)} />
          <span className="text-xs text-brand-600">{t.slotHint}</span>
        </label>

        <label className="grid gap-1 text-sm text-brand-800" htmlFor="settings-auto-cancel-hours">
          <span>{t.pendingAutoCancelHours}</span>
          <input id="settings-auto-cancel-hours" className="admin-input" type="number" min="1" max="168" step="1" value={pendingAutoCancelHours} onChange={(e) => setPendingAutoCancelHours(e.target.value)} />
        </label>

        <label className="grid gap-1 text-sm text-brand-800" htmlFor="settings-cutoff-hours">
          <span>{t.cancelCutoffHours}</span>
          <input id="settings-cutoff-hours" className="admin-input" type="number" min="0" max="168" step="1" value={cancelCutoffHours} onChange={(e) => setCancelCutoffHours(e.target.value)} />
        </label>

        <label className="grid gap-1 text-sm text-brand-800" htmlFor="settings-earn-ratio">
          <span>{t.pointEarnRatioJpy}</span>
          <input id="settings-earn-ratio" className="admin-input" type="number" min="1" max="100000" step="1" value={pointEarnRatioJpy} onChange={(e) => setPointEarnRatioJpy(e.target.value)} />
        </label>

        <label className="grid gap-1 text-sm text-brand-800" htmlFor="settings-redeem-ratio">
          <span>{t.pointRedeemRatioJpy}</span>
          <input id="settings-redeem-ratio" className="admin-input" type="number" min="1" max="100000" step="1" value={pointRedeemRatioJpy} onChange={(e) => setPointRedeemRatioJpy(e.target.value)} />
        </label>

        <div className="flex items-end">
          <button className="admin-btn-primary w-full sm:w-auto" disabled={saving} type="submit">
            {saving ? `${t.save}...` : t.save}
          </button>
        </div>
      </form>

      {error ? <p className="admin-danger" aria-live="assertive">{error}</p> : null}
      {ok ? <p className="ui-state-success" aria-live="polite">{ok}</p> : null}
    </section>
  );
}
