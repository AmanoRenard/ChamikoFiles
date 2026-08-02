"use client";

import { usePathname } from "next/navigation";

const AUTH_PATHS = ["/login", "/register", "/setup"];

export function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.includes(pathname);

  return (
    <main className={isAuthPage ? "" : "pt-16 min-h-screen"}>
      {children}
    </main>
  );
}
