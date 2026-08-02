"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { SetupStep } from "@/types";
import ParticleBackground from "@/components/setup/particle-background";
import StepIndicator from "@/components/setup/step-indicator";
import StepWelcome from "@/components/setup/step-welcome";
import StepAdminAccount from "@/components/setup/step-admin-account";
import StepSiteConfig from "@/components/setup/step-site-config";
import StepSecurityStorage from "@/components/setup/step-security-storage";
import StepComplete from "@/components/setup/step-complete";

const STEP_ORDER: SetupStep[] = ["welcome", "admin", "site", "security", "complete"];

/** 密码需至少8位，且至少包含字母、数字、特殊字符中的两种 */
function isPasswordValid(pwd: string): boolean {
  if (pwd.length < 8) return false;
  const hasLetter = /[a-zA-Z]/.test(pwd);
  const hasDigit = /[0-9]/.test(pwd);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{}|;:'",.<>?/\\`~]/.test(pwd);
  return [hasLetter, hasDigit, hasSpecial].filter(Boolean).length >= 2;
}

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -300 : 300,
    opacity: 0,
  }),
};

export default function SetupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<SetupStep>("welcome");
  const [completedSteps, setCompletedSteps] = useState<SetupStep[]>([]);
  const [direction, setDirection] = useState(1);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);

  // Step 2 data
  const [adminData, setAdminData] = useState({
    username: "",
    nickname: "",
    password: "",
    confirmPassword: "",
  });

  // Step 3 data
  const [siteData, setSiteData] = useState({
    name: "ChamikoFiles",
    description: "私人云盘",
    storagePath: "",
  });

  // Step 4 data
  const [securityData, setSecurityData] = useState({
    maxFileSize: 500,
    maxSpace: 10,
    maxLoginAttempts: 5,
    sessionTimeout: 168,
  });

  // Check if setup is needed
  useEffect(() => {
    fetch("/api/auth/check-setup")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setNeedsSetup(d.data.needsSetup);
        else setNeedsSetup(false);
      })
      .catch(() => setNeedsSetup(false));
  }, []);

  // Redirect if setup not needed
  useEffect(() => {
    if (needsSetup === false) {
      router.replace("/login");
    }
  }, [needsSetup, router]);

  const goToStep = useCallback(
    (step: SetupStep) => {
      const currentIdx = STEP_ORDER.indexOf(currentStep);
      const targetIdx = STEP_ORDER.indexOf(step);
      setDirection(targetIdx > currentIdx ? 1 : -1);
      setError("");

      // Mark current as completed when moving forward
      if (targetIdx > currentIdx) {
        setCompletedSteps((prev) => {
          const newCompleted = [...prev];
          for (let i = 0; i < targetIdx; i++) {
            const s = STEP_ORDER[i];
            if (!newCompleted.includes(s)) {
              newCompleted.push(s);
            }
          }
          return newCompleted;
        });
      }
      setCurrentStep(step);
    },
    [currentStep]
  );

  const handleNext = useCallback(() => {
    const idx = STEP_ORDER.indexOf(currentStep);
    if (idx < STEP_ORDER.length - 1) {
      const nextStep = STEP_ORDER[idx + 1];

      // Validate step 2 (admin) before proceeding to step 3
      if (currentStep === "admin") {
        setError("");
        if (!adminData.username.trim() || !adminData.password || !adminData.nickname.trim()) {
          setError("请填写所有必填字段");
          return;
        }
        if (adminData.username.trim().length < 2) {
          setError("用户名至少需要 2 个字符");
          return;
        }
        if (adminData.nickname.trim().length < 1 || adminData.nickname.trim().length > 32) {
          setError("昵称需要 1-32 个字符");
          return;
        }
        if (!isPasswordValid(adminData.password)) {
          setError("密码需至少8位，且至少包含字母、数字、特殊字符中的两种");
          return;
        }
        if (adminData.password !== adminData.confirmPassword) {
          setError("两次密码输入不一致");
          return;
        }
      }

      goToStep(nextStep);
    }
  }, [currentStep, adminData, goToStep]);

  const handlePrev = useCallback(() => {
    const idx = STEP_ORDER.indexOf(currentStep);
    if (idx > 0) {
      goToStep(STEP_ORDER[idx - 1]);
    }
  }, [currentStep, goToStep]);

  const handleFinish = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    setError("");

    // Step 1: Register admin
    const regRes = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: adminData.username.trim(),
        password: adminData.password,
        nickname: adminData.nickname.trim(),
      }),
    });
    const regData = await regRes.json();

    if (!regData.success) {
      setError(regData.error || "注册失败，请返回上一步检查信息");
      setSubmitting(false);
      setCurrentStep("admin");
      return;
    }

    // Step 2: Save config
    const configBody: Record<string, Record<string, string | number>> = {};

    if (siteData.name || siteData.description || siteData.storagePath) {
      const site: Record<string, string | number> = {};
      if (siteData.name) site.name = siteData.name.trim();
      if (siteData.description) site.description = siteData.description.trim();
      if (Object.keys(site).length > 0) configBody.site = site;
    }

    const storage: Record<string, string | number> = {};
    if (siteData.storagePath) {
      storage.path = siteData.storagePath.trim();
    }
    storage.maxSpace = securityData.maxSpace * 1024 * 1024 * 1024; // GB to bytes
    if (Object.keys(storage).length > 0) configBody.storage = storage;

    const upload: Record<string, string | number> = {};
    upload.maxFileSize = securityData.maxFileSize === -1 ? -1 : securityData.maxFileSize * 1024 * 1024; // MB to bytes ( -1 = unlimited)
    upload.maxFilesPerBatch = 50;
    configBody.upload = upload;

    const sec: Record<string, string | number> = {};
    sec.maxLoginAttempts = securityData.maxLoginAttempts;
    sec.lockoutMinutes = 15;
    sec.sessionTimeoutHours = securityData.sessionTimeout;
    configBody.security = sec;

    const quota: Record<string, string | number> = {};
    quota.defaultPersonalQuota = -1;
    quota.defaultSharedQuota = -1;
    quota.maxSharedSpaces = 3;
    configBody.quota = quota;

    const notif: Record<string, string | number> = {};
    notif.storageAlertPercent = 80;
    configBody.notification = notif;

    const configRes = await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(configBody),
    });
    const configData = await configRes.json();

    if (!configData.success) {
      setError(configData.error || "配置保存失败");
      setSubmitting(false);
      return;
    }

    // Complete - navigate home
    setTimeout(() => {
      router.push("/");
    }, 800);
  }, [submitting, adminData, siteData, securityData, router]);

  // Loading state
  if (needsSetup === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F0B1E] via-[#1A1530] to-[#0F0B1E]">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  if (needsSetup === false) {
    return null;
  }

  const isFirstStep = currentStep === "admin";
  const isLastStep = currentStep === "complete";
  const showNavigation = currentStep !== "welcome" && currentStep !== "complete";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0B1E] via-[#1A1530] to-[#0F0B1E] relative overflow-hidden">
      {/* Particle background */}
      <ParticleBackground mode={currentStep === "complete" ? "firework" : "float"} />

      {/* Step indicator — hide on welcome page */}
      {currentStep !== "welcome" && (
        <StepIndicator currentStep={currentStep} completedSteps={completedSteps} />
      )}

      {/* Main content with step transitions */}
      <div className="relative z-10 pt-16">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            {currentStep === "welcome" && (
              <StepWelcome onNext={handleNext} />
            )}

            {currentStep === "admin" && (
              <StepAdminAccount
                data={adminData}
                onChange={setAdminData}
                error={error}
              />
            )}

            {currentStep === "site" && (
              <StepSiteConfig data={siteData} onChange={setSiteData} />
            )}

            {currentStep === "security" && (
              <StepSecurityStorage
                data={securityData}
                onChange={setSecurityData}
              />
            )}

            {currentStep === "complete" && (
              <StepComplete
                adminData={adminData}
                siteData={siteData}
                securityData={securityData}
                submitting={submitting}
                onFinish={handleFinish}
                onPrev={handlePrev}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom navigation */}
      {showNavigation && (
        <div className="fixed bottom-0 left-0 right-0 z-30 pb-6 pt-4 px-4">
          <div className="max-w-md mx-auto grid grid-cols-3 items-center">
            <div className="flex justify-start">
              {!isFirstStep && (
                <button
                  onClick={handlePrev}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-slate-400 hover:text-slate-200 hover:border-white/[0.15] transition-all"
                >
                  <ArrowLeft size={16} />
                  上一步
                </button>
              )}
            </div>

            <span className="text-[11px] text-slate-600 text-center">
              {STEP_ORDER.indexOf(currentStep)} / {STEP_ORDER.length - 1}
            </span>

            {!isLastStep && (
              <div className="flex justify-end">
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-cyan text-white text-sm font-medium shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
                >
                  下一步
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom padding for navigation */}
      {showNavigation && <div className="h-20" />}
    </div>
  );
}
