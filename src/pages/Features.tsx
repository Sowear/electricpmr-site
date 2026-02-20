import Layout from "@/components/layout/Layout";
import { Home, Building, Construction, Cable, Zap, Plug, Lightbulb, Settings, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const allServices = [
  {
    icon: Home,
    title: "Электромонтаж в квартирах",
    description: "Полный комплекс электромонтажных работ в квартирах любой планировки. Включает разводку проводки, установку розеток, выключателей, осветительных приборов и электрощитов.",
    features: ["Разводка проводки", "Установка розеток и выключателей", "Монтаж освещения", "Сборка щитов"],
  },
  {
    icon: Building,
    title: "Электромонтаж в частных домах",
    description: "Комплексная электрификация частных домов и коттеджей под ключ. От проекта до сдачи объекта с полной документацией.",
    features: ["Проектирование", "Ввод электричества", "Внутренняя разводка", "Заземление и молниезащита"],
  },
  {
    icon: Construction,
    title: "Монтаж в новостройках",
    description: "Профессиональная разводка электрики с нуля в новых зданиях. Работаем по проекту или разрабатываем индивидуальное решение.",
    features: ["Работа с проектом", "Скрытая проводка", "Современные материалы", "Соответствие нормам"],
  },
  {
    icon: Cable,
    title: "Замена проводки",
    description: "Полная или частичная замена устаревшей алюминиевой проводки на современную медную. Безопасность вашего дома.",
    features: ["Демонтаж старой проводки", "Прокладка новых линий", "Замена автоматов", "Проверка изоляции"],
  },
  {
    icon: Zap,
    title: "Установка электрощитов",
    description: "Монтаж и сборка электрощитов любой сложности. Правильно собранный щит — основа безопасной электросети.",
    features: ["Сборка щитов", "Установка автоматов", "Подключение УЗО", "Маркировка линий"],
  },
  {
    icon: Plug,
    title: "Подключение бытовой техники",
    description: "Установка и подключение розеток, выключателей, а также подключение мощной бытовой техники.",
    features: ["Силовые розетки", "Подключение плит", "Бойлеры и кондиционеры", "Стиральные машины"],
  },
  {
    icon: Lightbulb,
    title: "Монтаж освещения",
    description: "Установка всех типов освещения: люстры, точечные светильники, светодиодные ленты, уличное освещение.",
    features: ["Люстры и бра", "Точечное освещение", "LED-подсветка", "Наружное освещение"],
  },
  {
    icon: Settings,
    title: "Ремонт электрики",
    description: "Диагностика и устранение неисправностей в электросети. Быстрый выезд в аварийных ситуациях.",
    features: ["Поиск обрыва", "Замена автоматов", "Ремонт проводки", "Аварийный выезд"],
  },
  {
    icon: ShieldCheck,
    title: "Проверка и диагностика",
    description: "Комплексная проверка состояния электросети, измерение сопротивления изоляции, проверка заземления.",
    features: ["Проверка изоляции", "Тест заземления", "Тепловизия", "Заключение"],
  },
];

const Features = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="section-padding bg-secondary/30">
        <div className="container-main">
          <div className="max-w-3xl">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
              Наши услуги
            </h1>
            <p className="text-lg text-muted-foreground">
              Полный спектр электромонтажных работ для жилых и коммерческих объектов. 
              Работаем качественно, быстро и с гарантией.
            </p>
          </div>
        </div>
      </section>

      {/* Services List */}
      <section className="section-padding">
        <div className="container-main">
          <div className="space-y-8">
            {allServices.map((service, index) => (
              <div
                key={index}
                className="card-industrial p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                <div className="lg:col-span-2">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                      <service.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-semibold mb-2">
                        {service.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {service.description}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="lg:border-l lg:border-border lg:pl-6">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Включает
                  </h4>
                  <ul className="space-y-2">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">
              Не нашли нужную услугу? Свяжитесь с нами!
            </p>
            <Button size="lg" asChild>
              <Link to="/#request-form">Оставить заявку</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Features;