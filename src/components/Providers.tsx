import { ReactNode, useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { isPrerenderRuntime } from "@/lib/runtime";

const queryClient = new QueryClient();

const ClientOnly = ({ children }: { children: ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (!isPrerenderRuntime()) setMounted(true);
  }, []);
  return mounted ? <>{children}</> : null;
};

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider defaultTheme="light" storageKey="electricpmr-theme" attribute="class">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ClientOnly>
            <Toaster />
            <Sonner />
          </ClientOnly>
          {children}
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
