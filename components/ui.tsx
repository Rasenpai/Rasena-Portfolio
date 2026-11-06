import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ElementType,
  HTMLAttributes,
  ReactNode,
} from "react";

type ContainerProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  children?: ReactNode;
};

export function Container({
  className = "",
  children,
  as: Tag = "div",
  ...rest
}: ContainerProps) {
  return (
    <Tag
      className={`mx-auto w-[calc(100%-28px)] max-w-[1120px] sm:w-[calc(100%-40px)] ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

type SectionProps = {
  id: string;
  className?: string;
  children: ReactNode;
};

export function Section({ id, className = "", children }: SectionProps) {
  return (
    <section id={id} className={`py-[55px] sm:py-[76px] ${className}`}>
      {children}
    </section>
  );
}

export function Kicker({ children }: { children: ReactNode }) {
  return (
    <div className="text-xs font-extrabold uppercase tracking-[0.16em] text-accent">
      {children}
    </div>
  );
}

type SectionHeadProps = {
  kicker: string;
  title: string;
  desc?: string;
};

export function SectionHead({ kicker, title, desc }: SectionHeadProps) {
  return (
    <div className="mb-8 max-w-[650px]">
      <Kicker>{kicker}</Kicker>
      <h2 className="my-2.5 text-[clamp(29px,4vw,42px)] font-bold leading-[1.15] tracking-[-0.04em]">
        {title}
      </h2>
      {desc && <p className="m-0 text-muted">{desc}</p>}
    </div>
  );
}

export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <article
      className={`min-w-0 rounded-2xl border border-line bg-linear-to-br from-[#171725] to-[#101019] p-[23px] transition duration-200 hover:-translate-y-[3px] hover:border-[#8c6adf88] ${className}`}
    >
      {children}
    </article>
  );
}

export function Tags({ items }: { items: string[] }) {
  return (
    <div className="mt-[18px] flex flex-wrap gap-[7px]">
      {items.map((tag) => (
        <span
          key={tag}
          className="rounded-[7px] border border-line bg-white/[0.01] px-[9px] py-[5px] text-[11px] text-[#c7c1d8]"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

type ButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  primary?: boolean;
};

export function Button({
  primary = false,
  className = "",
  children,
  href,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-[9px] rounded-xl border px-[17px] py-3 text-sm font-bold transition duration-200 hover:-translate-y-0.5 hover:border-accent";
  const variant = primary
    ? "border-transparent bg-linear-to-br from-accent2 to-[#9d6cff] text-white shadow-[0_10px_35px_#7c5cff30]"
    : "border-line";
  const classes = `${base} ${variant} ${className}`;

  // Rute internal (/projects, /#about) pakai <Link>; anchor (#contact), mailto & eksternal pakai <a>
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={classes} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={classes} {...props}>
      {children}
    </a>
  );
}
