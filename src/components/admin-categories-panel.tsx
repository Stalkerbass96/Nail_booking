"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Lang } from "@/lib/lang";

type CategoryItem = {
  id: string;
  nameZh: string;
  nameJa: string;
  sortOrder: number;
  isActive: boolean;
  packageCount: number;
  activePackageCount: number;
};

type CategoryFormState = {
  nameZh: string;
  nameJa: string;
  sortOrder: string;
  isActive: boolean;
};

type Props = {
  lang: Lang;
};

const TEXT = {
  zh: {
    title: "分类管理",
    refresh: "刷新",
    loading: "加载中...",
    createTitle: "新建分类",
    nameZh: "中文名",
    nameJa: "日文名",
    sortOrder: "排序",
    create: "新建分类",
    selectAll: "全选",
    batchEnable: "批量启用",
    batchDisable: "批量停用",
    packageUsage: "套餐",
    active: "启用",
    yes: "是",
    no: "否",
    moveUp: "上移",
    moveDown: "下移",
    edit: "编辑",
    save: "保存",
    cancel: "取消",
    loadFailed: "加载分类失败",
    createFailed: "创建失败",
    updateFailed: "更新失败",
    batchFailed: "批量更新失败",
    reorderFailed: "排序失败",
    empty: "暂无分类"
  },
  ja: {
    title: "カテゴリ管理",
    refresh: "更新",
    loading: "読み込み中...",
    createTitle: "カテゴリ作成",
    nameZh: "中国語名",
    nameJa: "日本語名",
    sortOrder: "並び順",
    create: "作成",
    selectAll: "すべて選択",
    batchEnable: "一括有効化",
    batchDisable: "一括無効化",
    packageUsage: "メニュー",
    active: "有効",
    yes: "はい",
    no: "いいえ",
    moveUp: "上へ",
    moveDown: "下へ",
    edit: "編集",
    save: "保存",
    cancel: "キャンセル",
    loadFailed: "カテゴリの読み込みに失敗しました",
    createFailed: "作成に失敗しました",
    updateFailed: "更新に失敗しました",
    batchFailed: "一括更新に失敗しました",
    reorderFailed: "並び替えに失敗しました",
    empty: "カテゴリはありません"
  }
};

function createEmptyForm(): CategoryFormState {
  return {
    nameZh: "",
    nameJa: "",
    sortOrder: "0",
    isActive: true
  };
}

function fromItem(item: CategoryItem): CategoryFormState {
  return {
    nameZh: item.nameZh,
    nameJa: item.nameJa,
    sortOrder: String(item.sortOrder),
    isActive: item.isActive
  };
}

export default function AdminCategoriesPanel({ lang }: Props) {
  const t = TEXT[lang];

  const [items, setItems] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [createForm, setCreateForm] = useState<CategoryFormState>(createEmptyForm());

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CategoryFormState>(createEmptyForm());

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const orderedItems = useMemo(
    () => [...items].sort((a, b) => (a.sortOrder - b.sortOrder) || a.id.localeCompare(b.id)),
    [items]
  );

  function patchCreateForm(next: Partial<CategoryFormState>) {
    setCreateForm((prev) => ({ ...prev, ...next }));
  }

  function patchEditForm(next: Partial<CategoryFormState>) {
    setEditForm((prev) => ({ ...prev, ...next }));
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function setAllSelected(checked: boolean) {
    setSelectedIds(checked ? orderedItems.map((item) => item.id) : []);
  }

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t.loadFailed);
      const nextItems: CategoryItem[] = data.items ?? [];
      setItems(nextItems);

      if (editingId) {
        const target = nextItems.find((item) => item.id === editingId);
        if (target) {
          setEditForm(fromItem(target));
        } else {
          setEditingId(null);
          setEditForm(createEmptyForm());
        }
      }

      setSelectedIds((prev) => prev.filter((id) => nextItems.some((item) => item.id === id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [editingId, t.loadFailed]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function serializeForm(form: CategoryFormState) {
    return {
      nameZh: form.nameZh.trim(),
      nameJa: form.nameJa.trim(),
      sortOrder: Number.parseInt(form.sortOrder, 10) || 0,
      isActive: form.isActive
    };
  }

  async function createCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(serializeForm(createForm))
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t.createFailed);

      setCreateForm(createEmptyForm());
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.createFailed);
    }
  }

  function startEdit(item: CategoryItem) {
    setEditingId(item.id);
    setEditForm(fromItem(item));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(createEmptyForm());
  }

  async function saveEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId) return;

    setError("");

    try {
      const res = await fetch(`/api/admin/categories/${editingId}`, {
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

  async function batchSetActive(isActive: boolean) {
    if (selectedIds.length === 0) return;

    setError("");
    try {
      const res = await fetch("/api/admin/categories/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setActive", ids: selectedIds, isActive })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t.batchFailed);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.batchFailed);
    }
  }

  async function swapSortOrder(index: number, direction: -1 | 1) {
    const target = orderedItems[index];
    const other = orderedItems[index + direction];
    if (!target || !other) return;

    setError("");
    try {
      const res = await fetch("/api/admin/categories/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "setSortOrder",
          items: [
            { id: target.id, sortOrder: other.sortOrder },
            { id: other.id, sortOrder: target.sortOrder }
          ]
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t.reorderFailed);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.reorderFailed);
    }
  }

  const allChecked = orderedItems.length > 0 && selectedIds.length === orderedItems.length;

  return (
    <section className="admin-panel-shell">
      <div className="flex items-center justify-between">
        <h2 className="admin-section-title">{t.title}</h2>
        <button className="admin-btn-ghost" onClick={() => void refresh()} type="button">
          {t.refresh}
        </button>
      </div>

      {error ? <p className="admin-danger">{error}</p> : null}
      {loading ? <p className="ui-state-info" aria-live="polite">{t.loading}</p> : null}

      <form className="admin-subsection" onSubmit={createCategory}>
        <p className="font-medium text-brand-900">{t.createTitle}</p>

        <div className="grid gap-3 md:grid-cols-4">
          <input
            className="admin-input-sm"
            placeholder={t.nameZh}
            value={createForm.nameZh}
            onChange={(e) => patchCreateForm({ nameZh: e.target.value })}
          />
          <input
            className="admin-input-sm"
            placeholder={t.nameJa}
            value={createForm.nameJa}
            onChange={(e) => patchCreateForm({ nameJa: e.target.value })}
          />
          <input
            className="admin-input-sm"
            placeholder={t.sortOrder}
            value={createForm.sortOrder}
            onChange={(e) => patchCreateForm({ sortOrder: e.target.value })}
          />
          <button className="admin-btn-primary" type="submit">
            {t.create}
          </button>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label className="admin-btn-ghost">
          <input
            className="admin-check"
            type="checkbox"
            checked={allChecked}
            onChange={(e) => setAllSelected(e.target.checked)}
          />
          {t.selectAll}
        </label>

        <button className="admin-btn-ghost" onClick={() => void batchSetActive(true)} type="button">
          {t.batchEnable}
        </button>
        <button className="admin-btn-ghost" onClick={() => void batchSetActive(false)} type="button">
          {t.batchDisable}
        </button>
      </div>

      <div className="mt-4 grid gap-3">
        {!loading && orderedItems.length === 0 ? <p className="ui-state-info">{t.empty}</p> : null}
        {orderedItems.map((item, index) => (
          <article key={item.id} className="admin-item">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="grid gap-1 text-sm text-brand-800">
                <label>
                  <input
                    className="admin-check"
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => toggleSelect(item.id)}
                  />
                  {item.nameZh} / {item.nameJa}
                </label>
                <p>
                  {t.sortOrder}: {item.sortOrder} · {t.active}: {item.isActive ? t.yes : t.no}
                </p>
                <p>
                  {t.packageUsage}: {item.activePackageCount}/{item.packageCount}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button className="admin-btn-ghost" onClick={() => void swapSortOrder(index, -1)} type="button">
                  {t.moveUp}
                </button>
                <button className="admin-btn-ghost" onClick={() => void swapSortOrder(index, 1)} type="button">
                  {t.moveDown}
                </button>
                <button className="admin-btn-ghost" onClick={() => startEdit(item)} type="button">
                  {t.edit}
                </button>
              </div>
            </div>

            {editingId === item.id ? (
              <form className="mt-3 grid gap-3 rounded-xl border border-brand-100 p-3" onSubmit={saveEdit}>
                <div className="grid gap-3 md:grid-cols-3">
                  <input
                    className="admin-input-sm"
                    value={editForm.nameZh}
                    onChange={(e) => patchEditForm({ nameZh: e.target.value })}
                  />
                  <input
                    className="admin-input-sm"
                    value={editForm.nameJa}
                    onChange={(e) => patchEditForm({ nameJa: e.target.value })}
                  />
                  <input
                    className="admin-input-sm"
                    value={editForm.sortOrder}
                    onChange={(e) => patchEditForm({ sortOrder: e.target.value })}
                  />
                </div>

                <label className="text-sm text-brand-800">
                  <input
                    className="admin-check"
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(e) => patchEditForm({ isActive: e.target.checked })}
                  />
                  {t.active}
                </label>

                <div className="flex gap-2">
                  <button className="admin-btn-primary px-3 py-1.5" type="submit">
                    {t.save}
                  </button>
                  <button className="admin-btn-ghost" type="button" onClick={cancelEdit}>
                    {t.cancel}
                  </button>
                </div>
              </form>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

