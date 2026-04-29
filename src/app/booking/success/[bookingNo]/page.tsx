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
  const galleryHref = `/?lang=${lang}${entryToken ? `&entry=${entryToken}` : ""}`;

  return (
    <PublicSiteFrame lang={lang} entryToken={entryToken} minimalHeader>
      <main className="mx-auto flex w-full max-w-md px-4 py-4 sm:max-w-3xl sm:px-6 sm:py-8">
        <section className="success-panel success-panel-lite w-full">
          <div className="success-badge">{pickText(lang, "等待确认", "確認待ち")}</div>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-900 sm:text-3xl">
            {pickText(lang, "预约已经发送给店长", "予約を送信しました")}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-brand-700">
            {pickText(
              lang,
              "店长确认后会继续通过 LINE 联系你。先保留预约号，后续查看详情或沟通时都会用到。",
              "確認後のご案内はそのまま LINE に届きます。予約番号は詳細確認ややり取りで使うので控えておいてください。"
            )}
          </p>

          <div className="success-ticket success-ticket-lite">
            <span>{pickText(lang, "预约号", "予約番号")}</span>
            <strong>{bookingNo}</strong>
          </div>

          <div className="success-card-stack mt-4">
            <div className="compact-info-card">
              <p className="text-sm font-medium text-brand-900">{pickText(lang, "接下来会发生什么", "このあとについて")}</p>
              <p className="mt-2 text-sm leading-7 text-brand-700">
                {pickText(
                  lang,
                  "预约会先进入待确认状态。店长确认时间后，LINE 会自动通知你。",
                  "予約はまず確認待ちになります。時間が確定したら LINE で自動通知します。"
                )}
              </p>
            </div>
            <div className="compact-info-card">
              <p className="text-sm font-medium text-brand-900">{pickText(lang, "后续查看", "あとで確認する")}</p>
              <p className="mt-2 text-sm leading-7 text-brand-700">
                {pickText(
                  lang,
                  "如果你之后想看这笔预约的状态，可以直接打开详情页。",
                  "あとで状態を見たいときは、このまま詳細ページを開いて確認できます。"
                )}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <Link className="ui-btn-primary w-full" href={detailHref}>
              {pickText(lang, "查看预约详情", "予約詳細を見る")}
            </Link>
            <Link className="ui-btn-secondary w-full" href={galleryHref}>
              {pickText(lang, "继续看图墙", "ギャラリーに戻る")}
            </Link>
          </div>
        </section>
      </main>
    </PublicSiteFrame>
  );
}
