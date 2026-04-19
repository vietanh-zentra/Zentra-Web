"use client";

import Image from "next/image";

import profile from "../../../public/Elipse.png";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { apiClient } from "@/utils/api";
import { usePsychologicalStateContext } from "@/context/PsychologicalStateContext";
import { STATE_CONFIG } from "@/components/StateIndicator";
import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "../../../tailwind.config.js";

const fullConfig = resolveConfig(tailwindConfig);
const colors = fullConfig.theme.colors;

// Helper function to convert hex to rgba
const hexToRgba = (hex, alpha = 1) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const NavLink = ({ href, icon, label, isActive }) => {
  return (
    <Link
      href={href}
      className={`flex flex-row items-center justify-center px-[18px] py-3 transition-all duration-200 rounded-full group ${
        isActive
          ? "bg-[#00BFA6] text-white "
          : "bg-transparent text-[#363636] bg-[#EAF1F0] border border-[#FFFFFF] hover:bg-white/50"
      }`}
    >
      <div
        className={`flex items-center justify-center mr-[10px] ${isActive ? "text-white" : "text-[#363636]"}`}
      >
        {icon}
      </div>
      <span
        className={`text-sm font-medium ${isActive ? "text-white" : "text-[#363636]"}`}
      >
        {label}
      </span>
    </Link>
  );
};

const Icon = ({ children, className = "w-6 h-6" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

const HamburgerIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>
);

const Sidebar = ({ collapsed = false, onToggle }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { data: stateData } = usePsychologicalStateContext() || {};

  // Inject global background style
  useEffect(() => {
    document.body.style.backgroundColor = "#DDE7E7";
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, []);

  const handleLogout = async () => {
    try {
      await apiClient.logout();
      router.push("/auth/login");
    } catch (error) {
      console.error("Error logging out:", error.message);
    }
  };

  const navLinks = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: (
        <Icon className="w-5 h-5">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </Icon>
      ),
    },
    {
      href: "/dashboard/trades",
      label: "Trades",
      icon: (
        <Icon className="w-5 h-5">
          <line x1="12" y1="20" x2="12" y2="10" />
          <line x1="18" y1="20" x2="18" y2="4" />
          <line x1="6" y1="20" x2="6" y2="16" />
        </Icon>
      ),
    },
    {
      href: "/dashboard/plan",
      label: "Trading",
      icon: (
        <Icon className="w-5 h-5">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </Icon>
      ),
    },
    {
      href: "/dashboard/connect",
      label: "Connect",
      icon: (
        <Icon className="w-5 h-5">
          <rect width="20" height="14" x="2" y="3" rx="2" />
          <line x1="8" x2="16" y1="21" y2="21" />
          <line x1="12" x2="12" y1="17" y2="21" />
        </Icon>
      ),
    },
  ];

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md shadow-sm backdrop-blur-md bg-white/50 text-[#363636]"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        <HamburgerIcon />
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Top Navbar Container */}
      <div className="w-full fixed top-0 left-0 right-0 z-40 px-8 py-[30px] bg-[#DDE7E7]">
        <div className="flex items-center justify-between max-w-[1920px] mx-auto">
          {/* Logo Section */}
          <div className="flex items-center mr-36 ">
            <span className="text-[32px] font-bold bg-gradient-to-r from-[#A1DCCE] to-[#1E438D] bg-clip-text text-transparent">
              ZENTRA
            </span>
          </div>

          {/* Center Navigation - Desktop */}
          <div className="hidden lg:flex items-center space-x-2 bg-transparent">
            {navLinks.map(({ href, label, icon }) => (
              <NavLink
                key={href}
                href={href}
                icon={icon}
                label={label}
                isActive={pathname === href}
              />
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            {/* Search Icon */}
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-[##dde7e7] border transition-colors">
              {/* <Icon className="w-5 h-5 text-[#363636]">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </Icon> */}
            </button>

            {/* Settings Icon with Popover */}
            <div className="relative">
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-[#dde7e7] transition-colors border "
              >
                {/* <Icon className="w-5 h-5 text-[#363636]">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </Icon> */}
              </button>

              {isSettingsOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#dde7e7] rounded-xl shadow-lg   py-1 z-50">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-[#363636] flex items-center gap-2"
                  >
                    {/* <Icon className="w-4 h-4">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </Icon>
                    Logout */}
                  </button>
                </div>
              )}
            </div>

            {/* Notification Icon */}
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-[#dde7e7] transition-colors">
              {/* <Icon className="w-5 h-5 text-[#363636]">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </Icon> */}
            </button>

            {/* User Profile */}
            <div className="flex items-center bg-[#dde7e7]  pl-1 pr-4 py-1 gap-3 ">
              <div className="w-8 h-8 rounded-full overflow-hidden">
                {/* Placeholder for user image if available, or generic avatar */}
                {/* <Image
                  src={profile} // from public folder
                  alt="Profile image"
                  width={36}
                  height={36}
                /> */}
                {/* <div className="w-full h-full bg-gradient-to-br from-orange-300 to-orange-500" /> */}
              </div>
              <div className="flex items-center gap-2">
                {/* <span className="text-[14px] font-medium text-[#363636]">
                  Paityn Bator
                </span>
                <Icon className="w-4 h-4 text-[#363636]">
                  <path d="m6 9 6 6 6-6" />
                </Icon> */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-white  shadow-xl transform transition-transform duration-300 ease-in-out z-50 lg:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold tracking-wider">
              <span className="font-bold bg-gradient-to-r from-[#A1DCCE] to-[#1E438D] bg-clip-text text-transparent">
                ZENTRA
              </span>
            </h1>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 text-[#363636] hover:bg-[#EAF1F0] rounded-full"
            >
              <Icon className="w-5 h-5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </Icon>
            </button>
          </div>
          <div className="flex flex-col space-y-2">
            {navLinks.map(({ href, label, icon }) => (
              <NavLink
                key={href}
                href={href}
                icon={icon}
                label={label}
                isActive={pathname === href}
              />
            ))}
          </div>
          <div className="mt-8 pt-8 border-t border-white">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2 text-[#363636] hover:bg-gray-50 rounded-lg w-full transition-colors"
            >
              <Icon className="w-5 h-5">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </Icon>
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
