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
    "bg-violet text-black hover:bg-[#b09aff] focus-visible:outline-violet",
  secondary:
    "border border-white/35 text-white hover:border-violet hover:text-violet bg-transparent",
  ghost: "text-white hover:text-violet bg-transparent px-0",
  onLight:
    "bg-violet-dark text-white hover:bg-[#5630c4] focus-visible:outline-violet-dark",
  outline:
    "border border-black/30 text-black hover:border-violet-dark hover:text-violet-dark bg-transparent",
};

const sizeClasses: Record<ButtonSize, string> = {
  md: "min-h-11 px-5 text-sm",
  lg: "min-h-12 px-6 text-base",
};

export function Button(props: ButtonProps) {
  const { children, className, variant = "primary", size = "md" } = props;

  const classes = cn(
    "inline-flex items-center justify-center gap-2 font-[family-name:var(--font-heading)] font-medium tracking-wide transition-colors duration-200 rounded-sm no-underline",
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
