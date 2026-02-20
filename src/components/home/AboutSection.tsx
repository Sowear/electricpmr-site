import { useEffect, useRef, useState } from "react";
import { motion, useInView, useAnimation } from "framer-motion";
import { Shield, Award, Clock, CheckCircle2 } from "lucide-react";
import aboutPanelImage from "@/assets/about-electrical-panel.png";

interface CounterProps {
  end: number;
  suffix?: string;
  duration?: number;
}

const Counter = ({ end, suffix = "", duration = 2 }: CounterProps) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;
    
    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * end));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [isInView, end, duration]);

  return (
    <span ref={ref}>
      {count}{suffix}
    </span>
  );
};

const stats = [
  { value: 15, suffix: "+", label: "Видов электромонтажных работ", icon: Award },
  { value: 3, suffix: "", label: "Основных стандарта безопасности", icon: Clock },
  { value: 24, suffix: " ч", label: "Среднее время отклика", icon: Shield },
  { value: 100, suffix: "%", label: "Соответствие нормам ПУЭ", icon: CheckCircle2 },
];

const benefits = [
  "Сертифицированные специалисты",
  "Качественные материалы",
  "Соблюдение норм безопасности",
  "Гарантия на все работы",
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

const imageVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

const AboutSection = () => {
  const controls = useAnimation();
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  return (
    <section 
      ref={ref}
      id="about"
      className="relative py-20 lg:py-28 bg-gradient-to-b from-background to-secondary/20 overflow-hidden"
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container-main relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={controls}
          className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-center"
        >
          {/* Left Column - 3D Visual (60%) */}
          <motion.div 
            variants={imageVariants}
            className="lg:col-span-3 order-2 lg:order-1"
          >
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent rounded-3xl blur-2xl opacity-60" />
              
              {/* Main image container */}
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 shadow-2xl">
                {/* Technical overlay grid */}
                <div className="absolute inset-0 opacity-10">
                  <div className="h-full w-full" style={{
                    backgroundImage: 'linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                  }} />
                </div>
                
                {/* Image */}
                <img 
                  src={aboutPanelImage} 
                  alt="Профессиональный электрощит" 
                  className="w-full h-auto relative z-10"
                />
                
                {/* Technical markers */}
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs font-mono">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-muted-foreground">SYSTEM ACTIVE</span>
                </div>
                
                <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs font-mono text-muted-foreground">
                  IEC 61439 • ПУЭ 7
                </div>
              </div>
              
              {/* Floating accent card */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="absolute -bottom-4 right-4 md:-bottom-6 md:-right-4 lg:-right-6 bg-card rounded-xl p-5 shadow-xl border border-border z-20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-display font-bold text-primary">5 лет</div>
                    <div className="text-sm text-muted-foreground">гарантии</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Right Column - Content (40%) */}
          <motion.div 
            variants={containerVariants}
            className="lg:col-span-2 order-1 lg:order-2"
          >
            <motion.span 
              variants={itemVariants}
              className="inline-block text-sm font-medium text-primary mb-3"
            >
              Надёжность и опыт
            </motion.span>
            
            <motion.h2 
              variants={itemVariants}
              className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight"
            >
              О компании
            </motion.h2>
            
            <motion.p 
              variants={itemVariants}
              className="text-muted-foreground text-lg mb-8 leading-relaxed"
            >
              Мы — команда профессиональных электриков с многолетним опытом работы 
              в Приднестровье. Работаем по современным стандартам безопасности, 
              проектируем и реализуем электросети любой сложности — 
              от квартир до коммерческих объектов.
            </motion.p>

            {/* Stats Grid */}
            <motion.div 
              variants={containerVariants}
              className="grid grid-cols-2 gap-4 mb-8"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="group relative bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border/50 hover:border-primary/30 transition-colors"
                >
                  {/* Subtle glow on hover */}
                  <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative">
                    <div className="text-3xl md:text-4xl font-display font-bold text-primary mb-1">
                      <Counter end={stat.value} suffix={stat.suffix} />
                    </div>
                    <div className="text-sm text-muted-foreground leading-snug">
                      {stat.label}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Benefits list */}
            <motion.ul 
              variants={containerVariants}
              className="space-y-3"
            >
              {benefits.map((benefit, index) => (
                <motion.li 
                  key={index}
                  variants={itemVariants}
                  className="flex items-center gap-3 text-sm"
                >
                  <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-3 w-3 text-success" />
                  </div>
                  <span>{benefit}</span>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;
