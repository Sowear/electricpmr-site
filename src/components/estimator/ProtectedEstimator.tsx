import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProtectedEstimatorProps {
  children: React.ReactNode;
}

const ProtectedEstimator = ({ children }: ProtectedEstimatorProps) => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setIsAuthenticated(false);
        return;
      }
      
      setIsAuthenticated(true);
      
      // Check if user has any estimator role (admin, manager, or technician)
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);
      
      const userRoles = (roles || []).map(r => r.role);
      const allowed = userRoles.some(r => 
        r === 'admin' || r === 'manager' || r === 'technician'
      );
      
      setHasAccess(allowed);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session?.user) {
          setIsAuthenticated(false);
          setHasAccess(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (isAuthenticated === null || hasAccess === null) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Доступ ограничен</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Сметтер доступен только авторизованным пользователям.
          Войдите в систему, чтобы продолжить.
        </p>
        <Button onClick={() => navigate("/auth")}>
          Войти в систему
        </Button>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Недостаточно прав</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Сметтер доступен администраторам, менеджерам и электрикам.
        </p>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          Вернуться в личный кабинет
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedEstimator;
