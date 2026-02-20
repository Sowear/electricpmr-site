import Layout from "@/components/layout/Layout";
import HeroSection from "@/components/home/HeroSection";
import AboutSection from "@/components/home/AboutSection";
import ServicesSection from "@/components/home/ServicesSection";
import HowWeWorkSection from "@/components/home/HowWeWorkSection";
import WorkExamplesSection from "@/components/portfolio/WorkExamplesSection";
import RequestForm from "@/components/home/RequestForm";
import ContactSection from "@/components/contact/ContactSection";
import FloatingContactBar from "@/components/contact/FloatingContactBar";

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <ServicesSection />
      <AboutSection />
      <WorkExamplesSection />
      <HowWeWorkSection />
      <RequestForm />
      <ContactSection />
      <FloatingContactBar />
    </Layout>
  );
};

export default Index;
