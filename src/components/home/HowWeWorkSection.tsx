import { FileText, Wrench, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    icon: FileText,
    title: "Заявка",
    description: "Оставляете заявку на сайте или звоните. Уточняем задачу и сразу договариваемся о следующем шаге.",
  },
  {
    number: "02",
    icon: Wrench,
    title: "Осмотр и расчёт",
    description: "Выезжаем на объект или оцениваем по фото. Формируем смету, объём и понятный план работ.",
  },
  {
    number: "03",
    icon: CheckCircle,
    title: "Выполнение и сдача",
    description: "Приступаем к монтажу, проверяем результат, объясняем логику групп и даём гарантию.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 26 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

const HowWeWorkSection = () => {
  return (
    <section className="section-padding bg-background relative overflow-hidden">
      {/* Subtle schematic background pattern (Glassmorphism base) */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none mix-blend-overlay">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="schematic-hw" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="2" fill="currentColor" />
              <path d="M 45 50 h 10 M 50 45 v 10" fill="none" stroke="currentColor" strokeWidth="1" />
              <path d="M 0 100 L 20 80 L 80 80 L 100 60" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#schematic-hw)" />
        </svg>
      </div>

      <div className="container-main relative z-10">
        <motion.div
          className="mx-auto mb-12 max-w-2xl text-center relative z-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <span className="technical-label">Процесс работы</span>
          <h2 className="mt-5 font-display text-3xl font-bold md:text-4xl glitch-text">Понятная последовательность без лишнего хаоса</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            От первого звонка до сдачи объекта двигаемся по чёткому плану, чтобы у вас не оставалось вопросов по срокам и объёму.
          </p>
        </motion.div>

        <motion.div
          className="grid gap-6 md:grid-cols-3 relative"
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
              transition={{ delay: index * 0.2, duration: 0.6 }}
              className="relative group"
            >
              <div className="card-glass h-full p-6 relative">
                <div className="mb-6 flex items-center justify-between">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                    <step.icon className="h-6 w-6" />
                  </div>
                  
                  {/* Interactive Step Number (LED effect) */}
                  <motion.div 
                    initial={{ opacity: 0.3, color: "hsl(var(--muted-foreground))" }}
                    whileInView={{ opacity: 1, color: "hsl(var(--primary))", textShadow: "0 0 10px hsl(var(--primary))" }}
                    viewport={{ once: true, margin: "-150px" }}
                    transition={{ delay: index * 0.3 + 0.5 }}
                    className="text-4xl font-display font-bold"
                  >
                    {step.number}
                  </motion.div>
                </div>
                <h3 className="mt-6 font-display text-2xl font-semibold text-foreground relative z-10">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground relative z-10">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HowWeWorkSection;
