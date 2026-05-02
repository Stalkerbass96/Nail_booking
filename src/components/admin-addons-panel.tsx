"use client";

import { useCallback, useEffect, useState } from "react";
import type { Lang } from "@/lib/lang";

type AddonItem = {
  id: string;
  nameZh: string;
  nameJa: string;
  descZh?: string | null;
  descJa?: string | null;
  priceJpy: number;
  durationIncreaseMin: number;
  maxQty: number;
  isActive: boolean;
  packageIds: string[];
};

type AddonFormState = {
  nameZh: string;
  nameJa: string;
  descZh: string;
  descJa: string;
  priceJpy: string;
  durationIncreaseMin: string;
  maxQty: string;
  isActive: boolean;
};

type Props = {
  lang: Lang;
};

const TEXT = {
  zh: {
    title: "加项管理",
    refresh: "刷新",
    loading: "加载中...",
    createTitle: "新建加项",
    nameZh: "中文名",
    nameJa: "日文名",
    price: "价格",
    duration: "时长增量(30倍数)",
    maxQty: "最大数量",
    descZh: "中文描述",
    descJa: "日文描述",
    create: "新建加项",
    usedBy: "被",
    packageSuffix: "个套餐使用",
    enabled: "启用",
    disabled: "停用",
    active: "启用",
    edit: "编辑",
    remove: "删除",
    save: "保存",
    cancel: "取消",
    loadAddonFailed: "加载加项失败",
    loadFailed: "加载失败",
    createFailed: "创建失败",
    updateFailed: "更新失败",
    deleteFailed: "删除加项失败",
    deleteConfirm: "确定要删除这个加项吗？如果已经被套餐或预约历史使用，系统会拒绝删除。",
    deleteBlocked: "这个加项已被套餐或预约历史使用，不能删除。",
    empty: "暂无加项"
  },
  ja: {
    title: "追加オプション管理",
    refresh: "更新",
    loading: "読み込み中...",
    createTitle: "追加オプション作成",
    nameZh: "中国語名",
    nameJa: "日本語名",
    price: "価格",
    duration: "時間追加(30分単位)",
    maxQty: "最大数量",
    descZh: "中国語説明",
    descJa: "日本語説明",
    create: "作成",
    usedBy: "利用メニュー",
    packageSuffix: "件",
    enabled: "有効",
    disabled: "無効",
    active: "有効",
    edit: "編集",
    remove: "削除",
    save: "保存",
    cancel: "キャンセル",
    loadAddonFailed: "追加オプションの読み込みに失敗しました",
    loadFailed: "読み込みに失敗しました",
    createFailed: "作成に失敗しました",
    updateFailed: "更新に失敗しました",
    deleteFailed: "追加オプションの削除に失敗しました",
    deleteConfirm: "この追加オプションを削除しますか？メニューや予約履歴で使われている場合は削除できません。",
    deleteBlocked: "この追加オプションはメニューまたは予約履歴で使われているため削除できません。",
    empty: "追加オプションはありません"
  }
} as const;

function createEmptyFormState(): AddonFormState {
  return {
    nameZh: "",
    nameJa: "",
    descZh: "",
    descJa: "",
    priceJpy: "0",
    durationIncreaseMin: "30",
    maxQty: "1",
    isActive: true
  };
}

function fromAddon(item: AddonItem): AddonFormState {
  return {
    nameZh: item.nameZh,
    nameJa: item.nameJa,
    descZh: item.descZh ?? "",
    descJa: item.descJa ?? "",
    priceJpy: String(item.priceJpy),
    durationIncreaseMin: String(item.durationIncreaseMin),
    maxQty: String(item.maxQty ?? 1),
    isActive: item.isActive
  };
}

function mapDeleteError(lang: Lang, fallback: string, message?: string) {
  const t = TEXT[lang];
  if (!message) return fallback;
  if (message.includes("packages or appointment history")) return t.deleteBlocked;
  return message;
}

export default function AdminAddonsPanel({ lang }: Props) {
  const t = TEXT[lang];

  const [items, setItems] = useState<AddonItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [createForm, setCreateForm] = useState<AddonFormState>(createEmptyFormState());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<AddonFormState>(createEmptyFormState());

  function patchCreateForm(next: Partial<AddonFormState>) {
    setCreateForm((prev) => ({ ...prev, ...next }));
  }

  function patchEditForm(next: Partial<AddonFormState>) {
    setEditForm((prev) => ({ ...prev, ...next }));
  }

  function serializeForm(form: AddonFormState) {
    return {
      nameZh: form.nameZh.trim(),
      nameJa: form.nameJa.trim(),
      descZh: form.descZh.trim() || null,
      descJa: form.descJa.trim() || null,
      priceJpy: Number.parseInt(form.priceJpy, 10) || 0,
      durationIncreaseMin: Number.parseInt(form.durationIncreaseMin, 10) || 0,
      maxQty: Math.max(1, Number.parseInt(form.maxQty, 10) || 1),
      isActive: form.isActive
    };
  }

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/addons");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t.loadAddonFailed);
      const nextItems: AddonItem[] = data.items ?? [];
      setItems(nextItems);

      if (editingId) {
        const target = nextItems.find((item) => item.id === editingId);
        if (target) {
          setEditForm(fromAddon(target));
        } else {
          setEditingId(null);
          setEditForm(createEmptyFormState());
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [editingId, t.loadAddonFailed, t.loadFailed]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function createAddon(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/admin/addons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(serializeForm(createForm))
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t.createFailed);

      setCreateForm(createEmptyFormState());
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.createFailed);
    }
  }

  function startEdit(item: AddonItem) {
    setEditingId(item.id);
    setEditForm(fromAddon(item));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(createEmptyFormState());
  }

  async function saveEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId) return;

    setError("");

    try {
      const res = await fetch(`/api/admin/addons/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(serializeForm(editForm))
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t.updateFailed);

      setEditingId(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.updateFailed);
    }
  }

  async function deleteAddon(item: AddonItem) {
    if (!window.confirm(t.deleteConfirm)) return;

    setError("");
    try {
      const res = await fetch(`/api/admin/addons/${item.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(mapDeleteError(lang, t.deleteFailed, data?.error));
      if (editingId === item.id) cancelEdit();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.deleteFailed);
    }
  }

  return (
    <section className="admin-panel-shell">
      <div className="flex items-center justify-between">
        <h2 className="admin-section-title">{t.title}</h2>
        <button className="admin-btn-ghost" onClick={() => void refresh()} type="button">
          {t.refresh}
        </button>
      </div>

      {error ? <p className="admin-danger" aria-live="assertive">{error}</p> : null}
      {loading ? <p className="ui-state-info" aria-live="polite">{t.loading}</p> : null}

      <form className="admin-subsection" onSubmit={createAddon}>
        <p className="font-medium text-brand-900">{t.createTitle}</p>

        <div className="grid gap-3 md:grid-cols-5">
          <input className="admin-input-sm" placeholder={t.nameZh} value={createForm.nameZh} onChange={(e) => patchCreateForm({ nameZh: e.target.value })} />
          <input className="admin-input-sm" placeholder={t.nameJa} value={createForm.nameJa} onChange={(e) => patchCreateForm({ nameJa: e.target.value })} />
          <input className="admin-input-sm" placeholder={t.price} value={createForm.priceJpy} onChange={(e) => patchCreateForm({ priceJpy: e.target.value })} />
          <input className="admin-input-sm" placeholder={t.duration} value={createForm.durationIncreaseMin} onChange={(e) => patchCreateForm({ durationIncreaseMin: e.target.value })} />
          <input className="admin-input-sm" placeholder={t.maxQty} value={createForm.maxQty} onChange={(e) => patchCreateForm({ maxQty: e.target.value })} />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <textarea className="admin-input min-h-20" placeholder={t.descZh} value={createForm.descZh} onChange={(e) => patchCreateForm({ descZh: e.target.value })} />
          <textarea className="admin-input min-h-20" placeholder={t.descJa} value={createForm.descJa} onChange={(e) => patchCreateForm({ descJa: e.target.value })} />
        </div>

        <button className="admin-btn-primary w-fit" type="submit">{t.create}</button>
      </form>

      <div className="mt-4 grid gap-3">
        {!loading && items.length === 0 ? <p className="ui-state-info">{t.empty}</p> : null}
        {items.map((item) => (
          <article key={item.id} className="admin-item">
            <p className="font-medium text-brand-900">{item.nameZh} / {item.nameJa}</p>
            <p className="text-sm text-brand-700">
              {item.priceJpy} JPY · +{item.durationIncreaseMin} min · {t.maxQty}: {item.maxQty ?? 1} · {t.usedBy} {item.packageIds.length} {t.packageSuffix} · {item.isActive ? t.enabled : t.disabled}
            </p>

            <div className="mt-2 flex gap-2">
              <button className="admin-btn-ghost" onClick={() => startEdit(item)} type="button">{t.edit}</button>
              <button className="admin-btn-danger" onClick={() => void deleteAddon(item)} type="button">{t.remove}</button>
            </div>

            {editingId === item.id ? (
              <form className="mt-3 grid gap-3 rounded-xl border border-brand-100 p-3" onSubmit={saveEdit}>
                <div className="grid gap-3 md:grid-cols-5">
                  <input className="admin-input-sm" value={editForm.nameZh} onChange={(e) => patchEditForm({ nameZh: e.target.value })} />
                  <input className="admin-input-sm" value={editForm.nameJa} onChange={(e) => patchEditForm({ nameJa: e.target.value })} />
                  <input className="admin-input-sm" value={editForm.priceJpy} onChange={(e) => patchEditForm({ priceJpy: e.target.value })} />
                  <input className="admin-input-sm" value={editForm.durationIncreaseMin} onChange={(e) => patchEditForm({ durationIncreaseMin: e.target.value })} />
                  <input className="admin-input-sm" value={editForm.maxQty} onChange={(e) => patchEditForm({ maxQty: e.target.value })} />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <textarea className="admin-input min-h-20" value={editForm.descZh} onChange={(e) => patchEditForm({ descZh: e.target.value })} />
                  <textarea className="admin-input min-h-20" value={editForm.descJa} onChange={(e) => patchEditForm({ descJa: e.target.value })} />
                </div>

                <label className="text-sm text-brand-800">
                  <input className="admin-check" type="checkbox" checked={editForm.isActive} onChange={(e) => patchEditForm({ isActive: e.target.checked })} />
                  {t.active}
                </label>

                <div className="flex gap-2">
                  <button className="admin-btn-primary px-3 py-1.5" type="submit">{t.save}</button>
                  <button className="admin-btn-ghost" type="button" onClick={cancelEdit}>{t.cancel}</button>
                </div>
              </form>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
