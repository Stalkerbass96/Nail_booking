"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Lang } from "@/lib/lang";

type CategoryItem = {
  id: string;
  nameZh: string;
  nameJa: string;
};

type AddonItem = {
  id: string;
  nameZh: string;
  nameJa: string;
};

type PackageItem = {
  id: string;
  nameZh: string;
  nameJa: string;
  descZh?: string | null;
  descJa?: string | null;
  imageUrl?: string | null;
  priceJpy: number;
  durationMin: number;
  isActive: boolean;
  category: CategoryItem;
  addonIds: string[];
};

type PackageFormState = {
  categoryId: string;
  nameZh: string;
  nameJa: string;
  descZh: string;
  descJa: string;
  imageUrl: string;
  priceJpy: string;
  durationMin: string;
  isActive: boolean;
  addonIds: string[];
};

type Props = {
  lang: Lang;
};

const TEXT = {
  zh: {
    title: "套餐管理",
    refresh: "刷新",
    loading: "加载中...",
    createTitle: "新建套餐",
    category: "分类",
    nameZh: "中文名",
    nameJa: "日文名",
    price: "价格",
    duration: "时长(30倍数)",
    descZh: "中文描述",
    descJa: "日文描述",
    imageUrl: "图片 URL（可选）",
    imageUrlShort: "图片 URL",
    create: "新建套餐",
    addons: "加项",
    none: "无",
    active: "启用",
    enabled: "启用",
    disabled: "停用",
    edit: "编辑",
    save: "保存",
    cancel: "取消",
    remove: "删除",
    loadCategoryFailed: "加载分类失败",
    loadAddonFailed: "加载加项失败",
    loadPackageFailed: "加载套餐失败",
    loadFailed: "加载失败",
    createFailed: "创建失败",
    updateFailed: "更新失败",
    deleteFailed: "删除套餐失败",
    deleteConfirm: "确定要删除这个套餐吗？如果已经被图墙或预约引用，系统会拒绝删除。",
    deleteBlocked: "这个套餐已被图墙或预约引用，不能删除。",
    empty: "暂无套餐"
  },
  ja: {
    title: "メニュー管理",
    refresh: "更新",
    loading: "読み込み中...",
    createTitle: "メニュー作成",
    category: "カテゴリ",
    nameZh: "中国語名",
    nameJa: "日本語名",
    price: "価格",
    duration: "所要時間(30分単位)",
    descZh: "中国語説明",
    descJa: "日本語説明",
    imageUrl: "画像 URL（任意）",
    imageUrlShort: "画像 URL",
    create: "作成",
    addons: "追加オプション",
    none: "なし",
    active: "有効",
    enabled: "有効",
    disabled: "無効",
    edit: "編集",
    save: "保存",
    cancel: "キャンセル",
    remove: "削除",
    loadCategoryFailed: "カテゴリの読み込みに失敗しました",
    loadAddonFailed: "追加オプションの読み込みに失敗しました",
    loadPackageFailed: "メニューの読み込みに失敗しました",
    loadFailed: "読み込みに失敗しました",
    createFailed: "作成に失敗しました",
    updateFailed: "更新に失敗しました",
    deleteFailed: "メニューの削除に失敗しました",
    deleteConfirm: "このメニューを削除しますか？ギャラリーや予約で使われている場合は削除できません。",
    deleteBlocked: "このメニューはギャラリーまたは予約で使われているため削除できません。",
    empty: "メニューはありません"
  }
} as const;

function createEmptyFormState(categoryId = ""): PackageFormState {
  return {
    categoryId,
    nameZh: "",
    nameJa: "",
    descZh: "",
    descJa: "",
    imageUrl: "",
    priceJpy: "0",
    durationMin: "60",
    isActive: true,
    addonIds: []
  };
}

function fromPackage(item: PackageItem): PackageFormState {
  return {
    categoryId: item.category.id,
    nameZh: item.nameZh,
    nameJa: item.nameJa,
    descZh: item.descZh ?? "",
    descJa: item.descJa ?? "",
    imageUrl: item.imageUrl ?? "",
    priceJpy: String(item.priceJpy),
    durationMin: String(item.durationMin),
    isActive: item.isActive,
    addonIds: item.addonIds
  };
}

function displayName(lang: Lang, nameZh: string, nameJa: string): string {
  return lang === "ja" ? nameJa : nameZh;
}

export default function AdminPackagesPanel({ lang }: Props) {
  const t = TEXT[lang];

  const [items, setItems] = useState<PackageItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [addons, setAddons] = useState<AddonItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [createForm, setCreateForm] = useState<PackageFormState>(createEmptyFormState());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<PackageFormState>(createEmptyFormState());

  const addonLabelById = useMemo(() => {
    const map = new Map<string, string>();
    addons.forEach((item) => map.set(item.id, displayName(lang, item.nameZh, item.nameJa)));
    return map;
  }, [addons, lang]);

  function patchCreateForm(next: Partial<PackageFormState>) {
    setCreateForm((prev) => ({ ...prev, ...next }));
  }

  function patchEditForm(next: Partial<PackageFormState>) {
    setEditForm((prev) => ({ ...prev, ...next }));
  }

  function toggleCreateAddon(id: string) {
    patchCreateForm({
      addonIds: createForm.addonIds.includes(id)
        ? createForm.addonIds.filter((x) => x !== id)
        : [...createForm.addonIds, id]
    });
  }

  function toggleEditAddon(id: string) {
    patchEditForm({
      addonIds: editForm.addonIds.includes(id)
        ? editForm.addonIds.filter((x) => x !== id)
        : [...editForm.addonIds, id]
    });
  }

  function serializeForm(form: PackageFormState) {
    return {
      categoryId: form.categoryId,
      nameZh: form.nameZh.trim(),
      nameJa: form.nameJa.trim(),
      descZh: form.descZh.trim() || null,
      descJa: form.descJa.trim() || null,
      imageUrl: form.imageUrl.trim() || null,
      priceJpy: Number.parseInt(form.priceJpy, 10) || 0,
      durationMin: Number.parseInt(form.durationMin, 10) || 60,
      isActive: form.isActive,
      addonIds: form.addonIds
    };
  }

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [catRes, addonRes, pkgRes] = await Promise.all([
        fetch("/api/admin/categories"),
        fetch("/api/admin/addons"),
        fetch("/api/admin/packages")
      ]);

      const [catData, addonData, pkgData] = await Promise.all([catRes.json(), addonRes.json(), pkgRes.json()]);

      if (!catRes.ok) throw new Error(catData?.error || t.loadCategoryFailed);
      if (!addonRes.ok) throw new Error(addonData?.error || t.loadAddonFailed);
      if (!pkgRes.ok) throw new Error(pkgData?.error || t.loadPackageFailed);

      const nextCategories: CategoryItem[] = catData.items ?? [];
      const nextAddons: AddonItem[] = addonData.items ?? [];
      const nextItems: PackageItem[] = pkgData.items ?? [];

      setCategories(nextCategories);
      setAddons(nextAddons);
      setItems(nextItems);

      setCreateForm((prev) =>
        prev.categoryId
          ? prev
          : {
              ...prev,
              categoryId: nextCategories[0]?.id ?? ""
            }
      );

      if (editingId) {
        const target = nextItems.find((item) => item.id === editingId);
        if (target) {
          setEditForm(fromPackage(target));
        } else {
          setEditingId(null);
          setEditForm(createEmptyFormState(nextCategories[0]?.id ?? ""));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [editingId, t.loadAddonFailed, t.loadCategoryFailed, t.loadFailed, t.loadPackageFailed]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function createPackage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/admin/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(serializeForm(createForm))
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t.createFailed);

      setCreateForm(createEmptyFormState(categories[0]?.id ?? ""));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.createFailed);
    }
  }

  function startEdit(item: PackageItem) {
    setEditingId(item.id);
    setEditForm(fromPackage(item));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(createEmptyFormState(categories[0]?.id ?? ""));
  }

  async function saveEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId) return;

    setError("");

    try {
      const res = await fetch(`/api/admin/packages/${editingId}`, {
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

  async function deletePackage(item: PackageItem) {
    if (!window.confirm(t.deleteConfirm)) return;
    setError("");
    try {
      const res = await fetch(`/api/admin/packages/${item.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        const message = typeof data?.error === "string" && data.error.includes("appointments or showcase items") ? t.deleteBlocked : data?.error || t.deleteFailed;
        throw new Error(message);
      }
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
        <button className="admin-btn-ghost" onClick={() => void refresh()} type="button">{t.refresh}</button>
      </div>

      {error ? <p className="admin-danger" aria-live="assertive">{error}</p> : null}
      {loading ? <p className="ui-state-info" aria-live="polite">{t.loading}</p> : null}

      <form className="admin-subsection" onSubmit={createPackage}>
        <p className="font-medium text-brand-900">{t.createTitle}</p>

        <div className="grid gap-3 md:grid-cols-5">
          <select className="admin-input-sm" value={createForm.categoryId} onChange={(e) => patchCreateForm({ categoryId: e.target.value })}>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>{displayName(lang, item.nameZh, item.nameJa)}</option>
            ))}
          </select>
          <input className="admin-input-sm" placeholder={t.nameZh} value={createForm.nameZh} onChange={(e) => patchCreateForm({ nameZh: e.target.value })} />
          <input className="admin-input-sm" placeholder={t.nameJa} value={createForm.nameJa} onChange={(e) => patchCreateForm({ nameJa: e.target.value })} />
          <input className="admin-input-sm" placeholder={t.price} value={createForm.priceJpy} onChange={(e) => patchCreateForm({ priceJpy: e.target.value })} />
          <input className="admin-input-sm" placeholder={t.duration} value={createForm.durationMin} onChange={(e) => patchCreateForm({ durationMin: e.target.value })} />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <textarea className="admin-input min-h-20" placeholder={t.descZh} value={createForm.descZh} onChange={(e) => patchCreateForm({ descZh: e.target.value })} />
          <textarea className="admin-input min-h-20" placeholder={t.descJa} value={createForm.descJa} onChange={(e) => patchCreateForm({ descJa: e.target.value })} />
        </div>

        <input className="admin-input-sm" placeholder={t.imageUrl} value={createForm.imageUrl} onChange={(e) => patchCreateForm({ imageUrl: e.target.value })} />

        <div className="grid gap-2 md:grid-cols-4">
          {addons.map((addon) => (
            <label key={addon.id} className="rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm text-brand-800">
              <input className="admin-check" type="checkbox" checked={createForm.addonIds.includes(addon.id)} onChange={() => toggleCreateAddon(addon.id)} />
              {displayName(lang, addon.nameZh, addon.nameJa)}
            </label>
          ))}
        </div>

        <button className="admin-btn-primary w-fit" type="submit">{t.create}</button>
      </form>

      <div className="mt-4 grid gap-3">
        {!loading && items.length === 0 ? <p className="ui-state-info">{t.empty}</p> : null}
        {items.map((item) => (
          <article key={item.id} className="admin-item">
            <p className="font-medium text-brand-900">{item.nameZh} / {item.nameJa}</p>
            <p className="text-sm text-brand-700">
              {t.category}: {displayName(lang, item.category.nameZh, item.category.nameJa)} · {item.priceJpy} JPY · {item.durationMin} min · {item.isActive ? t.enabled : t.disabled}
            </p>
            <p className="text-sm text-brand-700">
              {t.addons}: {item.addonIds.length ? item.addonIds.map((id) => addonLabelById.get(id) ?? id).join(", ") : t.none}
            </p>

            <div className="mt-2 flex gap-2">
              <button className="admin-btn-ghost" onClick={() => startEdit(item)} type="button">{t.edit}</button>
              <button className="admin-btn-danger" onClick={() => void deletePackage(item)} type="button">{t.remove}</button>
            </div>

            {editingId === item.id ? (
              <form className="mt-3 grid gap-3 rounded-xl border border-brand-100 p-3" onSubmit={saveEdit}>
                <div className="grid gap-3 md:grid-cols-5">
                  <select className="admin-input-sm" value={editForm.categoryId} onChange={(e) => patchEditForm({ categoryId: e.target.value })}>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{displayName(lang, cat.nameZh, cat.nameJa)}</option>
                    ))}
                  </select>
                  <input className="admin-input-sm" value={editForm.nameZh} onChange={(e) => patchEditForm({ nameZh: e.target.value })} />
                  <input className="admin-input-sm" value={editForm.nameJa} onChange={(e) => patchEditForm({ nameJa: e.target.value })} />
                  <input className="admin-input-sm" value={editForm.priceJpy} onChange={(e) => patchEditForm({ priceJpy: e.target.value })} />
                  <input className="admin-input-sm" value={editForm.durationMin} onChange={(e) => patchEditForm({ durationMin: e.target.value })} />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <textarea className="admin-input min-h-20" value={editForm.descZh} onChange={(e) => patchEditForm({ descZh: e.target.value })} />
                  <textarea className="admin-input min-h-20" value={editForm.descJa} onChange={(e) => patchEditForm({ descJa: e.target.value })} />
                </div>

                <input className="admin-input-sm" placeholder={t.imageUrlShort} value={editForm.imageUrl} onChange={(e) => patchEditForm({ imageUrl: e.target.value })} />

                <label className="text-sm text-brand-800">
                  <input className="admin-check" type="checkbox" checked={editForm.isActive} onChange={(e) => patchEditForm({ isActive: e.target.checked })} />
                  {t.active}
                </label>

                <div className="grid gap-2 md:grid-cols-4">
                  {addons.map((addon) => (
                    <label key={addon.id} className="rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm text-brand-800">
                      <input className="admin-check" type="checkbox" checked={editForm.addonIds.includes(addon.id)} onChange={() => toggleEditAddon(addon.id)} />
                      {displayName(lang, addon.nameZh, addon.nameJa)}
                    </label>
                  ))}
                </div>

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
