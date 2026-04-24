"use client";
import { motion } from "framer-motion";
import Container from "./Container";

export default function GoFurtherSection() {
  const cards = [
    {
      title: "Replace guesswork with awareness",
      bgColor: "linear-gradient(135deg, #3b5998 0%, #2d4373 100%)",
      iconBgColor: "rgba(147, 176, 221, 0.5)",
    },
    {
      title: "Spot emotional traps before decisions",
      bgColor: "linear-gradient(135deg, #00bfa6 0%, #00a88f 100%)",
      iconBgColor: "rgba(128, 222, 234, 0.5)",
    },
    {
      title: "Build lasting discipline daily",
      bgColor: "linear-gradient(135deg, #434343 0%, #2b2b2b 100%)",
      iconBgColor: "rgba(169, 169, 169, 0.5)",
    },
  ];

  return (
    <section className="min-h-screen px-6 md:px-16 py-24 relative bg-white">
      <Container maxWidth="6xl" className="relative z-10" padding={false}>
        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-16 text-[#000000]"
        >
          Go further with Zentra.
        </motion.h2>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
          {cards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="rounded-3xl p-8 md:p-10 shadow-2xl hover:scale-105 transition-transform duration-300"
              style={{
                background: card.bgColor,
              }}
            >
              {/* Title */}
              <h3 className="text-white font-semibold text-lg md:text-xl mb-16 leading-tight">
                {card.title}
              </h3>

              {/* Icon Circle */}
              <div className="flex justify-center">
                <div
                  className="w-24 h-24 md:w-28 md:h-28 rounded-full"
                  style={{ backgroundColor: card.iconBgColor }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
