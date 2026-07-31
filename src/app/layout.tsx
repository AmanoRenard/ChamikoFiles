import type { Metadata } from "next";
import "./globals.css";
import { NavBarWrapper } from "@/components/nav-bar-wrapper";
import { ToastProvider } from "@/components/toast-provider";
import { AuthProvider } from "@/components/auth-provider";
import { MainWrapper } from "@/components/main-wrapper";

export const metadata: Metadata = {
  title: "ChamikoFiles - 私人云盘",
  description: "轻量化私人网盘",
};

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
