import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, AlertTriangle, CheckCircle2, Shield, Users, FileText, MapPin, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import EmergencyCallDialog from "@/components/contact/EmergencyCallDialog";
import { QuizDialog } from "@/components/contact/QuizDialog";
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

const TextFlipper = ({ words }: { words: string[] }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((current) => (current + 1) % words.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <div className="relative inline-block h-[1.2em] align-text-bottom w-[200px] sm:w-[250px] md:w-[300px] lg:w-[380px]">
      <AnimatePresence>
        <motion.span
          key={index}
          initial={{ y: 40, opacity: 0, rotateX: -90 }}
          animate={{ y: 0, opacity: 1, rotateX: 0 }}
          exit={{ y: -40, opacity: 0, rotateX: 90 }}
          transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
          className="absolute left-0 top-0 whitespace-nowrap"
          style={{ transformOrigin: "50% 50% -20px" }}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

const HeroSection = () => {
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  
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

  const proofItems = [
    { icon: Shield, label: "5 лет гарантии" },
    { icon: MapPin, label: "Выезд по ПМР" },
    { icon: FileText, label: "Смета до работы" },
    { icon: Phone, label: "+373 777 46642" },
  ];


  return (
    <section className="relative isolate min-h-[90vh] overflow-hidden bg-industrial-dark">
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-industrial-dark via-industrial-dark/80 to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-industrial-dark via-transparent to-transparent z-10" />
      <div className="tech-grid absolute inset-0 z-0 text-white/[0.08] [background-size:56px_56px]" />
      
      {/* Main Conductor Line */}
      <div className="hidden md:block absolute left-[8%] top-24 bottom-0 z-0 w-px bg-gradient-to-b from-transparent via-primary/30 to-primary/80">
        {/* Flowing current */}
        <motion.div 
          className="absolute -left-[1px] w-[3px] h-[150px] bg-gradient-to-b from-transparent via-primary to-transparent blur-[1px]"
          animate={{ top: ["-20%", "120%"] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
        />
      </div>
      <div className="hidden md:block absolute left-[8%] top-24 z-0 h-px w-[38vw] bg-gradient-to-r from-primary/25 to-transparent" />
      

      {/* 3D Illustration - Mobile background */}
      <div className="absolute top-[15%] right-[-28%] sm:right-[-15%] w-[150%] sm:w-[112%] md:w-[90%] lg:hidden z-0 overflow-hidden pointer-events-none opacity-[0.28] md:opacity-35">
        <motion.div
          className="relative w-full"
          variants={imageVariants}
          initial="hidden"
          animate="visible"
        >
          <img 
            src={heroImage} 
            alt="Электромонтаж фон" 
            className="w-full h-auto object-contain"
            style={{ WebkitMaskImage: 'radial-gradient(ellipse at center, black 45%, transparent 75%)', maskImage: 'radial-gradient(ellipse at center, black 45%, transparent 75%)' }}
          />
          <div className="absolute right-[30%] top-[40%] -translate-y-1/2 w-[250px] h-[250px] bg-primary/40 rounded-full blur-[70px]" />
        </motion.div>
      </div>
      
      {/* 3D Illustration - Right side */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[55%] h-full hidden lg:block z-0">
        <motion.div 
          className="relative h-full w-full"
          variants={imageVariants}
          initial="hidden"
          animate="visible"
        >
          <img 
            src={heroImage} 
            alt="Профессиональный электрощит с аккуратной разводкой" 
            className="absolute right-0 top-1/2 -translate-y-1/2 w-full h-auto max-h-[90%] object-contain opacity-100" 
            style={{ WebkitMaskImage: 'radial-gradient(ellipse at center, black 50%, transparent 75%)', maskImage: 'radial-gradient(ellipse at center, black 50%, transparent 75%)' }}
          />
          {/* Glow effect behind panel */}
          <div className="absolute right-[10%] top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]" />

        </motion.div>
      </div>

      {/* Content */}
      <div className="container-main relative z-20">
        <div className="pt-8 pb-16 md:pt-12 md:pb-28 lg:pt-16 lg:pb-36">
          <motion.div 
            className="max-w-[48rem]"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Badge */}
            <motion.div 
              variants={badgeVariants}
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 mb-7 shadow-[0_0_30px_rgba(234,179,8,0.10)]"
            >
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">Электромонтаж по всему Приднестровью</span>
            </motion.div>

            {/* Headline */}
            <motion.h1 
              variants={itemVariants}
              className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.2] mb-6 text-white perspective-[1000px]"
            >
              Профессиональный
              <br />
              электромонтаж для{' '}
              <span className="text-primary font-sans md:whitespace-nowrap inline-block drop-shadow-[0_0_15px_rgba(234,179,8,0.4)]">
                <TextFlipper words={['квартир', 'домов', 'бизнеса', 'новостроек']} />
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p 
              variants={itemVariants}
              className="text-base md:text-lg text-white/80 mb-4 max-w-[42rem] leading-[1.42]"
            >
              Проектируем, монтируем и сопровождаем системы электроснабжения для коммерческих и жилых объектов.
              Выполняем работы по техническим нормам с поэтапным контролем качества.
            </motion.p>

            {/* Quick Proofs */}
            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-2 gap-2.5 text-[13px] text-white/90 mb-10 max-w-xl font-medium sm:flex sm:flex-wrap sm:gap-x-4 sm:gap-y-2 sm:text-sm"
            >
              {proofItems.map((item) => (
                <div key={item.label} className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 sm:border-0 sm:bg-transparent sm:p-0">
                  <item.icon className="h-4 w-4 shrink-0 text-primary" />
                  <span>{item.label}</span>
                </div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 mb-5"
            >
              <Button size="lg" onClick={() => setQuizOpen(true)} className="btn-hero btn-spark group text-base min-h-[56px] px-7 md:px-8 shadow-[0_10px_26px_rgba(234,179,8,0.24)]">
                Узнать стоимость
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button size="lg" variant="outline" className="btn-spark min-h-[56px] px-7 md:px-8 text-base border-2 border-white/25 bg-transparent text-white/90 hover:bg-white/10 hover:border-white/40" onClick={() => setEmergencyOpen(true)}>
                <AlertTriangle className="mr-2 h-5 w-5 text-destructive" />
                Аварийный вызов
              </Button>
            </motion.div>

            {/* Service Areas Mini-Block */}
            <motion.div
              variants={itemVariants}
              className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs md:text-sm text-white/60 mb-12 max-w-xl"
            >
              <MapPin className="h-3.5 w-3.5" />
              <span>Работаем: Тирасполь, Бендеры, Слободзея и районы</span>
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
                className="group relative flex min-h-[132px] sm:aspect-square flex-col items-center justify-center text-center p-4 md:p-5 rounded-xl bg-white/[0.07] border border-white/15 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:bg-white/[0.09] hover:border-primary/65 hover:shadow-[0_0_24px_rgba(234,179,8,0.22)] transition-colors duration-300"
              >
                <span className="absolute right-3 top-3 text-[10px] font-semibold text-white/25 transition-colors group-hover:text-primary/70">
                  0{index + 1}
                </span>
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

      <EmergencyCallDialog open={emergencyOpen} onOpenChange={setEmergencyOpen} />
      <QuizDialog open={quizOpen} onOpenChange={setQuizOpen} />
    </section>
  );
};

export default HeroSection;
