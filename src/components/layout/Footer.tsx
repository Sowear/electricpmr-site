import { Link } from "react-router-dom";
import { Zap, Phone, Mail, MapPin, ArrowRight } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-muted/30 dark:bg-card border-t text-foreground">
      <div className="container-main py-12 md:py-16">
        <div className="mb-10 grid gap-4 rounded-lg border border-border/60 bg-card/50 dark:bg-white/[0.04] p-6 shadow-[0_24px_70px_-42px_rgba(0,0,0,0.12)] dark:shadow-[0_24px_70px_-42px_rgba(0,0,0,0.72)] md:grid-cols-[1.2fr_auto] md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Консультация и смета</p>
            <h3 className="mt-2 font-display text-2xl font-bold md:text-3xl">
              Поможем понять объём работ и соберём понятное решение
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Разберёмся в задаче, подскажем по стоимости и по срокам без лишней воды.
            </p>
          </div>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_18px_36px_-18px_rgba(234,179,8,0.9)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105"
          >
            Связаться
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-5 md:gap-12">
          <div className="md:col-span-2">
            <Link to="/" className="mb-4 flex items-center gap-3 font-display text-xl font-bold">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Zap className="h-5 w-5 text-primary-foreground" strokeWidth={2} />
              </div>
              <span>ЭлектроМастер</span>
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              Профессиональный электромонтаж в Приднестровье: квартиры, дома, коммерческие объекты и аварийные выезды.
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-display font-semibold">Навигация</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="text-muted-foreground transition-colors hover:text-foreground">
                  Главная
                </Link>
              </li>
              <li>
                <Link to="/uslugi" className="text-muted-foreground transition-colors hover:text-foreground">
                  Услуги
                </Link>
              </li>
              <li>
                <Link to="/stoimost" className="text-muted-foreground transition-colors hover:text-foreground">
                  Стоимость
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground transition-colors hover:text-foreground">
                  Контакты
                </Link>
              </li>
              <li>
                <Link to="/auth" className="text-muted-foreground transition-colors hover:text-foreground">
                  Личный кабинет
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-display font-semibold">Услуги</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/zamena-provodki" className="text-muted-foreground transition-colors hover:text-foreground">
                  Замена проводки
                </Link>
              </li>
              <li>
                <Link to="/sborka-elektroshchita" className="text-muted-foreground transition-colors hover:text-foreground">
                  Сборка щита
                </Link>
              </li>
              <li>
                <Link to="/elektromontazh-v-kvartire" className="text-muted-foreground transition-colors hover:text-foreground">
                  Электрика в квартире
                </Link>
              </li>
              <li>
                <Link to="/elektromontazh-v-dome" className="text-muted-foreground transition-colors hover:text-foreground">
                  Электрика в доме
                </Link>
              </li>
              <li>
                <Link to="/avariynyy-elektrik" className="font-medium text-primary transition-colors hover:text-primary/80">
                  Аварийный вызов
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-display font-semibold">Контакты</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" strokeWidth={2} aria-label="Телефон" />
                <span>+373 777 46642</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" strokeWidth={2} aria-label="Email" />
                <span>mmxxnon@gmail.com</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-primary" strokeWidth={2} aria-label="Адрес" />
                <span>г. Тирасполь, Приднестровье</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border/60 pt-8">
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <Link to="/elektrik-v-tiraspole" className="text-muted-foreground transition-colors hover:text-foreground">
              Электрик в Тирасполе
            </Link>
            <Link to="/elektrik-v-benderah" className="text-muted-foreground transition-colors hover:text-foreground">
              Электрик в Бендерах
            </Link>
            <Link to="/elektrik-v-slobodzee" className="text-muted-foreground transition-colors hover:text-foreground">
              Электрик в Слободзее
            </Link>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-border/60 pt-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} ЭлектроМастер. Все права защищены.</p>
          <p>Работаем по всему Приднестровью</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
