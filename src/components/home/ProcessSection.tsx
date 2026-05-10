import { Phone, Search, Calculator, Wrench, BookOpen, Users, Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    icon: Phone,
    title: "Заявка",
    description: "Связь с клиентом, уточнение задачи.",
    ariaLabel: "Заявка",
  },
  {
    number: "02",
    icon: Search,
    title: "Осмотр / диагностика",
    description: "Оцениваем объём и предлагаем решение.",
    ariaLabel: "Диагностика",
  },
  {
    number: "03",
    icon: Calculator,
    title: "Смета",
    description: "Чёткая цена без скрытых работ.",
    ariaLabel: "Смета",
  },
  {
    number: "04",
    icon: Wrench,
    title: "Выполнение и сдача",
    description: "Проверка, объяснение и выдача гарантии.",
    ariaLabel: "Выполнение",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const ProcessSection = () => {
  return (
    <section className="section-padding bg-background relative overflow-hidden">
      {/* Schematic background pattern */}
      <div className="absolute inset-0 opacity-[0.08] dark:opacity-[0.12] pointer-events-none text-foreground">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="schematic-hw" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="2.5" fill="none" stroke="currentColor" strokeWidth="1" />
              <path d="M 45 50 h 10 M 50 45 v 10" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M 0 100 L 20 80 L 80 80 L 100 60" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#schematic-hw)" />
        </svg>
      </div>

      <div className="container-main max-w-5xl relative z-10">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 glitch-text">
            Как мы работаем: чёткий процесс без лишнего хаоса
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            От заявки до сдачи — фиксируем объём, согласуем стоимость и держим всё под контролем. Без «сюрпризов» по ходу работ.
          </p>
        </motion.div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: index * 0.15, duration: 0.6 }}
              className="relative group"
            >
              <div className="card-glass h-full p-6 relative">
                <div className="mb-6 flex items-center justify-between">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                    <step.icon className="h-6 w-6" strokeWidth={2} aria-label={step.ariaLabel} />
                  </div>
                  
                  <motion.div 
                    initial={{ opacity: 0.3, color: "hsl(var(--muted-foreground))" }}
                    whileInView={{ opacity: 1, color: "hsl(var(--primary))", textShadow: "0 0 10px hsl(var(--primary))" }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ delay: index * 0.2 + 0.4 }}
                    className="text-4xl font-display font-bold"
                  >
                    {step.number}
                  </motion.div>
                </div>
                <h3 className="font-semibold text-lg mb-2 relative z-10">{step.title}</h3>
                <p className="text-sm text-muted-foreground relative z-10">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
        
        {/* Trust block & CTA integrated */}
        <motion.div 
          className="mt-12 bg-muted/30 rounded-xl p-6 md:p-8 border shadow-sm relative z-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-sm">
            <div className="flex items-start gap-3">
              <div className="mt-1 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-4 w-4 text-primary" strokeWidth={2} aria-label="Работа по ПУЭ" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Работаем по ПУЭ</h4>
                <p className="text-muted-foreground leading-relaxed">Всё делается строго по правилам устройства электроустановок, безопасность превыше всего.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Users className="h-4 w-4 text-primary" strokeWidth={2} aria-label="Без посредников" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Без посредников</h4>
                <p className="text-muted-foreground leading-relaxed">Личная ответственность за результат. Мы не передаём задачи третьим лицам.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-4 w-4 text-primary" strokeWidth={2} aria-label="Аккуратная работа" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Аккуратная работа</h4>
                <p className="text-muted-foreground leading-relaxed">Чистота на объекте — наш приоритет. Бережно относимся к имуществу и убираем за собой.</p>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-border flex flex-col lg:flex-row items-center justify-between gap-6 text-center lg:text-left">
            <div className="max-w-2xl">
              <h3 className="font-bold text-lg md:text-xl text-foreground">
                Работаем в Тирасполе, Бендерах, Слободзее и по всему Приднестровью.
              </h3>
              <p className="text-muted-foreground mt-2 text-base">
                Расскажите, что нужно сделать — мы бесплатно проконсультируем, оценим объём и сразу сориентируем по точной стоимости.
              </p>
            </div>
            <button 
              onClick={() => document.getElementById('request-form')?.scrollIntoView({ behavior: 'smooth' })}
              className="group h-14 px-8 bg-primary text-primary-foreground rounded-lg font-semibold text-lg hover:opacity-90 transition-all hover:scale-105 active:scale-95 whitespace-nowrap flex-shrink-0 shadow-md flex items-center gap-2 mx-auto lg:mx-0"
            >
              Оставить заявку
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProcessSection;