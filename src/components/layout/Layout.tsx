import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { motion, useScroll, useSpring } from "framer-motion";
import ScrollWire from "../common/ScrollWire";

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
  title?: string;
  description?: string;
  canonical?: string;
}

const Layout = ({ 
  children, 
  showFooter = true, 
  title = "ЭлектроМастер — электромонтаж в Приднестровье", 
  description = "Профессиональный электромонтаж в Тирасполе, Слободзее, Бендерах. Монтаж, ремонт, аварийный выезд. Качественная работа с гарантией.",
  canonical 
}: LayoutProps) => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <>
      <ScrollWire />
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-primary origin-left z-[100] shadow-[0_0_15px_hsl(var(--primary))]"
        style={{ scaleX }}
      />
      <Helmet>
        {/* Organization Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "ЭлектроМастер",
            "alternateName": "ElectricMaster",
            "url": "https://electricpmr.vercel.app",
            "logo": "https://electricpmr.vercel.app/logo-icon.png",
            "description": "Профессиональный электромонтаж в Приднестровье",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Тирасполь",
              "addressRegion": "ПМР",
              "addressCountry": "MD"
            },
            "telephone": "+37377746642",
            "email": "mmxxnon@gmail.com",
            "areaServed": ["Тирасполь", "Слободзея", "Бендеры", "Днестровск", "Григориополь"],
            "serviceType": "Электромонтажные работы",
            "availableLanguage": "ru",
            "foundingDate": "2024",
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": "+37377746642",
              "contactType": "customer service",
              "areaServed": ["ПМР", "Тирасполь", "Слободзея", "Бендеры"]
            },
            "makesOffer": [
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Электромонтажные работы",
                  "description": "Полный спектр электромонтажных работ: замена проводки, установка розеток, сборка щитов, подключение техники"
                }
              }
            ]
          })}
        </script>
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        {showFooter && <Footer />}
      </div>
    </>
  );
};

export default Layout;