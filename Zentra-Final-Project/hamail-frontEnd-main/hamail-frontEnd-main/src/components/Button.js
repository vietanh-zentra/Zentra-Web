import Link from "next/link";

export default function Button({
  href,
  children,
  className = "",
  onClick,
  type = "button",
  arrowDirection = "right",
  showArrow = true,
  variant = "primary",
}) {
  const baseClasses =
    "group px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300 shadow-lg hover:shadow-xl inline-flex items-center gap-2 transform hover:scale-105";

  const variantClasses =
    variant === "secondary"
      ? "bg-sixth text-white hover:bg-sixth/90 border-2 border-sixth"
      : variant === "outline"
      ? "bg-transparent text-white border-2 border-white hover:bg-white hover:text-black"
      : "bg-primary text-secondary hover:bg-primary/90 border-2 border-primary";

  const buttonClasses = `${baseClasses} ${variantClasses} ${className}`;

  const arrow = showArrow ? (
    <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
      {arrowDirection === "right" ? "→" : "←"}
    </span>
  ) : null;

  if (href) {
    return (
      <Link href={href} className={buttonClasses}>
        {arrowDirection === "left" && arrow}
        {children}
        {arrowDirection === "right" && arrow}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={buttonClasses}>
      {arrowDirection === "left" && arrow}
      {children}
      {arrowDirection === "right" && arrow}
    </button>
  );
}
