import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { lazy, Suspense } from "react";
import SeoRouterMeta from "./components/SeoRouterMeta";
import { LazyComponent, LazyPage } from "./components/LazyPage";
import { ThemeProvider } from "./components/ThemeProvider";
import Index from "./pages/Index";

const ElectricianTiraspol = lazy(() => import("./pages/ElectricianTiraspol"));
const ElectricianBendery = lazy(() => import("./pages/ElectricianBendery"));
const ElectricianSlobozia = lazy(() => import("./pages/ElectricianSlobozia"));
const Estimator = lazy(() => import("./pages/Estimator"));
const EstimatorEdit = lazy(() => import("./pages/EstimatorEdit"));

const ServiceZamenaProvodki = lazy(() => import("./pages/services/ServiceZamenaProvodki"));
const ServiceSborkaShchita = lazy(() => import("./pages/services/ServiceSborkaShchita"));
const ServiceAvariynyy = lazy(() => import("./pages/services/ServiceAvariynyy"));
const ServiceKvartira = lazy(() => import("./pages/services/ServiceKvartira"));
const ServiceDom = lazy(() => import("./pages/services/ServiceDom"));

const Features = lazy(() => import("./pages/Features"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminWorkExamples = lazy(() => import("./pages/AdminWorkExamples"));
const Projects = lazy(() => import("./pages/Projects"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const ProjectPayouts = lazy(() => import("./pages/ProjectPayouts"));
const AdminFinanceSettings = lazy(() => import("./pages/AdminFinanceSettings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const CityLanding = lazy(() => import("./pages/CityLanding"));
const Contact = lazy(() => import("./pages/Contact"));

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="light" storageKey="electricpmr-theme" attribute="class">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
      <Toaster />
      <Sonner />
      <HelmetProvider>
        <BrowserRouter>
        <SeoRouterMeta />
        <Routes>
          <Route path="/" element={<LazyPage><Index /></LazyPage>} />
          <Route path="/features" element={<LazyComponent Component={Features} />} />
          <Route path="/pricing" element={<LazyComponent Component={Pricing} />} />
          <Route path="/elektrik-v-tiraspole" element={<LazyComponent Component={ElectricianTiraspol} />} />
          <Route path="/elektrik-v-benderah" element={<LazyComponent Component={ElectricianBendery} />} />
          <Route path="/elektrik-v-slobodzee" element={<LazyComponent Component={ElectricianSlobozia} />} />
          <Route path="/zamena-provodki" element={<LazyComponent Component={ServiceZamenaProvodki} />} />
          <Route path="/sborka-elektroshchita" element={<LazyComponent Component={ServiceSborkaShchita} />} />
          <Route path="/avariynyy-elektrik" element={<LazyComponent Component={ServiceAvariynyy} />} />
          <Route path="/elektromontazh-v-kvartire" element={<LazyComponent Component={ServiceKvartira} />} />
          <Route path="/elektromontazh-v-dome" element={<LazyComponent Component={ServiceDom} />} />
          <Route path="/auth" element={<LazyComponent Component={Auth} />} />
          <Route path="/dashboard" element={<LazyComponent Component={Dashboard} />} />
          <Route path="/admin/users" element={<LazyComponent Component={AdminUsers} />} />
          <Route path="/admin/work-examples" element={<LazyComponent Component={AdminWorkExamples} />} />
          <Route path="/projects" element={<LazyComponent Component={Projects} />} />
          <Route path="/projects/:projectId" element={<LazyComponent Component={ProjectDetail} />} />
          <Route path="/projects/:projectId/estimates/:estimateId" element={<LazyComponent Component={EstimatorEdit} />} />
          <Route path="/projects/:projectId/finance/payouts" element={<LazyComponent Component={ProjectPayouts} />} />
          <Route path="/estimator" element={<LazyComponent Component={Estimator} />} />
          <Route path="/estimator/:id" element={<LazyComponent Component={EstimatorEdit} />} />
          <Route path="/admin/finance-settings" element={<LazyComponent Component={AdminFinanceSettings} />} />
          <Route path="/uslugi" element={<LazyComponent Component={Features} />} />
          <Route path="/stoimost" element={<LazyComponent Component={Pricing} />} />
          <Route path="/contact" element={<LazyComponent Component={Contact} />} />
          <Route path="*" element={<LazyComponent Component={NotFound} />} />
        </Routes>
        </BrowserRouter>
      </HelmetProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
