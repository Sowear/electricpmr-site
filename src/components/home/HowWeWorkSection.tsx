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
    <section className="section-padding bg-background relative">
      <div className="container-main">
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
            <motion.div key={step.number} variants={itemVariants} className="relative z-10">
              {index < steps.length - 1 && (
                <div className="absolute right-[-24px] top-[44px] hidden w-12 h-10 md:block pointer-events-none z-0">
                  <svg viewBox="0 0 48 40" className="w-full h-full overflow-visible">
                    <motion.path
                      d="M 0 20 L 12 20 L 24 10 L 36 10 L 48 20"
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      whileInView={{ pathLength: 1, opacity: 1 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.6, delay: 0.5 + index * 0.4 }}
                      className="drop-shadow-[0_0_6px_hsl(var(--primary))]"
                    />
                  </svg>
                </div>
              )}

              <div className="card-industrial h-full p-6 relative bg-card border border-border shadow-sm">
                <div className="flex items-start justify-between gap-4 relative z-10">
                  <div className="flex h-14 w-14 items-center justify-center rounded-md bg-primary/10">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                  
                  {/* LED Step Number */}
                  <motion.div
                    initial={{ color: "hsl(var(--muted-foreground))", textShadow: "none" }}
                    whileInView={{ color: "hsl(var(--primary))", textShadow: "0 0 14px hsl(var(--primary))" }}
                    transition={{ delay: 0.8 + index * 0.4, duration: 0.3 }}
                    viewport={{ once: true }}
                    className="flex flex-col items-end"
                  >
                    <span className="text-sm font-bold uppercase tracking-[0.16em]">{step.number}</span>
                    <motion.div 
                      className="w-1.5 h-1.5 rounded-full mt-1"
                      initial={{ backgroundColor: "hsl(var(--muted))", boxShadow: "none" }}
                      whileInView={{ backgroundColor: "hsl(var(--primary))", boxShadow: "0 0 8px hsl(var(--primary))" }}
                      transition={{ delay: 0.8 + index * 0.4, duration: 0.3 }}
                      viewport={{ once: true }}
                    />
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
