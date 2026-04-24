/**
 * Container component for consistent max-width and centering
 * Mobile: max-w-md (448px)
 * Desktop: Customizable via maxWidth prop
 */
export default function Container({
  children,
  maxWidth = "7xl",
  className = "",
  padding = true,
}) {
  const maxWidthClasses = {
    "3xl": "max-w-md md:max-w-3xl",
    "4xl": "max-w-md md:max-w-4xl",
    "5xl": "max-w-md md:max-w-5xl",
    "6xl": "max-w-md md:max-w-6xl",
    "7xl": "max-w-md md:max-w-7xl",
  };

  const paddingClasses = padding ? "px-4 sm:px-6 lg:px-8" : "";

  return (
    <div
      className={`${maxWidthClasses[maxWidth]} mx-auto ${paddingClasses} ${className}`}
    >
      {children}
    </div>
  );
}
