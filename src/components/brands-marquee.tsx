// Sponsor / partner brands marquee — social proof at end of landing
import { Handshake } from "lucide-react";
import bkashLogo from "@/assets/bkash-logo.png";
import nagadLogo from "@/assets/nagad-logo.png";

const BRANDS = [
  // Foreign Ad networks & sponsors
  "Google AdSense", "Adsterra", "ExoClick", "PropellerAds", "Media.net",
  "Meta Audience", "AdMob", "Unity Ads", "ironSource", "TrafficStars",
  "Amazon Associates", "AliExpress", "ClickBank", "Taboola", "Outbrain",
  // Local payment & telcos
  "bKash", "Nagad", "TallyKhata",
  "Grameenphone", "Robi", "Banglalink", "Teletalk",
  // Local commerce
  "Daraz", "Pathao", "Foodpanda", "Shohoz", "Chaldal",
];

export function BrandsMarquee() {
  // Duplicate list to make seamless loop
  const loop = [...BRANDS, ...BRANDS];

  return (
    <section className="relative py-16 border-t border-b border-border/60 bg-card/40 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 text-center mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-gradient-brand-soft px-3 py-1 text-xs font-semibold text-primary">
          <Handshake className="h-3.5 w-3.5" /> Trusted Partners & Ad Networks
        </div>
        <h2 className="font-display text-2xl md:text-3xl font-bold mt-4 tracking-tight">
          ৪০+ <span className="text-gradient-brand">Brand</span> ও Ad Network আমাদের সাথে কাজ করে
        </h2>
        <p className="text-muted-foreground mt-2 text-sm">এজন্যই প্রতিদিন নতুন task আসে আর আপনি earn করতে পারেন</p>
      </div>

      {/* Marquee row 1 */}
      <div className="relative">
        <div className="flex gap-3 animate-marquee whitespace-nowrap">
          {loop.map((b, i) => (
            <BrandChip key={`a-${i}`} name={b} />
          ))}
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-card/80 to-transparent" />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-card/80 to-transparent" />
      </div>

      {/* Marquee row 2 — reverse direction */}
      <div className="relative mt-4">
        <div className="flex gap-3 animate-marquee-reverse whitespace-nowrap">
          {loop.slice().reverse().map((b, i) => (
            <BrandChip key={`b-${i}`} name={b} variant />
          ))}
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-card/80 to-transparent" />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-card/80 to-transparent" />
      </div>
    </section>
  );
}

// Real brand marks for local payment partners (official logo image + wordmark)
const BRAND_MARKS: Record<string, { logo: string; word: string; color: string }> = {
  bKash:  { logo: bkashLogo,  word: "bKash",  color: "#E2136E" },
  Nagad:  { logo: nagadLogo,  word: "Nagad",  color: "#EC1C24" },
  
};

function BrandChip({ name, variant }: { name: string; variant?: boolean }) {
  const real = BRAND_MARKS[name];
  if (real) {
    return (
      <div
        className={`shrink-0 inline-flex items-center gap-2 sm:gap-2.5 rounded-xl sm:rounded-2xl border border-border/70 ${variant ? "bg-card" : "bg-background"} px-3 sm:px-5 py-2 sm:py-3 shadow-card`}
      >
        <img
          src={real.logo}
          alt={`${real.word} logo`}
          loading="lazy"
          width={28}
          height={28}
          className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg object-contain shrink-0"
        />
        <span
          className="font-display font-bold text-xs sm:text-sm tracking-tight"
          style={{ color: real.color }}
        >
          {real.word}
        </span>
      </div>
    );
  }

  // Deterministic gradient per brand (fallback for non-payment brands)
  const hue = (name.charCodeAt(0) * 17 + name.length * 23) % 360;
  return (
    <div
      className={`shrink-0 inline-flex items-center gap-2 rounded-xl sm:rounded-2xl border border-border/70 ${variant ? "bg-card" : "bg-background"} px-3 sm:px-5 py-2 sm:py-3 shadow-card`}
      style={{
        backgroundImage: `linear-gradient(135deg, oklch(0.98 0.02 ${hue}), oklch(0.96 0.04 ${(hue + 40) % 360}))`,
      }}
    >
      <span
        aria-hidden
        className="grid place-items-center h-6 w-6 sm:h-7 sm:w-7 rounded-lg text-white text-[10px] sm:text-[11px] font-bold shadow"
        style={{ background: `linear-gradient(135deg, oklch(0.55 0.18 ${hue}), oklch(0.6 0.18 ${(hue + 40) % 360}))` }}
      >
        {name[0]}
      </span>
      <span className="font-display font-semibold text-xs sm:text-sm text-foreground/85 tracking-tight">{name}</span>
    </div>
  );
}
