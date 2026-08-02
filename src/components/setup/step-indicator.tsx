"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { SetupStep, SETUP_STEPS, STEP_LABELS } from "@/types";

interface Props {
  currentStep: SetupStep;
  completedSteps: SetupStep[];
}

const STEP_ICONS: Record<SetupStep, string> = {
  welcome: "—",
  admin: "1",
  site: "2",
  security: "3",
  complete: "4",
};

export default function StepIndicator({ currentStep, completedSteps }: Props) {
  // Exclude welcome from the indicator — it‘s not a configuration step
  const visibleSteps = SETUP_STEPS.filter((s) => s !== "welcome");

  return (
    <div className="fixed top-0 left-0 right-0 z-30 pt-6 pb-3 px-4">
      <div className="max-w-2xl mx-auto flex items-center justify-center gap-0">
        {visibleSteps.map((step, index) => {
          const isActive = currentStep === step;
          const isCompleted = completedSteps.includes(step);
          const isPast = completedSteps.includes(step) || isActive;

          return (
            <div key={step} className="flex items-center">
              {/* Step circle */}
              <motion.div
                className="relative flex items-center justify-center"
                animate={
                  isActive
                    ? {
                        scale: [1, 1.08, 1],
                        transition: { repeat: Infinity, duration: 2, ease: "easeInOut" },
                      }
                    : { scale: 1 }
                }
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                    isCompleted
                      ? "bg-emerald-500/20 border border-emerald-400/40 text-emerald-300"
                      : isActive
                      ? "bg-primary/20 border border-primary/50 text-primary-light shadow-lg shadow-primary/15"
                      : "bg-white/[0.03] border border-white/[0.08] text-slate-600"
                  }`}
                >
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Check size={14} />
                    </motion.div>
                  ) : (
                    STEP_ICONS[step]
                  )}
                </div>

                {/* Label below (hidden on mobile) */}
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 hidden sm:block">
                  <span
                    className={`text-[10px] whitespace-nowrap transition-colors duration-300 ${
                      isActive
                        ? "text-primary-light font-medium"
                        : isCompleted
                        ? "text-emerald-400/60"
                        : "text-slate-600"
                    }`}
                  >
                    {STEP_LABELS[step]}
                  </span>
                </div>
              </motion.div>

              {/* Connector line — only light up after the step is completed */}
              {index < visibleSteps.length - 1 && (
                <div className="w-10 sm:w-16 h-px mx-1.5 sm:mx-2 relative">
                  <div className="absolute inset-0 bg-white/[0.06] rounded-full" />
                  <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-primary-cyan origin-left"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: isCompleted ? 1 : 0 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
