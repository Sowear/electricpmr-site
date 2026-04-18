import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, AlertTriangle, CheckCircle2, Shield, Users, FileText } from "lucide-react";
import EmergencyCallDialog from "@/components/contact/EmergencyCallDialog";
import heroImage from "@/assets/hero-electricalhome.png";
const HeroSection = () => {
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const scrollToForm = () => {
    document.getElementById('request-form')?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  const trustBadges = [{
    icon: Users,
    title: "Работаем с объектами любого масштаба",
    subtitle: "Коммерческие, жилые и смешанные объекты"
  }, {
    icon: FileText,
    title: "Фиксируем объем и стоимость до старта",
    subtitle: "Технически обоснованная смета до выхода на объект"
  }, {
    icon: CheckCircle2,
    title: "Соблюдаем нормы и регламент работ",
    subtitle: "Контроль качества на каждом этапе реализации"
  }, {
    icon: Shield,
    title: "Сроки, качество и гарантия закреплены",
    subtitle: "Ответственность фиксируется условиями договора"
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
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.16] tracking-[0.015em] mb-6 text-white animate-slide-up">
              Электромонтаж и системы
              <span className="block mt-1 text-gradient bg-primary text-[1.08em] font-extrabold tracking-[0.01em]">электроснабжения под ключ в Приднестровье</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-white/85 mb-4 max-w-xl animate-slide-up leading-[1.4]" style={{
            animationDelay: "0.1s"
          }}>
              Проектируем, монтируем и сопровождаем электрические системы для коммерческих и жилых объектов.
              Работаем по техническим нормам с контролем на каждом этапе.
            </p>

            <p className="text-sm text-white/60 mb-10 max-w-xl animate-slide-up" style={{
            animationDelay: "0.15s"
          }}>
              Работаем по договору, с фиксированной зоной ответственности и прозрачной структурой стоимости.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-16 animate-slide-up" style={{
            animationDelay: "0.2s"
          }}>
              <Button size="lg" onClick={scrollToForm} className="btn-hero group text-base h-14 px-8">
                Оставить заявку
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-base border-2 border-white/30 bg-transparent text-white hover:bg-white/10 hover:border-white/50" onClick={() => setEmergencyOpen(true)}>
                <AlertTriangle className="mr-2 h-5 w-5 text-destructive" />
                Получить расчёт
              </Button>
            </div>

             {/* Trust Badges */}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 lg:[grid-template-columns:repeat(4,minmax(260px,280px))] lg:justify-center animate-slide-up" style={{
              animationDelay: "0.3s"
            }}>
               {trustBadges.map((badge, index) => <div key={index} className="flex aspect-square flex-col items-center justify-center text-center p-6 md:p-7 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-primary/60 hover:shadow-[0_0_24px_rgba(234,179,8,0.2)] hover:scale-[1.03] transition-all duration-300">
                   <div className="h-10 w-10 flex items-center justify-center mb-4 flex-shrink-0">
                     <badge.icon className="h-7 w-7 text-primary" />
                   </div>
                   <span className="text-base md:text-lg font-bold text-white mb-2 max-w-[18ch] [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] overflow-hidden leading-snug">{badge.title}</span>
                   <span className="text-xs md:text-sm text-white/65 max-w-[24ch] [display:-webkit-box] [-webkit-line-clamp:3] [-webkit-box-orient:vertical] overflow-hidden leading-relaxed">{badge.subtitle}</span>
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
