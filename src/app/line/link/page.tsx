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
    <PublicSiteFrame lang={lang}>
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
        <section className="section-panel">
          <p className="section-eyebrow">LINE Linking</p>
          <h1 className="section-title">
            {pickText(lang, "把 LINE 与你的预约身份连接起来。", "LINE と予約情報を安全に連携します。")}
          </h1>
          <p className="section-copy">
            {pickText(lang, "验证后会跳转到 LINE 官方确认页，绑定完成后店长就能在后台与你一对一沟通。", "確認後に LINE 公式の連携画面へ進み、完了すると店長が管理画面から 1 対 1 で対応できるようになります。")}
          </p>
        </section>

        <LineLinkForm lang={lang} sessionToken={sessionToken} />
      </main>
    </PublicSiteFrame>
  );
}
