import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { lazy, Suspense } from "react";
import ElectricianTiraspol from "./pages/ElectricianTiraspol";
import ElectricianBendery from "./pages/ElectricianBendery";
import ElectricianSlobozia from "./pages/ElectricianSlobozia";
import { LazyComponent } from "./components/LazyPage";
import Index from "./pages/Index";
import Estimator from "./pages/Estimator";
import EstimatorEdit from "./pages/EstimatorEdit";

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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HelmetProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/features" element={<LazyComponent Component={Features} />} />
          <Route path="/pricing" element={<LazyComponent Component={Pricing} />} />
          <Route path="/elektrik-v-tiraspole" element={<LazyComponent Component={CityLanding} cityKey="tiraspol" />} />
          <Route path="/elektrik-v-tiraspole" element={<ElectricianTiraspol />} />
          <Route path="/elektrik-v-benderah" element={<ElectricianBendery />} />
          <Route path="/elektrik-v-slobodzee" element={<ElectricianSlobozia />} />
          <Route path="/auth" element={<LazyComponent Component={Auth} />} />
          <Route path="/dashboard" element={<LazyComponent Component={Dashboard} />} />
          <Route path="/admin/users" element={<LazyComponent Component={AdminUsers} />} />
          <Route path="/admin/work-examples" element={<LazyComponent Component={AdminWorkExamples} />} />
          <Route path="/projects" element={<LazyComponent Component={Projects} />} />
          <Route path="/projects/:projectId" element={<LazyComponent Component={ProjectDetail} />} />
          <Route path="/projects/:projectId/estimates/:estimateId" element={<LazyComponent Component={EstimatorEdit} />} />
          <Route path="/projects/:projectId/finance/payouts" element={<LazyComponent Component={ProjectPayouts} />} />
          <Route path="/estimator" element={<Estimator />} />
          <Route path="/estimator/:id" element={<EstimatorEdit />} />
          <Route path="/admin/finance-settings" element={<LazyComponent Component={AdminFinanceSettings} />} />
          <Route path="/uslugi" element={<LazyComponent Component={Features} />} />
          <Route path="/stoimost" element={<LazyComponent Component={Pricing} />} />
          <Route path="*" element={<LazyComponent Component={NotFound} />} />
        </Routes>
        </BrowserRouter>
      </HelmetProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
