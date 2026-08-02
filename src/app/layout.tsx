import type { Metadata } from "next";
import "./globals.css";
import { NavBarWrapper } from "@/components/nav-bar-wrapper";
import { ToastProvider } from "@/components/toast-provider";
import { AuthProvider } from "@/components/auth-provider";
import { MainWrapper } from "@/components/main-wrapper";
import { readConfig } from "@/lib/config";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const config = readConfig();
    const name = config.site?.name || "ChamikoFiles";
    const desc = config.site?.description || "轻量化私人网盘";
    return {
      title: `${name} - ${desc}`,
      description: desc,
    };
  } catch {
    return {
      title: "ChamikoFiles - 私人云盘",
      description: "轻量化私人网盘",
    };
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="dark">
        <AuthProvider>
          <ToastProvider>
            <NavBarWrapper />
            <MainWrapper>{children}</MainWrapper>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
