import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "onLight" | "outline";
type ButtonSize = "md" | "lg";

type CommonProps = {
  children: React.ReactNode;
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

type ButtonAsLink = CommonProps & {
  href: string;
  external?: boolean;
  disabled?: never;
  type?: never;
  onClick?: never;
};

type ButtonAsButton = CommonProps & {
  href?: never;
  external?: never;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
};

type ButtonProps = ButtonAsLink | ButtonAsButton;

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-violet)] text-[var(--color-black)] hover:bg-[#b09aff] focus-visible:outline-[var(--color-violet)]",
  secondary:
    "border border-white/35 text-[var(--color-white)] hover:border-[var(--color-violet)] hover:text-[var(--color-violet)] bg-transparent",
  ghost:
    "text-[var(--color-white)] hover:text-[var(--color-violet)] bg-transparent px-0",
  onLight:
    "bg-[var(--color-violet-dark)] text-[var(--color-white)] hover:bg-[#5630c4] focus-visible:outline-[var(--color-violet-dark)]",
  outline:
    "border border-[var(--color-black)]/30 text-[var(--color-black)] hover:border-[var(--color-violet-dark)] hover:text-[var(--color-violet-dark)] bg-transparent",
};

const sizeClasses: Record<ButtonSize, string> = {
  md: "min-h-11 px-5 text-sm",
  lg: "min-h-12 px-6 text-base",
};

export function Button(props: ButtonProps) {
  const {
    children,
    className,
    variant = "primary",
    size = "md",
  } = props;

  const classes = cn(
    "inline-flex items-center justify-center gap-2 font-[family-name:var(--font-heading)] font-medium tracking-wide transition-colors duration-200 rounded-sm",
    "disabled:opacity-50 disabled:pointer-events-none",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );

  if ("href" in props && props.href) {
    const { href, external } = props;
    if (external) {
      return (
        <a
          href={href}
          className={classes}
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
          <span className="sr-only"> (öffnet in neuem Tab)</span>
        </a>
      );
    }
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={props.type ?? "button"}
      className={classes}
      disabled={props.disabled}
      onClick={props.onClick}
    >
      {children}
    </button>
  );
}
