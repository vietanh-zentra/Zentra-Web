"use client";
import { motion } from "framer-motion";
import { ArrowRightIcon, CheckIcon } from "@heroicons/react/24/outline";
import Button from "@/components/Button";
import GlassPanel from "@/components/GlassPanel";
import Container from "./Container";

export default function CTASection() {
  const features = [
    "Free 14-day trial",
    "No credit card required",
    "Cancel anytime",
    "Full access to all features",
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-tertiary/10" />
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-3xl" />
      </div>

      <Container maxWidth="4xl" className="relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl lg:text-6xl font-bold text-primary mb-6">
            Ready to{" "}
            <span className="bg-gradient-to-r from-primary via-tertiary to-primary/70 bg-clip-text text-transparent">
              Start Trading Better?
            </span>
          </h2>

          <p className="text-xl lg:text-2xl text-primary/80 mb-12 leading-relaxed">
            Start your free trial today.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button variant="primary" showArrow={false}>
              <span className="flex items-center justify-center gap-2">
                Start Your Free Trial
                <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>

            <Button variant="outline" showArrow={false}>
              <span className="flex items-center justify-center gap-2">
                Schedule a Demo
                <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
          </div>

          {/* Features list */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {features.map((feature, index) => (
              <GlassPanel
                key={index}
                variant="light"
                padding="sm"
                className="flex items-center gap-2"
              >
                <CheckIcon className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm font-medium text-primary">
                  {feature}
                </span>
              </GlassPanel>
            ))}
          </div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row items-center justify-center gap-8 text-primary/70"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-tertiary rounded-full animate-pulse" />
              <span className="text-sm">Trusted by 10,000+ traders</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-tertiary rounded-full animate-pulse" />
              <span className="text-sm">4.9/5 average rating</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-tertiary rounded-full animate-pulse" />
              <span className="text-sm">SOC 2 compliant</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Floating elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-tertiary rounded-full opacity-30"
              style={{
                left: `${10 + i * 15}%`,
                top: `${20 + i * 10}%`,
              }}
              animate={{
                y: [-20, 20, -20],
                opacity: [0.2, 0.6, 0.2],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
