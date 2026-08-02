"use client";

import { motion } from "framer-motion";
import {
  Globe,
  FileText,
  FolderOpen,
  Info,
} from "lucide-react";

interface SiteData {
  name: string;
  description: string;
  storagePath: string;
}

interface Props {
  data: SiteData;
  onChange: (data: SiteData) => void;
}

export default function StepSiteConfig({ data, onChange }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] px-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
          >
            <Globe size={22} className="text-cyan-400" />
          </motion.div>
          <h2 className="text-xl font-bold text-slate-100 mb-1">个性化你的站点</h2>
          <p className="text-sm text-slate-500">设置站点名称和存储位置</p>
        </div>

        {/* Form */}
        <div className="glass-card p-6 border border-white/[0.06] space-y-4">
          {/* Site Name */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
              <Globe size={13} />
              站点名称
            </label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => onChange({ ...data, name: e.target.value })}
              placeholder="ChamikoFiles"
              className="w-full h-11 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
            />
            <p className="text-[11px] text-slate-600 mt-1">显示在浏览器标题栏和页面顶部</p>
          </div>

          {/* Site Description */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
              <FileText size={13} />
              站点描述
            </label>
            <input
              type="text"
              value={data.description}
              onChange={(e) => onChange({ ...data, description: e.target.value })}
              placeholder="私人云盘"
              className="w-full h-11 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
            />
          </div>

          {/* Storage Path */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
              <FolderOpen size={13} />
              文件存放目录
            </label>
            <input
              type="text"
              value={data.storagePath}
              onChange={(e) => onChange({ ...data, storagePath: e.target.value })}
              placeholder="留空使用默认路径"
              className="w-full h-11 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
            />

            {/* Path hint */}
            <motion.div
              className="flex items-start gap-2 mt-2 px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Info size={13} className="text-slate-500 flex-shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-500 leading-relaxed">
                <p>文件存放的根目录路径。请输入绝对路径，例如：D:/Files</p>
                <p className="mt-0.5">留空则使用系统公共目录下的 Chamiko Files 文件夹</p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
