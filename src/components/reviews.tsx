// Auto-rotating Bangladeshi user reviews — social proof
import { useEffect, useState } from "react";
import { Star, Quote, BadgeCheck } from "lucide-react";

type Review = { name: string; city: string; text: string; amount: number; days: number; avatar: string };

const REVIEWS: Review[] = [
  { name: "রহিম উদ্দিন", city: "ঢাকা", text: "মাত্র ২ মাসে ১৮,০০০ টাকা withdraw করেছি। বিকাশে টাকা সাথে সাথে আসে। ছাত্র অবস্থায় হাত খরচ কমপ্লিট!", amount: 18000, days: 60, avatar: "🧑🏽" },
  { name: "তানিয়া আক্তার", city: "চট্টগ্রাম", text: "ঘরে বসে দিনে ৩০০-৪০০ টাকা easy আসে। Premium package নিয়েছি, এখন daily ৬৫০ টাকা।", amount: 24500, days: 90, avatar: "👩🏽" },
  { name: "সাব্বির হোসেন", city: "সিলেট", text: "প্রথমে বিশ্বাস হয়নি, ৫০০ টাকা deposit করে test করেছিলাম। ৩ দিনে withdraw পেয়েছি — এখন full time এ আছি।", amount: 42000, days: 150, avatar: "🧑🏻" },
  { name: "নাদিয়া ইসলাম", city: "রাজশাহী", text: "Refer করে আলাদা commission পাই, বান্ধবীদের join করিয়েছি ১২ জন। মাসে এখন ৮-১০ হাজার আসে।", amount: 31000, days: 75, avatar: "👩🏻" },
  { name: "মেহেদী হাসান", city: "খুলনা", text: "Spin আর task দুটোই করি, withdraw fast — Nagad এ ১০ মিনিটে পেয়ে যাই। Real platform 💯", amount: 15600, days: 45, avatar: "🧔🏽" },
  { name: "রিয়া দাস", city: "বরিশাল", text: "House wife হিসেবে দিনে ১ ঘন্টা সময় দিই, মাসে ৭-৮ হাজার আসে। সংসারের অনেক কাজে লাগে।", amount: 22400, days: 100, avatar: "👩🏽‍🦱" },
  { name: "জুবায়ের আহমেদ", city: "ময়মনসিংহ", text: "VIP package নিয়েছি — Daily ১২০০ টাকা income guaranteed। ১ মাসেই খরচ উঠে গেছে।", amount: 38000, days: 35, avatar: "🧑🏽‍💼" },
  { name: "ফারিয়া সুলতানা", city: "কুমিল্লা", text: "Support team অনেক helpful, যেকোনো সমস্যায় instant reply পাই। ClickTaka best 🇧🇩", amount: 19800, days: 80, avatar: "👩🏽‍🎓" },
];

export function Reviews() {
  const [page, setPage] = useState(0);
  const perPage = 3;
  const totalPages = Math.ceil(REVIEWS.length / perPage);

  useEffect(() => {
    const t = setInterval(() => setPage((p) => (p + 1) % totalPages), 5000);
    return () => clearInterval(t);
  }, [totalPages]);

  const visible = REVIEWS.slice(page * perPage, page * perPage + perPage);

  return (
    <section className="max-w-6xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700">
          <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> ৪.৯ / ৫.০ — ১২,৪০০+ user review
        </div>
        <h2 className="font-display text-3xl md:text-4xl font-bold mt-4 tracking-tight">আমাদের <span className="text-gradient-brand">সফল সদস্যদের</span> কথা</h2>
        <p className="text-muted-foreground mt-2 text-sm md:text-base">বাংলাদেশের ১,৮০,০০০+ active user প্রতিদিন আয় করছেন</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 min-h-[280px]">
        {visible.map((r, i) => (
          <article
            key={`${page}-${i}`}
            className="animate-fade-in relative rounded-2xl border border-border/70 bg-card p-6 shadow-card hover:shadow-brand transition-all"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/10" />
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-brand-soft grid place-items-center text-2xl">{r.avatar}</div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-semibold text-sm">{r.name}</h3>
                  <BadgeCheck className="h-4 w-4 text-info" />
                </div>
                <p className="text-xs text-muted-foreground">{r.city}, বাংলাদেশ</p>
              </div>
            </div>
            <div className="flex gap-0.5 mt-3">
              {Array.from({ length: 5 }).map((_, j) => (
                <Star key={j} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="mt-3 text-sm text-foreground/90 leading-relaxed">"{r.text}"</p>
            <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">মোট আয়</span>
              <span className="font-bold text-success tabular-nums">৳{r.amount.toLocaleString()} <span className="text-muted-foreground font-normal">/ {r.days} দিনে</span></span>
            </div>
          </article>
        ))}
      </div>

      <div className="flex justify-center gap-1.5 mt-6">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i)}
            aria-label={`Page ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${i === page ? "w-8 bg-gradient-brand" : "w-1.5 bg-border"}`}
          />
        ))}
      </div>
    </section>
  );
}
