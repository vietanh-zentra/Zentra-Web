"use client";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Container from "./Container";
import GradientHeading from "./GradientHeading.js";
import DescriptionText from "./DescriptionText.js";
import { STATE_CONFIG } from "./StateIndicator";
import Brain3D from "./Brain3D";
import Image from "next/image";

gsap.registerPlugin(ScrollTrigger);

const LOOP_STATES = ["stable", "overtrading", "aggressive", "hesitant"];
const STATE_MESSAGES = {
  stable: "You're in a stable state. Stay with what's working.",
  overextended: "You're in an overextended state. Step back and reset.",
  overtrading: "You're showing signs of overtrading. Slow things down.",
  hesitant: "You're in a hesitant state. Review your last three valid setups.",
  aggressive: "You're in an aggressive state. Be mindful of risk management.",
};

// State Animation Card Component
const StateLoopCard = ({ delay }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [brainSize, setBrainSize] = useState(320);
  const imageRef = useRef(null);
  const cardRef = useRef(null);
  const currentState = LOOP_STATES[currentIndex];
  const nextState = LOOP_STATES[(currentIndex + 1) % LOOP_STATES.length];

  const stateName = useMemo(
    () => STATE_CONFIG[currentState]?.name || "Stable",
    [currentState]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % LOOP_STATES.length);
    }, 4200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateSize = () => {
      if (typeof window === "undefined") return;
      if (window.innerWidth < 640) {
        setBrainSize(240);
      } else if (window.innerWidth < 1024) {
        setBrainSize(300);
      } else {
        setBrainSize(360);
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // GSAP Scroll Animation
  // useEffect(() => {
  //   if (!imageRef.current || !cardRef.current) return;

  //   const ctx = gsap.context(() => {
  //     gsap.fromTo(
  //       imageRef.current,
  //       {
  //         y: -280,
  //         x: "20%",
  //         scale: 0.6,
  //       },
  //       {
  //         y: "30%",
  //         x: "20%",
  //         scale: 0.75,
  //         ease: "none",
  //         scrollTrigger: {
  //           trigger: cardRef.current,
  //           start: "top 85%",
  //           end: "top 20%",
  //           scrub: true,

  //           // 👇 When scrolling DOWN → hide overflow
  //           onUpdate: (self) => {
  //             if (self.progress > 0.85) {
  //               cardRef.current.classList.remove("overflow-visible");
  //               cardRef.current.classList.add("overflow-hidden");
  //             } else {
  //               cardRef.current.classList.remove("overflow-hidden");
  //               cardRef.current.classList.add("overflow-visible");
  //             }
  //           },

  //           // 👇 When scrolling UP → show overflow again
  //           onLeaveBack: () => {
  //             cardRef.current.classList.remove("overflow-hidden");
  //             cardRef.current.classList.add("overflow-visible");
  //           },
  //         },
  //       }
  //     );
  //   });

  //   return () => ctx.revert();
  // }, []);


  useEffect(() => {
    if (!imageRef.current || !cardRef.current) return;

    const mm = gsap.matchMedia();

    mm.add("(min-width: 768px)", () => {
      gsap.fromTo(
        imageRef.current,
        {
          y: -280,
          x: "20%",
          scale: 0.6,
        },
        {
          y: "30%",
          x: "20%",
          scale: 0.75,
          ease: "none",
          scrollTrigger: {
            trigger: cardRef.current,
            start: "top 85%",
            end: "top 20%",
            scrub: true,
            onUpdate: (self) => {
              if (self.progress > 0.85) {
                cardRef.current.classList.add("overflow-hidden");
                cardRef.current.classList.remove("overflow-visible");
              } else {
                cardRef.current.classList.add("overflow-visible");
                cardRef.current.classList.remove("overflow-hidden");
              }
            },
            onLeaveBack: () => {
              cardRef.current.classList.add("overflow-visible");
              cardRef.current.classList.remove("overflow-hidden");
            },
          },
        }
      );
    });

    mm.add("(max-width: 767px)", () => {
      gsap.set(imageRef.current, { clearProps: "all" });
      
      cardRef.current.classList.remove("overflow-hidden");
      cardRef.current.classList.add("overflow-visible");
    });

    return () => mm.revert();
  }, []);
  return (
    <div className="flex justify-center">
      <div
        ref={cardRef}
        className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-[896px] h-[400px] group "
      >
        <div className="absolute top-[0.5rem] sm:top-10 left-10 z-20">
          <div className="flex items-center justify-center">
            <img src="/images/Frame.svg" alt="brain" height={40} width={40} />
          </div>
        </div>

        <div className="absolute top-[4rem] sm:top-[6rem] left-10 z-10 max-w-md text-left">
          <h3 className=" max-w-[312px]">
            <span
              className="text-[32px] md:text-[40px] leading-[40px] sm:leading-[48px] font-semibold"
              style={{
                background:
                  "linear-gradient(114deg, #000080 4.51%, #00BFA6 56.18%, #F0E8D0 107.84%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              One Place.
              <br /> One Process.
              <br /> Endless Clarity.
            </span>
          </h3>
        </div>

        {/* 3. Image Area: Adjusted to bottom-right corner with overflow */}
        <div className="absolute bottom-0 right-0 w-full h-full flex justify-end items-end pointer-events-none">
          <img
            ref={imageRef}
            // src="/images/tablet-heroSection4.png"
              src="/images/new.jpeg"
            alt="Dashboard Preview"
            width={786}
            height={422}
            className="w-[65%] md:w-[95%]"
            style={{
              transform: "translate(40%, 25%)",
            }}
          />
        </div>
      </div>
    </div>
  );
};

// Plan Tracking Card Component
const PlanCard = ({ delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      className="bg-white shadow-[0_0_40px_0_rgba(0,0,0,0.12)] rounded-[32px] p-6  "
    >
      {/* Header with Title and Edit Button */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-[24px] leading-8 font-bold text-[#18181B]">
            Trading Plan
          </h3>
        </div>
        <p className="text-[#18181BCC] text-[14px] font-normal leading-5">
          Manage your trading preferences and risk parameters{" "}
        </p>
      </div>

      {/* Trading Plan Cards */}
      <div className="space-y-3">
        {/* Max Trades Per Day Card */}
        <div className="bg-white rounded-[16px] border border-[#16C9B5] p-4 shadow-[0_0_20px_0_rgba(22,201,181,0.12)]">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              {/* Heading and Icon */}
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-[#16C9B5] font-semibold text-[16px] leading-[20px]">
                  Max Trades Per Day
                </h4>
                <div className=" flex items-center justify-center flex-shrink-0">
                  <img
                    src="/images/trade1.svg"
                    alt="brain"
                    height={40}
                    width={40}
                  />
                </div>
              </div>

              {/* Number and Description */}
              <p className="text-[20px] font-bold leading-6 text-[#18181B] mb-4">
                3
              </p>
              <p className="text-[#18181BCC] text-[12px] font-normal leading-4">
                Helps prevent overtrading and maintain discipline
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[16px] border border-[#FF8C00] p-4 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              {/* Heading and Icon */}
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-[#FF8C00] font-semibold text-[16px] leading-[20px]">
                  Risk Per Trade
                </h4>
                <div className=" flex items-center justify-center flex-shrink-0">
                  <img
                    src="/images/trade2.svg"
                    alt="brain"
                    height={40}
                    width={40}
                  />
                </div>
              </div>

              {/* Number and Description */}
              <p className="text-[20px] font-bold leading-5 text-[#18181B] mb-4">
                2%
              </p>
              <p className="text-[#18181BCC] text-[12px] font-normal leading-4">
                Percentage of account risked per trade
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Evolution Card Component
const EvolutionCard = ({ delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      className="bg-[#00001F]  text-white rounded-3xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden"
    >
      <div>
        <h3 className="text-[20px] sm:text-[24px] leading-[28px] sm:leading-8 font-bold mb-2 text-white">
          Evolve Your Performance
        </h3>
        <p className="text-[14px] font-normal leading-5 text-[rgba(255,255,255,0.88)]">
          Your motion score has{" "}
          <span className="text-white font-semibold leading-5 text-[14px]">
            improved 23%
          </span>{" "}
          this month. Sessions show stronger discipline during high volatility
          phases.
        </p>
      </div>

      <div className="bg-[#16C9B5] opacity-50 blur-3xl w-[280px] h-[280px] absolute bottom-0 z-0 left-10 rounded-full"></div>

      {/* Insight Box */}
      <Image
        src="/images/data.png"
        alt="brain"
        className="relative z-10"
        height={169}
        width={367}
      />
    </motion.div>
  );
};

export default function InControlSection() {
  return (
    <>
      <style>{`
        #features {
          background: linear-gradient(to bottom, #ffffff 0%, #ffffff 15%, #f8feff 25%, #d4f4f4 35%, #a8e5e5 50%, #7bc7d8 65%, #5a9fc9 80%, #3d5a8f 100%);
        }
        @media (min-width: 768px) {
          #features {
            background: linear-gradient(to bottom, #ffffff 0%, #f8feff 45%, #d4f4f4 50%, #a8e5e5 55%, #7bc7d8 70%, #5a9fc9 85%, #3d5a8f 100%);
          }
        }
      `}</style>
      <section
        id="features"
        className="min-h-screen px-6 md:px-[272px] py-[50px] sm:py-[128px]  relative overflow-visible scroll-mt-12 rounded-b-[48px] md:rounded-b-[64px]"
      >
        <Container
          maxWidth="4xl"
          className="relative z-10 overflow-hidden"
          padding={false}
        >
          <div className=" mb-8 sm:mb-20">
            <GradientHeading>
              In
              <br />
              control.
            </GradientHeading>

            {/* Description */}
            <div className="mt-8 max-w-sm ">
              <DescriptionText
                delay={0.2}
                className="text-[#9CA3AF] text-[20px] sm:text-[24px] !font-bold leading-[30px] sm:leading-[39px] max-w-[353px] w-full"
              >
                Zentra gives you deep insight into how you trade — and why.
                Every feature works together to keep your mind, data, and
                discipline perfectly aligned.
              </DescriptionText>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* State Loop Card - Full width */}
            <div id="pin-windmill-wrap" className="md:col-span-2">
              <StateLoopCard delay={0.3} />
            </div>

            <PlanCard delay={0.5} />

            <EvolutionCard delay={0.7} />
          </div>
        </Container>
      </section>
    </>
  );
}
