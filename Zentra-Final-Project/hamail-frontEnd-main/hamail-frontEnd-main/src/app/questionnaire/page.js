"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

export default function QuestionnairePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const questions = [
    {
      id: "trading_style",
      question: "What's your primary trading style?",
      type: "radio",
      options: [
        { value: "day_trading", label: "Day Trading" },
        { value: "swing_trading", label: "Swing Trading" },
        { value: "position_trading", label: "Position Trading" },
        { value: "scalping", label: "Scalping" },
      ],
    },
    {
      id: "experience_level",
      question: "How long have you been trading?",
      type: "radio",
      options: [
        { value: "beginner", label: "Less than 1 year" },
        { value: "intermediate", label: "1-3 years" },
        { value: "advanced", label: "3-5 years" },
        { value: "expert", label: "5+ years" },
      ],
    },
    {
      id: "risk_tolerance",
      question: "How would you describe your risk tolerance?",
      type: "radio",
      options: [
        {
          value: "conservative",
          label: "Conservative - I prefer small, steady gains",
        },
        { value: "moderate", label: "Moderate - I balance risk and reward" },
        {
          value: "aggressive",
          label:
            "Aggressive - I'm comfortable with higher risk for higher returns",
        },
        {
          value: "very_aggressive",
          label: "Very Aggressive - I'm willing to take significant risks",
        },
      ],
    },
    {
      id: "trading_goals",
      question: "What are your main trading goals?",
      type: "checkbox",
      options: [
        { value: "consistent_income", label: "Generate consistent income" },
        { value: "wealth_building", label: "Build long-term wealth" },
        { value: "skill_improvement", label: "Improve trading skills" },
        { value: "risk_management", label: "Better risk management" },
        { value: "emotional_control", label: "Better emotional control" },
      ],
    },
    {
      id: "biggest_challenge",
      question: "What's your biggest trading challenge?",
      type: "radio",
      options: [
        { value: "overtrading", label: "Overtrading - Taking too many trades" },
        {
          value: "fear_greed",
          label: "Fear and Greed - Emotional decision making",
        },
        { value: "discipline", label: "Discipline - Not following my plan" },
        { value: "patience", label: "Patience - Waiting for the right setups" },
        {
          value: "risk_management",
          label: "Risk Management - Position sizing and stops",
        },
      ],
    },
    {
      id: "trading_frequency",
      question: "How many trades do you typically take per day?",
      type: "radio",
      options: [
        { value: "0-1", label: "0-1 trades" },
        { value: "2-5", label: "2-5 trades" },
        { value: "6-10", label: "6-10 trades" },
        { value: "10+", label: "10+ trades" },
      ],
    },
  ];

  const handleAnswer = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit questionnaire
      console.log("Questionnaire completed:", answers);
      // Redirect to dashboard or next step
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentQuestion = questions[currentStep];
  const isAnswered = answers[currentQuestion.id] !== undefined;
  const progress = ((currentStep + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary/5 to-secondary/10 flex items-center justify-center p-6">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-40 h-40 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-2xl" />
        <div className="absolute bottom-1/4 -right-20 w-40 h-40 bg-gradient-to-br from-secondary/20 to-transparent rounded-full blur-2xl" />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="p-8 bg-white/70 backdrop-blur-md rounded-2xl border border-white/40 shadow-xl"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">Z</span>
              </div>
              <span className="text-2xl font-bold text-neutral-900">
                Zentra
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-neutral-900 mb-2">
              Trading Psychology Assessment
            </h1>
            <p className="text-neutral-600">
              Help us understand your trading style and psychology
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-neutral-600 mb-2">
              <span>
                Question {currentStep + 1} of {questions.length}
              </span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-white/50 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Question */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-xl font-semibold text-neutral-900 mb-6">
              {currentQuestion.question}
            </h2>

            <div className="space-y-3 mb-8">
              {currentQuestion.options.map((option, index) => (
                <motion.label
                  key={option.value}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                    answers[currentQuestion.id] === option.value
                      ? "border-primary bg-primary/10"
                      : "border-white/30 bg-white/50 hover:border-primary/50"
                  }`}
                >
                  <input
                    type={currentQuestion.type}
                    name={currentQuestion.id}
                    value={option.value}
                    checked={
                      currentQuestion.type === "radio"
                        ? answers[currentQuestion.id] === option.value
                        : answers[currentQuestion.id]?.includes(option.value)
                    }
                    onChange={(e) => {
                      if (currentQuestion.type === "radio") {
                        handleAnswer(currentQuestion.id, e.target.value);
                      } else {
                        const currentValues = answers[currentQuestion.id] || [];
                        const newValues = e.target.checked
                          ? [...currentValues, e.target.value]
                          : currentValues.filter((v) => v !== e.target.value);
                        handleAnswer(currentQuestion.id, newValues);
                      }
                    }}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                      answers[currentQuestion.id] === option.value ||
                      (currentQuestion.type === "checkbox" &&
                        answers[currentQuestion.id]?.includes(option.value))
                        ? "border-primary bg-primary"
                        : "border-neutral-300"
                    }`}
                  >
                    {(answers[currentQuestion.id] === option.value ||
                      (currentQuestion.type === "checkbox" &&
                        answers[currentQuestion.id]?.includes(
                          option.value
                        ))) && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <span className="text-neutral-700">{option.label}</span>
                </motion.label>
              ))}
            </div>
          </motion.div>

          {/* Navigation */}
          <div className="flex justify-between">
            <motion.button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                currentStep === 0
                  ? "text-neutral-400 cursor-not-allowed"
                  : "text-neutral-700 hover:bg-white/50"
              }`}
              whileHover={currentStep > 0 ? { scale: 1.02 } : {}}
              whileTap={currentStep > 0 ? { scale: 0.98 } : {}}
            >
              <ChevronLeftIcon className="w-5 h-5" />
              Previous
            </motion.button>

            <motion.button
              onClick={handleNext}
              disabled={!isAnswered}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                isAnswered
                  ? "bg-gradient-to-r from-primary to-tertiary text-white hover:shadow-lg"
                  : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
              }`}
              whileHover={isAnswered ? { scale: 1.02 } : {}}
              whileTap={isAnswered ? { scale: 0.98 } : {}}
            >
              {currentStep === questions.length - 1 ? "Complete" : "Next"}
              <ChevronRightIcon className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
