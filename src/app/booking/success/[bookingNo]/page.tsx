import Link from "next/link";
import PublicSiteFrame from "@/components/public-site-frame";
import { pickText, resolveLang } from "@/lib/lang";

type Props = {
  params: Promise<{ bookingNo: string }>;
  searchParams: Promise<{ lang?: string; entry?: string }>;
};

export default async function BookingSuccessPage({ params, searchParams }: Props) {
  const [{ bookingNo }, query] = await Promise.all([params, searchParams]);
  const lang = resolveLang(query?.lang);
  const entryToken = query?.entry?.trim() || undefined;
  const detailHref = `/booking/${bookingNo}?lang=${lang}${entryToken ? `&entry=${entryToken}` : ""}`;

  return (
    <PublicSiteFrame lang={lang} entryToken={entryToken}>
      <main className="mx-auto flex min-h-[70vh] w-full max-w-4xl items-center px-4 py-8 sm:px-6 sm:py-12">
        <section className="success-panel w-full">
          <div className="success-badge">PENDING CONFIRMATION</div>
          <h1 className="section-title">{pickText(lang, "\u9884\u7ea6\u8bf7\u6c42\u5df2\u7ecf\u63d0\u4ea4\u3002", "\u4e88\u7d04\u30ea\u30af\u30a8\u30b9\u30c8\u3092\u53d7\u3051\u4ed8\u3051\u307e\u3057\u305f\u3002")}</h1>
          <p className="section-copy mt-3">
            {pickText(lang, "\u5f53\u524d\u72b6\u6001\u901a\u5e38\u4e3a\u201c\u5f85\u786e\u8ba4\u201d\u3002\u7cfb\u7edf\u4f1a\u901a\u8fc7 LINE \u628a\u9884\u7ea6\u53f7\u548c\u8be6\u60c5\u94fe\u63a5\u53d1\u7ed9\u4f60\uff0c\u5e97\u957f\u786e\u8ba4\u540e\u4e5f\u4f1a\u518d\u6b21\u901a\u77e5\u3002", "\u73fe\u5728\u306e\u72b6\u614b\u306f\u901a\u5e38\u300c\u672a\u78ba\u8a8d\u300d\u3067\u3059\u3002\u4e88\u7d04\u756a\u53f7\u3068\u8a73\u7d30\u30ea\u30f3\u30af\u306f LINE \u306b\u5c4a\u304d\u3001\u5e97\u9577\u78ba\u8a8d\u5f8c\u3082\u518d\u5ea6\u901a\u77e5\u3055\u308c\u307e\u3059\u3002")}
          </p>

          <div className="success-ticket">
            <span>{pickText(lang, "\u9884\u7ea6\u53f7", "\u4e88\u7d04\u756a\u53f7")}</span>
            <strong>{bookingNo}</strong>
          </div>

          <div className="success-grid">
            <div className="showcase-card">
              <strong>{pickText(lang, "\u4e0b\u4e00\u6b65", "\u6b21\u306e\u30b9\u30c6\u30c3\u30d7")}</strong>
              <p>{pickText(lang, "\u5e97\u957f\u4f1a\u5728\u540e\u53f0\u786e\u8ba4\u9884\u7ea6\u3002\u786e\u8ba4\u524d\u8be5\u65f6\u6bb5\u4f1a\u4e3a\u4f60\u4fdd\u7559\u3002", "\u7ba1\u7406\u753b\u9762\u3067\u4e88\u7d04\u78ba\u8a8d\u304c\u884c\u308f\u308c\u307e\u3059\u3002\u78ba\u8a8d\u524d\u3067\u3082\u305d\u306e\u6642\u9593\u67a0\u306f\u78ba\u4fdd\u3055\u308c\u3066\u3044\u307e\u3059\u3002")}</p>
            </div>
            <div className="showcase-card">
              <strong>{pickText(lang, "\u67e5\u770b\u8be6\u60c5", "\u8a73\u7d30\u3092\u898b\u308b")}</strong>
              <p>{pickText(lang, "\u4f60\u4e5f\u53ef\u4ee5\u76f4\u63a5\u6253\u5f00\u9884\u7ea6\u8be6\u60c5\u94fe\u63a5\u67e5\u770b\u72b6\u6001\u3002", "\u4e88\u7d04\u8a73\u7d30\u30ea\u30f3\u30af\u3092\u958b\u3044\u3066\u3001\u73fe\u5728\u306e\u72b6\u614b\u3092\u78ba\u8a8d\u3059\u308b\u3053\u3068\u3082\u3067\u304d\u307e\u3059\u3002")}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="ui-btn-primary" href={detailHref}>
              {pickText(lang, "\u67e5\u770b\u9884\u7ea6\u8be6\u60c5", "\u4e88\u7d04\u8a73\u7d30\u3092\u898b\u308b")}
            </Link>
            <Link className="ui-btn-secondary" href={`/?lang=${lang}${entryToken ? `&entry=${entryToken}` : ""}`}>
              {pickText(lang, "\u8fd4\u56de\u56fe\u5899", "\u30ae\u30e3\u30e9\u30ea\u30fc\u3078\u623b\u308b")}
            </Link>
          </div>
        </section>
      </main>
    </PublicSiteFrame>
  );
}
