import Providers from "./Providers";
import React, { lazy, Suspense } from "react";

import Index from "@/pages/Index";
import Features from "@/pages/Features";
import Pricing from "@/pages/Pricing";
import Contact from "@/pages/Contact";
import ElectricianBendery from "@/pages/ElectricianBendery";
import ElectricianSlobozia from "@/pages/ElectricianSlobozia";
import ElectricianTiraspol from "@/pages/ElectricianTiraspol";

import ServiceAvariynyy from "@/pages/services/ServiceAvariynyy";
import ServiceDom from "@/pages/services/ServiceDom";
import ServiceKvartira from "@/pages/services/ServiceKvartira";
import ServiceSborkaShchita from "@/pages/services/ServiceSborkaShchita";
import ServiceZamenaProvodki from "@/pages/services/ServiceZamenaProvodki";

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

export default function PageWrapper({ pagePath }: { pagePath?: string }) {
  if (!pagePath) return null;
  const Component = Pages[pagePath];
  
  if (!Component) {
    console.error(`PageWrapper: Component mapped to path "${pagePath}" not found.`);
    return null;
  }
  
  return (
    <Providers>
      <Component />
    </Providers>
  );
}
