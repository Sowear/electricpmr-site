import { Building2, Zap, MapPin, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

const rightItemVariants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

const CompanyInfoSection = () => {
  return (
    <section className="section-padding bg-muted/20">
      <div className="container-main max-w-4xl">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
            Профессиональный электромонтаж в Приднестровье
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            ЭлектроМастер — команда специалистов по электромонтажу. 
            Мы выполняем работы по всему Приднестровью: от квартир и частных домов до коммерческих объектов.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 overflow-hidden">
          <motion.div 
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            <motion.div variants={itemVariants} className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 flex-shrink-0">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Что мы делаем</h3>
                <p className="text-muted-foreground">
                  Занимаемся разводкой и заменой проводки, сборкой электрощитов, подключением техники и освещения, 
                  а также диагностикой электросетей. Работаем аккуратно, соблюдаем нормы безопасности и даём гарантию.
                </p>
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 flex-shrink-0">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Где работаем</h3>
                <p className="text-muted-foreground">
                  Основные города: Тирасполь и Слободзея. 
                  Также выезд в Бендеры, Днестровск, Григориополь и другие населённые пункты Приднестровья.
                </p>
              </div>
            </motion.div>
          </motion.div>
          
          <motion.div 
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            <motion.div variants={rightItemVariants} className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 flex-shrink-0">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Типы объектов</h3>
                <p className="text-muted-foreground">
                  Работаем в квартирах, частных домах, новостройках и коммерческих помещениях. 
                  Опыт работы с различными проектами — от простых квартир до сложных систем в новых домах.
                </p>
              </div>
            </motion.div>
            
            <motion.div variants={rightItemVariants} className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 flex-shrink-0">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Наши принципы</h3>
                <p className="text-muted-foreground">
                  Мы не делаем «на глаз». Сначала понимаем задачу, затем предлагаем решение и 
                  только после согласования приступаем к работе. Всё делаем по ПУЭ и с гарантией.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
        
        <motion.div 
          className="mt-8 p-6 bg-primary/5 rounded-lg border border-border"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <p className="text-center text-muted-foreground">
            Специализируемся на <strong>электромонтаже квартир и домов</strong>, <strong>замене проводки</strong>, 
            <strong>сборке электрощитов</strong>, <strong>диагностике электросети</strong>. 
            Все работы проводим с <strong>гарантией на работы</strong>.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default CompanyInfoSection;