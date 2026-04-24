"use client";
import { motion } from "framer-motion";
import Link from "next/link";

import GradientHeading from "./GradientHeading";
import Container from "./Container";
import DescriptionText from "./DescriptionText";

import Image from "next/image";

const FloatingLabel = ({ children, position, delay = 0, icon }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className={`absolute ${position} bg-white rounded-full px-4 py-2 shadow-lg flex items-center gap-2 text-[10px] md:text-[12px] leading-4 font-medium whitespace-nowrap z-50 text-black border border-gray-100`}
  >
    {icon && <span className="text-base">{icon}</span>}
    {!icon && <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>}
    {children}
  </motion.div>
);

const DashboardVisual = () => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.3 }}
    transition={{ duration: 0.8 }}
    className="w-full max-w-5xl mx-auto relative mt-4 md:mt-5"
  >
    {/* 1. LAYERED CONTAINER (The "Envelope") */}
    <div className="relative w-full max-w-[800px] mx-auto aspect-[16/10] md:aspect-[16/8] flex items-end justify-center">
      {/* BACKGROUND OVERLAY (The back part of the pocket) */}
      <div className="absolute bottom-0 w-[95%] h-[88%] sm:h-[70%] bg-[#1a1b2e]/60 backdrop-blur-md rounded-[40px] border border-[#FFFFFF1F] z-0" />

      {/* 2. THE DASHBOARD IMAGE (Tucked inside) */}
      <motion.div
        initial={{
          y: typeof window !== "undefined" && window.innerWidth < 640 ? 0 : 400,
          opacity:
            typeof window !== "undefined" && window.innerWidth < 640 ? 1 : 0,
        }}
        whileInView={{
          y: typeof window !== "undefined" && window.innerWidth < 640 ? 0 : -50,
          opacity: 1,
        }}
        transition={{ duration: 1, ease: "easeOut" }}
        viewport={{ once: true }}
        className="relative z-10 w-[85%] shadow-2xl overflow-visible lg:top-0 -top-[6.5rem] md:-top-[2.5rem]"
      >
        <Image
          src="/images/why-zentra1.png"
          height={656}
          width={1200}
          alt="Zentra Dashboard"
          className="w-full h-auto object-cover"
        />
      </motion.div>

      {/* 3. FRONT OVERLAY (The "Live Insights" Panel) */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full  z-30 pointer-events-none  ">
        <div className="bg-[#00001F7A] from-[#1a1b2e]/80 to-[#0d0e1c] backdrop-blur-xl border-t border-[#FFFFFF1F]   pb-4 sm:pb-[33px] pt-2 sm:pt-6 pl-4 sm:pl-[60px] pr-4 sm:pr-[84px]  rounded-[40px]  shadow-[0_-20px_50px_rgba(0,0,0,0.5)] pointer-events-auto">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_#4ade80]"></span>
            <span className="sm:text-[14px] text-[12px] font-medium leading-[18px] text-white uppercase tracking-widest">
              Live Insights
            </span>
          </div>
          <h3 className="sm:text-[20px] text-[18px] leading-6 font-semibold mb-2 text-white">
            Decision clarity improved 12%️ since your last trade
          </h3>
          <p className="sm:text-[14px] text-[12px] text-[#FFFFFFE0]  leading-[18px] font-normal">
            Zentra turns emotions into observable signals. Every pulse is a live
            read on your composure.
          </p>
        </div>
      </div>

      {/* DASHED CONNECTORS & LABELS */}
      <div className="hidden sm:block absolute inset-0 pointer-events-none">
        {/* LABELS - Position these independently */}
        <div className="absolute top-[2%] left-[-22%] z-50">
          <FloatingLabel position="relative" delay={0.2} icon="🧠">
            Emotional Signal Detection
          </FloatingLabel>
        </div>

        <div className="absolute top-[40%] left-[-21%] z-50">
          <FloatingLabel position="relative" delay={0.3} icon="🎯">
            Decision Accuracy
          </FloatingLabel>
        </div>

        <div className="absolute top-[14%] right-[-136px] z-50">
          <FloatingLabel position="relative" delay={0.4} icon="⚡">
            Instant Feedback Loop
          </FloatingLabel>
        </div>

        <div className="absolute top-[42%] right-[-20%] z-50">
          <FloatingLabel position="relative" delay={0.5} icon="🔍">
            Behavioral Clarity
          </FloatingLabel>

          
        </div>

        {/* IMAGES - Position these separately */}
        <img
          src="/images/left1.svg"
          className="absolute top-[12%] left-[2%] w-20 opacity-50 z-40"
          // Adjusted to position relative to screen, not label
        />

        <img
          src="/images/left2.svg"
          className="absolute top-[44%] left-[0%] w-24 opacity-50 z-40"
        />

        <img
          src="/images/right2.svg"
          className="absolute top-[25%] right-[2%] w-20 opacity-50 z-40"
        />

        <img
          src="/images/right1.svg"
          className="absolute top-[47%] right-[-0%] w-24 opacity-50 rotate-180 z-40"
        />
      </div>
    </div>
  </motion.div>
);
{
  /* Optional: Add corner decorative image */
}
{
  /* <img 
        src="/images/corner-decoration.png" 
        alt="" 
        className="absolute top-0 left-0 w-24 h-24 opacity-50"
      /> */
}

{
  /* Optional: Add dots pattern image */
}
{
  /* <img 
        src="/images/dots-pattern.png" 
        alt="" 
        className="absolute bottom-0 right-0 w-32 h-32 opacity-30"
      /> */
}

export default function WhyZentraSection() {
  return (
    <>
      <style>{`
        #why-zentra {
          clip-path: inset(0 0 0 0 round 0 0 48px 48px);
        }
        @media (min-width: 768px) {
          #why-zentra {
            clip-path: inset(0 0 0 0 round 0 0 64px 64px);
          }
        }
      `}</style>
      <section
        id="why-zentra"
        className="min-h-screen px-6 md:px-[120px] py-[100px] pb-0 relative scroll-mt-12 md:-mt-0.5 bg-[#00001F]"
      >
        {/* Gradient glow effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-[#00021A] to-[#001040] opacity-80 pointer-events-none" />

        <Container maxWidth="4xl" className="relative z-10" padding={false}>
          <div className="max-w-sm mx-auto md:max-w-none md:mx-0 bg-[black/40 backdrop-blur-sm] rounded-3xl p-6 md:p-12 border border-white/10 md:bg-transparent md:backdrop-blur-none md:border-none md:rounded-none">
            <motion.h3
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8 md:mb-12 text-white font-normal text-[40px] sm:text-[60px] leading-[48px] sm:leading-[60px] text-left"
            >
              Zentra
            </motion.h3>

            {/* Large Gradient Heading */}
            <div className="text-left">
              <GradientHeading animated={true} className="!mb-8">
                All-new
                <br />
                clarity.
              </GradientHeading>
            </div>

            <div className="mb-6">
              <DescriptionText className="!text-gray-300 text-left">
                Powered by intelligence and grounded in psychology. Zentra
                transforms emotions into data and data into results you can see.
              </DescriptionText>
            </div>

            {/* CTA Link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-left mb-2 sm:mb-0"
            >
              <Link
                href="#states-explanation"
                className="inline-flex items-center text-[18px] sm:text-[20px] font-normal leading-6 gap-2 text-[#00BFA6] transition-all group"
              >
                See how Zentra works
                <span className="group-hover:translate-x-1 transition-transform text-[#00BFA6]">
                  ›
                </span>
              </Link>
            </motion.div>
          </div>

          {/* Main Content - Dashboard Visual */}
          <div className="flex flex-col items-center md:items-start pb-[50px] sm:pb-[100px]">
            <DashboardVisual />
          </div>
        </Container>
      </section>
    </>
  );
}
