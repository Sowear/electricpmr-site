import { MessageSquare, ClipboardCheck, Wrench, BadgeCheck } from "lucide-react";
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

const ProcessSection = () => {
  return (
    <section className="section-padding bg-background">
      <div className="container-main max-w-4xl">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
            Как мы работаем — без лишних сложностей
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Понятный процесс: от заявки до гарантийного обслуживания. 
            Каждый этап контролируется, всё делается аккуратно и по нормам.
          </p>
        </motion.div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <motion.div variants={itemVariants} className="flex flex-col items-center text-center p-5 rounded-xl border bg-card">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Заявка</h3>
            <p className="text-sm text-muted-foreground">
              Вы оставляете заявку или связываетесь с нами. 
              Уточняем задачу и ваши пожелания.
            </p>
          </motion.div>
          
          <motion.div variants={itemVariants} className="flex flex-col items-center text-center p-5 rounded-xl border bg-card">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <ClipboardCheck className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Диагностика</h3>
            <p className="text-sm text-muted-foreground">
              При необходимости выезжаем на осмотр. 
              Даём чёткое техническое заключение.
            </p>
          </motion.div>
          
          <motion.div variants={itemVariants} className="flex flex-col items-center text-center p-5 rounded-xl border bg-card">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Wrench className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Смета</h3>
            <p className="text-sm text-muted-foreground">
              Составляем понятную смету без скрытых работ. 
              Вы согласовываете стоимость.
            </p>
          </motion.div>
          
          <motion.div variants={itemVariants} className="flex flex-col items-center text-center p-5 rounded-xl border bg-card">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <BadgeCheck className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Гарантия</h3>
            <p className="text-sm text-muted-foreground">
              Выполняем работу и предоставляем гарантию. 
              Поддержка после сдачи проекта.
            </p>
          </motion.div>
        </motion.div>
        
        <motion.div 
          className="mt-12 bg-muted/30 rounded-xl p-6 border"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
              <div>
                <h4 className="font-medium mb-1">Работаем по ПУЭ</h4>
                <p className="text-muted-foreground">Все работы выполняются согласно правилам устройства электроустановок</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
              <div>
                <h4 className="font-medium mb-1">Без посредников</h4>
                <p className="text-muted-foreground">Напрямую с вами, без передачи третьим лицам</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
              <div>
                <h4 className="font-medium mb-1">Аккуратная работа</h4>
                <p className="text-muted-foreground">Чистота и порядок на объекте — наш приоритет</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-lg">Работаем в Тирасполе, Слободзее, Бендерах, Днестровске, Григориополе</h3>
              <p className="text-muted-foreground mt-1">
                Если у вас задача по электрике — напишите нам, подскажем решение и сориентируем по стоимости
              </p>
            </div>
            <button 
              onClick={() => document.getElementById('request-form')?.scrollIntoView({ behavior: 'smooth' })}
              className="h-12 px-6 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              Оставить заявку
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProcessSection;