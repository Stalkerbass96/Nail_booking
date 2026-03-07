import Link from "next/link";
import PublicSiteFrame from "@/components/public-site-frame";
import { pickText, resolveLang } from "@/lib/lang";

type Props = {
  params: Promise<{ bookingNo: string }>;
  searchParams: Promise<{ lang?: string }>;
};

export default async function BookingSuccessPage({ params, searchParams }: Props) {
  const [{ bookingNo }, query] = await Promise.all([params, searchParams]);
  const lang = resolveLang(query?.lang);

  return (
    <PublicSiteFrame lang={lang}>
      <main className="mx-auto flex min-h-[70vh] w-full max-w-4xl items-center px-4 py-8 sm:px-6 sm:py-12">
        <section className="success-panel w-full">
          <div className="success-badge">CONFIRMED REQUEST</div>
          <h1 className="section-title">{pickText(lang, "预约请求已经提交。", "予約リクエストを受け付けました。")}</h1>
          <p className="section-copy mt-3">
            {pickText(lang, "当前状态通常为“待确认”。请保存预约号，后续可用邮箱 + 预约号查询。", "現在の状態は通常「未確認」です。予約番号を保存し、後からメールアドレス + 予約番号で確認してください。")}
          </p>

          <div className="success-ticket">
            <span>{pickText(lang, "预约号", "予約番号")}</span>
            <strong>{bookingNo}</strong>
          </div>

          <div className="success-grid">
            <div className="showcase-card">
              <strong>{pickText(lang, "下一步", "次のステップ")}</strong>
              <p>{pickText(lang, "店长会在后台确认预约。确认前该时段会为你保留。", "管理画面で予約確認が行われます。確認前でもその時間枠は確保されています。")}</p>
            </div>
            <div className="showcase-card">
              <strong>{pickText(lang, "如何再次查看", "あとで確認するには")}</strong>
              <p>{pickText(lang, "前往预约查询页，输入邮箱和预约号即可。", "予約確認ページでメールアドレスと予約番号を入力してください。")}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="ui-btn-primary" href={`/booking/lookup?lang=${lang}`}>
              {pickText(lang, "查询我的预约", "予約を確認する")}
            </Link>
            <Link className="ui-btn-secondary" href={`/services?lang=${lang}`}>
              {pickText(lang, "继续浏览服务", "メニュー一覧へ戻る")}
            </Link>
          </div>
        </section>
      </main>
    </PublicSiteFrame>
  );
}
