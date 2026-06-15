import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, useEffect, useState, type ReactNode } from "react";
import { LazyComponent, LazyPage } from "./components/LazyPage";
import { ThemeProvider } from "./components/ThemeProvider";
import { isPrerenderRuntime } from "./lib/runtime";

const Estimator = lazy(() => import("./components/pages/Estimator"));
const EstimatorEdit = lazy(() => import("./components/pages/EstimatorEdit"));

const Auth = lazy(() => import("./components/pages/Auth"));
const Dashboard = lazy(() => import("./components/pages/Dashboard"));
const AdminUsers = lazy(() => import("./components/pages/AdminUsers"));
const AdminWorkExamples = lazy(() => import("./components/pages/AdminWorkExamples"));
const Projects = lazy(() => import("./components/pages/Projects"));
const ProjectDetail = lazy(() => import("./components/pages/ProjectDetail"));
const ProjectPayouts = lazy(() => import("./components/pages/ProjectPayouts"));
const AdminFinanceSettings = lazy(() => import("./components/pages/AdminFinanceSettings"));
const NotFound = lazy(() => import("./components/pages/NotFound"));
const CityLanding = lazy(() => import("./components/pages/CityLanding"));
const Catalog = lazy(() => import("./components/pages/Catalog"));

const queryClient = new QueryClient();

const ClientOnly = ({ children }: { children: ReactNode }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isPrerenderRuntime()) {
      return;
    }

    setMounted(true);
  }, []);

  return mounted ? <>{children}</> : null;
};

const App = () => (
  <ThemeProvider defaultTheme="light" storageKey="electricpmr-theme" attribute="class">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ClientOnly>
          <Toaster />
          <Sonner />
        </ClientOnly>
        <BrowserRouter>
          <Routes>
            <Route path="/auth/*" element={<LazyComponent Component={Auth} />} />
            <Route path="/dashboard/*" element={<LazyComponent Component={Dashboard} />} />
            <Route path="/admin/users" element={<LazyComponent Component={AdminUsers} />} />
            <Route path="/admin/work-examples" element={<LazyComponent Component={AdminWorkExamples} />} />
            <Route path="/projects/*" element={<LazyComponent Component={Projects} />} />
            <Route path="/projects/:projectId" element={<LazyComponent Component={ProjectDetail} />} />
            <Route path="/projects/:projectId/estimates/:estimateId" element={<LazyComponent Component={EstimatorEdit} />} />
            <Route path="/projects/:projectId/finance/payouts" element={<LazyComponent Component={ProjectPayouts} />} />
            <Route path="/estimator/*" element={<LazyComponent Component={Estimator} />} />
            <Route path="/estimator/:id" element={<LazyComponent Component={EstimatorEdit} />} />
            <Route path="/catalog/*" element={<LazyComponent Component={Catalog} />} />
            <Route path="/admin/finance-settings" element={<LazyComponent Component={AdminFinanceSettings} />} />
            <Route path="*" element={<LazyComponent Component={NotFound} />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
