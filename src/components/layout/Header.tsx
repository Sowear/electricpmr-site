import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap, Menu, X, LogOut, AlertTriangle, Calculator, FolderOpen, BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import EmergencyCallDialog from "@/components/contact/EmergencyCallDialog";
import NotificationBell from "./NotificationBell";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => {
            checkAdminRole(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRole = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .in('role', ['admin', 'super_admin', 'manager']);
    
    setIsAdmin(!!(data && data.length > 0));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const scrollToForm = () => {
    if (location.pathname !== '/') {
      navigate('/#request-form');
    } else {
      document.getElementById('request-form')?.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  const navLinks = [
    { href: "/", label: "Главная" },
    { href: "/features", label: "Услуги" },
    { href: "/pricing", label: "Стоимость" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container-main">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="hidden sm:inline">ЭлектроМастер</span>
            </Link>

            {/* Desktop Navigation - Centered */}
            <nav className="hidden md:flex items-center justify-center flex-1 px-8">
              <div className="flex items-center gap-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`link-underline text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive(link.href)
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
              {user ? (
                <>
                  {isAdmin && (
                    <>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to="/projects">
                          <FolderOpen className="h-4 w-4 mr-1" />
                          Проекты
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to="/estimator">Сметы</Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to="/admin/finance">
                          <BarChart3 className="h-4 w-4 mr-1" />
                          Финансы
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to="/admin/users">Админ</Link>
                      </Button>
                    </>
                  )}
                  {isAdmin && <NotificationBell />}
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/dashboard">Мои заявки</Link>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Выйти
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/auth">Войти</Link>
                  </Button>
                  <Button size="sm" onClick={scrollToForm}>
                    <Calculator className="h-4 w-4 mr-2" />
                    Расчёт бесплатно
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => setEmergencyOpen(true)}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Аварийный
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-border animate-fade-in">
              <nav className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`text-sm font-medium ${
                      isActive(link.href) ? "text-foreground" : "text-muted-foreground"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="flex flex-col gap-2 pt-4 border-t border-border">
                  {user ? (
                    <>
                      {isAdmin && (
                        <>
                          <Button variant="ghost" size="sm" asChild>
                            <Link to="/projects" onClick={() => setIsMenuOpen(false)}>
                              <FolderOpen className="h-4 w-4 mr-1" />
                              Проекты
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link to="/estimator" onClick={() => setIsMenuOpen(false)}>
                              Сметы
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link to="/admin/finance" onClick={() => setIsMenuOpen(false)}>
                              <BarChart3 className="h-4 w-4 mr-1" />
                              Финансы
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link to="/admin/users" onClick={() => setIsMenuOpen(false)}>
                              Админ-панель
                            </Link>
                          </Button>
                        </>
                      )}
                      <Button variant="outline" size="sm" asChild>
                        <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                          Мои заявки
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleLogout}>
                        Выйти
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" asChild>
                        <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                          Войти
                        </Link>
                      </Button>
                      <Button size="sm" onClick={scrollToForm}>
                        <Calculator className="h-4 w-4 mr-2" />
                        Получить расчёт бесплатно
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => {
                          setEmergencyOpen(true);
                          setIsMenuOpen(false);
                        }}
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Аварийный вызов
                      </Button>
                    </>
                  )}
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      <EmergencyCallDialog open={emergencyOpen} onOpenChange={setEmergencyOpen} />
    </>
  );
};

export default Header;
