import BookingLookupForm from "@/components/booking-lookup-form";
import { resolveLang } from "@/lib/lang";

type Props = {
  searchParams: Promise<{
    lang?: string;
  }>;
};

export default async function BookingLookupPage({ searchParams }: Props) {
  const query = await searchParams;
  const lang = resolveLang(query?.lang);

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <BookingLookupForm lang={lang} />
    </main>
  );
}