"use client";

import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";

const NAV_ITEMS = [
  { label: "Vision", href: "#vision" },
  { label: "Why Zentra", href: "#why-zentra" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "/pricing" },
  // { label: "Dashboard", href: "/dashboard" },
];

export default function Footer() {
  const pathname = usePathname();

  const handleClick = (e, href) => {
    // Only handle smooth scroll for hash links
    if (href.startsWith("#")) {
      e.preventDefault();

      // If not on homepage, navigate to homepage with hash
      if (pathname !== "/") {
        window.location.href = `/${href}`;
        return;
      }

      // If on homepage, smooth scroll to section
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  };

  return (
    <footer className="w-full ">
      <div className=" mx-auto px-5 sm:px-[120px] py-[30px]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          {/* Logo */}
<div className="flex flex-col items-start">
  <Logo />

  <p className="mt-2 text-[12px] font-normal leading-4 text-[#18181BA3]">
    © ZENTRA 2025. All Rights Reserved{" "}
    <a
      href="https://carlosreinoso.co.uk/web-dev"
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-gray-600 font-bold hover:text-gray-600 transition-colors duration-200"
    >
    </a>
  </p>
</div>


          {/* Navigation Links */}
          <nav className="flex flex-wrap items-center justify-center gap-8">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => handleClick(e, item.href)}
                className="text-[16px] font-normal leading-5 text-[#18181BCC]  hover:text-gray-600 transition-colors duration-200"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Copyright & Credits */}
          {/* <div className="flex flex-col items-center md:items-end gap-1">
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} Zentra
            </p>
            <p className="text-xs text-gray-600">
              Website by{" "}
              <a
                href="https://carlosreinoso.co.uk/web-dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-600 font-bold hover:text-gray-600 transition-colors duration-200"
              >
                Carlos Reinoso
              </a>
            </p>
          </div> */}
        </div>
      </div>
    </footer>
  );
}
