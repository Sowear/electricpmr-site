import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, AlertTriangle, CheckCircle2, Shield, Users, FileText } from "lucide-react";
import { motion } from "framer-motion";
import EmergencyCallDialog from "@/components/contact/EmergencyCallDialog";
import heroImage from "@/assets/hero-electricalhome.png";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

const badgeVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const imageVariants = {
  hidden: { opacity: 0, x: 50, scale: 0.95 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 1, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 },
  },
};

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
    subtitle: "Коммерческие и жилые проекты"
  }, {
    icon: FileText,
    title: "Фиксируем объём и стоимость до старта",
    subtitle: "Смета согласуется до выхода на объект"
  }, {
    icon: CheckCircle2,
    title: "Соблюдаем нормы и регламент работ",
    subtitle: "Технический контроль на каждом этапе"
  }, {
    icon: Shield,
    title: "Сроки, качество и гарантия закреплены",
    subtitle: "Ответственность по договору"
  }];

  return (
    <section className="relative min-h-[90vh] overflow-hidden bg-industrial-dark">
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-industrial-dark via-industrial-dark/95 to-industrial-dark/70 z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-industrial-dark via-transparent to-transparent z-10" />
      
      {/* Bottom diffusion to white */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
      
      {/* 3D Illustration - Right side */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[55%] h-full hidden lg:block z-0">
        <motion.div 
          className="relative h-full w-full"
          variants={imageVariants}
          initial="hidden"
          animate="visible"
        >
          <img src={heroImage} alt="Профессиональный электрощит с аккуратной разводкой" className="absolute right-0 top-1/2 -translate-y-1/2 w-full h-auto max-h-[80%] object-contain opacity-90" />
          {/* Glow effect behind panel */}
          <div className="absolute right-[10%] top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]" />
        </motion.div>
      </div>

      {/* Content */}
      <div className="container-main relative z-20">
        <div className="py-20 md:py-28 lg:py-36">
          <motion.div 
            className="max-w-[48rem]"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Badge */}
            <motion.div 
              variants={badgeVariants}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-8"
            >
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">Электромонтаж по всему Приднестровью</span>
            </motion.div>

            {/* Headline */}
            <motion.h1 
              variants={itemVariants}
              className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-6 text-white"
            >
              Электрика, в которой
              <br />
              <span className="text-gradient bg-primary text-right text-6xl font-sans md:whitespace-nowrap">вы уверены на 100%</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p 
              variants={itemVariants}
              className="text-base md:text-lg text-white/80 mb-4 max-w-[42rem] leading-[1.42]"
            >
              Проектируем, монтируем и сопровождаем системы электроснабжения для коммерческих и жилых объектов.
              Выполняем работы по техническим нормам с поэтапным контролем качества.
            </motion.p>

            <motion.p 
              variants={itemVariants}
              className="text-sm text-white/60 mb-10 max-w-xl"
            >
              Работаем по договору, с фиксированной зоной ответственности и прозрачной структурой стоимости.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 mb-16"
            >
              <Button size="lg" onClick={scrollToForm} className="btn-hero group text-base h-13 md:h-14 px-7 md:px-8 shadow-[0_10px_26px_rgba(234,179,8,0.24)]">
                Оставить заявку
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button size="lg" variant="outline" className="h-13 md:h-14 px-7 md:px-8 text-base border-2 border-white/25 bg-transparent text-white/90 hover:bg-white/10 hover:border-white/40" onClick={() => setEmergencyOpen(true)}>
                <AlertTriangle className="mr-2 h-5 w-5 text-destructive" />
                Аварийный вызов
              </Button>
            </motion.div>
          </motion.div>

          {/* Trust Badges */}
          <motion.div 
            className="w-full max-w-[1020px] mx-auto grid grid-cols-2 gap-3 md:gap-4 lg:[grid-template-columns:repeat(4,minmax(210px,230px))] lg:justify-center"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {trustBadges.map((badge, index) => (
              <motion.div 
                key={index} 
                variants={itemVariants}
                whileHover={{ scale: 1.03, y: -5 }}
                className="flex aspect-square flex-col items-center justify-center text-center p-4 md:p-5 rounded-xl bg-white/[0.07] border border-white/15 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:bg-white/[0.09] hover:border-primary/65 hover:shadow-[0_0_24px_rgba(234,179,8,0.22)] transition-colors duration-300"
              >
                <div className="h-8 w-8 flex items-center justify-center mb-3 flex-shrink-0">
                  <badge.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-[13px] md:text-[14px] font-bold text-white mb-1.5 max-w-[20ch] [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] overflow-hidden leading-snug">{badge.title}</span>
                <span className="text-[11px] md:text-xs text-white/65 max-w-[22ch] [display:-webkit-box] [-webkit-line-clamp:3] [-webkit-box-orient:vertical] overflow-hidden leading-[1.35]">{badge.subtitle}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Mobile 3D image - shown below content on mobile */}
      <motion.div 
        className="lg:hidden relative z-0 -mt-20 pb-8"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
      >
        <div className="container-main">
          <div className="relative">
            <img src={heroImage} alt="Профессиональный электрощит" className="w-full max-w-md mx-auto h-auto opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-industrial-dark via-transparent to-transparent" />
          </div>
        </div>
      </motion.div>

      <EmergencyCallDialog open={emergencyOpen} onOpenChange={setEmergencyOpen} />
    </section>
  );
};

export default HeroSection;
