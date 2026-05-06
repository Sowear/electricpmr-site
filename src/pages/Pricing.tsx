import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import FaqAccordion from "@/components/common/FaqAccordion";
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
  "Цена материалов может отличаться от объекта к объекту",
  "Каждый объект требует индивидуального расчёта",
  'Смета составляется заранее, без формата "потом доплатите"',
];

const Pricing = () => {
  return (
    <Layout
      title="Стоимость электромонтажа — ЭлектроМастер"
      description="Цены на электромонтаж в Приднестровье. Прозрачный расчёт, понятная смета и согласование работ до начала монтажа."
    >
      <section className="section-padding bg-secondary/30">
        <div className="container-main">
          <div className="max-w-3xl">
            <h1 className="mb-6 font-display text-4xl font-bold md:text-5xl">Стоимость работ</h1>
            <p className="text-lg text-muted-foreground">
              Мы рассчитываем стоимость индивидуально для каждого проекта, чтобы вы платили только за то,
              что действительно нужно вашему объекту.
            </p>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-main">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                <Calculator className="h-7 w-7 text-primary" />
              </div>
              <h2 className="mb-4 font-display text-2xl font-bold md:text-3xl">Почему нет фиксированных цен?</h2>
              <p className="mb-6 text-muted-foreground">
                Каждый объект отличается по площади, состоянию стен, количеству линий, нагрузке и выбранным
                материалам. Поэтому мы не даём случайную цифру "на глаз", а считаем реальную смету по вашей задаче.
              </p>
              <ul className="space-y-3">
                {whyNoPrices.map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-success" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card-industrial bg-foreground p-8 text-background">
              <FileText className="mb-4 h-8 w-8 text-primary" />
              <h3 className="mb-3 font-display text-xl font-semibold">Как узнать стоимость?</h3>
              <ol className="space-y-4 text-background/80">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    1
                  </span>
                  <span>Оставляете заявку или звоните нам</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    2
                  </span>
                  <span>Мастер выезжает на осмотр, стоимость выезда зависит от удалённости объекта</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    3
                  </span>
                  <span>Получаете подробную смету и согласовываете объём работ</span>
                </li>
              </ol>

              <div className="mt-6 border-t border-background/20 pt-6">
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

      <section className="section-padding bg-secondary/30">
        <div className="container-main">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 font-display text-2xl font-bold md:text-3xl">Форматы работ</h2>
            <p className="text-muted-foreground">
              Работаем в разных форматах: от одной точки до полного электромонтажа под ключ.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {pricingFormats.map((format, index) => (
              <div key={index} className="card-industrial p-6">
                <h3 className="mb-2 font-display text-lg font-semibold">{format.title}</h3>
                <p className="mb-4 text-sm text-muted-foreground">{format.description}</p>
                <div className="mb-4 inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  {format.note}
                </div>
                <div className="border-t border-border pt-4">
                  <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Примеры:</p>
                  <ul className="space-y-1">
                    {format.examples.map((example, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <span className="h-1 w-1 rounded-full bg-muted-foreground" />
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

      <section className="section-padding bg-secondary/30">
        <div className="container-main">
          <div className="mx-auto max-w-3xl space-y-6">
            <h2 className="mb-8 text-center font-display text-2xl font-bold md:text-3xl">Вопросы о стоимости</h2>

            <FaqAccordion
              items={[
                {
                  question: "Как формируется стоимость работ?",
                  answer:
                    "Стоимость зависит от объёма работ, состояния проводки, сложности проекта и выбранных материалов. Мы сначала уточняем задачу, а затем даём понятный расчёт без скрытых доплат.",
                },
                {
                  question: "Выезд на осмотр платный?",
                  answer:
                    "Да, выезд инженера платный и зависит от удалённости объекта. Если нужно, можно начать с бесплатной онлайн-консультации по фото или видео.",
                },
                {
                  question: "Есть ли фиксированные цены?",
                  answer:
                    "Нет, мы не используем фиксированные цены для всех случаев подряд. Каждый расчёт делается индивидуально после оценки объёма и условий на объекте.",
                },
                {
                  question: "Бывают ли скрытые доплаты?",
                  answer:
                    "Нет. Все работы и стоимость согласовываются заранее, а смета составляется до начала монтажа.",
                },
                {
                  question: "Как оплачивается работа?",
                  answer:
                    "Обычно мы работаем по предоплате и поэтапным оплатам. Конкретный график зависит от объёма и длительности проекта.",
                },
                {
                  question: "Можно ли оплатить по факту?",
                  answer:
                    "Для новых клиентов чаще всего нужна небольшая предоплата. Для постоянных клиентов и отдельных форматов работ условия можем согласовать отдельно.",
                },
                {
                  question: "Делаете ли вы скидки?",
                  answer:
                    "Да, при объёмных работах возможны индивидуальные условия. Это обсуждается после оценки проекта.",
                },
              ]}
              className="mx-auto max-w-2xl"
              itemClassName="bg-background"
            />

            <div className="pt-6 text-center">
              <p className="mb-4 text-sm text-muted-foreground">Не нашли свой вопрос? Напишите нам</p>
              <Button asChild>
                <Link to="/#request-form">Задать вопрос</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-main text-center">
          <h2 className="mb-4 font-display text-2xl font-bold md:text-3xl">Готовы обсудить ваш проект?</h2>
          <p className="mx-auto mb-6 max-w-xl text-muted-foreground">
            Оставьте заявку, и мы сориентируем по стоимости, срокам и формату работ под ваш объект.
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
