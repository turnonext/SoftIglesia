"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { GlobalLoadingBar } from "@/components/layout/global-loading-bar";
import { useLocaleStore } from "@/stores/locale-store";

function HtmlLangSync() {
  const locale = useLocaleStore((s) => s.locale);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
        },
      })
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="lms-theme">
      <QueryClientProvider client={client}>
        <HtmlLangSync />
        <GlobalLoadingBar />
        {children}
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
