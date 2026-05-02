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
      staggerChildren: 0.18,
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
    <section className="section-padding bg-background">
      <div className="container-main">
        <motion.div
          className="mx-auto mb-12 max-w-2xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <span className="technical-label">Процесс работы</span>
          <h2 className="mt-5 font-display text-3xl font-bold md:text-4xl">Понятная последовательность без лишнего хаоса</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            От первого звонка до сдачи объекта двигаемся по чёткому плану, чтобы у вас не оставалось вопросов по срокам и объёму.
          </p>
        </motion.div>

        <motion.div
          className="grid gap-6 md:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {steps.map((step, index) => (
            <motion.div key={step.number} variants={itemVariants} className="relative">
              {index < steps.length - 1 && (
                <div className="absolute right-[-12px] top-10 hidden h-px w-6 bg-gradient-to-r from-primary/50 to-transparent md:block" />
              )}

              <div className="card-industrial h-full p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-md bg-primary/12">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">{step.number}</span>
                </div>

                <h3 className="mt-6 font-display text-2xl font-semibold text-foreground">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HowWeWorkSection;
