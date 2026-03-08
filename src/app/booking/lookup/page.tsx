import Link from "next/link";
import PublicSiteFrame from "@/components/public-site-frame";
import { pickText, resolveLang } from "@/lib/lang";

type Props = {
  searchParams: Promise<{
    lang?: string;
  }>;
};

export default async function BookingLookupPage({ searchParams }: Props) {
  const query = await searchParams;
  const lang = resolveLang(query?.lang);

  return (
    <PublicSiteFrame lang={lang}>
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
        <section className="section-panel">
          <p className="section-eyebrow">Legacy Lookup</p>
          <h1 className="section-title">{pickText(lang, "2.0 \u9ed8\u8ba4\u6539\u4e3a LINE + \u56fe\u5899\u8def\u5f84\u3002", "2.0 \u3067\u306f LINE + \u30ae\u30e3\u30e9\u30ea\u30fc\u5c0e\u7dda\u304c\u65e2\u5b9a\u7d4c\u8def\u3067\u3059\u3002")}</h1>
          <p className="section-copy">
            {pickText(lang, "\u5f53\u524d\u5efa\u8bae\u4ece LINE \u6d88\u606f\u4e2d\u7684\u9884\u7ea6\u8be6\u60c5\u94fe\u63a5\u67e5\u770b\u8bb0\u5f55\u3002\u8fd9\u4e2a\u9875\u9762\u53ea\u4f5c\u4e3a\u65e7\u6d41\u7a0b\u517c\u5bb9\u4fdd\u7559\u3002", "\u73fe\u5728\u306f LINE \u30e1\u30c3\u30bb\u30fc\u30b8\u5185\u306e\u4e88\u7d04\u8a73\u7d30\u30ea\u30f3\u30af\u304b\u3089\u78ba\u8a8d\u3059\u308b\u3053\u3068\u3092\u63a8\u5968\u3057\u307e\u3059\u3002\u3053\u306e\u753b\u9762\u306f\u65e7\u30d5\u30ed\u30fc\u4e92\u63db\u306e\u305f\u3081\u306b\u306e\u307f\u6b8b\u3057\u3066\u3044\u307e\u3059\u3002")}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="ui-btn-primary" href={`/?lang=${lang}`}>
              {pickText(lang, "\u8fd4\u56de\u56fe\u5899\u9996\u9875", "\u30ae\u30e3\u30e9\u30ea\u30fc\u30db\u30fc\u30e0\u3078")}
            </Link>
            <Link className="ui-btn-secondary" href={`/services?lang=${lang}`}>
              {pickText(lang, "\u67e5\u770b\u5957\u9910", "\u30e1\u30cb\u30e5\u30fc\u4e00\u89a7")}
            </Link>
          </div>
        </section>
      </main>
    </PublicSiteFrame>
  );
}
