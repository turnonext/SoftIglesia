import { MarketingBrandingReset } from "@/components/auth/marketing-branding-reset";
import { PublicThemeLock } from "@/components/auth/public-theme-lock";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MarketingBrandingReset />
      <PublicThemeLock />
      {children}
    </>
  );
}
