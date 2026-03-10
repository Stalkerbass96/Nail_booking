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
    <PublicSiteFrame lang={lang} entryToken={entryToken}>
      <main className="mx-auto flex min-h-[72vh] w-full max-w-4xl items-center px-4 py-8 sm:px-6 sm:py-12">
        <section className="success-panel w-full">
          <div className="success-badge">
            {pickText(lang, "待确认", "未確認")}
          </div>
          <h1 className="section-title">
            {pickText(lang, "预约请求已经提交", "予約リクエストを受け付けました")}
          </h1>
          <p className="section-copy mt-3 max-w-2xl">
            {pickText(
              lang,
              "时间已经为你暂时保留。店长确认后，系统会继续通过 LINE 把结果和详情链接发给你。",
              "時間枠は一時的に確保されています。店側で確認が完了すると、結果と詳細リンクが LINE に届きます。"
            )}
          </p>

          <div className="success-ticket">
            <span>{pickText(lang, "预约号", "予約番号")}</span>
            <strong>{bookingNo}</strong>
          </div>

          <div className="success-grid mt-5">
            <div className="showcase-card">
              <strong>{pickText(lang, "现在会发生什么", "この後の流れ")}</strong>
              <p>
                {pickText(
                  lang,
                  "店长会在后台确认预约。确认前，这个时段会继续占用，不会被其他预约覆盖。",
                  "管理画面で予約確認が行われます。確認前でも、この時間枠は他の予約に開放されません。"
                )}
              </p>
            </div>
            <div className="showcase-card">
              <strong>{pickText(lang, "查看方式", "確認方法")}</strong>
              <p>
                {pickText(
                  lang,
                  "你可以等 LINE 通知，也可以直接打开预约详情页查看当前状态。",
                  "LINE 通知を待つことも、予約詳細ページを開いて状態を確認することもできます。"
                )}
              </p>
            </div>
          </div>

          <div className="admin-inline-actions mt-6 max-w-[34rem]">
            <Link className="ui-btn-primary" href={detailHref}>
              {pickText(lang, "查看预约详情", "予約詳細を見る")}
            </Link>
            <Link className="ui-btn-secondary" href={galleryHref}>
              {pickText(lang, "继续查看图墙", "ギャラリーに戻る")}
            </Link>
          </div>
        </section>
      </main>
    </PublicSiteFrame>
  );
}
