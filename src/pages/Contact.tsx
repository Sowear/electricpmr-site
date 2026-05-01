import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Mail, Clock, Send, CheckCircle2, MessageSquare, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Layout from "@/components/layout/Layout";
import { Helmet } from "react-helmet-async";

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      toast.success("Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.");
      
      // Reset after showing success
      setTimeout(() => {
        setIsSuccess(false);
        (e.target as HTMLFormElement).reset();
      }, 3000);
    }, 1500);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <Layout>
      <Helmet>
        <title>Контакты | ЭлектроМастер</title>
        <meta name="description" content="Свяжитесь с нами для вызова электрика или расчета стоимости. Телефон, Telegram, Viber, WhatsApp." />
      </Helmet>

      <div className="section-padding min-h-screen bg-background relative overflow-hidden flex items-center">
        {/* Background Decorative Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="container-main relative z-10 w-full mt-12 md:mt-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
            
            {/* Left Column: Contact Info */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col justify-center"
            >
              <motion.div variants={itemVariants} className="mb-2">
                <span className="text-primary font-medium tracking-wider uppercase text-sm">На связи 24/7</span>
              </motion.div>
              
              <motion.h1 variants={itemVariants} className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
                Давайте <br className="hidden md:block"/> обсудим ваш проект
              </motion.h1>
              
              <motion.p variants={itemVariants} className="text-muted-foreground text-lg mb-12 max-w-md">
                Готовы ответить на ваши вопросы, рассчитать смету или срочно выехать на аварийный вызов.
              </motion.p>

              <div className="space-y-8">
                {/* Phone & Messengers */}
                <motion.div variants={itemVariants} className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm text-muted-foreground font-medium mb-1">Телефон / Мессенджеры</h3>
                    <a href="tel:+37377746642" className="text-2xl font-display font-bold text-foreground hover:text-primary transition-colors block mb-2">
                      +373 777 46642
                    </a>
                    <div className="flex flex-wrap gap-3">
                      <a href="https://t.me/ElectricPMR" target="_blank" rel="noreferrer" className="inline-flex items-center text-sm font-medium text-blue-500 hover:text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-md transition-colors">
                        Telegram
                      </a>
                      <a href="viber://chat?number=37377746642" target="_blank" rel="noreferrer" className="inline-flex items-center text-sm font-medium text-purple-500 hover:text-purple-400 bg-purple-500/10 px-3 py-1.5 rounded-md transition-colors">
                        Viber
                      </a>
                      <a href="https://wa.me/37377746642" target="_blank" rel="noreferrer" className="inline-flex items-center text-sm font-medium text-emerald-500 hover:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-md transition-colors">
                        WhatsApp
                      </a>
                    </div>
                  </div>
                </motion.div>

                {/* Email */}
                <motion.div variants={itemVariants} className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm text-muted-foreground font-medium mb-1">Email</h3>
                    <a href="mailto:mmxxnon@gmail.com" className="text-lg font-medium text-foreground hover:text-primary transition-colors">
                      mmxxnon@gmail.com
                    </a>
                  </div>
                </motion.div>

                {/* Socials */}
                <motion.div variants={itemVariants} className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Instagram className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm text-muted-foreground font-medium mb-1">Instagram</h3>
                    <a href="https://instagram.com/electricpmr" target="_blank" rel="noreferrer" className="text-lg font-medium text-foreground hover:text-primary transition-colors">
                      @electricpmr
                    </a>
                  </div>
                </motion.div>

                {/* Working Hours */}
                <motion.div variants={itemVariants} className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm text-muted-foreground font-medium mb-1">График работы</h3>
                    <p className="text-lg font-medium text-foreground">7 дней в неделю</p>
                    <p className="text-muted-foreground">с 8:00 до 20:00</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Right Column: Form */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative"
            >
              <div className="card-industrial p-8 md:p-10 relative overflow-hidden bg-background">
                <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
                
                <h2 className="text-2xl font-display font-bold mb-6 text-foreground">Отправить заявку</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground/80">Ваше имя</Label>
                    <Input 
                      id="name" 
                      required 
                      placeholder="Иван Иванов" 
                      className="bg-muted/50 border-border focus:border-primary/50 focus:ring-primary/20 transition-all h-12"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-foreground/80">Номер телефона</Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      required 
                      placeholder="+373 77X XXXXX" 
                      className="bg-muted/50 border-border focus:border-primary/50 focus:ring-primary/20 transition-all h-12"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-foreground/80">Опишите задачу (необязательно)</Label>
                    <Textarea 
                      id="message" 
                      placeholder="Например: нужно заменить проводку в двухкомнатной квартире..." 
                      className="bg-muted/50 border-border focus:border-primary/50 focus:ring-primary/20 transition-all min-h-[120px] resize-y"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    size="lg" 
                    className={`w-full h-14 text-base relative overflow-hidden group transition-colors ${
                      isSuccess ? 'bg-green-600 hover:bg-green-600 text-white dark:bg-green-500 dark:hover:bg-green-500' : ''
                    }`}
                    disabled={isSubmitting || isSuccess}
                  >
                    <AnimatePresence mode="wait">
                      {isSubmitting ? (
                        <motion.div
                          key="submitting"
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -15 }}
                          className="flex items-center"
                        >
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Отправка...
                        </motion.div>
                      ) : isSuccess ? (
                        <motion.div
                          key="success"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="flex items-center text-white"
                        >
                          <CheckCircle2 className="mr-2 h-5 w-5" />
                          Успешно
                        </motion.div>
                      ) : (
                        <motion.div
                          key="idle"
                          initial={{ opacity: 0, y: -15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 15 }}
                          className="flex items-center"
                        >
                          Отправить заявку
                          <Send className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>
                </form>
              </div>
              
              {/* Decorative elements behind form */}
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-primary/20 rounded-full blur-2xl -z-10" />
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-primary/10 rounded-full blur-2xl -z-10" />
            </motion.div>
            
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Contact;
