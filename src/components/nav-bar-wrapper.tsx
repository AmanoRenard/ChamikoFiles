import { readConfig } from "@/lib/config";
import { NavBarWrapperClient } from "./nav-bar-wrapper-client";

const HIDDEN_NAV_PATHS = ["/login", "/register", "/setup"];

export function NavBarWrapper() {
  let siteName = "ChamikoFiles";
  let siteDesc = "私人云盘";
  let smartGradient = true;

  try {
    const config = readConfig();
    siteName = config.site?.name || "ChamikoFiles";
    siteDesc = config.site?.description || "私人云盘";
    smartGradient = config.site?.smartGradient ?? true;
  } catch {
    // use defaults
  }

  return (
    <NavBarWrapperClient
      initialSiteName={siteName}
      initialSiteDesc={siteDesc}
      initialSmartGradient={smartGradient}
      hiddenPaths={HIDDEN_NAV_PATHS}
    />
  );
}
