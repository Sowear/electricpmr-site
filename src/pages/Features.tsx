import Layout from "@/components/layout/Layout";
import { Home, Building, Construction, Cable, Zap, Plug, Lightbulb, Settings, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import FaqAccordion from "@/components/common/FaqAccordion";

const SERVICES = [
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
    features: ["Проверка изоляции", "Тест заземления", "Тепливизия", "Заключение"],
  },
];

const Features = () => {
  return (
    <Layout
      title="Электромонтажные услуги — ЭлектроМастер"
      description="Полный спектр электромонтажных работ: замена проводки, установка розеток, сборка щитов, подключение техники. Работаем в Тирасполе, Слободзее, Бендерах."
    >
      {/* Hero */}
      <section className="section-padding bg-secondary/30">
        <div className="container-main">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
              Наши услуги
            </h1>
            <p className="text-lg text-muted-foreground">
              Комплексный подход к электромонтажу: от проектирования до сдачи объекта. Работаем качественно, быстро и с гарантией.
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="section-padding">
        <div className="container-main">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((service, index) => {
              const Icon = service.icon;
              return (
                <div key={index} className="card-industrial p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-semibold mb-2">
                        {service.title}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {service.description}
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-padding bg-secondary/30">
        <div className="container-main">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-8">
              Вопросы и ответы
            </h2>
            
            <FaqAccordion 
              items={[
                {
                  question: "Какие работы вы выполняете?",
                  answer: "Выполняем полный спектр электромонтажных работ: разводка проводки, замена электрики, сборка щитов, установка розеток, освещения и подключение техники."
                },
                {
                  question: "Можно ли заменить проводку частично?",
                  answer: "Да, при необходимости можно заменить проводку по зонам. Оценим состояние сети и предложим безопасное решение."
                },
                {
                  question: "Работаете ли вы с электрощитками?",
                  answer: "Да, выполняем сборку, замену и модернизацию электрощитов, установку автоматов, УЗО и реле защиты."
                },
                {
                  question: "Подключаете ли вы бытовую технику?",
                  answer: "Да, подключаем плиты, духовые шкафы, бойлеры, стиральные машины и другую технику с учётом нагрузки и безопасности."
                },
                {
                  question: "Можно ли вызвать мастера на диагностику?",
                  answer: "Выезд мастера платный, стоимость зависит от удаленности объекта. Онлайн-диагностика по фото/видео — бесплатна."
                },
                {
                  question: "Работаете ли вы в новостройках?",
                  answer: "Да, выполняем монтаж электрики с нуля по проекту или разрабатываем решение под ваш объект."
                },
                {
                  question: "Что входит в стоимость работ?",
                  answer: "В стоимость входит сам монтаж, подключение и проверка. Все условия согласовываем заранее — без скрытых работ и доплат."
                },
                {
                  question: "Когда можно начать работу?",
                  answer: "После согласования задачи и расчёта можем приступить в ближайшее время, в зависимости от загрузки и объёма работ."
                }
              ]}
              className="max-w-2xl mx-auto"
              itemClassName="bg-background"
            />
            
            <div className="text-center pt-6">
              <p className="text-sm text-muted-foreground mb-4">Не нашли свой вопрос?</p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <button 
                  onClick={() => document.getElementById('request-form')?.scrollIntoView({ behavior: 'smooth' })}
                  className="inline-flex items-center justify-center h-10 px-4 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity"
                >
                  Задать вопрос
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding">
        <div className="container-main text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
            Готовы обсудить ваш проект?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Оставьте заявку, и мы бесплатно приедем на осмотр и составим смету
          </p>
          <Button size="lg" asChild>
            <Link to="/#request-form">Оставить заявку</Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Features;