import { Link } from "react-router-dom";
import { Phone, MapPin, ShieldCheck, Clock3, CheckCircle2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";

type CityConfig = {
  title: string;
  heading: string;
  description: string;
  areaLabel: string;
};

const CITY_CONTENT: Record<string, CityConfig> = {
  tiraspol: {
    title: "Электрик в Тирасполе",
    heading: "Электрик в Тирасполе",
    description:
      "Профессиональный электрик в Тирасполе: монтаж, диагностика, ремонт проводки, подключение техники и сборка щитов. Работаем аккуратно, по договоренности и с гарантией.",
    areaLabel: "Тирасполе",
  },
  slobozia: {
    title: "Электрик в Слободзее",
    heading: "Электрик в Слободзее",
    description:
      "Электромонтаж и ремонт электрики в Слободзее: квартиры, дома и коммерческие объекты. Быстрый выезд, прозрачная смета, соблюдение норм безопасности.",
    areaLabel: "Слободзее",
  },
  bendery: {
    title: "Электрик в Бендерах",
    heading: "Электрик в Бендерах",
    description:
      "Нужен электрик в Бендерах? Выполняем монтаж и замену проводки, установку розеток и освещения, устранение аварийных неисправностей и пусконаладку.",
    areaLabel: "Бендерах",
  },
};

interface CityLandingProps {
  cityKey: "tiraspol" | "slobozia" | "bendery";
}

const bullets = [
  "Монтаж и замена электропроводки",
  "Установка розеток, выключателей, освещения",
  "Сборка и модернизация электрощитов",
  "Поиск и устранение неисправностей",
  "Выезд на объект и составление сметы",
];

const CityLanding = ({ cityKey }: CityLandingProps) => {
  const content = CITY_CONTENT[cityKey];

  const getTitleByCity = (key: string) => {
    switch(key) {
      case "tiraspol": return "Электрик в Тирасполе — ЭлектроМастер";
      case "slobozia": return "Электрик в Слободзее — ЭлектроМастер";
      case "bendery": return "Электрик в Бендерах — ЭлектроМастер";
      default: return content.title;
    }
  };

  const getDescriptionByCity = (key: string) => {
    switch(key) {
      case "tiraspol": 
        return "Профессиональный электрик в Тирасполе: монтаж, диагностика, ремонт проводки, подключение техники. Быстрый выезд, гарантия, прозрачная смета.";
      case "slobozia": 
        return "Электромонтаж в Слободзее: замена проводки, установка розеток, сборка щитов. Работаем по договоренности, с гарантией и безопасностью.";
      case "bendery": 
        return "Электрик в Бендерах: полный комплекс работ от монтажа до диагностики. Аварийный выезд, профессиональный подход, конкурентные цены.";
      default: return content.description;
    }
  };

  return (
    <Layout
      title={getTitleByCity(cityKey)}
      description={getDescriptionByCity(cityKey)}
    >
      <section className="section-padding bg-secondary/30">
        <div className="container-main grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <div>
            <p className="text-sm uppercase tracking-wide text-muted-foreground mb-3">
              Электромонтажные услуги
            </p>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-5">{content.heading}</h1>
            <p className="text-lg text-muted-foreground mb-7">{content.description}</p>

            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/#request-form">Оставить заявку</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="tel:+37377746642">
                  <Phone className="h-4 w-4 mr-2" /> +373 777 46642
                </a>
              </Button>
            </div>
          </div>

          <div className="card-industrial p-7 space-y-5">
            <h2 className="font-display text-2xl font-semibold">Что делаем в {content.areaLabel}</h2>
            <ul className="space-y-3">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" /> Выезд по городу и району
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock3 className="h-4 w-4" /> Согласуем удобное время
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4" /> Гарантия на работы
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" /> Консультация по телефону
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default CityLanding;
