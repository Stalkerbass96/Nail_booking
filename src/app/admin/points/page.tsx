import AdminNav from "@/components/admin-nav";
import AdminPointsPanel from "@/components/admin-points-panel";
import { resolveLang } from "@/lib/lang";

type Props = {
  searchParams: Promise<{ lang?: string }>;
};

export default async function AdminPointsPage({ searchParams }: Props) {
  const query = await searchParams;
  const lang = resolveLang(query?.lang);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <AdminNav lang={lang} />
      <AdminPointsPanel lang={lang} />
    </main>
  );
}
