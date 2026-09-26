import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Zap, Loader2, Mail, Lock, User, Phone, Eye, EyeOff } from "lucide-react";
import { z } from "zod";

const SAVED_EMAIL_KEY = "electricpmr_saved_email";

const isEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
const isPhone = (val: string) => /^[\d\s\+\-\(\)]+$/.test(val.trim()) && val.replace(/\D/g, "").length >= 6;

const loginSchema = z.object({
  email: z.string().trim().refine(
    (val) => isEmail(val) || isPhone(val),
    { message: "Введите корректный email или номер телефона (+373...)" }
  ),
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
});

const signupSchema = z.object({
  name: z.string().trim().min(2, "Имя должно содержать минимум 2 символа").max(100),
  email: z.string().trim().email("Введите корректный email"),
  phone: z.string().trim().min(6, "Введите корректный номер телефона").max(20).optional(),
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
});

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  useEffect(() => {
    // Check if already authenticated
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate("/dashboard", { replace: true });
      }
    });

    // Prefill remembered email/login if present
    const savedEmail = localStorage.getItem(SAVED_EMAIL_KEY);
    if (savedEmail) {
      setFormData((prev) => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, [navigate]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const cleanedFormData = {
      ...formData,
      email: formData.email.trim(),
      name: formData.name.trim(),
      phone: formData.phone.trim(),
    };

    const schema = isLogin ? loginSchema : signupSchema;
    const result = schema.safeParse(cleanedFormData);
    
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
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanedFormData.email,
          password: cleanedFormData.password,
        });
        
        if (error) {
          if (
            error.message.includes("Invalid login credentials") ||
            error.message.includes("401") ||
            error.message.includes("Unauthorized")
          ) {
            throw new Error("Неверный email/телефон или пароль");
          }
          throw error;
        }

        if (rememberMe) {
          localStorage.setItem(SAVED_EMAIL_KEY, cleanedFormData.email);
        } else {
          localStorage.removeItem(SAVED_EMAIL_KEY);
        }
        
        toast({ title: "Добро пожаловать!" });
        navigate("/dashboard");
      } else {
        const redirectUrl = `${window.location.origin}/`;
        
        const { error } = await supabase.auth.signUp({
          email: cleanedFormData.email,
          password: cleanedFormData.password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              name: cleanedFormData.name,
              phone: cleanedFormData.phone || null,
            },
          },
        });
        
        if (error) {
          if (error.message.includes("already registered") || error.message.includes("409")) {
            throw new Error("Пользователь с таким email уже существует");
          }
          throw error;
        }

        if (rememberMe) {
          localStorage.setItem(SAVED_EMAIL_KEY, cleanedFormData.email);
        }
        
        toast({
          title: "Регистрация успешна!",
          description: "Вы вошли в систему.",
        });
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Ошибка входа",
        description: error.message || "Не удалось авторизоваться. Проверьте правильность введенных данных.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 font-display text-xl font-bold mb-8">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span>ЭлектроМастер</span>
          </a>

          {/* Heading */}
          <h1 className="font-display text-3xl font-bold mb-2">
            {isLogin ? "Войти в аккаунт" : "Создать аккаунт"}
          </h1>
          <p className="text-muted-foreground mb-8">
            {isLogin
              ? "Введите данные для входа в личный кабинет"
              : "Заполните форму для регистрации"}
          </p>

          {/* Form */}
          <form noValidate onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Ваше имя</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      name="name"
                      autoComplete="name"
                      placeholder="Иван Петров"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      className={`pl-10 ${errors.name ? "border-destructive" : ""}`}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-destructive text-sm mt-1">{errors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Телефон</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      name="phone"
                      autoComplete="tel"
                      placeholder="+373 777 12345"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      className={`pl-10 ${errors.phone ? "border-destructive" : ""}`}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-destructive text-sm mt-1">{errors.phone}</p>
                  )}
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                {isLogin ? "Email или телефон (+373)" : "Email"}
              </label>
              <div className="relative">
                {isLogin && !formData.email.includes("@") && formData.email.replace(/\D/g, "").length > 0 ? (
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                ) : (
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                )}
                <Input
                  name="email"
                  type={isLogin ? "text" : "email"}
                  autoComplete="username"
                  placeholder={isLogin ? "email@example.com или +373 777 69367" : "email@example.com"}
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
                />
              </div>
              {errors.email && (
                <p className="text-destructive text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Пароль</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className={`pl-10 pr-10 ${errors.password ? "border-destructive" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  title={showPassword ? "Скрыть пароль" : "Показать пароль"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-destructive text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {isLogin && (
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <Checkbox
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(!!checked)}
                  />
                  <span>Запомнить меня</span>
                </label>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full mt-2" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {isLogin ? "Вход..." : "Регистрация..."}
                </>
              ) : (
                isLogin ? "Войти" : "Зарегистрироваться"
              )}
            </Button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin ? (
                <>
                  Нет аккаунта?{" "}
                  <span className="text-primary font-medium">Зарегистрироваться</span>
                </>
              ) : (
                <>
                  Уже есть аккаунт?{" "}
                  <span className="text-primary font-medium">Войти</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - Decorative */}
      <div className="hidden lg:flex flex-1 bg-foreground items-center justify-center p-12">
        <div className="max-w-md text-background text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary flex items-center justify-center">
            <Zap className="h-10 w-10 text-primary-foreground" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-4">
            Личный кабинет
          </h2>
          <p className="text-background/70">
            Отслеживайте статус ваших заявок, просматривайте историю работ 
            и связывайтесь с нами напрямую через личный кабинет.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;