import AdminLinePanel from "@/components/admin-line-panel";
import AdminNav from "@/components/admin-nav";
import { resolveLang } from "@/lib/lang";

type Props = {
  searchParams: Promise<{ lang?: string; userId?: string }>;
};

export default async function AdminLinePage({ searchParams }: Props) {
  const query = await searchParams;
  const lang = resolveLang(query?.lang);
  const initialUserId = query?.userId?.trim() || "";

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <AdminNav lang={lang} />
      <AdminLinePanel lang={lang} initialUserId={initialUserId} />
    </main>
  );
}
