import { FileText, Wrench, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    icon: FileText,
    title: "Заявка",
    description: "Оставьте заявку на сайте или позвоните нам. Мы свяжемся с вами в течение 24 часов.",
  },
  {
    number: "02",
    icon: Wrench,
    title: "Осмотр и расчёт",
    description: "Специалист выезжает на объект, оценивает объём работ и составляет смету.",
  },
  {
    number: "03",
    icon: CheckCircle,
    title: "Выполнение работ",
    description: "После согласования приступаем к работе. Сдаём объект с гарантией качества.",
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
  hidden: { opacity: 0, y: 30 },
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
    <section className="relative section-padding bg-foreground text-background">
      {/* Top diffusion from white to dark */}
      <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-background to-transparent z-10" />
      {/* Bottom diffusion from dark to white */}
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-background to-transparent z-10" />

      <div className="container-main relative z-20">
        {/* Header */}
        <motion.div 
          className="text-center max-w-2xl mx-auto mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Как мы работаем
          </h2>
          <p className="text-background/70 text-lg">
            Простой и понятный процесс от заявки до результата
          </p>
        </motion.div>

        {/* Steps */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {steps.map((step, index) => (
            <motion.div key={index} variants={itemVariants} className="relative">
              {/* Connector Line (desktop) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-background/20" />
              )}
              
              <div className="relative text-center">
                {/* Number Badge */}
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary mb-6"
                >
                  <step.icon className="h-10 w-10 text-primary-foreground" />
                </motion.div>
                
                {/* Step Number */}
                <div className="absolute top-0 right-1/3 -translate-y-2 translate-x-8 bg-background text-foreground text-xs font-bold px-2 py-1 rounded">
                  {step.number}
                </div>

                <h3 className="font-display text-xl font-semibold mb-3">
                  {step.title}
                </h3>
                <p className="text-background/70">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HowWeWorkSection;