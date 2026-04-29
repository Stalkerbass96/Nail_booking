import PublicSiteFrame from "@/components/public-site-frame";
import LineLinkForm from "@/components/line-link-form";
import { pickText, resolveLang } from "@/lib/lang";

type Props = {
  searchParams: Promise<{ lang?: string; session?: string }>;
};

export default async function LineLinkPage({ searchParams }: Props) {
  const query = await searchParams;
  const lang = resolveLang(query?.lang);
  const sessionToken = typeof query?.session === "string" ? query.session : "";

  return (
    <PublicSiteFrame lang={lang} minimalHeader>
      <main className="mx-auto flex w-full max-w-md flex-col gap-3 px-4 py-4 sm:px-6 sm:py-8">
        <section className="section-panel section-panel-compact">
          <h1 className="section-title">
            {pickText(lang, "\u7ed1\u5b9a LINE", "LINE \u9023\u643a")}
          </h1>
          <p className="section-copy mt-2">
            {pickText(lang, "\u8f93\u5165\u9884\u7ea6\u4fe1\u606f\u540e\u7ee7\u7eed\u5230 LINE \u786e\u8ba4\u9875\u3002", "\u4e88\u7d04\u60c5\u5831\u3092\u5165\u529b\u3057\u3066 LINE \u306e\u78ba\u8a8d\u753b\u9762\u3078\u9032\u307f\u307e\u3059\u3002")}
          </p>
        </section>

        <LineLinkForm lang={lang} sessionToken={sessionToken} />
      </main>
    </PublicSiteFrame>
  );
}
