import Link from "next/link";
import { AppointmentStatus } from "@prisma/client";
import PublicSiteFrame from "@/components/public-site-frame";
import { prisma } from "@/lib/db";
import { pickText, resolveLang } from "@/lib/lang";

type Props = {
  params: Promise<{ bookingNo: string }>;
  searchParams: Promise<{ lang?: string; entry?: string }>;
};

const STATUS_TEXT = {
  zh: {
    pending: "\u5f85\u786e\u8ba4",
    confirmed: "\u5df2\u786e\u8ba4",
    completed: "\u5df2\u5b8c\u6210",
    canceled: "\u5df2\u53d6\u6d88"
  },
  ja: {
    pending: "\u672a\u78ba\u8a8d",
    confirmed: "\u78ba\u8a8d\u6e08\u307f",
    completed: "\u5b8c\u4e86",
    canceled: "\u30ad\u30e3\u30f3\u30bb\u30eb"
  }
} as const;

export default async function PublicBookingDetailPage({ params, searchParams }: Props) {
  const [{ bookingNo }, query] = await Promise.all([params, searchParams]);
  const lang = resolveLang(query?.lang);
  const entryToken = query?.entry?.trim() || undefined;

  const appointment = await prisma.appointment.findUnique({
    where: { bookingNo },
    include: {
      customer: {
        select: { name: true }
      },
      servicePackage: {
        select: { nameZh: true, nameJa: true, priceJpy: true, durationMin: true }
      },
      showcaseItem: {
        select: { titleZh: true, titleJa: true, imageUrl: true }
      }
    }
  });

  return (
    <PublicSiteFrame lang={lang} entryToken={entryToken}>
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
        {!appointment ? (
          <section className="section-panel">
            <p className="ui-state-error mt-0">{pickText(lang, "\u6ca1\u6709\u627e\u5230\u5bf9\u5e94\u9884\u7ea6\u3002", "\u8a72\u5f53\u3059\u308b\u4e88\u7d04\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093\u3002")}</p>
          </section>
        ) : (
          <>
            <section className="success-panel">
              <div className="success-badge">
                {appointment.status === AppointmentStatus.pending ? "PENDING" : "BOOKING DETAIL"}
              </div>
              <h1 className="section-title">{pickText(lang, "\u9884\u7ea6\u8be6\u60c5", "\u4e88\u7d04\u8a73\u7d30")}</h1>
              <p className="section-copy mt-3">
                {pickText(lang, "\u8fd9\u4e2a\u516c\u5f00\u8be6\u60c5\u94fe\u63a5\u53ef\u4ece LINE \u6d88\u606f\u4e2d\u6253\u5f00\u67e5\u770b\u3002", "\u3053\u306e\u516c\u958b\u8a73\u7d30\u30ea\u30f3\u30af\u306f LINE \u30e1\u30c3\u30bb\u30fc\u30b8\u304b\u3089\u958b\u3044\u3066\u78ba\u8a8d\u3067\u304d\u307e\u3059\u3002")}
              </p>
              <div className="success-ticket">
                <span>{pickText(lang, "\u9884\u7ea6\u53f7", "\u4e88\u7d04\u756a\u53f7")}</span>
                <strong>{appointment.bookingNo}</strong>
              </div>
            </section>

            <section className="detail-hero-panel">
              <div className="detail-hero-media min-h-[18rem]" style={appointment.showcaseItem?.imageUrl ? { backgroundImage: `linear-gradient(180deg, rgba(47,29,39,0.06), rgba(47,29,39,0.24)), url(${appointment.showcaseItem.imageUrl})` } : undefined}>
                <span>{appointment.showcaseItem ? (lang === "ja" ? appointment.showcaseItem.titleJa : appointment.showcaseItem.titleZh) : pickText(lang, "\u9884\u7ea6\u8bb0\u5f55", "\u4e88\u7d04\u8a18\u9332")}</span>
              </div>
              <div className="grid gap-4">
                <div>
                  <p className="section-eyebrow">Status</p>
                  <h2 className="text-3xl font-semibold text-brand-900">{STATUS_TEXT[lang][appointment.status]}</h2>
                </div>
                <div className="grid gap-3 text-sm text-brand-800">
                  <div className="summary-row"><dt>{pickText(lang, "\u987e\u5ba2", "\u9867\u5ba2")}</dt><dd>{appointment.customer.name}</dd></div>
                  <div className="summary-row"><dt>{pickText(lang, "\u5957\u9910", "\u30e1\u30cb\u30e5\u30fc")}</dt><dd>{lang === "ja" ? appointment.servicePackage.nameJa : appointment.servicePackage.nameZh}</dd></div>
                  <div className="summary-row"><dt>{pickText(lang, "\u65f6\u95f4", "\u6642\u9593")}</dt><dd>{new Intl.DateTimeFormat(lang === "ja" ? "ja-JP" : "zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(appointment.startAt)}</dd></div>
                  <div className="summary-row"><dt>{pickText(lang, "\u4ef7\u683c\u53c2\u8003", "\u4fa1\u683c\u76ee\u5b89")}</dt><dd>{appointment.servicePackage.priceJpy} JPY</dd></div>
                  <div className="summary-row"><dt>{pickText(lang, "\u5907\u6ce8", "\u5099\u8003")}</dt><dd>{appointment.customerNote || "-"}</dd></div>
                </div>
              </div>
            </section>

            <div className="flex flex-wrap gap-3">
              <Link className="ui-btn-primary" href={`/?lang=${lang}${entryToken ? `&entry=${entryToken}` : ""}`}>
                {pickText(lang, "\u8fd4\u56de\u56fe\u5899", "\u30ae\u30e3\u30e9\u30ea\u30fc\u3078\u623b\u308b")}
              </Link>
              <Link className="ui-btn-secondary" href={`/services?lang=${lang}`}>
                {pickText(lang, "\u67e5\u770b\u5957\u9910", "\u30e1\u30cb\u30e5\u30fc\u4e00\u89a7")}
              </Link>
            </div>
          </>
        )}
      </main>
    </PublicSiteFrame>
  );
}
