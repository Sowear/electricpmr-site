import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Loader2, Plus, Clock, CheckCircle2, Wrench, FileText } from "lucide-react";
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
  const [user, setUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);

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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Layout showFooter={false}>
      <div className="container-main py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">Мои заявки</h1>
            <p className="text-muted-foreground">Отслеживайте статус ваших заявок</p>
          </div>
          <Button asChild>
            <a href="/#request-form">
              <Plus className="mr-2 h-4 w-4" />
              Новая заявка
            </a>
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
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
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;