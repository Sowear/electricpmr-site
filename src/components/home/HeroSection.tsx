import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, AlertTriangle, CheckCircle2, Shield, Users } from "lucide-react";
import EmergencyCallDialog from "@/components/contact/EmergencyCallDialog";
import heroImage from "@/assets/hero-electrical-panel.png";
const HeroSection = () => {
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const scrollToForm = () => {
    document.getElementById('request-form')?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  const trustBadges = [{
    icon: CheckCircle2,
    title: "ПУЭ",
    subtitle: "работаем по нормам"
  }, {
    icon: Shield,
    title: "5 лет",
    subtitle: "гарантии на работы"
  }, {
    icon: Users,
    title: "Своя команда",
    subtitle: "без посредников"
  }];
  return <section className="relative min-h-[90vh] overflow-hidden bg-industrial-dark">
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-industrial-dark via-industrial-dark/95 to-industrial-dark/70 z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-industrial-dark via-transparent to-transparent z-10" />
      
      {/* 3D Illustration - Right side */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[55%] h-full hidden lg:block z-0">
        <div className="relative h-full w-full">
          <img src={heroImage} alt="Профессиональный электрощит с аккуратной разводкой" className="absolute right-0 top-1/2 -translate-y-1/2 w-full h-auto max-h-[80%] object-contain opacity-90" />
          {/* Glow effect behind panel */}
          <div className="absolute right-[10%] top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]" />
        </div>
      </div>

      {/* Content */}
      <div className="container-main relative z-20">
        <div className="py-20 md:py-28 lg:py-36">
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-8 animate-fade-in">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">Электромонтаж по всему Приднестровью</span>
            </div>

            {/* Headline */}
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-6 text-white animate-slide-up">
              Электрика, в которой{" "}
              <span className="text-gradient bg-primary text-right text-6xl font-sans">вы уверены на 100%</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-white/70 mb-10 max-w-xl animate-slide-up leading-relaxed" style={{
            animationDelay: "0.1s"
          }}>
              Проектируем, монтируем и обслуживаем электросети 
              в Приднестровье по современным стандартам безопасности
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-16 animate-slide-up" style={{
            animationDelay: "0.2s"
          }}>
              <Button size="lg" onClick={scrollToForm} className="btn-hero group text-base h-14 px-8">
                Получить расчёт бесплатно
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-base border-2 border-white/30 bg-transparent text-white hover:bg-white/10 hover:border-white/50" onClick={() => setEmergencyOpen(true)}>
                <AlertTriangle className="mr-2 h-5 w-5 text-destructive" />
                Аварийный вызов
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 animate-slide-up" style={{
            animationDelay: "0.3s"
          }}>
              {trustBadges.map((badge, index) => <div key={index} className="flex flex-col items-start p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                  <badge.icon className="h-6 w-6 text-primary mb-3" />
                  <span className="text-xl md:text-2xl font-bold text-white">{badge.title}</span>
                  <span className="text-sm text-white/60">{badge.subtitle}</span>
                </div>)}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile 3D image - shown below content on mobile */}
      <div className="lg:hidden relative z-0 -mt-20 pb-8">
        <div className="container-main">
          <div className="relative">
            <img src={heroImage} alt="Профессиональный электрощит" className="w-full max-w-md mx-auto h-auto opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-industrial-dark via-transparent to-transparent" />
          </div>
        </div>
      </div>

      <EmergencyCallDialog open={emergencyOpen} onOpenChange={setEmergencyOpen} />
    </section>;
};
export default HeroSection;