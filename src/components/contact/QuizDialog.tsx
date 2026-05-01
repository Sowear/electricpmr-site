import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Building2, Store, Zap, Wrench, ArrowRight, ArrowLeft, CheckCircle2, Loader2, HardHat } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface QuizDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Get UTM params from URL
const getUtmParams = () => {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source") || "",
    utm_medium: params.get("utm_medium") || "",
    utm_campaign: params.get("utm_campaign") || "",
  };
};

const objectTypes = [
  { id: "flat", title: "Квартира", icon: Building2 },
  { id: "house", title: "Частный дом", icon: Home },
  { id: "commercial", title: "Коммерция", icon: Store },
];

const workTypes = [
  { id: "full", title: "Монтаж под ключ", icon: Zap, desc: "Полная прокладка с нуля" },
  { id: "replace", title: "Замена старой проводки", icon: Wrench, desc: "Демонтаж и новая разводка" },
  { id: "repair", title: "Частичный ремонт", icon: HardHat, desc: "Щиток, розетки, люстры" },
];

export function QuizDialog({ open, onOpenChange }: QuizDialogProps) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [answers, setAnswers] = useState({
    objectType: "",
    area: 50,
    workType: "",
    name: "",
    phone: "",
  });

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep(1);
        setIsSuccess(false);
        setAnswers({
          objectType: "",
          area: 50,
          workType: "",
          name: "",
          phone: "",
        });
      }, 300);
    }
  }, [open]);

  const handleNext = () => {
    setDirection(1);
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setDirection(-1);
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answers.name || !answers.phone) return;

    setIsSubmitting(true);
    
    const serviceTypeText = "Квиз-калькулятор";
    const descriptionText = `Объект: ${objectTypes.find(o => o.id === answers.objectType)?.title}\nПлощадь: ${answers.area} м²\nТип работ: ${workTypes.find(w => w.id === answers.workType)?.title}`;

    try {
      // 1. Save to database
      const { error: dbError } = await supabase.from("requests").insert({
        name: answers.name.trim(),
        phone: answers.phone.trim(),
        service_type: serviceTypeText,
        description: descriptionText,
      });

      if (dbError) throw dbError;

      // 2. Send notification via Edge Function
      const utmParams = getUtmParams();
      const notificationPayload = {
        name: answers.name.trim(),
        phone: answers.phone.trim(),
        service_type: serviceTypeText,
        description: descriptionText,
        ...utmParams,
        referrer: document.referrer || undefined,
      };

      const { error: fnError } = await supabase.functions.invoke("send-request-notification", {
        body: notificationPayload,
      });

      if (fnError && (fnError.message?.includes("RATE_LIMITED") || fnError.message?.includes("429"))) {
        toast.error("Слишком много запросов. Пожалуйста, подождите.");
        setIsSubmitting(false);
        return;
      }

      setIsSuccess(true);
      // Let it show success state for 3 seconds then close
      setTimeout(() => {
        onOpenChange(false);
      }, 3000);
      
    } catch (error) {
      console.error("Quiz submission error:", error);
      toast.error("Произошла ошибка. Пожалуйста, попробуйте еще раз.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg overflow-hidden p-0 bg-background border-border">
        
        {/* Progress Bar Header */}
        <div className="bg-muted/30 px-6 py-4 border-b border-border">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-display font-semibold">Расчет стоимости</h3>
            <span className="text-sm text-muted-foreground font-medium">Шаг {step} из 4</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div 
              className="bg-primary h-1.5 rounded-full transition-all duration-500 ease-in-out" 
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        <div className="p-6 relative min-h-[350px]">
          <AnimatePresence custom={direction} mode="wait">
            
            {/* STEP 1: Object Type */}
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-full"
              >
                <h2 className="text-xl font-bold mb-6 text-foreground">Где планируются работы?</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {objectTypes.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setAnswers({ ...answers, objectType: item.id });
                        handleNext();
                      }}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                        answers.objectType === item.id 
                          ? "border-primary bg-primary/10" 
                          : "border-border bg-card hover:border-primary/50 hover:bg-muted/50"
                      }`}
                    >
                      <item.icon className={`w-8 h-8 mb-3 ${answers.objectType === item.id ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="font-medium text-sm text-center">{item.title}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 2: Area */}
            {step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-full"
              >
                <h2 className="text-xl font-bold mb-8 text-foreground">Укажите примерную площадь</h2>
                
                <div className="mb-10 mt-6 px-4">
                  <div className="flex justify-between items-end mb-6">
                    <span className="text-muted-foreground">Площадь:</span>
                    <span className="text-3xl font-display font-bold text-primary">{answers.area} <span className="text-lg text-muted-foreground">м²</span></span>
                  </div>
                  
                  <Slider
                    value={[answers.area]}
                    onValueChange={(val) => setAnswers({ ...answers, area: val[0] })}
                    max={250}
                    min={10}
                    step={5}
                    className="py-4"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>10 м²</span>
                    <span>250+ м²</span>
                  </div>
                </div>

                <div className="flex gap-3 justify-end mt-8">
                  <Button variant="outline" onClick={handleBack} className="w-12 px-0">
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <Button onClick={handleNext} className="flex-1">
                    Продолжить <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Work Type */}
            {step === 3 && (
              <motion.div
                key="step3"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-full"
              >
                <h2 className="text-xl font-bold mb-6 text-foreground">Что нужно сделать?</h2>
                <div className="space-y-3">
                  {workTypes.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setAnswers({ ...answers, workType: item.id });
                        handleNext();
                      }}
                      className={`flex items-center p-4 w-full rounded-xl border-2 transition-all text-left ${
                        answers.workType === item.id 
                          ? "border-primary bg-primary/10" 
                          : "border-border bg-card hover:border-primary/50 hover:bg-muted/50"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 flex-shrink-0 ${
                        answers.workType === item.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold">{item.title}</div>
                        <div className="text-sm text-muted-foreground">{item.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
                
                <div className="flex gap-3 justify-end mt-6">
                  <Button variant="outline" onClick={handleBack} className="w-12 px-0">
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Contact Form */}
            {step === 4 && !isSuccess && (
              <motion.div
                key="step4"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-full"
              >
                <h2 className="text-xl font-bold mb-2 text-foreground">Последний шаг! 🎉</h2>
                <p className="text-muted-foreground mb-6 text-sm">
                  Оставьте контакты, чтобы мы рассчитали примерную стоимость и связались с вами.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="quiz-name">Как к вам обращаться?</Label>
                    <Input 
                      id="quiz-name" 
                      required 
                      placeholder="Иван"
                      value={answers.name}
                      onChange={(e) => setAnswers({...answers, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quiz-phone">Номер телефона</Label>
                    <Input 
                      id="quiz-phone" 
                      type="tel"
                      required 
                      placeholder="+373 777 12345"
                      value={answers.phone}
                      onChange={(e) => setAnswers({...answers, phone: e.target.value})}
                    />
                  </div>

                  <div className="flex gap-3 mt-8">
                    <Button type="button" variant="outline" onClick={handleBack} className="w-12 px-0" disabled={isSubmitting}>
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Отправка...</>
                      ) : (
                        "Узнать стоимость"
                      )}
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* SUCCESS STATE */}
            {isSuccess && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full h-full flex flex-col items-center justify-center py-8 text-center"
              >
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-foreground">Заявка принята!</h2>
                <p className="text-muted-foreground max-w-xs">
                  Наш инженер уже готовит для вас расчет. Мы свяжемся с вами в течение рабочего дня.
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
