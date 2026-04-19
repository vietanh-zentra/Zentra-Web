"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import vector1 from "../../../../public/Vector 1.png";
import vector2 from "../../../../public/Vector 2.png";

/*
|--------------------------------------------------------------------------
| Local Quote List (Master Codebase Data)
|--------------------------------------------------------------------------
*/

const TRADING_QUOTES = [
  "The goal of a successful trader is to make the best trades. Money is secondary.",
  "Plan the trade and trade the plan.",
  "Losses are the tuition you pay for market education.",
  "Risk comes from not knowing what you're doing.",
  "Amateurs think about how much money they can make. Professionals think about how much money they could lose.",
  "The market is a device for transferring money from the impatient to the patient.",
  "Discipline is the bridge between goals and accomplishment in trading.",
  "You don’t need to be right every time, you just need to manage risk.",
  "Trading isn’t about being right; it’s about making money.",
  "Successful trading is always about emotional discipline.",
];

/*
|--------------------------------------------------------------------------
| Helper Function : Deterministic Quote by Date
|--------------------------------------------------------------------------
*/

function getQuoteByDate(date) {
  const baseDate = new Date("2024-01-01"); // fixed start date
  const diffDays = Math.floor((date - baseDate) / (1000 * 60 * 60 * 24));

  const index =
    ((diffDays % TRADING_QUOTES.length) + TRADING_QUOTES.length) %
    TRADING_QUOTES.length;

  return TRADING_QUOTES[index];
}

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function QuoteOfTheDay({ selectedDate }) {
  const date = selectedDate ? new Date(selectedDate) : new Date();
  const quote = getQuoteByDate(date);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="relative flex flex-col items-center p-6 bg-gradient-to-r from-[#EAEFF1] to-[#E6F6F6] overflow-hidden border border-[#fff]"
      style={{
        width: "100%",
        height: "264px",
        borderRadius: "20px",
        borderColor: "#fff",
      }}
    >
      {/* Top Decoration */}
      <div className="absolute top-0 left-0 right-0 h-24 pointer-events-none">
        <Image
          src={vector1}
          className="absolute right-0"
          alt="vector1"
          width={260}
          priority
        />

        <Image
          src={vector2}
          className="absolute left-0"
          alt="vector2"
          width={260}
          priority
        />
      </div>

      {/* Quote Icon */}
      <div className="relative z-10 mt-4 mb-4">
        <Image
          className="opacity-90"
          src={"/quotes.png"}
          alt="Quote icon"
          width={48}
          height={48}
        />
      </div>

      {/* Quote Text */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 md:px-12">
        <p className="text-6 text-[#363636] font-normal max-w-[380px]">
          {quote}
        </p>
      </div>
    </motion.div>
  );
}