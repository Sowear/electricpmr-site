import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { z } from "zod";

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

interface RequestFormProps {
  preselectedService?: string;
}

const RequestForm = ({ preselectedService }: RequestFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
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
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      // Save to database
      const { error: dbError } = await supabase.from("requests").insert({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        service_type: formData.service_type,
        description: formData.description.trim() || null,
        user_id: userId,
      });

      if (dbError) {
        console.error("Database error:", dbError);
        throw dbError;
      }

      // Send notification email via edge function
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
        const { data, error: fnError } = await supabase.functions.invoke("send-request-notification", {
          body: notificationPayload,
        });

        if (fnError) {
          console.error("Email notification error:", fnError);
          // Check for rate limit error
          if (fnError.message?.includes("RATE_LIMITED") || fnError.message?.includes("429")) {
            toast({
              title: "Слишком много запросов",
              description: "Пожалуйста, подождите 10 минут перед отправкой новой заявки.",
              variant: "destructive",
            });
            setIsLoading(false);
            return;
          }
        }
      } catch (notifyErr: any) {
        console.error("Failed to send notification:", notifyErr);
        // Check if it's a rate limit error from the response
        if (notifyErr?.message?.includes("429") || notifyErr?.message?.includes("RATE_LIMITED")) {
          toast({
            title: "Слишком много запросов",
            description: "Пожалуйста, подождите 10 минут перед отправкой новой заявки.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }

      setIsSuccess(true);
      setFormData({ name: "", phone: "", service_type: "", description: "", desired_date: "" });
      
      toast({
        title: "Заявка отправлена!",
        description: "Мы свяжемся с вами в ближайшее время.",
      });

      setTimeout(() => setIsSuccess(false), 5000);
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось отправить заявку. Попробуйте позже.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isUrgent = formData.service_type === "Аварийный выезд";

  return (
    <section id="request-form" className="section-padding">
      <div className="container-main">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Получить расчёт бесплатно
            </h2>
            <p className="text-muted-foreground text-lg">
              Заполните форму — мы свяжемся с вами{" "}
              {isUrgent ? (
                <span className="text-destructive font-semibold">в течение 2 часов</span>
              ) : (
                "в течение 24 часов"
              )}
            </p>
          </div>

          {/* Form */}
          <div className="card-industrial p-6 md:p-8">
            {isSuccess ? (
              <div className="text-center py-8 animate-scale-in">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">
                  Заявка успешно отправлена!
                </h3>
                <p className="text-muted-foreground">
                  {isUrgent
                    ? "Срочные заявки — свяжемся в течение 2 часов!"
                    : "Наш специалист свяжется с вами в ближайшее время."}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Ваше имя *
                    </label>
                    <Input
                      placeholder="Иван Петров"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      className={errors.name ? "border-destructive" : ""}
                    />
                    {errors.name && (
                      <p className="text-destructive text-sm mt-1">{errors.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Телефон *
                    </label>
                    <Input
                      placeholder="+373 777 12345"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      className={errors.phone ? "border-destructive" : ""}
                    />
                    {errors.phone && (
                      <p className="text-destructive text-sm mt-1">{errors.phone}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Тип услуги *
                    </label>
                    <Select
                      value={formData.service_type}
                      onValueChange={(value) => handleChange("service_type", value)}
                    >
                      <SelectTrigger className={errors.service_type ? "border-destructive" : ""}>
                        <SelectValue placeholder="Выберите услугу" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem key={service} value={service}>
                            {service}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.service_type && (
                      <p className="text-destructive text-sm mt-1">{errors.service_type}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Желаемая дата (опц.)
                    </label>
                    <Input
                      type="date"
                      value={formData.desired_date}
                      onChange={(e) => handleChange("desired_date", e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Комментарий
                  </label>
                  <Textarea
                    placeholder="Опишите вашу задачу или пожелания..."
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    rows={4}
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full btn-hero"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Отправка...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      Отправить заявку
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RequestForm;
