import Link from "next/link";
import PublicSiteFrame from "@/components/public-site-frame";
import { pickText, resolveLang } from "@/lib/lang";

type Props = {
  searchParams: Promise<{
    lang?: string;
  }>;
};

const FEATURES = {
  zh: [
    ["套餐与加项", "支持套餐、图片、描述与加项组合，前台展示更完整。"],
    ["预约不重叠", "待确认和已确认都会占用档期，自动拦截重复预约。"],
    ["单店管理后台", "预约、客户、积分、系统设置都集中在一个后台里。"]
  ],
  ja: [
    ["メニュー + 追加オプション", "メニュー、画像、説明、追加オプションを一体で管理できます。"],
    ["重複予約を防止", "未確認でも枠を占有し、重複予約を自動で防ぎます。"],
    ["単店向け管理画面", "予約、顧客、ポイント、設定を一つの管理画面で扱えます。"]
  ]
} as const;

export default async function HomePage({ searchParams }: Props) {
  const query = await searchParams;
  const lang = resolveLang(query?.lang);

  return (
    <PublicSiteFrame lang={lang}>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
        <section className="hero-panel">
          <div className="hero-copy">
            <p className="hero-eyebrow">Boutique Nail Flow</p>
            <h1 className="hero-title">
              {pickText(lang, "把预约体验做得像商业产品，而不是表单堆砌。", "予約体験を、単なるフォームではなく商用プロダクトの品質へ。")}
            </h1>
            <p className="hero-text">
              {pickText(
                lang,
                "从服务展示、可用时段选择到后台管理，这个系统围绕单店美甲场景做了更轻、更清楚的闭环。",
                "メニュー閲覧、空き時間選択、管理画面まで、単店ネイル運営に必要な流れを軽く分かりやすくまとめています。"
              )}
            </p>
            <div className="hero-actions">
              <Link className="ui-btn-primary" href={`/services?lang=${lang}`}>
                {pickText(lang, "浏览服务与套餐", "メニューを見る")}
              </Link>
              <Link className="ui-btn-secondary" href={`/booking?lang=${lang}`}>
                {pickText(lang, "直接预约", "予約する")}
              </Link>
              <Link className="ui-btn-secondary" href={`/booking/lookup?lang=${lang}`}>
                {pickText(lang, "查询已有预约", "予約を確認する")}
              </Link>
            </div>
          </div>

          <aside className="hero-aside">
            <div className="hero-metric-card">
              <span>{pickText(lang, "支持语言", "対応言語")}</span>
              <strong>{pickText(lang, "中文 / 日文", "中国語 / 日本語")}</strong>
            </div>
            <div className="hero-metric-card">
              <span>{pickText(lang, "预约模型", "予約モデル")}</span>
              <strong>{pickText(lang, "单店 + 单技师", "単店 + 単独担当")}</strong>
            </div>
            <div className="hero-metric-card">
              <span>{pickText(lang, "交易方式", "決済方式")}</span>
              <strong>{pickText(lang, "线下结算", "店頭決済")}</strong>
            </div>
          </aside>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {FEATURES[lang].map(([title, body]) => (
            <article key={title} className="feature-card">
              <p className="feature-kicker">Core</p>
              <h2 className="feature-title">{title}</h2>
              <p className="feature-text">{body}</p>
            </article>
          ))}
        </section>

        <section className="showcase-panel">
          <div>
            <p className="section-eyebrow">Front to Back</p>
            <h2 className="section-title">
              {pickText(lang, "顾客看得顺、店长管得住。", "お客様には分かりやすく、店長には管理しやすく。")}
            </h2>
          </div>
          <div className="showcase-grid">
            <div className="showcase-card">
              <strong>{pickText(lang, "前台体验", "フロント体験")}</strong>
              <p>{pickText(lang, "看服务、选加项、挑时间、提交预约，一条路径完成。", "メニュー確認、追加選択、時間選択、予約作成までを一つの流れで完了できます。")}</p>
            </div>
            <div className="showcase-card">
              <strong>{pickText(lang, "后台体验", "管理体験")}</strong>
              <p>{pickText(lang, "预约、分类、套餐、客户、积分和系统规则都集中管理。", "予約、カテゴリ、メニュー、顧客、ポイント、システム設定を一元管理できます。")}</p>
            </div>
          </div>
        </section>
      </main>
    </PublicSiteFrame>
  );
}
