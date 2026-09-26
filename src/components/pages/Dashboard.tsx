import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase, type User } from "@/integrations/supabase/client";
import {
  Loader2,
  Plus,
  Clock,
  CheckCircle2,
  Wrench,
  FileText,
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  User as UserIcon,
  Mail,
  Phone,
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

type RequestStatus = "new" | "in_progress" | "done";

interface Request {
  id: string;
  name: string;
  phone: string;
  service_type: string;
  description: string | null;
  status: RequestStatus;
  created_at: string;
}

const statusConfig = {
  new: {
    label: "Новая",
    icon: Clock,
    class: "badge-new",
  },
  in_progress: {
    label: "В работе",
    icon: Wrench,
    class: "badge-in-progress",
  },
  done: {
    label: "Выполнена",
    icon: CheckCircle2,
    class: "badge-done",
  },
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [activeTab, setActiveTab] = useState<"requests" | "security">("requests");

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session?.user) {
          navigate("/auth");
        } else {
          setUser(session.user);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchRequests(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchRequests = async (userId: string) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("requests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRequests(data as Request[]);
    }
    setIsLoading(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrors({});

    const errors: Record<string, string> = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = "Введите текущий пароль";
    }

    if (!passwordData.newPassword) {
      errors.newPassword = "Введите новый пароль";
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = "Новый пароль должен быть не менее 6 символов";
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "Пароли не совпадают";
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setIsChangingPassword(true);

    try {
      const { data, error } = await supabase.auth.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );

      if (error) {
        throw new Error(error.message || "Не удалось изменить пароль");
      }

      toast({
        title: "Успешно!",
        description: "Ваш пароль был успешно изменен.",
      });

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      toast({
        title: "Ошибка",
        description: err.message || "Не удалось обновить пароль. Проверьте текущий пароль.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const userName = user.user_metadata?.name || "Пользователь";
  const userPhone = user.user_metadata?.phone || user.phone || "Не указан";

  return (
    <Layout showFooter={false}>
      <div className="container-main py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">Личный кабинет</h1>
            <p className="text-muted-foreground">Управление заявками и настройками профиля</p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <a href="/#request-form">
                <Plus className="mr-2 h-4 w-4" />
                Новая заявка
              </a>
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-border mb-6 gap-2">
          <button
            onClick={() => setActiveTab("requests")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "requests"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Мои заявки ({requests.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "security"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>Безопасность и пароль</span>
          </button>
        </div>

        {/* Tab 1: Requests */}
        {activeTab === "requests" && (
          isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-20 card-industrial">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">
                Нет заявок
              </h3>
              <p className="text-muted-foreground mb-6">
                У вас пока нет заявок. Создайте первую!
              </p>
              <Button asChild>
                <a href="/#request-form">Создать заявку</a>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Requests List */}
              <div className="lg:col-span-2 space-y-4">
                {requests.map((request) => {
                  const status = statusConfig[request.status];
                  const StatusIcon = status.icon;
                  
                  return (
                    <div
                      key={request.id}
                      className={`card-industrial p-4 md:p-6 cursor-pointer transition-all ${
                        selectedRequest?.id === request.id ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => setSelectedRequest(request)}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{request.service_type}</h3>
                            <span className={`badge-status ${status.class}`}>
                              <StatusIcon className="h-3.5 w-3.5 mr-1" />
                              {status.label}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(request.created_at), "d MMMM yyyy, HH:mm", { locale: ru })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Request Details */}
              <div className="lg:col-span-1">
                {selectedRequest ? (
                  <div className="card-industrial p-6 sticky top-24">
                    <h3 className="font-display font-semibold mb-4">
                      Детали заявки
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Услуга</p>
                        <p className="font-medium">{selectedRequest.service_type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Статус</p>
                        <span className={`badge-status ${statusConfig[selectedRequest.status].class}`}>
                          {statusConfig[selectedRequest.status].label}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Имя</p>
                        <p className="font-medium">{selectedRequest.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Телефон</p>
                        <p className="font-medium">{selectedRequest.phone}</p>
                      </div>
                      {selectedRequest.description && (
                        <div>
                          <p className="text-sm text-muted-foreground">Комментарий</p>
                          <p className="text-sm">{selectedRequest.description}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-muted-foreground">Создана</p>
                        <p className="text-sm">
                          {format(new Date(selectedRequest.created_at), "d MMMM yyyy, HH:mm", { locale: ru })}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="card-industrial p-6 text-center text-muted-foreground">
                    <p>Выберите заявку для просмотра деталей</p>
                  </div>
                )}
              </div>
            </div>
          )
        )}

        {/* Tab 2: Security & Profile */}
        {activeTab === "security" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Profile Card */}
            <div className="lg:col-span-1 space-y-6">
              <div className="card-industrial p-6 space-y-4">
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                    <UserIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{userName}</h3>
                    <p className="text-sm text-muted-foreground">Профиль аккаунта</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  {userPhone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{userPhone}</span>
                    </div>
                  )}
                  {user.created_at && (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground pt-2 border-t border-border">
                      <Clock className="h-4 w-4 shrink-0" />
                      <span>Регистрация: {format(new Date(user.created_at), "d MMMM yyyy", { locale: ru })}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Password Change Form Card */}
            <div className="lg:col-span-2">
              <div className="card-industrial p-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-lg">Сменить пароль</h3>
                    <p className="text-sm text-muted-foreground">
                      Обновите пароль для повышения безопасности вашего аккаунта
                    </p>
                  </div>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                  {/* Hidden email input for browser password manager context */}
                  <input type="text" name="email" value={user.email || ""} readOnly hidden autoComplete="username" />

                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Текущий пароль</label>
                    <div className="relative">
                      <Input
                        name="current-password"
                        type={showCurrentPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={passwordData.currentPassword}
                        onChange={(e) => {
                          setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }));
                          if (passwordErrors.currentPassword) {
                            setPasswordErrors((prev) => ({ ...prev, currentPassword: "" }));
                          }
                        }}
                        className={`pr-10 ${passwordErrors.currentPassword ? "border-destructive" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                        title={showCurrentPassword ? "Скрыть" : "Показать"}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordErrors.currentPassword && (
                      <p className="text-destructive text-sm mt-1">{passwordErrors.currentPassword}</p>
                    )}
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Новый пароль</label>
                    <div className="relative">
                      <Input
                        name="new-password"
                        type={showNewPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        value={passwordData.newPassword}
                        onChange={(e) => {
                          setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }));
                          if (passwordErrors.newPassword) {
                            setPasswordErrors((prev) => ({ ...prev, newPassword: "" }));
                          }
                        }}
                        className={`pr-10 ${passwordErrors.newPassword ? "border-destructive" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                        title={showNewPassword ? "Скрыть" : "Показать"}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Минимум 6 символов</p>
                    {passwordErrors.newPassword && (
                      <p className="text-destructive text-sm mt-1">{passwordErrors.newPassword}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Подтвердите новый пароль</label>
                    <div className="relative">
                      <Input
                        name="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        value={passwordData.confirmPassword}
                        onChange={(e) => {
                          setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }));
                          if (passwordErrors.confirmPassword) {
                            setPasswordErrors((prev) => ({ ...prev, confirmPassword: "" }));
                          }
                        }}
                        className={`pr-10 ${passwordErrors.confirmPassword ? "border-destructive" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                        title={showConfirmPassword ? "Скрыть" : "Показать"}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordErrors.confirmPassword && (
                      <p className="text-destructive text-sm mt-1">{passwordErrors.confirmPassword}</p>
                    )}
                  </div>

                  <Button type="submit" className="mt-4" disabled={isChangingPassword}>
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Сохранение...
                      </>
                    ) : (
                      "Обновить пароль"
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
