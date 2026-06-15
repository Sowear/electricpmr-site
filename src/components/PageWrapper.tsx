import Providers from "./Providers";
import React, { lazy, Suspense } from "react";

import Index from "@/components/pages/Index";
import Features from "@/components/pages/Features";
import Pricing from "@/components/pages/Pricing";
import Contact from "@/components/pages/Contact";
import ElectricianBendery from "@/components/pages/ElectricianBendery";
import ElectricianSlobozia from "@/components/pages/ElectricianSlobozia";
import ElectricianTiraspol from "@/components/pages/ElectricianTiraspol";

import ServiceAvariynyy from "@/components/pages/services/ServiceAvariynyy";
import ServiceDom from "@/components/pages/services/ServiceDom";
import ServiceKvartira from "@/components/pages/services/ServiceKvartira";
import ServiceSborkaShchita from "@/components/pages/services/ServiceSborkaShchita";
import ServiceZamenaProvodki from "@/components/pages/services/ServiceZamenaProvodki";

const Pages: Record<string, React.ElementType> = {
  "Index": Index,
  "Features": Features,
  "Pricing": Pricing,
  "Contact": Contact,
  "ElectricianBendery": ElectricianBendery,
  "ElectricianSlobozia": ElectricianSlobozia,
  "ElectricianTiraspol": ElectricianTiraspol,
  "services/ServiceAvariynyy": ServiceAvariynyy,
  "services/ServiceDom": ServiceDom,
  "services/ServiceKvartira": ServiceKvartira,
  "services/ServiceSborkaShchita": ServiceSborkaShchita,
  "services/ServiceZamenaProvodki": ServiceZamenaProvodki,
};

import { RouteContext } from "./RouteContext";

export default function PageWrapper({ pagePath, currentPath }: { pagePath?: string, currentPath?: string }) {
  if (!pagePath) return null;
  const Component = Pages[pagePath];
  
  if (!Component) {
    console.error(`PageWrapper: Component mapped to path "${pagePath}" not found.`);
    return null;
  }
  
  return (
    <RouteContext.Provider value={currentPath || "/"}>
      <Providers>
        <Component />
      </Providers>
    </RouteContext.Provider>
  );
}
