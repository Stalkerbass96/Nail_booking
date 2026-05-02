"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Lang } from "@/lib/lang";

type CategoryItem = {
  id: string;
  nameZh: string;
  nameJa: string;
};

type PackageItem = {
  id: string;
  nameZh: string;
  nameJa: string;
  priceJpy: number;
  durationMin: number;
  isActive?: boolean;
};

type AvailableAddon = {
  id: string;
  nameZh: string;
  nameJa: string;
  priceJpy: number;
  durationIncreaseMin: number;
  maxQty: number;
  isActive: boolean;
  currentQty: number;
};

type ShowcaseItem = {
  id: string;
  titleZh: string;
  titleJa: string;
  descriptionZh?: string | null;
  descriptionJa?: string | null;
  imageUrl: string;
  sortOrder: number;
  isPublished: boolean;
  hideAddonDetails: boolean;
  customPriceJpy: number | null;
  appointmentCount: number;
  category: CategoryItem;
  servicePackage: PackageItem & { isActive: boolean };
};

type ShowcaseFormState = {
  categoryId: string;
  servicePackageId: string;
  titleZh: string;
  titleJa: string;
  descriptionZh: string;
  descriptionJa: string;
  imageUrl: string;
  sortOrder: string;
  isPublished: boolean;
  hideAddonDetails: boolean;
  customPriceJpy: string;
};

type PublishFilter = "all" | "published" | "unpublished";

type Props = {
  lang: Lang;
};

const TEXT = {
  zh: {
    title: "图墙管理",
    refresh: "刷新",
    loading: "加载中...",
    saving: "保存中...",
    createTitle: "新建图墙项",
    titleZh: "中文标题",
    titleJa: "日文标题",
    descriptionZh: "中文说明",
    descriptionJa: "日文说明",
    imageUrl: "图片 URL",
    sortOrder: "排序",
    create: "新建图墙项",
    edit: "编辑",
    save: "保存",
    cancel: "取消",
    published: "上架",
    unpublished: "下架",
    appointments: "来源预约",
    loadFailed: "加载图墙失败",
    createFailed: "创建失败",
    updateFailed: "更新失败",
    reorderFailed: "排序调整失败",
    saveSuccess: "图墙项已保存",
    reorderSuccess: "图墙排序已更新",
    empty: "暂无图墙项",
    activePackageMissing: "关联套餐已停用",
    moveUp: "上移",
    moveDown: "下移",
    publishNow: "立即上架",
    unpublishNow: "立即下架",
    preview: "图片预览",
    filtersTitle: "快速筛选",
    category: "分类",
    status: "状态",
    keyword: "关键词",
    keywordPlaceholder: "搜索图墙标题、分类或套餐",
    allCategories: "全部分类",
    allStatuses: "全部状态",
    sortHint: "优先用上移 / 下移调整首页图墙顺序。",
    remove: "删除",
    deleteFailed: "删除图墙失败",
    deleteSuccess: "图墙项已删除",
    deleteConfirm: "确定要删除这个图墙项吗？如果已经产生预约，系统会拒绝删除。",
    deleteBlocked: "这个图墙项已有预约历史，不能删除。",
    addonsTitle: "固定加项组合",
    addonsSaveSuccess: "加项已保存",
    addonsSaveFailed: "保存加项失败",
    addonsNone: "此套餐暂无可用加项",
    addonsLoading: "加载加项...",
    hideAddonDetails: "隐藏加项明细（价格/时长）",
    customPriceJpy: "图墙专属价（留空则显示原价）"
  },
  ja: {
    title: "ギャラリー管理",
    refresh: "更新",
    loading: "読み込み中...",
    saving: "保存中...",
    createTitle: "ギャラリー項目作成",
    titleZh: "中国語タイトル",
    titleJa: "日本語タイトル",
    descriptionZh: "中国語説明",
    descriptionJa: "日本語説明",
    imageUrl: "画像 URL",
    sortOrder: "並び順",
    create: "作成",
    edit: "編集",
    save: "保存",
    cancel: "キャンセル",
    published: "公開",
    unpublished: "非公開",
    appointments: "予約流入",
    loadFailed: "ギャラリーの読み込みに失敗しました",
    createFailed: "作成に失敗しました",
    updateFailed: "更新に失敗しました",
    reorderFailed: "並び替えに失敗しました",
    saveSuccess: "ギャラリー項目を保存しました",
    reorderSuccess: "ギャラリーの並び順を更新しました",
    empty: "ギャラリー項目はありません",
    activePackageMissing: "連携メニューは無効です",
    moveUp: "上へ",
    moveDown: "下へ",
    publishNow: "すぐ公開",
    unpublishNow: "非公開にする",
    preview: "画像プレビュー",
    filtersTitle: "クイック絞り込み",
    category: "カテゴリ",
    status: "状態",
    keyword: "キーワード",
    keywordPlaceholder: "タイトル、カテゴリ、メニューで検索",
    allCategories: "すべてのカテゴリ",
    allStatuses: "すべての状態",
    sortHint: "ホームギャラリーの順番は上へ / 下へで簡単に調整できます。",
    remove: "削除",
    deleteFailed: "ギャラリー項目の削除に失敗しました",
    deleteSuccess: "ギャラリー項目を削除しました",
    deleteConfirm: "このギャラリー項目を削除しますか？予約履歴がある場合は削除できません。",
    deleteBlocked: "このギャラリー項目には予約履歴があるため削除できません。",
    addonsTitle: "固定オプション組み合わせ",
    addonsSaveSuccess: "オプションを保存しました",
    addonsSaveFailed: "オプションの保存に失敗しました",
    addonsNone: "このメニューには利用可能なオプションがありません",
    addonsLoading: "オプションを読み込み中...",
    hideAddonDetails: "オプション明細（金額/時間）を非表示",
    customPriceJpy: "ギャラリー専用価格（空白で通常価格表示）"
  }
} as const;

function displayName(lang: Lang, zh: string, ja: string) {
  return lang === "ja" ? ja : zh;
}

function createEmptyForm(categoryId = "", servicePackageId = ""): ShowcaseFormState {
  return {
    categoryId,
    servicePackageId,
    titleZh: "",
    titleJa: "",
    descriptionZh: "",
    descriptionJa: "",
    imageUrl: "",
    sortOrder: "0",
    isPublished: true,
    hideAddonDetails: false,
    customPriceJpy: ""
  };
}

function fromItem(item: ShowcaseItem): ShowcaseFormState {
  return {
    categoryId: item.category.id,
    servicePackageId: item.servicePackage.id,
    titleZh: item.titleZh,
    titleJa: item.titleJa,
    descriptionZh: item.descriptionZh ?? "",
    descriptionJa: item.descriptionJa ?? "",
    imageUrl: item.imageUrl,
    sortOrder: String(item.sortOrder),
    isPublished: item.isPublished,
    hideAddonDetails: item.hideAddonDetails,
    customPriceJpy: item.customPriceJpy !== null ? String(item.customPriceJpy) : ""
  };
}

export default function AdminShowcasePanel({ lang }: Props) {
  const t = TEXT[lang];
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [createForm, setCreateForm] = useState<ShowcaseFormState>(createEmptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ShowcaseFormState>(createEmptyForm());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [publishFilter, setPublishFilter] = useState<PublishFilter>("all");
  const [keyword, setKeyword] = useState("");
  const [showcaseAddons, setShowcaseAddons] = useState<AvailableAddon[]>([]);
  const [addonQtys, setAddonQtys] = useState<Record<string, number>>({});
  const [addonsLoading, setAddonsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const responses = await Promise.all([
        fetch("/api/admin/showcase"),
        fetch("/api/admin/categories"),
        fetch("/api/admin/packages")
      ]);
      const payloads = await Promise.all(responses.map((res) => res.json()));
      const showcaseData = payloads[0];
      const categoryData = payloads[1];
      const packageData = payloads[2];

      if (!responses[0].ok || !responses[1].ok || !responses[2].ok) {
        throw new Error(showcaseData?.error || categoryData?.error || packageData?.error || t.loadFailed);
      }

      const nextItems: ShowcaseItem[] = showcaseData.items ?? [];
      const nextCategories: CategoryItem[] = categoryData.items ?? [];
      const nextPackages: PackageItem[] = (packageData.items ?? []).map((item: any) => ({
        id: item.id,
        nameZh: item.nameZh,
        nameJa: item.nameJa,
        priceJpy: item.priceJpy,
        durationMin: item.durationMin,
        isActive: item.isActive
      }));

      setItems(nextItems);
      setCategories(nextCategories);
      setPackages(nextPackages);
      setCreateForm((prev) => ({
        ...prev,
        categoryId: prev.categoryId || nextCategories[0]?.id || "",
        servicePackageId: prev.servicePackageId || nextPackages[0]?.id || ""
      }));

      if (editingId) {
        const target = nextItems.find((item) => item.id === editingId);
        if (target) {
          setEditForm(fromItem(target));
        } else {
          setEditingId(null);
          setEditForm(createEmptyForm(nextCategories[0]?.id || "", nextPackages[0]?.id || ""));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [editingId, t.loadFailed]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const sortedItems = useMemo(() => [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id)), [items]);
  const reorderLocked = categoryFilter !== "all" || publishFilter !== "all" || keyword.trim() !== "";

  const filteredItems = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return sortedItems.filter((item) => {
      if (categoryFilter !== "all" && item.category.id !== categoryFilter) return false;
      if (publishFilter === "published" && !item.isPublished) return false;
      if (publishFilter === "unpublished" && item.isPublished) return false;
      if (!q) return true;
      const haystack = [
        item.titleZh,
        item.titleJa,
        item.category.nameZh,
        item.category.nameJa,
        item.servicePackage.nameZh,
        item.servicePackage.nameJa
      ].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [categoryFilter, keyword, publishFilter, sortedItems]);

  function patchCreateForm(next: Partial<ShowcaseFormState>) {
    setCreateForm((prev) => ({ ...prev, ...next }));
  }

  function patchEditForm(next: Partial<ShowcaseFormState>) {
    setEditForm((prev) => ({ ...prev, ...next }));
  }

  function serializeForm(form: ShowcaseFormState) {
    return {
      categoryId: form.categoryId,
      servicePackageId: form.servicePackageId,
      titleZh: form.titleZh.trim(),
      titleJa: form.titleJa.trim(),
      descriptionZh: form.descriptionZh.trim() || null,
      descriptionJa: form.descriptionJa.trim() || null,
      imageUrl: form.imageUrl.trim(),
      hideAddonDetails: form.hideAddonDetails,
      customPriceJpy: form.customPriceJpy.trim() ? Math.max(1, Number.parseInt(form.customPriceJpy, 10) || 0) || null : null,
      sortOrder: Number.parseInt(form.sortOrder, 10) || 0,
      isPublished: form.isPublished
    };
  }

  async function createItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/showcase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(serializeForm(createForm))
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t.createFailed);
      setCreateForm(createEmptyForm(categories[0]?.id || "", packages[0]?.id || ""));
      setNotice(t.saveSuccess);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.createFailed);
    } finally {
      setSaving(false);
    }
  }

  async function saveItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId) return;
    setError("");
    setNotice("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/showcase/" + editingId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(serializeForm(editForm))
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t.updateFailed);

      // Save fixed add-ons if any are shown
      if (showcaseAddons.length > 0) {
        const addonPayload = Object.entries(addonQtys)
          .filter(([, qty]) => qty > 0)
          .map(([addonId, qty]) => ({ addonId, qty }));
        const addonRes = await fetch(`/api/admin/showcase/${editingId}/addons`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ addons: addonPayload })
        });
        const addonData = await addonRes.json();
        if (!addonRes.ok) throw new Error(addonData?.error || t.addonsSaveFailed);
      }

      setEditingId(null);
      setShowcaseAddons([]);
      setAddonQtys({});
      setNotice(t.saveSuccess);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.updateFailed);
    } finally {
      setSaving(false);
    }
  }

  async function moveItem(itemId: string, direction: -1 | 1) {
    const index = sortedItems.findIndex((item) => item.id === itemId);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= sortedItems.length) return;

    const current = sortedItems[index];
    const target = sortedItems[targetIndex];
    setError("");
    setNotice("");
    setSaving(true);
    try {
      const currentPayload = { ...serializeForm(fromItem(current)), sortOrder: target.sortOrder };
      const targetPayload = { ...serializeForm(fromItem(target)), sortOrder: current.sortOrder };
      const responses = await Promise.all([
        fetch("/api/admin/showcase/" + current.id, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(currentPayload)
        }),
        fetch("/api/admin/showcase/" + target.id, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(targetPayload)
        })
      ]);
      const payloads = await Promise.all(responses.map((res) => res.json()));
      if (!responses[0].ok || !responses[1].ok) {
        throw new Error(payloads[0]?.error || payloads[1]?.error || t.reorderFailed);
      }
      setNotice(t.reorderSuccess);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.reorderFailed);
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish(item: ShowcaseItem) {
    setError("");
    setNotice("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/showcase/" + item.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...serializeForm(fromItem(item)), isPublished: !item.isPublished })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t.updateFailed);
      setNotice(t.saveSuccess);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.updateFailed);
    } finally {
      setSaving(false);
    }
  }

  async function startEdit(item: ShowcaseItem) {
    setEditingId(item.id);
    setEditForm(fromItem(item));
    setShowcaseAddons([]);
    setAddonQtys({});
    setAddonsLoading(true);
    try {
      const res = await fetch(`/api/admin/showcase/${item.id}/addons`);
      const data = await res.json();
      const addons: AvailableAddon[] = data.availableAddons ?? [];
      setShowcaseAddons(addons);
      const qtys: Record<string, number> = {};
      for (const a of addons) {
        qtys[a.id] = a.currentQty;
      }
      setAddonQtys(qtys);
    } catch {
      // silently ignore — addon management is optional
    } finally {
      setAddonsLoading(false);
    }
  }

  async function deleteItem(item: ShowcaseItem) {
    if (!window.confirm(t.deleteConfirm)) return;
    setError("");
    setNotice("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/showcase/" + item.id, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        const message = typeof data?.error === "string" && data.error.includes("appointment history") ? t.deleteBlocked : data?.error || t.deleteFailed;
        throw new Error(message);
      }
      if (editingId === item.id) {
        setEditingId(null);
        setEditForm(createEmptyForm(categories[0]?.id || "", packages[0]?.id || ""));
      }
      setNotice(t.deleteSuccess);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.deleteFailed);
    } finally {
      setSaving(false);
    }
  }

  function renderPreview(imageUrl: string) {
    if (!imageUrl) return null;
    return (
      <div className="overflow-hidden rounded-2xl border border-brand-100 bg-brand-50">
        <p className="border-b border-brand-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">{t.preview}</p>
        <div className="aspect-[5/4] w-full bg-cover bg-center" style={{ backgroundImage: "url(" + imageUrl + ")" }} />
      </div>
    );
  }

  return (
    <section className="admin-panel-shell">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="admin-section-title">{t.title}</h2>
          <p className="admin-note mt-2">{t.sortHint}</p>
        </div>
        <button className="admin-btn-ghost" onClick={() => void refresh()} type="button">{t.refresh}</button>
      </div>

      {error ? <p className="admin-danger">{error}</p> : null}
      {notice ? <p className="admin-success">{notice}</p> : null}
      {loading ? <p className="ui-state-info">{t.loading}</p> : null}
      {saving ? <p className="ui-state-info">{t.saving}</p> : null}

      <section className="admin-subsection">
        <p className="font-medium text-brand-900">{t.filtersTitle}</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="grid gap-1 text-sm text-brand-800">
            <span>{t.category}</span>
            <select className="admin-input-sm" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="all">{t.allCategories}</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>{displayName(lang, item.nameZh, item.nameJa)}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm text-brand-800">
            <span>{t.status}</span>
            <select className="admin-input-sm" value={publishFilter} onChange={(e) => setPublishFilter(e.target.value as PublishFilter)}>
              <option value="all">{t.allStatuses}</option>
              <option value="published">{t.published}</option>
              <option value="unpublished">{t.unpublished}</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm text-brand-800">
            <span>{t.keyword}</span>
            <input className="admin-input-sm" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder={t.keywordPlaceholder} />
          </label>
        </div>
      </section>

      <form className="admin-subsection" onSubmit={createItem}>
        <p className="font-medium text-brand-900">{t.createTitle}</p>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <select className="admin-input-sm" value={createForm.categoryId} onChange={(e) => patchCreateForm({ categoryId: e.target.value })}>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>{displayName(lang, item.nameZh, item.nameJa)}</option>
            ))}
          </select>
          <select className="admin-input-sm" value={createForm.servicePackageId} onChange={(e) => patchCreateForm({ servicePackageId: e.target.value })}>
            {packages.map((item) => (
              <option key={item.id} value={item.id}>{displayName(lang, item.nameZh, item.nameJa)} / {item.priceJpy} JPY</option>
            ))}
          </select>
          <input className="admin-input-sm" placeholder={t.titleZh} value={createForm.titleZh} onChange={(e) => patchCreateForm({ titleZh: e.target.value })} />
          <input className="admin-input-sm" placeholder={t.titleJa} value={createForm.titleJa} onChange={(e) => patchCreateForm({ titleJa: e.target.value })} />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <textarea className="admin-input min-h-20" placeholder={t.descriptionZh} value={createForm.descriptionZh} onChange={(e) => patchCreateForm({ descriptionZh: e.target.value })} />
          <textarea className="admin-input min-h-20" placeholder={t.descriptionJa} value={createForm.descriptionJa} onChange={(e) => patchCreateForm({ descriptionJa: e.target.value })} />
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_140px_120px]">
          <input className="admin-input-sm" placeholder={t.imageUrl} value={createForm.imageUrl} onChange={(e) => patchCreateForm({ imageUrl: e.target.value })} />
          <input className="admin-input-sm" placeholder={t.sortOrder} value={createForm.sortOrder} onChange={(e) => patchCreateForm({ sortOrder: e.target.value })} />
          <label className="admin-note flex items-center rounded-xl border border-brand-200 bg-white px-3 py-2">
            <input className="admin-check" type="checkbox" checked={createForm.isPublished} onChange={(e) => patchCreateForm({ isPublished: e.target.checked })} />
            {t.published}
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <label className="admin-note flex items-center gap-2">
            <input className="admin-check" type="checkbox" checked={createForm.hideAddonDetails} onChange={(e) => patchCreateForm({ hideAddonDetails: e.target.checked })} />
            {t.hideAddonDetails}
          </label>
          <label className="flex items-center gap-2 text-sm text-brand-800">
            <span>{t.customPriceJpy}</span>
            <input className="admin-input-sm w-36" type="number" min="1" placeholder="留空" value={createForm.customPriceJpy} onChange={(e) => patchCreateForm({ customPriceJpy: e.target.value })} />
          </label>
        </div>
        {renderPreview(createForm.imageUrl)}
        <button className="admin-btn-primary w-fit" type="submit">{t.create}</button>
      </form>

      <div className="mt-4 grid gap-3">
        {!loading && filteredItems.length === 0 ? <p className="ui-state-info">{t.empty}</p> : null}
        {filteredItems.map((item, index) => (
          <article key={item.id} className="admin-item">
            <div className="grid gap-4 lg:grid-cols-[180px_1fr]">
              <div className="overflow-hidden rounded-2xl border border-brand-100 bg-brand-50">
                <div className="aspect-[4/5] w-full bg-cover bg-center" style={{ backgroundImage: "url(" + item.imageUrl + ")" }} />
              </div>
              <div className="grid gap-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-brand-900">{displayName(lang, item.titleZh, item.titleJa)}</p>
                    <p className="text-sm text-brand-700">
                      {displayName(lang, item.category.nameZh, item.category.nameJa)} / {displayName(lang, item.servicePackage.nameZh, item.servicePackage.nameJa)} / {item.servicePackage.priceJpy} JPY
                      {item.customPriceJpy !== null && (
                        <span className="ml-2 font-medium text-emerald-700">→ ¥{item.customPriceJpy.toLocaleString()}</span>
                      )}
                    </p>
                    <p className="text-sm text-brand-700">{item.isPublished ? t.published : t.unpublished} / {t.appointments} {item.appointmentCount} / #{item.sortOrder}</p>
                    {!item.servicePackage.isActive ? <p className="text-sm text-amber-700">{t.activePackageMissing}</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button className="admin-btn-ghost" onClick={() => void moveItem(item.id, -1)} type="button" disabled={reorderLocked || index === 0 || saving}>{t.moveUp}</button>
                    <button className="admin-btn-ghost" onClick={() => void moveItem(item.id, 1)} type="button" disabled={reorderLocked || index === filteredItems.length - 1 || saving}>{t.moveDown}</button>
                    <button className="admin-btn-ghost" onClick={() => void togglePublish(item)} type="button" disabled={saving}>{item.isPublished ? t.unpublishNow : t.publishNow}</button>
                    <button className="admin-btn-ghost" onClick={() => void startEdit(item)} type="button">{t.edit}</button>
                    <button className="admin-btn-danger" onClick={() => void deleteItem(item)} type="button" disabled={saving}>{t.remove}</button>
                  </div>
                </div>
                <p className="text-sm leading-7 text-brand-700">{displayName(lang, item.descriptionZh || "", item.descriptionJa || "") || "-"}</p>
              </div>
            </div>

            {editingId === item.id ? (
              <form className="mt-3 grid gap-3 rounded-xl border border-brand-100 p-3" onSubmit={saveItem}>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <select className="admin-input-sm" value={editForm.categoryId} onChange={(e) => patchEditForm({ categoryId: e.target.value })}>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{displayName(lang, cat.nameZh, cat.nameJa)}</option>
                    ))}
                  </select>
                  <select className="admin-input-sm" value={editForm.servicePackageId} onChange={(e) => patchEditForm({ servicePackageId: e.target.value })}>
                    {packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>{displayName(lang, pkg.nameZh, pkg.nameJa)} / {pkg.priceJpy} JPY</option>
                    ))}
                  </select>
                  <input className="admin-input-sm" value={editForm.titleZh} onChange={(e) => patchEditForm({ titleZh: e.target.value })} />
                  <input className="admin-input-sm" value={editForm.titleJa} onChange={(e) => patchEditForm({ titleJa: e.target.value })} />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <textarea className="admin-input min-h-20" value={editForm.descriptionZh} onChange={(e) => patchEditForm({ descriptionZh: e.target.value })} />
                  <textarea className="admin-input min-h-20" value={editForm.descriptionJa} onChange={(e) => patchEditForm({ descriptionJa: e.target.value })} />
                </div>
                <div className="grid gap-3 md:grid-cols-[1fr_140px_120px]">
                  <input className="admin-input-sm" value={editForm.imageUrl} onChange={(e) => patchEditForm({ imageUrl: e.target.value })} />
                  <input className="admin-input-sm" value={editForm.sortOrder} onChange={(e) => patchEditForm({ sortOrder: e.target.value })} />
                  <label className="admin-note flex items-center rounded-xl border border-brand-200 bg-white px-3 py-2">
                    <input className="admin-check" type="checkbox" checked={editForm.isPublished} onChange={(e) => patchEditForm({ isPublished: e.target.checked })} />
                    {t.published}
                  </label>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="admin-note flex items-center gap-2">
                    <input className="admin-check" type="checkbox" checked={editForm.hideAddonDetails} onChange={(e) => patchEditForm({ hideAddonDetails: e.target.checked })} />
                    {t.hideAddonDetails}
                  </label>
                  <label className="flex items-center gap-2 text-sm text-brand-800">
                    <span>{t.customPriceJpy}</span>
                    <input className="admin-input-sm w-36" type="number" min="1" placeholder="留空" value={editForm.customPriceJpy} onChange={(e) => patchEditForm({ customPriceJpy: e.target.value })} />
                  </label>
                </div>
                {renderPreview(editForm.imageUrl)}

                {/* Fixed add-ons */}
                <div>
                  <p className="font-medium text-brand-900 mb-2">{t.addonsTitle}</p>
                  {addonsLoading ? (
                    <p className="text-sm text-brand-600">{t.addonsLoading}</p>
                  ) : showcaseAddons.length === 0 ? (
                    <p className="text-sm text-brand-500">{t.addonsNone}</p>
                  ) : (
                    <div className="grid gap-2">
                      {showcaseAddons.map((addon) => {
                        const qty = addonQtys[addon.id] ?? 0;
                        const isSelected = qty > 0;
                        const name = displayName(lang, addon.nameZh, addon.nameJa);
                        return (
                          <div
                            key={addon.id}
                            className="flex items-center gap-3 rounded-lg border border-brand-200 bg-white px-3 py-2"
                          >
                            <label className="flex flex-1 cursor-pointer items-center gap-2">
                              <input
                                type="checkbox"
                                className="admin-check"
                                checked={isSelected}
                                onChange={(e) => {
                                  setAddonQtys((prev) => ({
                                    ...prev,
                                    [addon.id]: e.target.checked ? 1 : 0
                                  }));
                                }}
                              />
                              <span className="text-sm text-brand-900">{name}</span>
                              <span className="text-xs text-brand-500">
                                +¥{addon.priceJpy.toLocaleString()} +{addon.durationIncreaseMin}min
                              </span>
                            </label>
                            {isSelected && addon.maxQty > 1 && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  className="admin-btn-ghost px-2 py-0.5 text-xs"
                                  onClick={() => setAddonQtys((prev) => ({ ...prev, [addon.id]: Math.max(1, qty - 1) }))}
                                >−</button>
                                <span className="w-6 text-center text-sm font-medium">{qty}</span>
                                <button
                                  type="button"
                                  className="admin-btn-ghost px-2 py-0.5 text-xs"
                                  onClick={() => setAddonQtys((prev) => ({ ...prev, [addon.id]: Math.min(addon.maxQty, qty + 1) }))}
                                >+</button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button className="admin-btn-primary px-3 py-1.5" type="submit">{t.save}</button>
                  <button className="admin-btn-ghost" type="button" onClick={() => { setEditingId(null); setShowcaseAddons([]); setAddonQtys({}); }}>{t.cancel}</button>
                </div>
              </form>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
