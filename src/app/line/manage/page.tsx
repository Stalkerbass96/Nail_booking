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
    <PublicSiteFrame lang={lang}>
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
        <section className="section-panel">
          <p className="section-eyebrow">LINE Manage</p>
          <h1 className="section-title">
            {pickText(lang, "查看或解除 LINE 绑定。", "LINE 連携の確認と解除。")}
          </h1>
          <p className="section-copy">
            {pickText(lang, "如果你更换了 LINE、想重新绑定，或不希望继续接收店长消息，可以在这里解除绑定。", "LINE を変更したい時、再連携したい時、または店長からの連絡を止めたい時はここで解除できます。")}
          </p>
        </section>

        <LineManageForm lang={lang} />
      </main>
    </PublicSiteFrame>
  );
}
