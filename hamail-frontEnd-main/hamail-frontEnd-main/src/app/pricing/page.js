"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import SectionHero from "@/components/SectionHero";
import {
  CheckCircleIcon,
  InformationCircleIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState("monthly");
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const pricingPlans = [
    {
      id: "monthly",
      name: "Monthly",
      price: "29",
      period: "month",
      description: "Flexible monthly subscription",
      link: "https://buy.stripe.com/cNi14n6ax17RdDR2dt5gc00",
      features: [
        "Full access to all features",
        "Real-time trading analysis",
        "Psychological state monitoring",
        "Trading plan management",
        "Unlimited trade tracking",
        "Priority support",
      ],
    },
    {
      id: "yearly",
      name: "Yearly",
      price: "249",
      period: "year",
      originalPrice: "348",
      discount: "99",
      description: "Save £99 with annual billing",
      badge: "Best Value",
      link: "https://buy.stripe.com/00w7sL0Qd7wfgQ33hx5gc01",
      features: [
        "Everything in Monthly",
        "2 months free",
        "Save £99 per year",
        "Priority feature requests",
        "Advanced analytics",
        "Dedicated support",
      ],
    },
  ];

  const faqs = [
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit and debit cards, as well as PayPal. All payments are processed securely through our payment provider.",
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer:
        "Yes, you can cancel your subscription at any time. If you cancel during your billing period, you'll continue to have access until the end of that period.",
    },
    {
      question: "What happens if I switch from monthly to yearly?",
      answer:
        "If you switch from monthly to yearly, we'll prorate your remaining monthly subscription and apply it to your yearly plan. You'll immediately start saving with the annual rate.",
    },
    {
      question: "Do you offer refunds?",
      answer:
        "We offer a 30-day money-back guarantee. If you're not satisfied with your subscription within the first 30 days, contact us for a full refund.",
    },
    {
      question: "Are there any hidden fees?",
      answer:
        "No hidden fees. The price you see is the price you pay. All prices include VAT where applicable.",
    },
    {
      question: "Can I change my plan later?",
      answer:
        "Absolutely! You can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.",
    },
    {
      question: "What features are included?",
      answer:
        "Both plans include full access to all features: real-time trading analysis, psychological state monitoring, trading plan management, unlimited trade tracking, and priority support. Yearly subscribers get additional benefits like priority feature requests and advanced analytics.",
    },
    {
      question: "Is there a free trial?",
      answer:
        "We don't offer a free trial—instead, we provide a 30-day money-back guarantee. Try Zentra risk-free.",
    },
  ];

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <>
      {/* Pricing Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-4">
              Finally see the trader you are, and the trader you can become.
            </h2>
            <h6 className="md:text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the plan that works best for you. All plans include full
              access to all features.
            </h6>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className={`relative bg-white rounded-2xl shadow-lg border-2 ${
                  plan.badge
                    ? "border-tertiary"
                    : "border-gray-200 hover:border-primary/50"
                } transition-all duration-300 overflow-hidden flex flex-col`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute top-4 right-4 bg-tertiary text-white px-4 py-1 rounded-full text-sm font-semibold">
                    {plan.badge}
                  </div>
                )}

                <div className="p-8 flex flex-col h-full">
                  {/* Plan Name */}
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-primary mb-2">
                      {plan.name}
                    </h3>
                    <h6 className="text-gray-600 text-sm">
                      {plan.description}
                    </h6>
                  </div>

                  {/* Pricing */}
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-4xl md:text-5xl font-bold text-primary">
                        £{plan.price}
                      </span>
                      <span className="text-gray-600 ml-2">/{plan.period}</span>
                    </div>
                    {plan.originalPrice && (
                      <div className="mt-2">
                        <span className="text-gray-400 line-through mr-2">
                          £{plan.originalPrice}
                        </span>
                        <span className="text-tertiary font-semibold">
                          Save £{plan.discount}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Features List */}
                  <ul className="space-y-4 mb-8 flex-1">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <CheckCircleIcon className="w-5 h-5 text-tertiary mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <a
                    href={plan.link}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`w-full inline-flex justify-center py-4 px-6 rounded-lg font-semibold text-white transition-all duration-300 mt-auto ${
                      plan.badge
                        ? "bg-gradient-to-r from-primary to-tertiary hover:from-tertiary hover:to-primary"
                        : "bg-primary hover:bg-primary/90"
                    } transform hover:scale-105`}
                  >
                    Select {plan.name}
                  </a>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-gradient-to-br from-secondary/30 to-tertiary/10 rounded-2xl p-8 max-w-5xl mx-auto"
          >
            <div className="flex items-start">
              <InformationCircleIcon className="w-6 h-6 text-primary mr-4 mt-1 flex-shrink-0" />
              <div>
                <h4 className="text-lg font-semibold text-primary mb-2">
                  Need more information?
                </h4>
                <h6 className="text-gray-700">
                  All plans include VAT where applicable. You can change or
                  cancel your plan at any time. Questions? Check out our FAQ
                  section below or{" "}
                  <a
                    href="/contact"
                    className="text-tertiary hover:text-tertiary/80 underline"
                  >
                    contact us
                  </a>
                  .
                </h6>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-gray-50 to-secondary/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center mb-4">
              <QuestionMarkCircleIcon className="w-8 h-8 text-primary mr-3" />
              <h2 className="text-3xl md:text-4xl font-bold text-primary">
                Frequently Asked Questions
              </h2>
            </div>
            <h6 className="text-gray-600">
              Everything you need to know about our pricing
            </h6>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-primary text-lg">
                    {faq.question}
                  </span>
                  <svg
                    className={`w-5 h-5 text-tertiary transition-transform ${
                      openFaqIndex === index ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {openFaqIndex === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-6 pb-5"
                  >
                    <h6 className="text-gray-700  pt-2">{faq.answer}</h6>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Still have questions
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <div className="bg-white rounded-xl p-8 shadow-md border border-gray-200">
              <h3 className="text-2xl font-bold text-primary mb-4">
                Still have questions?
              </h3>
              <h6 className="text-gray-600 mb-6">
                Can't find the answer you're looking for? Please chat with our
                friendly team.
              </h6>
              <a
                href="/contact"
                className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Contact Us
              </a>
            </div>
          </motion.div> */}
        </div>
      </section>
    </>
  );
}
