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

type ResetSummary = {
  customers: number;
  appointments: number;
  lineUsers: number;
  lineMessages: number;
  showcaseItems: number;
  servicePackages: number;
  serviceAddons: number;
  serviceCategories: number;
  preserved: {
    admins: number;
    systemSettings: number;
    businessHours: number;
  };
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
    slotHint: "当前系统仅支持 30 分钟的倍数，建议保持 30 分钟。",
    dangerTitle: "测试清库",
    dangerDesc: "清空客户、预约、LINE 会话、图墙、分类、套餐和加项等业务数据，并恢复示例目录。管理员账号、系统设置和营业时间会保留。",
    confirmationLabel: "输入确认词 RESET 后才能执行",
    confirmationPlaceholder: "请输入 RESET",
    resetAction: "清空测试数据",
    resetting: "正在清空...",
    resetFailed: "清空测试数据失败",
    resetSuccess: "测试数据已清空，并恢复了示例目录",
    invalidConfirmation: "确认词不正确",
    resetSummary: "本次清理结果",
    resetCustomers: "客户",
    resetAppointments: "预约",
    resetLineUsers: "LINE 用户",
    resetLineMessages: "LINE 消息",
    resetShowcase: "图墙项",
    resetPackages: "套餐",
    resetAddons: "加项",
    resetCategories: "分类",
    preserved: "保留",
    admins: "管理员",
    systemSettings: "系统设置",
    businessHours: "营业时间"
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
    slotHint: "現在の予約モデルでは 30 分単位のみサポートしています。通常は 30 分を推奨します。",
    dangerTitle: "テストデータ初期化",
    dangerDesc: "顧客、予約、LINE 会話、ギャラリー、カテゴリ、メニュー、追加オプションなどの業務データを削除し、サンプルカタログを復元します。管理者アカウント、システム設定、営業時間は保持されます。",
    confirmationLabel: "実行するには確認文字 RESET を入力してください",
    confirmationPlaceholder: "RESET を入力",
    resetAction: "テストデータを初期化",
    resetting: "初期化中...",
    resetFailed: "テストデータの初期化に失敗しました",
    resetSuccess: "テストデータを初期化し、サンプルカタログを復元しました",
    invalidConfirmation: "確認文字が正しくありません",
    resetSummary: "今回の初期化結果",
    resetCustomers: "顧客",
    resetAppointments: "予約",
    resetLineUsers: "LINE ユーザー",
    resetLineMessages: "LINE メッセージ",
    resetShowcase: "ギャラリー項目",
    resetPackages: "メニュー",
    resetAddons: "追加オプション",
    resetCategories: "カテゴリ",
    preserved: "保持",
    admins: "管理者",
    systemSettings: "システム設定",
    businessHours: "営業時間"
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
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [resetInput, setResetInput] = useState("");
  const [resetSummary, setResetSummary] = useState<ResetSummary | null>(null);

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

  async function onResetTestData() {
    setError("");
    setOk("");

    if (resetInput.trim() !== "RESET") {
      setError(t.invalidConfirmation);
      return;
    }

    setResetting(true);
    try {
      const res = await fetch("/api/admin/test-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: resetInput.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t.resetFailed);
      setResetSummary(data.summary ?? null);
      setResetInput("");
      setOk(t.resetSuccess);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.resetFailed);
    } finally {
      setResetting(false);
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

      <section className="admin-subsection mt-6 border border-red-100 bg-red-50/50">
        <p className="font-medium text-red-800">{t.dangerTitle}</p>
        <p className="mt-2 text-sm leading-7 text-red-700">{t.dangerDesc}</p>

        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px] md:items-end">
          <label className="grid gap-1 text-sm text-red-800" htmlFor="test-reset-confirmation">
            <span>{t.confirmationLabel}</span>
            <input
              id="test-reset-confirmation"
              className="admin-input border-red-200 bg-white"
              value={resetInput}
              onChange={(e) => setResetInput(e.target.value)}
              placeholder={t.confirmationPlaceholder}
            />
          </label>

          <button className="admin-btn-danger w-full" disabled={resetting} onClick={() => void onResetTestData()} type="button">
            {resetting ? t.resetting : t.resetAction}
          </button>
        </div>

        {resetSummary ? (
          <div className="mt-4 rounded-2xl border border-red-100 bg-white p-4 text-sm text-brand-800">
            <p className="font-medium text-brand-900">{t.resetSummary}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <p>{t.resetCustomers}: {resetSummary.customers}</p>
              <p>{t.resetAppointments}: {resetSummary.appointments}</p>
              <p>{t.resetLineUsers}: {resetSummary.lineUsers}</p>
              <p>{t.resetLineMessages}: {resetSummary.lineMessages}</p>
              <p>{t.resetShowcase}: {resetSummary.showcaseItems}</p>
              <p>{t.resetPackages}: {resetSummary.servicePackages}</p>
              <p>{t.resetAddons}: {resetSummary.serviceAddons}</p>
              <p>{t.resetCategories}: {resetSummary.serviceCategories}</p>
            </div>
            <p className="mt-3 font-medium text-brand-900">{t.preserved}</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <p>{t.admins}: {resetSummary.preserved.admins}</p>
              <p>{t.systemSettings}: {resetSummary.preserved.systemSettings}</p>
              <p>{t.businessHours}: {resetSummary.preserved.businessHours}</p>
            </div>
          </div>
        ) : null}
      </section>

      {error ? <p className="admin-danger" aria-live="assertive">{error}</p> : null}
      {ok ? <p className="ui-state-success" aria-live="polite">{ok}</p> : null}
    </section>
  );
}
