import { Crown, Sparkles, Star, Gem, Trophy, Medal, ShieldCheck, Package as PackageIcon } from "lucide-react";

type PkgMeta = { label: string; cls: string; Icon: React.ComponentType<{ className?: string }> };

const PKG_META: Record<string, PkgMeta> = {
  "silver":   { label: "Silver",   cls: "bg-slate-200/90 text-slate-800",     Icon: ShieldCheck },
  "silver-2": { label: "Silver 2", cls: "bg-zinc-200/90 text-zinc-800",       Icon: Medal },
  "silver-3": { label: "Silver 3", cls: "bg-blue-200/90 text-blue-800",       Icon: Star },
  "gold":     { label: "Gold",     cls: "bg-yellow-200/90 text-yellow-900",   Icon: Crown },
  "diamond":  { label: "Diamond",  cls: "bg-cyan-200/90 text-cyan-900",       Icon: Gem },
  "royal":    { label: "Royal",    cls: "bg-fuchsia-200/90 text-fuchsia-900", Icon: Trophy },
};

/** Strip `[pkg:xxx]` prefix → returns { pkgKey, meta, clean } */
export function parseTaskTitle(title: string): { pkgKey: string | null; meta: PkgMeta | null; clean: string } {
  if (!title) return { pkgKey: null, meta: null, clean: "" };
  const m = title.match(/^\[pkg:([^\]]+)\]\s*(.*)$/);
  if (!m) return { pkgKey: null, meta: null, clean: title };
  const key = m[1].toLowerCase();
  return { pkgKey: key, meta: PKG_META[key] || null, clean: m[2] };
}

/** Small pill badge for a package name/key. */
export function PackageBadge({ pkgKey, size = "sm", className = "" }: { pkgKey: string; size?: "xs" | "sm" | "md"; className?: string }) {
  const meta = PKG_META[pkgKey.toLowerCase()] || { label: pkgKey, cls: "bg-muted text-foreground", Icon: PackageIcon };
  const Icon = meta.Icon;
  const sizeCls =
    size === "xs" ? "px-1.5 py-0.5 text-[9px] gap-0.5" :
    size === "md" ? "px-2.5 py-1 text-xs gap-1.5" :
    "px-2 py-0.5 text-[10px] gap-1";
  const iconCls = size === "md" ? "h-3.5 w-3.5" : "h-2.5 w-2.5";
  return (
    <span className={`inline-flex items-center rounded-full font-bold uppercase tracking-wider shrink-0 ${meta.cls} ${sizeCls} ${className}`}>
      <Icon className={iconCls} /> {meta.label}
    </span>
  );
}

/** Renders a task title with the `[pkg:xxx]` prefix replaced by a badge. */
export function TaskTitle({ title, className = "", badgeSize = "sm" }: { title: string; className?: string; badgeSize?: "xs" | "sm" | "md" }) {
  const { pkgKey, clean } = parseTaskTitle(title);
  if (!pkgKey) return <span className={className}>{title}</span>;
  return (
    <span className={`inline-flex items-center gap-1.5 min-w-0 ${className}`}>
      <PackageBadge pkgKey={pkgKey} size={badgeSize} />
      <span className="truncate">{clean}</span>
    </span>
  );
}
