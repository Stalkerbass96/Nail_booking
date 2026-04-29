import PublicSiteFrame from "@/components/public-site-frame";
import LineManageForm from "@/components/line-manage-form";
import { pickText, resolveLang } from "@/lib/lang";

type Props = {
  searchParams: Promise<{ lang?: string }>;
};

export default async function LineManagePage({ searchParams }: Props) {
  const query = await searchParams;
  const lang = resolveLang(query?.lang);

  return (
    <PublicSiteFrame lang={lang} minimalHeader>
      <main className="mx-auto flex w-full max-w-md flex-col gap-3 px-4 py-4 sm:px-6 sm:py-8">
        <section className="section-panel section-panel-compact">
          <h1 className="section-title">
            {pickText(lang, "LINE \u7ba1\u7406", "LINE \u7ba1\u7406")}
          </h1>
          <p className="section-copy mt-2">
            {pickText(lang, "\u67e5\u770b\u5f53\u524d\u7ed1\u5b9a\u72b6\u6001\uff0c\u6216\u5728\u9700\u8981\u65f6\u89e3\u9664\u7ed1\u5b9a\u3002", "\u9023\u643a\u72b6\u614b\u306e\u78ba\u8a8d\u3068\u89e3\u9664\u304c\u3067\u304d\u307e\u3059\u3002")}
          </p>
        </section>

        <LineManageForm lang={lang} />
      </main>
    </PublicSiteFrame>
  );
}
