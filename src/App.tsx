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
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import ElectricianTiraspol from "./pages/ElectricianTiraspol";
import ElectricianBendery from "./pages/ElectricianBendery";
import ElectricianSlobozia from "./pages/ElectricianSlobozia";
import ServiceZamenaProvodki from "./pages/services/ServiceZamenaProvodki";
import ServiceSborkaShchita from "./pages/services/ServiceSborkaShchita";
import ServiceAvariynyy from "./pages/services/ServiceAvariynyy";
import ServiceKvartira from "./pages/services/ServiceKvartira";
import ServiceDom from "./pages/services/ServiceDom";
import Contact from "./pages/Contact";

const Estimator = lazy(() => import("./pages/Estimator"));
const EstimatorEdit = lazy(() => import("./pages/EstimatorEdit"));

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
const Catalog = lazy(() => import("./pages/Catalog"));

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
          <Route path="/" element={<Index />} />
          <Route path="/features" element={<Features />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/elektrik-v-tiraspole" element={<ElectricianTiraspol />} />
          <Route path="/elektrik-v-benderah" element={<ElectricianBendery />} />
          <Route path="/elektrik-v-slobodzee" element={<ElectricianSlobozia />} />
          <Route path="/zamena-provodki" element={<ServiceZamenaProvodki />} />
          <Route path="/sborka-elektroshchita" element={<ServiceSborkaShchita />} />
          <Route path="/avariynyy-elektrik" element={<ServiceAvariynyy />} />
          <Route path="/elektromontazh-v-kvartire" element={<ServiceKvartira />} />
          <Route path="/elektromontazh-v-dome" element={<ServiceDom />} />
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
          <Route path="/catalog" element={<LazyComponent Component={Catalog} />} />
          <Route path="/admin/finance-settings" element={<LazyComponent Component={AdminFinanceSettings} />} />
          <Route path="/uslugi" element={<Features />} />
          <Route path="/stoimost" element={<Pricing />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<LazyComponent Component={NotFound} />} />
        </Routes>
        </BrowserRouter>
      </HelmetProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
