import AdminLoginForm from "@/components/admin-login-form";
import { getAdminFromServerCookies } from "@/lib/admin-auth";
import { resolveLang } from "@/lib/lang";
import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ next?: string; lang?: string }>;
};

const TEXT = {
  zh: {
    title: "\u540e\u53f0\u767b\u5f55",
    desc: "\u8f93\u5165\u7ba1\u7406\u5458\u8d26\u53f7\u8fdb\u5165\u5de5\u4f5c\u53f0\u3002"
  },
  ja: {
    title: "\u7ba1\u7406\u30ed\u30b0\u30a4\u30f3",
    desc: "\u7ba1\u7406\u8005\u30a2\u30ab\u30a6\u30f3\u30c8\u3067\u30ef\u30fc\u30af\u30b9\u30da\u30fc\u30b9\u306b\u5165\u308a\u307e\u3059\u3002"
  }
};

function ensureLang(nextPath: string, lang: "zh" | "ja"): string {
  if (!nextPath.startsWith("/")) return `/admin?lang=${lang}`;

  const [pathname, queryString = ""] = nextPath.split("?");
  const params = new URLSearchParams(queryString);
  params.set("lang", lang);
  const next = params.toString();

  return next ? `${pathname}?${next}` : pathname;
}

export default async function AdminLoginPage({ searchParams }: Props) {
  const query = await searchParams;
  const lang = resolveLang(query?.lang);
  const t = TEXT[lang];

  const admin = await getAdminFromServerCookies();
  if (admin) {
    redirect(`/admin?lang=${lang}`);
  }

  const rawNext = query?.next && query.next.startsWith("/") ? query.next : "/admin";
  const nextPath = ensureLang(rawNext, lang);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-8 sm:px-5">
      <section className="admin-panel-shell w-full">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-400">Tsuzuri</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-950">{t.title}</h1>
        <p className="mt-2 text-sm leading-6 text-neutral-500">{t.desc}</p>

        <div className="mt-6">
          <AdminLoginForm nextPath={nextPath} lang={lang} />
        </div>
      </section>
    </main>
  );
}
