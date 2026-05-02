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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => {
          checkAdminRole(session.user.id);
        }, 0);
      } else {
        setHasWorkspaceAccess(false);
        setHasAdminAccess(false);
      }
    });

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
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "super_admin", "manager", "technician"]);

    const roles = (data || []).map((r) => r.role);
    setHasWorkspaceAccess(roles.length > 0);
    setHasAdminAccess(roles.includes("admin") || roles.includes("super_admin"));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
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
    { href: "/sborka-elektroshchita", label: "Сборка электрощита" },
    { href: "/elektromontazh-v-kvartire", label: "Электрика в квартире" },
    { href: "/elektromontazh-v-dome", label: "Электрика в доме" },
    { href: "/avariynyy-elektrik", label: "Аварийный вызов" },
  ];

  const isActive = (path: string) => location.pathname === path;
  const servicesActive =
    location.pathname.startsWith("/zamena-") ||
    location.pathname.startsWith("/sborka-") ||
    location.pathname.startsWith("/elektro") ||
    location.pathname.startsWith("/avariy") ||
    isActive("/uslugi");

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/88 shadow-[0_18px_48px_-42px_rgba(15,23,42,0.28)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/72">
        <div className="container-main">
          <div className="flex h-[72px] items-center justify-between gap-4">
            <Link to="/" className="flex shrink-0 items-center gap-3 font-display font-bold">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shadow-[0_16px_30px_-18px_rgba(234,179,8,0.9)]">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg leading-none sm:text-xl">ЭлектроМастер</span>
                <span className="hidden text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground sm:block">
                  Проект и монтаж
                </span>
              </div>
            </Link>

            <nav className="hidden flex-1 items-center justify-center px-6 md:flex">
              <div className="flex items-center gap-6 rounded-full border border-border/70 bg-card/80 px-6 py-3 shadow-[0_18px_45px_-38px_rgba(15,23,42,0.25)]">
                {navLinks.map((link) => {
                  if (link.href === "/uslugi") {
                    return (
                      <div key={link.href} className="group relative py-1">
                        <Link
                          to={link.href}
                          className={`link-underline whitespace-nowrap text-sm font-medium transition-colors ${
                            servicesActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {link.label}
                        </Link>
                        <div className="absolute left-1/2 top-full hidden w-60 -translate-x-1/2 flex-col gap-1 rounded-lg border border-border/80 bg-card/95 p-2 shadow-[0_24px_55px_-34px_rgba(15,23,42,0.35)] group-hover:flex animate-fade-in">
                          {serviceLinks.map((service) => (
                            <Link
                              key={service.href}
                              to={service.href}
                              className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted/50 ${
                                isActive(service.href) ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {service.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={link.href}
                      to={link.href}
                      className={`link-underline whitespace-nowrap text-sm font-medium transition-colors ${
                        isActive(link.href) ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </nav>

            <div className="hidden shrink-0 items-center gap-2 md:flex">
              {user ? (
                <>
                  {hasWorkspaceAccess && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/projects">
                        <FolderOpen className="mr-1 h-4 w-4" />
                        Проекты
                      </Link>
                    </Button>
                  )}
                  {hasAdminAccess && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/admin/users">Админ</Link>
                    </Button>
                  )}
                  {hasWorkspaceAccess && <NotificationBell />}
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/dashboard">Мои заявки</Link>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Выйти
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-2 rounded-full border border-border/70 bg-card/85 p-1.5 shadow-[0_18px_45px_-38px_rgba(15,23,42,0.25)]">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/auth">Войти</Link>
                  </Button>
                  <Button size="sm" onClick={openQuiz}>
                    <Calculator className="mr-2 h-4 w-4" />
                    Расчёт
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setEmergencyOpen(true)}>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Срочно
                  </Button>
                </div>
              )}
            </div>

            <button
              className="rounded-lg border border-border/70 bg-card/90 p-2.5 shadow-sm md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {isMenuOpen && (
            <div className="animate-fade-in border-t border-border/70 py-4 md:hidden">
              <nav className="flex flex-col gap-4">
                <div className="rounded-lg border border-border/70 bg-card/90 px-4 py-3 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Быстрый контакт
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">+373 777 46642</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      className={`rounded-lg border px-4 py-3 text-sm font-semibold transition-colors ${
                        isActive(link.href) ? "border-primary/35 bg-primary/10 text-foreground" : "border-border/70 bg-card text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>

                <div className="rounded-lg border border-border/70 bg-muted/35 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Частые услуги
                  </p>
                  <div className="grid gap-2">
                    {serviceLinks.map((link) => (
                      <Link
                        key={link.href}
                        to={link.href}
                        className="rounded-md bg-background px-3 py-2 text-sm font-medium text-foreground shadow-sm"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-t border-border pt-4">
                  {user ? (
                    <>
                      {hasWorkspaceAccess && (
                        <Button variant="ghost" size="sm" asChild>
                          <Link to="/projects" onClick={() => setIsMenuOpen(false)}>
                            <FolderOpen className="mr-1 h-4 w-4" />
                            Проекты
                          </Link>
                        </Button>
                      )}
                      {hasAdminAccess && (
                        <Button variant="ghost" size="sm" asChild>
                          <Link to="/admin/users" onClick={() => setIsMenuOpen(false)}>
                            Админ-панель
                          </Link>
                        </Button>
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
                        <Calculator className="mr-2 h-4 w-4" />
                        Получить расчёт
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setEmergencyOpen(true);
                          setIsMenuOpen(false);
                        }}
                      >
                        <AlertTriangle className="mr-2 h-4 w-4" />
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
