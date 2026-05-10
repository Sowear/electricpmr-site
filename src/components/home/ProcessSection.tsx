import { MessageSquare, ClipboardCheck, FileText, CheckCircle } from "lucide-react";
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
      <div className="container-main max-w-5xl">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
            Как мы работаем: чёткий процесс без лишнего хаоса
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
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
          <motion.div variants={itemVariants} className="flex flex-col items-center text-center p-5 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">1. Заявка</h3>
            <p className="text-sm text-muted-foreground">
              Связь с клиентом, уточнение задачи и первичная консультация.
            </p>
          </motion.div>
          
          <motion.div variants={itemVariants} className="flex flex-col items-center text-center p-5 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <ClipboardCheck className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">2. Осмотр и диагностика</h3>
            <p className="text-sm text-muted-foreground">
              Выезд на объект, детальная оценка состояния и подбор решения.
            </p>
          </motion.div>
          
          <motion.div variants={itemVariants} className="flex flex-col items-center text-center p-5 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">3. Смета</h3>
            <p className="text-sm text-muted-foreground">
              Чёткий расчёт цены. Никаких скрытых работ и неожиданных доплат.
            </p>
          </motion.div>
          
          <motion.div variants={itemVariants} className="flex flex-col items-center text-center p-5 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">4. Выполнение и сдача</h3>
            <p className="text-sm text-muted-foreground">
              Проверка работоспособности, объяснение результатов и выдача гарантии.
            </p>
          </motion.div>
        </motion.div>
        
        <motion.div 
          className="mt-12 bg-muted/30 rounded-xl p-6 md:p-8 border shadow-sm"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-sm">
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1">Работаем по ПУЭ</h4>
                <p className="text-muted-foreground leading-relaxed">Всё делается строго по правилам устройства электроустановок, безопасность превыше всего.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1">Без посредников</h4>
                <p className="text-muted-foreground leading-relaxed">Личная ответственность за результат. Мы не передаём задачи третьим лицам.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1">Аккуратная работа</h4>
                <p className="text-muted-foreground leading-relaxed">Чистота на объекте — наш приоритет. Бережно относимся к имуществу и убираем за собой.</p>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-border flex flex-col lg:flex-row items-center justify-between gap-6 text-center lg:text-left">
            <div className="max-w-3xl">
              <h3 className="font-bold text-lg md:text-xl text-foreground">
                Работаем в Тирасполе, Бендерах, Слободзее и по другим городам Приднестровья.
              </h3>
              <p className="text-muted-foreground mt-2 text-base">
                Если есть задача по электрике — скажите, что нужно сделать, мы сразу сориентируем по решению и стоимости.
              </p>
            </div>
            <button 
              onClick={() => document.getElementById('request-form')?.scrollIntoView({ behavior: 'smooth' })}
              className="h-12 px-8 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-all hover:scale-105 active:scale-95 whitespace-nowrap flex-shrink-0 shadow-md"
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