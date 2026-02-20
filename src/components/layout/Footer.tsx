import { Link } from "react-router-dom";
import { Zap, Phone, Mail, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="container-main py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span>ЭлектроМастер</span>
            </Link>
            <p className="text-background/70 max-w-sm">
              Профессиональные электромонтажные услуги в Приднестровье. 
              Качество, надёжность и безопасность — наши приоритеты.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold mb-4">Навигация</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-background/70 hover:text-background transition-colors">
                  Главная
                </Link>
              </li>
              <li>
                <Link to="/features" className="text-background/70 hover:text-background transition-colors">
                  Услуги
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-background/70 hover:text-background transition-colors">
                  Стоимость
                </Link>
              </li>
              <li>
                <Link to="/auth" className="text-background/70 hover:text-background transition-colors">
                  Личный кабинет
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold mb-4">Контакты</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-background/70">
                <Phone className="h-4 w-4 text-primary" />
                <span>+373 777 46642</span>
              </li>
              <li className="flex items-center gap-2 text-background/70">
                <Mail className="h-4 w-4 text-primary" />
                <span>mmxxnon@gmail.com</span>
              </li>
              <li className="flex items-start gap-2 text-background/70">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                <span>г. Тирасполь, Приднестровье</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-background/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-background/50 text-sm">
            © {new Date().getFullYear()} ЭлектроМастер. Все права защищены.
          </p>
          <p className="text-background/50 text-sm">
            Работаем по всему Приднестровью
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;