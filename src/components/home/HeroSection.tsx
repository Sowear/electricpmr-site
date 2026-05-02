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
      staggerChildren: 0.14,
      delayChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

const imageVariants = {
  hidden: { opacity: 0, x: 36, scale: 0.97 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.22 },
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
    <span className="relative inline-block h-[1.2em] w-[190px] align-text-bottom sm:w-[240px] md:w-[280px] lg:w-[330px]">
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ y: 34, opacity: 0, rotateX: -90 }}
          animate={{ y: 0, opacity: 1, rotateX: 0 }}
          exit={{ y: -34, opacity: 0, rotateX: 90 }}
          transition={{ duration: 0.45, type: "spring", bounce: 0.28 }}
          className="text-gradient absolute left-0 top-0 inline-block whitespace-nowrap"
          style={{ transformOrigin: "50% 50% -20px" }}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

const HeroSection = () => {
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);

  const trustBadges = [
    {
      icon: Users,
      title: "Объекты любого масштаба",
      subtitle: "Квартиры, дома и коммерческие проекты",
    },
    {
      icon: FileText,
      title: "Смета до старта",
      subtitle: "Фиксируем объём, сроки и стоимость заранее",
    },
    {
      icon: CheckCircle2,
      title: "Монтаж по нормам",
      subtitle: "Пошаговый контроль и понятная сдача работ",
    },
    {
      icon: Shield,
      title: "Гарантия на работы",
      subtitle: "Закрепляем ответственность и остаёмся на связи",
    },
  ];

  const proofItems = [
    { icon: Shield, label: "5 лет гарантии" },
    { icon: MapPin, label: "Выезд по ПМР" },
    { icon: FileText, label: "Смета до начала" },
    { icon: Phone, label: "+373 777 46642" },
  ];

  return (
    <section className="relative overflow-hidden border-b border-border/60 bg-[linear-gradient(180deg,hsl(40_44%_96%)_0%,hsl(42_30%_98%)_58%,hsl(0_0%_100%)_100%)]">
      <div className="tech-grid absolute inset-0 text-foreground/[0.04]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/45 to-transparent" />

      <div className="container-main relative py-10 md:py-14 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-[42rem]">
            <motion.div variants={itemVariants} className="technical-label mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Электромонтаж по всему Приднестровью
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="font-display text-4xl font-bold leading-[1.08] text-foreground sm:text-5xl lg:text-6xl"
            >
              Проектируем и монтируем электрику для{" "}
              <TextFlipper words={["квартир", "домов", "бизнеса", "новостроек"]} />
            </motion.h1>

            <motion.p variants={itemVariants} className="mt-6 max-w-[38rem] text-lg leading-relaxed text-muted-foreground">
              Делаем систему, которая выглядит аккуратно, работает стабильно и понятна в обслуживании.
              Расчёт, монтаж, защита, маркировка и гарантия в одном процессе.
            </motion.p>

            <motion.div variants={itemVariants} className="mt-8 grid gap-3 sm:grid-cols-2">
              {proofItems.map((item) => (
                <div key={item.label} className="card-industrial flex items-center gap-3 px-4 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                </div>
              ))}
            </motion.div>

            <motion.div variants={itemVariants} className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button size="lg" onClick={() => setQuizOpen(true)} className="btn-hero btn-spark group min-h-[56px] text-base">
                Узнать стоимость
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="btn-outline-hero min-h-[56px] text-base"
                onClick={() => setEmergencyOpen(true)}
              >
                <AlertTriangle className="mr-2 h-5 w-5 text-destructive" />
                Аварийный вызов
              </Button>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="mt-6 inline-flex items-start gap-2 rounded-md border border-border/80 bg-card/70 px-4 py-3 text-sm text-muted-foreground shadow-sm"
            >
              <MapPin className="mt-0.5 h-4 w-4 text-primary" />
              <span>Работаем: Тирасполь, Бендеры, Слободзея и населённые пункты ПМР</span>
            </motion.div>
          </motion.div>

          <motion.div
            variants={imageVariants}
            initial="hidden"
            animate="visible"
            className="relative mx-auto w-full max-w-[640px] lg:max-w-none"
          >
            <div className="relative flex min-h-[320px] items-center justify-end sm:min-h-[400px] lg:min-h-[520px]">
              <motion.div 
                animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="pointer-events-none absolute right-[8%] top-[14%] h-[56%] w-[60%] rounded-full bg-[rgba(255,190,60,0.18)] blur-[100px]" 
              />
              <motion.div 
                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="pointer-events-none absolute right-[14%] bottom-[14%] h-[24%] w-[34%] rounded-full bg-[rgba(59,130,246,0.15)] blur-[80px]" 
              />

              <motion.div 
                className="relative z-10 ml-auto w-full max-w-[620px] lg:max-w-[660px]"
                animate={{ y: [-12, 12, -12] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="absolute inset-0 bg-primary/10 blur-[100px] rounded-full scale-[0.85]" />
                <img
                  src={heroImage}
                  alt="Профессиональная электросистема"
                  className="relative z-10 w-full object-contain drop-shadow-[0_20px_35px_rgba(15,23,42,0.12)] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_90%)] [-webkit-mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_90%)]"
                />
              </motion.div>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {trustBadges.map((badge) => (
            <motion.div key={badge.title} variants={itemVariants} className="card-industrial p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10">
                <badge.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-5 text-base font-semibold text-foreground">{badge.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{badge.subtitle}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <EmergencyCallDialog open={emergencyOpen} onOpenChange={setEmergencyOpen} />
      <QuizDialog open={quizOpen} onOpenChange={setQuizOpen} />
    </section>
  );
};

export default HeroSection;
