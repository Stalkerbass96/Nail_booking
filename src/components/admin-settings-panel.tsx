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
    desc: "维护预约与积分的核心业务参数。保存后立即生效。",
    slotMinutes: "预约粒度(分钟)",
    pendingAutoCancelHours: "待确认自动取消(小时)",
    cancelCutoffHours: "取消截止(预约前X小时)",
    pointEarnRatioJpy: "积分累计比例(日元/1分)",
    pointRedeemRatioJpy: "积分抵扣比例(日元/1分)",
    loading: "加载中...",
    save: "保存设置",
    saved: "保存成功",
    loadFailed: "加载设置失败",
    saveFailed: "保存失败"
  },
  ja: {
    title: "システム設定",
    desc: "予約・ポイントの主要パラメータを管理します。保存後すぐ反映されます。",
    slotMinutes: "予約スロット(分)",
    pendingAutoCancelHours: "仮予約の自動キャンセル(時間)",
    cancelCutoffHours: "キャンセル締切(開始X時間前)",
    pointEarnRatioJpy: "ポイント付与比率(円/1pt)",
    pointRedeemRatioJpy: "ポイント利用比率(円/1pt)",
    loading: "読み込み中...",
    save: "設定を保存",
    saved: "保存しました",
    loadFailed: "設定の読み込みに失敗しました",
    saveFailed: "保存に失敗しました"
  }
};

function toInt(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
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

        const s: SettingsDto = data.settings;
        setSlotMinutes(String(s.slotMinutes));
        setPendingAutoCancelHours(String(s.pendingAutoCancelHours));
        setCancelCutoffHours(String(s.cancelCutoffHours));
        setPointEarnRatioJpy(String(s.pointEarnRatioJpy));
        setPointRedeemRatioJpy(String(s.pointRedeemRatioJpy));
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
    setSaving(true);

    try {
      const body = {
        slotMinutes: toInt(slotMinutes, 30),
        pendingAutoCancelHours: toInt(pendingAutoCancelHours, 24),
        cancelCutoffHours: toInt(cancelCutoffHours, 6),
        pointEarnRatioJpy: toInt(pointEarnRatioJpy, 100),
        pointRedeemRatioJpy: toInt(pointRedeemRatioJpy, 100)
      };

      const res = await fetch("/api/admin/system-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t.saveFailed);

      const s: SettingsDto = data.settings;
      setSlotMinutes(String(s.slotMinutes));
      setPendingAutoCancelHours(String(s.pendingAutoCancelHours));
      setCancelCutoffHours(String(s.cancelCutoffHours));
      setPointEarnRatioJpy(String(s.pointEarnRatioJpy));
      setPointRedeemRatioJpy(String(s.pointRedeemRatioJpy));
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
          <input id="settings-slot-minutes" className="admin-input" value={slotMinutes} onChange={(e) => setSlotMinutes(e.target.value)} />
        </label>

        <label className="grid gap-1 text-sm text-brand-800" htmlFor="settings-auto-cancel-hours">
          <span>{t.pendingAutoCancelHours}</span>
          <input id="settings-auto-cancel-hours" className="admin-input" value={pendingAutoCancelHours} onChange={(e) => setPendingAutoCancelHours(e.target.value)} />
        </label>

        <label className="grid gap-1 text-sm text-brand-800" htmlFor="settings-cutoff-hours">
          <span>{t.cancelCutoffHours}</span>
          <input id="settings-cutoff-hours" className="admin-input" value={cancelCutoffHours} onChange={(e) => setCancelCutoffHours(e.target.value)} />
        </label>

        <label className="grid gap-1 text-sm text-brand-800" htmlFor="settings-earn-ratio">
          <span>{t.pointEarnRatioJpy}</span>
          <input id="settings-earn-ratio" className="admin-input" value={pointEarnRatioJpy} onChange={(e) => setPointEarnRatioJpy(e.target.value)} />
        </label>

        <label className="grid gap-1 text-sm text-brand-800" htmlFor="settings-redeem-ratio">
          <span>{t.pointRedeemRatioJpy}</span>
          <input id="settings-redeem-ratio" className="admin-input" value={pointRedeemRatioJpy} onChange={(e) => setPointRedeemRatioJpy(e.target.value)} />
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
