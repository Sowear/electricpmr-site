import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2, ArrowRight, CheckCircle2, Shield, FileText, Clock3, Phone, MessageCircle, Lock
} from "lucide-react";
import { z } from "zod";
import { motion } from "framer-motion";
import { isPrerenderRuntime } from "@/lib/runtime";

const requestSchema = z.object({
  name: z.string().min(2, "Имя должно содержать минимум 2 символа").max(100),
  phone: z.string().min(6, "Введите корректный номер телефона").max(20),
  service_type: z.string().min(1, "Выберите тип услуги"),
  description: z.string().max(1000).optional(),
  desired_date: z.string().optional(),
});

const services = [
  "Точечные работы",
  "Замена проводки",
  "Установка щита",
  "Аварийный выезд",
  "Монтаж освещения",
  "Электромонтаж в квартире",
  "Электромонтаж в доме",
  "Монтаж в новостройке",
  "Подключение техники",
  "Другое",
];

const getUtmParams = () => {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source") || "",
    utm_medium: params.get("utm_medium") || "",
    utm_campaign: params.get("utm_campaign") || "",
  };
};

const trustPoints = [
  { icon: FileText,     text: "Бесплатная оценка и смета до начала работ" },
  { icon: Clock3,       text: "Ответим в течение 24 часов, аварийные — за 2 часа" },
  { icon: Shield,       text: "Официальная гарантия на все виды работ — 5 лет" },
  { icon: CheckCircle2, text: "Работаем по договору, акт по завершению" },
];

const fieldIds = {
  name: "request-form-name",
  phone: "request-form-phone",
  serviceType: "request-form-service-type",
  desiredDate: "request-form-desired-date",
  description: "request-form-description",
};

interface RequestFormProps {
  preselectedService?: string;
}

const RequestForm = ({ preselectedService }: RequestFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [minDesiredDate, setMinDesiredDate] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    service_type: preselectedService || "",
    description: "",
    desired_date: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (isPrerenderRuntime()) return;
    setMinDesiredDate(new Date().toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    if (preselectedService) {
      setFormData(prev => ({ ...prev, service_type: preselectedService }));
    }
  }, [preselectedService]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = requestSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      const { error: dbError } = await supabase.from("requests").insert({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        service_type: formData.service_type,
        description: formData.description.trim() || null,
        user_id: userId,
      });

      if (dbError) throw dbError;

      const utmParams = getUtmParams();
      const notificationPayload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        service_type: formData.service_type,
        description: formData.description.trim() || undefined,
        desired_date: formData.desired_date || undefined,
        ...utmParams,
        referrer: document.referrer || undefined,
      };

      try {
        const { error: fnError } = await supabase.functions.invoke("send-request-notification", {
          body: notificationPayload,
        });
        if (fnError) {
          console.error("Email notification error:", fnError);
          if (fnError.message?.includes("RATE_LIMITED") || fnError.message?.includes("429")) {
            toast({ title: "Слишком много запросов", description: "Пожалуйста, подождите 10 минут.", variant: "destructive" });
            setIsLoading(false);
            return;
          }
        }
      } catch (notifyErr: any) {
        console.error("Failed to send notification:", notifyErr);
        if (notifyErr?.message?.includes("429") || notifyErr?.message?.includes("RATE_LIMITED")) {
          toast({ title: "Слишком много запросов", description: "Пожалуйста, подождите 10 минут.", variant: "destructive" });
          setIsLoading(false);
          return;
        }
      }

      setIsSuccess(true);
      setFormData({ name: "", phone: "", service_type: "", description: "", desired_date: "" });
      toast({ title: "Заявка отправлена!", description: "Мы свяжемся с вами в ближайшее время." });
      setTimeout(() => setIsSuccess(false), 5000);
    } catch (error) {
      console.error("Form submission error:", error);
      toast({ title: "Ошибка", description: "Не удалось отправить заявку. Попробуйте позже.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const isUrgent = formData.service_type === "Аварийный выезд";

  return (
    <section id="request-form" className="section-padding relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(234,179,8,0.07),transparent)]" />
      <div className="tech-grid absolute inset-0 text-foreground/[0.025]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="container-main relative">
        <div className="grid lg:grid-cols-[1fr_1.25fr] gap-12 xl:gap-20 items-start">

          {/* ── Левая колонка: Why us ── */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="lg:sticky lg:top-28"
          >
            <span className="technical-label mb-5 inline-flex">Бесплатная консультация</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 leading-tight">
              {"Получить расчёт "}
              <span className="text-primary">бесплатно</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              {isUrgent ? (
                <>
                  {"Заполните форму — мы свяжемся с вами "}
                  <span className="text-destructive font-semibold">в течение 2 часов</span>
                </>
              ) : (
                "Заполните форму — мы свяжемся с вами в течение 24 часов"
              )}
            </p>

            {/* Trust checklist */}
            <ul className="space-y-4 mb-10">
              {trustPoints.map((point, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <point.icon className="h-4 w-4 text-primary" strokeWidth={2} />
                  </div>
                  <span className="text-sm leading-relaxed text-foreground/80">{point.text}</span>
                </motion.li>
              ))}
            </ul>

            {/* Contact alternatives */}
            <div className="rounded-2xl border border-border/70 bg-card/60 p-5 backdrop-blur-sm space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                Или свяжитесь напрямую
              </p>
              <a
                href="tel:+37377746642"
                className="flex items-center gap-3 text-sm font-medium text-foreground hover:text-primary transition-colors group"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                +373 777 46642
              </a>
              <a
                href="https://wa.me/37377746642"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm font-medium text-foreground hover:text-primary transition-colors group"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <MessageCircle className="h-4 w-4 text-primary" />
                </div>
                WhatsApp / Telegram
              </a>
            </div>
          </motion.div>

          {/* ── Правая колонка: форма ── */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="relative rounded-2xl border border-border/70 bg-card/80 p-6 md:p-8 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)] backdrop-blur-sm">
              {/* Glow accent */}
              <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
              <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

              {isSuccess ? (
                <div className="text-center py-12 animate-scale-in">
                  <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-success/10 border border-success/30 flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-success" />
                  </div>
                  <h3 className="font-display text-2xl font-semibold mb-3">
                    Заявка отправлена!
                  </h3>
                  <p className="text-muted-foreground">
                    {isUrgent
                      ? "Срочная заявка — свяжемся в течение 2 часов!"
                      : "Наш специалист свяжется с вами в ближайшее время."}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor={fieldIds.name} className="block text-sm font-medium mb-2 text-foreground/90">
                        Ваше имя <span className="text-primary">*</span>
                      </label>
                      <Input
                        id={fieldIds.name}
                        placeholder="Иван Петров"
                        value={formData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        className={`transition-shadow focus:shadow-[0_0_0_3px_rgba(234,179,8,0.15)] ${errors.name ? "border-destructive" : ""}`}
                        aria-invalid={Boolean(errors.name)}
                        aria-describedby={errors.name ? `${fieldIds.name}-error` : undefined}
                      />
                      {errors.name && <p id={`${fieldIds.name}-error`} className="text-destructive text-xs mt-1.5">{errors.name}</p>}
                    </div>
                    <div>
                      <label htmlFor={fieldIds.phone} className="block text-sm font-medium mb-2 text-foreground/90">
                        Телефон <span className="text-primary">*</span>
                      </label>
                      <Input
                        id={fieldIds.phone}
                        placeholder="+373 777 12345"
                        value={formData.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        className={`transition-shadow focus:shadow-[0_0_0_3px_rgba(234,179,8,0.15)] ${errors.phone ? "border-destructive" : ""}`}
                        aria-invalid={Boolean(errors.phone)}
                        aria-describedby={errors.phone ? `${fieldIds.phone}-error` : undefined}
                      />
                      {errors.phone && <p id={`${fieldIds.phone}-error`} className="text-destructive text-xs mt-1.5">{errors.phone}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor={fieldIds.serviceType} className="block text-sm font-medium mb-2 text-foreground/90">
                        Тип услуги <span className="text-primary">*</span>
                      </label>
                      <Select value={formData.service_type} onValueChange={(v) => handleChange("service_type", v)}>
                        <SelectTrigger
                          id={fieldIds.serviceType}
                          className={errors.service_type ? "border-destructive" : ""}
                          aria-invalid={Boolean(errors.service_type)}
                          aria-describedby={errors.service_type ? `${fieldIds.serviceType}-error` : undefined}
                        >
                          <SelectValue placeholder="Выберите услугу" />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map((service) => (
                            <SelectItem key={service} value={service}>{service}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.service_type && <p id={`${fieldIds.serviceType}-error`} className="text-destructive text-xs mt-1.5">{errors.service_type}</p>}
                    </div>
                    <div>
                      <label htmlFor={fieldIds.desiredDate} className="block text-sm font-medium mb-2 text-foreground/90">
                        Желаемая дата <span className="text-xs text-muted-foreground">(опц.)</span>
                      </label>
                      <Input
                        id={fieldIds.desiredDate}
                        type="date"
                        value={formData.desired_date}
                        onChange={(e) => handleChange("desired_date", e.target.value)}
                        min={minDesiredDate || undefined}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor={fieldIds.description} className="block text-sm font-medium mb-2 text-foreground/90">
                      Комментарий <span className="text-xs text-muted-foreground">(опц.)</span>
                    </label>
                    <Textarea
                      id={fieldIds.description}
                      placeholder="Опишите вашу задачу: площадь, этаж, что нужно сделать..."
                      value={formData.description}
                      onChange={(e) => handleChange("description", e.target.value)}
                      rows={4}
                      className="resize-none transition-shadow focus:shadow-[0_0_0_3px_rgba(234,179,8,0.15)]"
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full btn-hero min-h-[56px] text-base shadow-[0_0_30px_rgba(234,179,8,0.3)] hover:shadow-[0_0_40px_rgba(234,179,8,0.5)] transition-shadow"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Отправка...
                      </>
                    ) : (
                      <>
                        Отправить заявку
                        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" strokeWidth={2} />
                      </>
                    )}
                  </Button>

                  {/* Micro-trust under button */}
                  <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-1">
                    <Lock className="h-3.5 w-3.5" />
                    Данные защищены · Не передаём третьим лицам
                  </p>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default RequestForm;
