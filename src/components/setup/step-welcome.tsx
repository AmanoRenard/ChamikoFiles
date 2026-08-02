"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Cloud,
  ArrowRight,
  Shield,
  Users,
  HardDrive,
  Lock,
  Sparkles,
} from "lucide-react";

const featureCards = [
  {
    icon: HardDrive,
    title: "海量存储",
    desc: "安全存储你的所有文件，支持多种格式预览",
    delay: 0.15,
    gradient: "from-primary/20 to-primary-cyan/10",
    border: "border-primary/20",
  },
  {
    icon: Users,
    title: "共享协作",
    desc: "创建共享空间，与团队无缝协作管理文件",
    delay: 0.3,
    gradient: "from-purple-500/20 to-pink-500/10",
    border: "border-purple-500/20",
  },
  {
    icon: Lock,
    title: "安全私密",
    desc: "邀请码注册机制，端到端保护你的数据安全",
    delay: 0.45,
    gradient: "from-cyan-500/20 to-emerald-500/10",
    border: "border-cyan-500/20",
  },
];

interface Props {
  onNext: () => void;
}

export default function StepWelcome({ onNext }: Props) {
  const [siteName, setSiteName] = useState("ChamikoFiles");
  const [smartGradient, setSmartGradient] = useState(true);

  useEffect(() => {
    fetch("/api/config/site")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setSiteName(d.data.name || "ChamikoFiles");
          setSmartGradient(d.data.smartGradient ?? true);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] px-4">
      {/* Logo area */}
      <motion.div
        className="flex flex-col items-center mb-12"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        {/* Logo icon */}
        <motion.div
          className="relative mb-8"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 15, delay: 0.1 }}
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary via-primary-light to-primary-cyan flex items-center justify-center shadow-2xl shadow-primary/25 relative">
            <Cloud size={40} className="text-white" />
            {/* Glow ring */}
            <motion.div
              className="absolute inset-0 rounded-2xl border-2 border-primary-light/40"
              animate={{
                scale: [1, 1.25, 1],
                opacity: [0.6, 0, 0.6],
              }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-3xl sm:text-4xl font-bold text-slate-100 mb-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {smartGradient ? (() => {
            for (let i = siteName.length - 1; i >= 1; i--) {
              if (siteName[i] >= "A" && siteName[i] <= "Z") {
                return <>{siteName.slice(0, i)}<span className="gradient-text">{siteName.slice(i)}</span></>;
              }
            }
            return <span className="gradient-text">{siteName}</span>;
          })() : siteName}
        </motion.h1>

        <motion.p
          className="text-base sm:text-lg text-slate-400 mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          构建你的私人云盘
        </motion.p>

        <motion.div
          className="flex items-center gap-1.5 text-sm text-slate-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.5 }}
        >
          <Sparkles size={14} className="text-primary-cyan" />
          <span>首次运行 · 初始化向导</span>
        </motion.div>
      </motion.div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl mb-12">
        {featureCards.map((card) => (
          <motion.div
            key={card.title}
            className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${card.gradient} border ${card.border} p-4 backdrop-blur-sm`}
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: card.delay, duration: 0.5, ease: "easeOut" }}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
          >
            <card.icon size={22} className="text-slate-300 mb-2.5" />
            <h3 className="text-sm font-semibold text-slate-200 mb-1">{card.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{card.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* CTA Button */}
      <motion.button
        onClick={onNext}
        className="group relative inline-flex items-center gap-3 px-8 py-3.5 rounded-xl bg-gradient-to-r from-primary to-primary-cyan text-white font-semibold text-sm shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        <span>开始配置</span>
        <motion.span
          animate={{ x: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        >
          <ArrowRight size={18} />
        </motion.span>
      </motion.button>

      {/* Bottom hint */}
      <motion.p
        className="mt-8 text-xs text-slate-600 flex items-center gap-1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.5 }}
      >
        <Shield size={12} />
        注册的账号将自动成为系统管理员
      </motion.p>
    </div>
  );
}
