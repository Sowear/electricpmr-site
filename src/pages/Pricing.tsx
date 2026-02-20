import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calculator, FileText, Phone, CheckCircle2 } from "lucide-react";

const pricingFormats = [
  {
    title: "Точечные работы",
    description: "Установка розеток, выключателей, подключение техники",
    note: "Оплата за единицу работы",
    examples: ["Установка розетки", "Замена выключателя", "Подключение люстры"],
  },
  {
    title: "Комплексные работы",
    description: "Электрификация помещения или объекта под ключ",
    note: "Расчёт по проекту",
    examples: ["Квартира под ключ", "Частный дом", "Новостройка"],
  },
  {
    title: "Аварийные работы",
    description: "Срочный выезд и устранение неисправностей",
    note: "Срочный тариф",
    examples: ["Обрыв проводки", "Короткое замыкание", "Отключение электричества"],
  },
];

const whyNoPrices = [
  "Стоимость зависит от объёма и сложности работ",
  "Цена материалов варьируется",
  "Индивидуальный подход к каждому объекту",
  "Честное ценообразование без скрытых наценок",
];

const Pricing = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="section-padding bg-secondary/30">
        <div className="container-main">
          <div className="max-w-3xl">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
              Стоимость работ
            </h1>
            <p className="text-lg text-muted-foreground">
              Мы рассчитываем стоимость индивидуально для каждого проекта, 
              чтобы вы платили только за то, что вам действительно нужно.
            </p>
          </div>
        </div>
      </section>

      {/* Why no fixed prices */}
      <section className="section-padding">
        <div className="container-main">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 mb-6">
                <Calculator className="h-7 w-7 text-primary" />
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
                Почему нет фиксированных цен?
              </h2>
              <p className="text-muted-foreground mb-6">
                Каждый объект уникален. Стоимость зависит от метража, состояния стен, 
                сложности разводки и выбранных материалов. Мы составляем точную смету 
                после осмотра объекта — без сюрпризов и скрытых доплат.
              </p>
              <ul className="space-y-3">
                {whyNoPrices.map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card-industrial p-8 bg-foreground text-background">
              <FileText className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-display text-xl font-semibold mb-3">
                Как узнать стоимость?
              </h3>
              <ol className="space-y-4 text-background/80">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold flex-shrink-0">1</span>
                  <span>Оставьте заявку или позвоните нам</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold flex-shrink-0">2</span>
                  <span>Мастер выезжает на осмотр (бесплатно)</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold flex-shrink-0">3</span>
                  <span>Получаете подробную смету</span>
                </li>
              </ol>
              <div className="mt-6 pt-6 border-t border-background/20">
                <Button size="lg" className="w-full" asChild>
                  <Link to="/#request-form">
                    <Phone className="mr-2 h-5 w-5" />
                    Получить расчёт
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Formats */}
      <section className="section-padding bg-secondary/30">
        <div className="container-main">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
              Форматы работ
            </h2>
            <p className="text-muted-foreground">
              Мы работаем в разных форматах в зависимости от ваших задач
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingFormats.map((format, index) => (
              <div key={index} className="card-industrial p-6">
                <h3 className="font-display text-lg font-semibold mb-2">
                  {format.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {format.description}
                </p>
                <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                  {format.note}
                </div>
                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                    Примеры:
                  </p>
                  <ul className="space-y-1">
                    {format.examples.map((example, idx) => (
                      <li key={idx} className="text-sm flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
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

export default Pricing;