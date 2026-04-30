import { Link } from "react-router-dom";
import { Home, Building, Construction, Cable, Zap, Plug, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const services = [
  {
    icon: Home,
    title: "Электромонтаж в квартирах",
    description: "Полный комплекс работ по электрике в квартирах любой планировки",
  },
  {
    icon: Building,
    title: "Электромонтаж в домах",
    description: "Электрификация частных домов и коттеджей под ключ",
  },
  {
    icon: Construction,
    title: "Монтаж в новостройках",
    description: "Разводка электрики с нуля в новых зданиях",
  },
  {
    icon: Cable,
    title: "Замена проводки",
    description: "Полная или частичная замена устаревшей проводки",
  },
  {
    icon: Zap,
    title: "Установка щитков",
    description: "Монтаж и сборка электрощитов любой сложности",
  },
  {
    icon: Plug,
    title: "Подключение техники",
    description: "Установка розеток, выключателей, подключение бытовой техники",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
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
      ease: "easeOut",
    },
  },
};

const ServicesSection = () => {
  return (
    <section className="section-padding">
      <div className="container-main">
        {/* Header */}
        <motion.div 
          className="text-center max-w-2xl mx-auto mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Наши услуги
          </h2>
          <p className="text-muted-foreground text-lg">
            Полный спектр электромонтажных работ для жилых и коммерческих объектов
          </p>
        </motion.div>

        {/* Services Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {services.map((service, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -5 }}
              className="card-industrial p-6 group cursor-pointer"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                <service.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">
                {service.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {service.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div 
          className="text-center mt-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <Button variant="outline" size="lg" asChild>
            <Link to="/features" className="group">
              Все услуги
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default ServicesSection;