import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap, Menu, X, LogOut, AlertTriangle, Calculator, FolderOpen } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase, type User } from "@/integrations/supabase/client";
import EmergencyCallDialog from "@/components/contact/EmergencyCallDialog";
import { QuizDialog } from "@/components/contact/QuizDialog";
import NotificationBell from "./NotificationBell";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [hasWorkspaceAccess, setHasWorkspaceAccess] = useState(false);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => {
            checkAdminRole(session.user.id);
          }, 0);
        } else {
          setHasWorkspaceAccess(false);
          setHasAdminAccess(false);
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
      .in('role', ['admin', 'super_admin', 'manager', 'technician']);

    const roles = (data || []).map((r) => r.role);
    setHasWorkspaceAccess(roles.length > 0);
    setHasAdminAccess(roles.includes('admin') || roles.includes('super_admin'));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const openQuiz = () => {
    setQuizOpen(true);
    setIsMenuOpen(false);
  };

  const navLinks = [
    { href: "/", label: "Главная" },
    { href: "/uslugi", label: "Услуги" },
    { href: "/stoimost", label: "Стоимость" },
    { href: "/contact", label: "Контакты" },
  ];

  const serviceLinks = [
    { href: "/zamena-provodki", label: "Замена проводки" },
    { href: "/sborka-elektroshchita", label: "Сборка щита" },
    { href: "/avariynyy-elektrik", label: "Аварийный вызов" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/90 shadow-[0_10px_40px_-34px_rgba(15,23,42,0.55)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/75">
        <div className="container-main">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 font-display text-xl font-bold shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-[0_10px_22px_rgba(234,179,8,0.24)]">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg sm:text-xl">ЭлектроМастер</span>
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
                  {hasWorkspaceAccess && (
                    <>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to="/projects">
                          <FolderOpen className="h-4 w-4 mr-1" />
                          Проекты
                        </Link>
                      </Button>
                    </>
                  )}
                  {hasAdminAccess && (
                    <>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to="/admin/users">Админ</Link>
                      </Button>
                    </>
                  )}
                  {hasWorkspaceAccess && <NotificationBell />}
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
                  <Button size="sm" onClick={openQuiz}>
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
              className="md:hidden rounded-xl border border-border/70 bg-card p-2 shadow-sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-border/70 py-4 animate-fade-in">
              <nav className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-2">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                        isActive(link.href)
                          ? "border-primary/35 bg-primary/10 text-foreground"
                          : "border-border/70 bg-card text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>

                <div className="rounded-xl border border-border/70 bg-muted/35 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Частые услуги
                  </p>
                  <div className="grid gap-2">
                    {serviceLinks.map((link) => (
                      <Link
                        key={link.href}
                        to={link.href}
                        className="rounded-lg bg-background px-3 py-2 text-sm font-medium text-foreground shadow-sm"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-4 border-t border-border">
                  {user ? (
                    <>
                      {hasWorkspaceAccess && (
                        <>
                          <Button variant="ghost" size="sm" asChild>
                            <Link to="/projects" onClick={() => setIsMenuOpen(false)}>
                              <FolderOpen className="h-4 w-4 mr-1" />
                              Проекты
                            </Link>
                          </Button>
                        </>
                      )}
                      {hasAdminAccess && (
                        <>
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
                      <Button size="sm" onClick={openQuiz}>
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
      <QuizDialog open={quizOpen} onOpenChange={setQuizOpen} />
    </>
  );
};

export default Header;
