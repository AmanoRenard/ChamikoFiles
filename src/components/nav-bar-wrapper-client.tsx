"use client";

import { usePathname } from "next/navigation";
import { NavBar } from "./nav-bar";

interface NavBarWrapperClientProps {
  initialSiteName: string;
  initialSiteDesc: string;
  initialSmartGradient: boolean;
  hiddenPaths: string[];
}

export function NavBarWrapperClient({
  initialSiteName,
  initialSiteDesc,
  initialSmartGradient,
  hiddenPaths,
}: NavBarWrapperClientProps) {
  const pathname = usePathname();

  if (hiddenPaths.includes(pathname)) {
    return null;
  }

  return (
    <NavBar
      initialSiteName={initialSiteName}
      initialSiteDesc={initialSiteDesc}
      initialSmartGradient={initialSmartGradient}
    />
  );
}
