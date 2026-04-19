"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import TabletHero from "./TabletHero";

export default function ZentraHero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/hero-section.png"
          fill
          alt="hero background"
          className="object-cover"
          priority
        />
      </div>

      {/* HERO CONTENT */}
      <div className="flex flex-col items-center justify-center px-4 text-center relative top-[7rem] sm:top-40">
        {/* Traders Joined */}
        <div className="flex items-center gap-2 bg-white rounded-full py-2 px-5 shadow-lg">
          <div className="flex -space-x-4">
            {["user1", "user2", "user3"].map((u, i) => (
              <Image
                key={i}
                src={`/images/${u}.svg`}
                width={32}
                height={32}
                alt="User"
                className="w-8 h-8 rounded-full relative"
                style={{ zIndex: 10 - i }}
              />
            ))}
          </div>

          <span className="text-xs sm:text-sm font-normal !leading-[18px] text-[#18181B]">
            4900+ Traders Joined
          </span>
        </div>

        {/* Heading */}
        <h1
          className="mt-8 font-bold bg-gradient-to-r from-[#c4e8d8] via-[#20b2aa] to-[#1e3a8a] bg-clip-text text-transparent"
          style={{
            fontSize: "clamp(3rem, 10vw, 7rem)",
          }}
        >
          ZENTRA
        </h1>

        {/* Subtitle */}
        <p
          className="mt-4 text-gray-700 font-normal"
          style={{
            fontSize: "clamp(1rem, 2.2vw, 1.5rem)",
          }}
        >
          World’s first psychological performance dashboard for traders
        </p>

        {/* CTA */}
        <motion.a
          href="/dashboard"
          className="hidden md:inline-flex mt-10 px-8 py-3 rounded-full text-[16px] font-medium leading-5 bg-[#00BFA6] text-white items-center gap-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Go to Dashboard
          <Image src="/images/right-arrow.svg" width={16} height={16} alt="" />
        </motion.a>
      </div>

      {/* SCROLL INDICATOR (Centered Bottom) */}
      {/* <div className="absolute bottom-0 sm:bottom-8 left-1/2 z-10 -translate-x-1/2">
        <div className="w-9 h-16 rounded-full border border-[#666666] flex justify-center backdrop-blur-[2px] p-2">
          <motion.span
            className="w-1 h-3 bg-[#00BFA6] rounded-full"
            animate={{ y: [0, 12, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
        </div>
      </div> */}

      <div
        className="w-full h-[23px] sm:h-[92px] absolute bottom-0 left-0 right-0 z-10"
        style={{
          background:
            "linear-gradient(180deg, rgba(255, 255, 255, 0.00) 0%, #FFF 100%)",
        }}
      ></div>

      {/* DASHBOARD SECTION */}
      <div className="relative top-[7rem] sm:top-[16rem]">
        <TabletHero />
      </div>
    </section>
  );
}
