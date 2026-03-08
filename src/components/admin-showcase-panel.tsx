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
};

type Props = {
  lang: Lang;
};

const TEXT = {
  zh: {
    title: "\u56fe\u5899\u7ba1\u7406",
    refresh: "\u5237\u65b0",
    loading: "\u52a0\u8f7d\u4e2d...",
    saving: "\u4fdd\u5b58\u4e2d...",
    createTitle: "\u65b0\u5efa\u56fe\u5899\u9879",
    titleZh: "\u4e2d\u6587\u6807\u9898",
    titleJa: "\u65e5\u6587\u6807\u9898",
    descriptionZh: "\u4e2d\u6587\u8bf4\u660e",
    descriptionJa: "\u65e5\u6587\u8bf4\u660e",
    imageUrl: "\u56fe\u7247 URL",
    sortOrder: "\u6392\u5e8f",
    create: "\u65b0\u5efa\u56fe\u5899\u9879",
    edit: "\u7f16\u8f91",
    save: "\u4fdd\u5b58",
    cancel: "\u53d6\u6d88",
    published: "\u4e0a\u67b6",
    unpublished: "\u4e0b\u67b6",
    appointments: "\u6765\u6e90\u9884\u7ea6",
    loadFailed: "\u52a0\u8f7d\u56fe\u5899\u5931\u8d25",
    createFailed: "\u521b\u5efa\u5931\u8d25",
    updateFailed: "\u66f4\u65b0\u5931\u8d25",
    reorderFailed: "\u6392\u5e8f\u8c03\u6574\u5931\u8d25",
    saveSuccess: "\u56fe\u5899\u9879\u5df2\u4fdd\u5b58",
    reorderSuccess: "\u56fe\u5899\u6392\u5e8f\u5df2\u66f4\u65b0",
    empty: "\u6682\u65e0\u56fe\u5899\u9879",
    activePackageMissing: "\u5173\u8054\u5957\u9910\u5df2\u505c\u7528",
    moveUp: "\u4e0a\u79fb",
    moveDown: "\u4e0b\u79fb",
    sortHint: "\u4f18\u5148\u7528\u4e0a\u79fb / \u4e0b\u79fb\u8c03\u6574\u9996\u9875\u56fe\u5899\u987a\u5e8f\u3002"
  },
  ja: {
    title: "\u30ae\u30e3\u30e9\u30ea\u30fc\u7ba1\u7406",
    refresh: "\u66f4\u65b0",
    loading: "\u8aad\u307f\u8fbc\u307f\u4e2d...",
    saving: "\u4fdd\u5b58\u4e2d...",
    createTitle: "\u30ae\u30e3\u30e9\u30ea\u30fc\u9805\u76ee\u4f5c\u6210",
    titleZh: "\u4e2d\u56fd\u8a9e\u30bf\u30a4\u30c8\u30eb",
    titleJa: "\u65e5\u672c\u8a9e\u30bf\u30a4\u30c8\u30eb",
    descriptionZh: "\u4e2d\u56fd\u8a9e\u8aac\u660e",
    descriptionJa: "\u65e5\u672c\u8a9e\u8aac\u660e",
    imageUrl: "\u753b\u50cf URL",
    sortOrder: "\u4e26\u3073\u9806",
    create: "\u4f5c\u6210",
    edit: "\u7de8\u96c6",
    save: "\u4fdd\u5b58",
    cancel: "\u30ad\u30e3\u30f3\u30bb\u30eb",
    published: "\u516c\u958b",
    unpublished: "\u975e\u516c\u958b",
    appointments: "\u4e88\u7d04\u6d41\u5165",
    loadFailed: "\u30ae\u30e3\u30e9\u30ea\u30fc\u306e\u8aad\u307f\u8fbc\u307f\u306b\u5931\u6557\u3057\u307e\u3057\u305f",
    createFailed: "\u4f5c\u6210\u306b\u5931\u6557\u3057\u307e\u3057\u305f",
    updateFailed: "\u66f4\u65b0\u306b\u5931\u6557\u3057\u307e\u3057\u305f",
    reorderFailed: "\u4e26\u3073\u66ff\u3048\u306b\u5931\u6557\u3057\u307e\u3057\u305f",
    saveSuccess: "\u30ae\u30e3\u30e9\u30ea\u30fc\u9805\u76ee\u3092\u4fdd\u5b58\u3057\u307e\u3057\u305f",
    reorderSuccess: "\u30ae\u30e3\u30e9\u30ea\u30fc\u306e\u4e26\u3073\u9806\u3092\u66f4\u65b0\u3057\u307e\u3057\u305f",
    empty: "\u30ae\u30e3\u30e9\u30ea\u30fc\u9805\u76ee\u306f\u3042\u308a\u307e\u305b\u3093",
    activePackageMissing: "\u9023\u643a\u30e1\u30cb\u30e5\u30fc\u306f\u7121\u52b9\u3067\u3059",
    moveUp: "\u4e0a\u3078",
    moveDown: "\u4e0b\u3078",
    sortHint: "\u30db\u30fc\u30e0\u30ae\u30e3\u30e9\u30ea\u30fc\u306e\u9806\u756a\u306f\u4e0a\u3078 / \u4e0b\u3078\u3067\u7c21\u5358\u306b\u8abf\u6574\u3067\u304d\u307e\u3059\u3002"
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
    isPublished: true
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
    isPublished: item.isPublished
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

      const nextItems = showcaseData.items ?? [];
      const nextCategories = categoryData.items ?? [];
      const nextPackages = (packageData.items ?? []).map((item: any) => ({
        id: item.id,
        nameZh: item.nameZh,
        nameJa: item.nameJa,
        priceJpy: item.priceJpy,
        durationMin: item.durationMin
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
        const target = nextItems.find((item: ShowcaseItem) => item.id === editingId);
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
      setEditingId(null);
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

  return (
    <section className="admin-panel-shell">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="admin-section-title">{t.title}</h2>
          <p className="admin-note mt-2">{t.sortHint}</p>
        </div>
        <button className="admin-btn-ghost" onClick={() => void refresh()} type="button">
          {t.refresh}
        </button>
      </div>

      {error ? <p className="admin-danger">{error}</p> : null}
      {notice ? <p className="admin-success">{notice}</p> : null}
      {loading ? <p className="ui-state-info">{t.loading}</p> : null}
      {saving ? <p className="ui-state-info">{t.saving}</p> : null}

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
              <option key={item.id} value={item.id}>{displayName(lang, item.nameZh, item.nameJa)} · {item.priceJpy} JPY</option>
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
        <button className="admin-btn-primary w-fit" type="submit">{t.create}</button>
      </form>

      <div className="mt-4 grid gap-3">
        {!loading && sortedItems.length === 0 ? <p className="ui-state-info">{t.empty}</p> : null}
        {sortedItems.map((item, index) => (
          <article key={item.id} className="admin-item">
            <div className="grid gap-4 lg:grid-cols-[180px_1fr]">
              <div className="overflow-hidden rounded-2xl border border-brand-100 bg-brand-50">
                <div className="aspect-[4/5] w-full bg-cover bg-center" style={{ backgroundImage: "url(" + item.imageUrl + ")" }} />
              </div>
              <div className="grid gap-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-brand-900">{displayName(lang, item.titleZh, item.titleJa)}</p>
                    <p className="text-sm text-brand-700">{displayName(lang, item.category.nameZh, item.category.nameJa)} · {displayName(lang, item.servicePackage.nameZh, item.servicePackage.nameJa)} · {item.servicePackage.priceJpy} JPY</p>
                    <p className="text-sm text-brand-700">{item.isPublished ? t.published : t.unpublished} · {t.appointments} {item.appointmentCount} · #{item.sortOrder}</p>
                    {!item.servicePackage.isActive ? <p className="text-sm text-amber-700">{t.activePackageMissing}</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button className="admin-btn-ghost" onClick={() => void moveItem(item.id, -1)} type="button" disabled={index === 0 || saving}>{t.moveUp}</button>
                    <button className="admin-btn-ghost" onClick={() => void moveItem(item.id, 1)} type="button" disabled={index === sortedItems.length - 1 || saving}>{t.moveDown}</button>
                    <button className="admin-btn-ghost" onClick={() => { setEditingId(item.id); setEditForm(fromItem(item)); }} type="button">{t.edit}</button>
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
                      <option key={pkg.id} value={pkg.id}>{displayName(lang, pkg.nameZh, pkg.nameJa)} · {pkg.priceJpy} JPY</option>
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
                <div className="flex gap-2">
                  <button className="admin-btn-primary px-3 py-1.5" type="submit">{t.save}</button>
                  <button className="admin-btn-ghost" type="button" onClick={() => setEditingId(null)}>{t.cancel}</button>
                </div>
              </form>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
