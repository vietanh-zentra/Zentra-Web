"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Figtree } from "next/font/google";
import Logo from "@/components/Logo";
import { UserIcon, Squares2X2Icon } from "@heroicons/react/24/outline";
import { apiClient } from "@/utils/api";
import Image from "next/image";

const NAV_ITEMS = [
  { label: "Vision", href: "#vision" },
  { label: "Why Zentra", href: "#why-zentra" },
  { label: "How Zentra Works", href: "#states-explanation" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "/pricing" },
];

const figtree = Figtree({ subsets: ["latin"] });

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  // useEffect(() => {
  //   const handleScroll = () => {
  //     setScrolled(window.scrollY > 10);
  //   };

  //   window.addEventListener("scroll", handleScroll);
  //   return () => window.removeEventListener("scroll", handleScroll);
  // }, []);

  useEffect(() => {
    // Check authentication status
    const checkAuth = () => {
      const token = apiClient.getToken();
      setIsLoggedIn(!!token);
    };

    checkAuth();

    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener("storage", handleStorageChange);

    checkAuth();

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [pathname]);

  const handleSmoothScroll = (e, href) => {
    if (href.startsWith("#")) {
      e.preventDefault();

      if (pathname !== "/") {
        window.location.href = `/${href}`;
        return;
      }

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
    <>
      {/* Desktop Navbar */}
      <header
        className={`z-[9999] w-full fixed overflow-hidden  ${figtree.className}
    ${open ? "hidden md:block" : "block"}
  `}
      >
        <div
          className={`py-[30px] transition-colors duration-300
  `}
        >
          <nav className="  max-w-[1062px] bg-[#FFF] sm:mx-auto py-3 pr-4 pl-8 shadow-[0_0_40px_0_rgba(0,0,0,0.16)] flex items-center justify-between  rounded-full border mx-2.5   border-[#EEEEEE] ">
            <div className="flex items-center">
              <Logo />
            </div>

          {/* Center: Navigation Items - Desktop */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => handleSmoothScroll(e, item.href)}
                className="text-[16px] leading-5 font-normal text-gray-900 hover:text-gray-600 transition-colors duration-200"
              >
                {item.label}
              </a>
            ))}
          </div>

            {/* Right: Login/Dashboard Button */}
            {/* <div className="hidden md:flex items-center">
            <a
              href={isLoggedIn ? "/dashboard" : "/auth/login"}
              className="text-[16px] leading-5 font-normal text-[#18181BCC] hover:text-gray-600 transition-colors duration-200 flex items-center gap-2"
            >
              {isLoggedIn ? (
                <>
                  <Squares2X2Icon className="w-5 h-5" />
                  Dashboard
                </>
              ) : (
                <>
                  <UserIcon className="w-5 h-5" />
                  Login
                </>
              )}
            </a>
          </div> */}
          <div className="hidden md:flex items-center">
            <a
              href={"/dashboard"}
              className="text-[16px] leading-5 font-medium py-3.5 px-8 rounded-full gap-4 bg-[#00BFA6]  text-white transition-colors duration-200 flex items-center"
            >
              Dashboard
              <Image
                src="/images/right-arrow.svg"
                width={580}
                height={500}
                alt="right-arrow"
                className="w-full h-full object-cover"
              />
            </a>
          </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 focus:outline-none"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
            >
              <svg
                className="w-5 h-5 text-gray-900"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile Menu Modal */}
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden">
          <div className="absolute right-0 top-0 w-64 h-full bg-white shadow-xl">
            <div className="flex flex-col h-full">
              {/* Close Button */}
              <div className="flex justify-end p-4 border-b border-gray-200">
                <button
                  className="p-2 focus:outline-none"
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                >
                  <svg
                    className="w-6 h-6 text-gray-900"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Menu Items */}
              <div className="flex flex-col p-4 gap-4">
                {NAV_ITEMS.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={(e) => {
                      handleSmoothScroll(e, item.href);
                      setOpen(false);
                    }}
                    className="text-base font-normal text-gray-900 hover:text-gray-600 transition-colors duration-200 py-2"
                  >
                    {item.label}
                  </a>
                ))}
                <a
                  href={isLoggedIn ? "/dashboard" : "/auth/login"}
                  className="text-base font-normal text-gray-900 hover:text-gray-600 transition-colors duration-200 py-2 border-t border-gray-200 mt-2 pt-4 flex items-center gap-2"
                  onClick={() => setOpen(false)}
                >
                  {isLoggedIn ? (
                    <>
                      <Squares2X2Icon className="w-5 h-5" />
                      Dashboard
                    </>
                  ) : (
                    <>
                      <UserIcon className="w-5 h-5" />
                      Login
                    </>
                  )}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
