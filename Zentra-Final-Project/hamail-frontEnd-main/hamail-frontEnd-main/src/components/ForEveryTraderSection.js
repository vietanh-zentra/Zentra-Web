"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import Container from "./Container";
import GradientHeading from "./GradientHeading.js";
import DescriptionText from "./DescriptionText.js";
import { ChartBarIcon, ArrowTrendingUpIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const dummyMetrics = {
  winRate: 72,
  avgTrade: 0.82,
  riskReward: 2.1,
  tradesToday: 3,
  maxTrades: 6,
  planCompliance: 91,
  earlyExitRate: 18,
};

gsap.registerPlugin(ScrollTrigger);

const ImmersiveVisualCard = ({ delay = 0.2 }) => {
  const imageRef = useRef(null);
  const cardRef = useRef(null);

  // useEffect(() => {
  //   if (!imageRef.current || !cardRef.current) return;

  //   const ctx = gsap.context(() => {
  //     gsap.fromTo(
  //       imageRef.current,
  //       {
  //         y: "-110%",
  //         x: "0%",
  //       },
  //       {
  //         y: "0",
  //         x: "0%",
  //         ease: "none",
  //         scrollTrigger: {
  //           trigger: cardRef.current,
  //           start: "top 135%",
  //           end: "top 30%",
  //           scrub: true,
  //         },
  //       }
  //     );
  //   });

  //   return () => ctx.revert();
  // }, []);
  useEffect(() => {
    if (!imageRef.current || !cardRef.current) return;

    const mm = gsap.matchMedia();

    mm.add("(min-width: 1024px)", () => {
      const tween = gsap.fromTo(
        imageRef.current,
        {
          y: "-110%",
          x: "0%",
        },
        {
          y: "0",
          x: "0%",
          ease: "none",
          scrollTrigger: {
            trigger: cardRef.current,
            start: "top 135%",
            end: "top 30%",
            scrub: true,
          },
        }
      );

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    });

    mm.add("(max-width: 1023px)", () => {
      gsap.set(imageRef.current, {
        clearProps: "all",
        y: 0,
        x: 0,
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      viewport={{ once: true }}
      className="rounded-[48px] p-[1px] bg-gradient-to-br from-[#5CF8E4] via-[#3DBBFA] to-[#2747B2] shadow-[0_25px_60px_rgba(26,44,88,0.35)]"
    >
      <div
        ref={cardRef}
        className="bg-white rounded-[46px] p-8 lg:p-12 flex flex-col lg:flex-row items-center gap-10"
      >
        <div className="relative w-full lg:w-1/2 flex items-center justify-center">
          <div className="absolute inset-0 rounded-[40px] bg-[radial-gradient(circle_at_20%_20%,rgba(92,248,228,0.35),transparent_55%),radial-gradient(circle_at_80%_30%,rgba(61,187,250,0.25),transparent_65%)] blur-2xl" />
          <Image
            ref={imageRef}
            src="/brain.png"
            alt="Brain maintaining clarity"
            width={360}
            height={360}
            priority
            className="relative w-52 h-52 lg:w-72 lg:h-72 object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.25)]"
          />
        </div>
        <div className="w-full lg:w-1/2 text-gray-900 space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-gray-500">
            Update:
          </p>
          <p className="sm:text-[45px] text-[38px] leading-[48px] sm:leading-[56px] font-semibold text-[#18181B]">
            Revenge trades reduced by{" "}
            <span
              className="
                inline-flex items-center gap-1
                bg-[linear-gradient(90deg,#0062FF_0%,#00FFE3_100%)]
                bg-clip-text text-transparent
                sm:text-[45px] text-[38px] leading-[48px] sm:leading-[56px] font-semibold
              "
            >
              24%
            </span>
          </p>
          <p className="text-[18px] font-bold leading-7 text-[#6B7280]">
            Great work maintaining clarity.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

const StabilityCompassCard = ({ delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    viewport={{ once: true }}
    className="bg-white rounded-[24px] p-[33px]   shadow-[0_20px_25px_-5px_rgba(0,0,0,0.10),0_8px_10px_-6px_rgba(0,0,0,0.10)]
 border border-[#F3F4F6]"
  >
    <div className="mb-6">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center shadow-md"
        style={{
          background: "linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)",
        }}
      >
        <ArrowTrendingUpIcon className="w-6 h-6 text-white" />
      </div>
    </div>
    <h3 className="text-[20px] leading-7 font-semibold mb-2 text-black">
      Stability Compass
    </h3>
    <p className="text-[14px] mb-6 text-[#4B5563] font-bold leading-5 ">
      Please proceed only once the next action is intentional not reactive.
    </p>
    <div
      className="rounded-[16px] bg-[#FFF]     shadow-[0_0_24px_rgba(0,0,0,0.08)]
  p-4"
    >
      🔍
      <span
        className=" tex-[16px] leading-5 
    inline-flex items-center gap-2
    bg-[linear-gradient(135deg,#00BFA6_0%,#000080_100%)]
    bg-clip-text text-transparent
    font-semibold mb-3
  "
      >
        Signal Detection
      </span>
      <p className="text-[#FF8C00] text-[14px] font-semibold leading-5 mb-1">
        Overtrading risk
      </p>
      <p className="text-[12px] text-[#18181B] font-normal leading-4">
        Please proceed only once the next action is intentional not reactive.
      </p>
    </div>
  </motion.div>
);

const PerformanceMetricsCard = ({ delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    viewport={{ once: true }}
    className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100"
  >
    <div className="flex items-center gap-3 mb-6">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center shadow-md"
        style={{
          background: "linear-gradient(135deg, #6DD5FA 0%, #2980B9 100%)",
        }}
      >
        <ChartBarIcon className="w-6 h-6 text-white" />
      </div>
      <div>
        <h3 className="text-xl font-semibold text-black">
          Performance Metrics
        </h3>
        <p className="text-sm text-gray-500">Moved from hero panel</p>
      </div>
    </div>
    <div className="space-y-4">
      {[
        ["Win Rate", `${dummyMetrics.winRate}%`],
        ["Average Trade", `${dummyMetrics.avgTrade}%`],
        ["Risk / Reward", `${dummyMetrics.riskReward}:1`],
        [
          "Trades Today",
          `${dummyMetrics.tradesToday}/${dummyMetrics.maxTrades}`,
        ],
        ["Plan Compliance", `${dummyMetrics.planCompliance}%`],
        ["Early Exit Rate", `${dummyMetrics.earlyExitRate}%`],
      ].map(([label, value]) => (
        <div key={label} className="flex justify-between items-center">
          <span className="text-xs sm:text-sm text-gray-500">{label}</span>
          <span className="text-sm sm:text-base font-semibold text-gray-900">
            {value}
          </span>
        </div>
      ))}
    </div>
  </motion.div>
);
export default function ForEveryTraderSection() {
  const contentRef = useRef(null);
  const headerRef = useRef(null);

  useEffect(() => {
    if (!contentRef.current || !headerRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        contentRef.current,
        { x: "100%", opacity: 0 },
        {
          x: "0%",
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 60%",
            end: "top 10%",
            scrub: true,
          },
        }
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <>
      <style>{`
        #for-every-trader {
          background: linear-gradient(to bottom, #ffffff 0%, #ffffff 15%, #e8f8f8 25%, #c4eded 35%, #9de0e0 50%, #6bc5d5 65%, #4a9ec6 80%, #34578d 100%);
        }
        @media (min-width: 768px) {
          #for-every-trader {
            background: linear-gradient(to bottom, #ffffff 0%, #e8f8f8 45%, #c4eded 50%, #9de0e0 55%, #6bc5d5 70%, #4a9ec6 85%, #34578d 100%);
          }
        }
        
        /* Disable animation on mobile */
        @media (max-width: 1023px) {
          .text-animation-container {
            transform: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>

      <section
        id="for-every-trader"
        className="min-h-screen px-6 md:px-16 pt-[96px] pb-[50px] sm:pb-[128px] relative overflow-visible scroll-mt-12 rounded-b-[48px] md:rounded-b-[64px]"
      >
        <Container maxWidth="4xl" className="relative z-10" padding={false}>
          {/* Header Section */}
          <div className="mb-20" ref={headerRef}>
            <GradientHeading>
              For every
              <br />
              trader.
            </GradientHeading>

            {/* Description */}
            <div className="mt-8 max-w-4xl overflow-hidden">
              <div ref={contentRef} className="text-animation-container">
                <DescriptionText
                  delay={0.2}
                  className="text-[#9CA3AF] leading-[39px] text-[24px] !font-medium"
                >
                  Your trading behavior tells a story. Zentra listens, learns
                  and helps you stay in control. Because mastering yourself is
                  the real edge in trading.
                </DescriptionText>
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 gap-6">
            <ImmersiveVisualCard />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-[25px]">
            <StabilityCompassCard delay={0.3} />
            <PerformanceMetricsCard delay={0.5} />
          </div>
        </Container>
      </section>
    </>
  );
}
