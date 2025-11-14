import Link, { LinkProps } from "next/link";
import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ReactNode, Ref } from "react";

function cn(...values: Array<string | undefined | false | null>) {
  return values.filter(Boolean).join(" ");
}

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type BaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

type ButtonButtonProps = BaseProps & ComponentPropsWithoutRef<"button"> & {
  href?: undefined;
};

type ButtonLinkProps = BaseProps & Omit<LinkProps, "href"> & {
  href: string;
  children: ReactNode;
};

type ButtonProps = ButtonButtonProps | ButtonLinkProps;

const baseStyles = "inline-flex items-center justify-center font-semibold transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-emerald-600 text-white hover:bg-emerald-500 focus-visible:outline-emerald-600",
  secondary: "bg-slate-900 text-white hover:bg-slate-800 focus-visible:outline-slate-900",
  ghost: "bg-transparent text-slate-900 hover:bg-slate-100 focus-visible:outline-slate-900",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm rounded-full",
  md: "h-11 px-5 text-base rounded-full",
  lg: "h-12 px-6 text-lg rounded-full",
};

function isLinkProps(props: ButtonProps): props is ButtonLinkProps {
  return typeof (props as ButtonLinkProps).href === "string";
}

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>((props, ref) => {
  const { variant = "primary", size = "md", className, ...rest } = props;
  const composed = cn(baseStyles, variantStyles[variant], sizeStyles[size], className);

  if (isLinkProps(props)) {
    const { children, href, ...linkProps } = rest as ButtonLinkProps;
    return (
      <Link ref={ref as Ref<HTMLAnchorElement>} href={href} className={composed} {...linkProps}>
        {children}
      </Link>
    );
  }

  const buttonProps = rest as ButtonButtonProps;
  return <button ref={ref as Ref<HTMLButtonElement>} className={composed} {...buttonProps} />;
});

Button.displayName = "Button";
