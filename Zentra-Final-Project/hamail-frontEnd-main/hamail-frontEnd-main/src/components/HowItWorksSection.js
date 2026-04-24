"use client";
import { motion } from "framer-motion";
import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "../../tailwind.config.js";
import Container from "./Container";
import GradientHeading from "./GradientHeading.js";
import DescriptionText from "./DescriptionText.js";

const fullConfig = resolveConfig(tailwindConfig);
const colors = fullConfig.theme.colors;

// Card icon component
const CardIcon = ({ gradient, children }) => {
  return (
    <div
      className="w-12 h-12 rounded-lg flex items-center justify-center shadow-md"
      style={{
        background: gradient,
      }}
    >
      {children}
    </div>
  );
};

// Feature card component
const FeatureCard = ({
  title,
  description,
  icon,
  bgColor,
  delay,
  isWhiteText,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      className={`${bgColor} rounded-3xl p-8 shadow-xl`}
    >
      <div className="mb-6">{icon}</div>
      <h3
        className={`text-xl font-semibold mb-3 ${
          isWhiteText ? "text-white" : "text-black"
        }`}
      >
        {title}
      </h3>
      <p
        className={`text-sm leading-relaxed ${
          isWhiteText ? "text-white/90" : "text-gray"
        }`}
      >
        {description}
      </p>
    </motion.div>
  );
};

export default function HowItWorksSection() {
  return (
    <>
      <style>{`
        #how-it-works {
          background: linear-gradient(to bottom, #ffffff 0%, #ffffff 20%, #e8f7f5 35%, #a8e5e0 55%, #8b9fd9 100%);
        }
        @media (min-width: 768px) {
          #how-it-works {
            background: linear-gradient(to bottom, #ffffff 0%, #ffffff 50%, #e8f7f5 60%, #a8e5e0 70%, #8b9fd9 100%);
          }
        }
      `}</style>
      <section
        id="how-it-works"
        className="min-h-screen px-6 md:px-16 py-24 pb-32 relative overflow-visible scroll-mt-12 rounded-b-[48px] md:rounded-b-[64px]"
      >
        <Container maxWidth="4xl" className="relative z-10" padding={false}>
          {/* Header Section */}
          <div className="mb-20">
            {/* Large Heading */}
            <GradientHeading>
              In the
              <br />
              zone.
            </GradientHeading>

            {/* Description - positioned to the right */}
            <div className="mt-8 ml-0 md:ml-auto max-w-sm">
              <DescriptionText delay={0.2}>
                Stay calm, stay sharp. Zentra keeps you aligned with your plan —
                tracking focus, emotion, and discipline in real time.
              </DescriptionText>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Plan it Card - Full width */}
            <div className="md:col-span-2">
              <FeatureCard
                title="Plan it."
                description="Set your trading rules — Zentra keeps you accountable."
                icon={
                  <CardIcon
                    gradient={`linear-gradient(135deg, ${colors.primary} 0%, #2d7a8f 100%)`}
                  >
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                      <rect x="9" y="3" width="6" height="4" rx="1" />
                      <path d="M9 12h6" />
                      <path d="M9 16h6" />
                    </svg>
                  </CardIcon>
                }
                bgColor="bg-white"
                delay={0.3}
              />
            </div>

            {/* Trade it Card - Left bottom */}
            <FeatureCard
              title="Trade it."
              description="Log your sessions effortlessly. Spot what's driving your decisions."
              icon={
                <CardIcon
                  gradient={`linear-gradient(135deg, ${colors.primary} 0%, #1f5661 100%)`}
                >
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </CardIcon>
              }
              bgColor="bg-gradient-to-b from-neutral-900 to-black text-white"
              isWhiteText={true}
              delay={0.5}
            />

            {/* Evolve Card - Right bottom */}
            <FeatureCard
              title="Evolve."
              description="See your mindset, learn your patterns, and grow with precision."
              icon={
                <CardIcon
                  gradient={`linear-gradient(135deg, ${colors.tertiary} 0%, #5a4db8 100%)`}
                >
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="20" x2="12" y2="10" />
                    <line x1="18" y1="20" x2="18" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="16" />
                  </svg>
                </CardIcon>
              }
              bgColor="bg-white"
              delay={0.7}
            />
          </div>
        </Container>
      </section>
    </>
  );
}
