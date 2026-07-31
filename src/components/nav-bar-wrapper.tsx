"use client";

import { usePathname } from "next/navigation";
import { NavBar } from "./nav-bar";

const HIDDEN_NAV_PATHS = ["/login", "/register"];

export function NavBarWrapper() {
  const pathname = usePathname();

  if (HIDDEN_NAV_PATHS.includes(pathname)) {
    return null;
  }

  return <NavBar />;
}
