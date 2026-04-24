"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import Container from "./Container";
import GradientHeading from "./GradientHeading.js";
import DescriptionText from "./DescriptionText.js";

export default function SignUpCTASection() {
  return (
    <>
      <style>{`
        #signup-cta {
          background: linear-gradient(to bottom, #3d5a8f 0%, #5a9fc9 20%, #7bc7d8 40%, #a8e5e5 60%, #d4f4f4 80%, #f8feff 95%, #ffffff 100%);
        }
        @media (min-width: 768px) {
          #signup-cta {
            background: linear-gradient(to bottom, #3d5a8f 0%, #5a9fc9 25%, #7bc7d8 45%, #a8e5e5 65%, #d4f4f4 85%, #f8feff 95%, #ffffff 100%);
          }
        }
      `}</style>
      <section
        id="signup-cta"
        className="min-h-[60vh] px-6 md:px-16 py-24 pb-32 relative overflow-visible scroll-mt-12 rounded-b-[48px] md:rounded-b-[64px]"
      >
        <Container maxWidth="5xl" className="relative z-10" padding={false}>
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <GradientHeading className="mb-8">
                Ready to take
                <br />
                control?
              </GradientHeading>

              <div className="mt-8 max-w-2xl mx-auto mb-12">
                <DescriptionText delay={0.2}>
                  Start monitoring your trading states and make better decisions
                  with Zentra. Join thousands of traders who are already using
                  state-aware trading to improve their performance.
                </DescriptionText>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <Link href="/auth/signup">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-[#4ECDC4] to-[#44A08D] text-white font-semibold px-12 py-5 rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 text-xl mb-8"
                  >
                    Sign Up Now
                  </motion.button>
                </Link>
              </motion.div>

              {/* Features */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mt-12"
              >
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                  <div className="text-3xl mb-3">✓</div>
                  <h4 className="text-lg font-bold text-black mb-2">
                    Free Trial
                  </h4>
                  <p className="text-sm text-gray-600">
                    Start with a free trial, no credit card required
                  </p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                  <div className="text-3xl mb-3">⚡</div>
                  <h4 className="text-lg font-bold text-black mb-2">
                    Instant Setup
                  </h4>
                  <p className="text-sm text-gray-600">
                    Get started in minutes with simple integration
                  </p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                  <div className="text-3xl mb-3">🎯</div>
                  <h4 className="text-lg font-bold text-black mb-2">
                    Real Results
                  </h4>
                  <p className="text-sm text-gray-600">
                    See immediate improvements in your trading decisions
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </Container>
      </section>
    </>
  );
}
