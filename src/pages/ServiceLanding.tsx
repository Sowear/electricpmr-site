import { Link } from "react-router-dom";
import { CheckCircle2, Clock3, Wrench, ShieldCheck, MapPin, Calculator, Phone, AlertTriangle } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";

type ServiceConfig = {
  title: string;
  heading: string;
  description: string;
  priceStart: string;
  priceLogic: string;
  includes: string[];
  timeline: string;
  commonFaults: string[];
  isEmergency?: boolean;
};

const SERVICE_CONTENT: Record<string, ServiceConfig> = {
  "zamena-provodki": {
    title: "Замена проводки в ПМР | ЭлектроМастер",
    heading: "Замена электропроводки под ключ",
    description: "Полная или частичная замена старой электропроводки на медную по стандартам ГОСТ. Выполняем штробление без пыли, аккуратную прокладку кабеля и сборку щитов.",
    priceStart: "от 50 $ за комнату",
    priceLogic: "Итоговая стоимость зависит от метража кабеля, количества точек (розеток/выключателей), материала стен (бетон/кирпич) и сложности монтажа.",
    includes: [
      "Составление схемы разводки и расчет нагрузок",
      "Демонтаж старой проводки (при необходимости)",
      "Штробление стен с пылесосом",
      "Прокладка нового медного кабеля (ВВГнг-LS)",
      "Монтаж подрозетников и распределительных коробок",
      "Проверка изоляции и пусконаладочные работы"
    ],
    timeline: "От 2 до 7 дней в зависимости от площади объекта.",
    commonFaults: [
      "Часто выбивает автоматы при включении техники",
      "Искрят розетки или пахнет гарью",
      "Алюминиевая проводка (срок службы вышел)",
      "Слабое напряжение, моргает свет"
    ]
  },
  "sborka-elektroshchita": {
    title: "Сборка и монтаж электрощитов в ПМР | ЭлектроМастер",
    heading: "Сборка и установка электрощита",
    description: "Профессиональная сборка электрощитов для квартир, домов и коммерческих объектов. Используем надежную автоматику, защищаем технику от скачков напряжения.",
    priceStart: "от 30 $",
    priceLogic: "Стоимость складывается из размера щита (количества модулей), типа установки (встраиваемый/накладной) и сложности схемы автоматики (УЗО, реле напряжения, контакторы).",
    includes: [
      "Расчет номиналов автоматов и сечений",
      "Подбор комплектующих (автоматы, УЗО, реле напряжения)",
      "Сборка щита согласно ГОСТ и ПУЭ",
      "Аккуратная маркировка всех групп",
      "Монтаж и подключение к питающей сети",
      "Тестирование срабатывания защит"
    ],
    timeline: "1-2 дня (сборка + монтаж).",
    commonFaults: [
      "Постоянно срабатывают пробки или автоматы",
      "Отсутствует УЗО (опасность удара током)",
      "Перегрев или плавление старого щитка",
      "Нужно подключить мощную технику (котел, плита)"
    ]
  },
  "avariynyy-elektrik": {
    title: "Срочный вызов электрика | Аварийный электрик ПМР",
    heading: "Аварийный вызов электрика",
    description: "Срочный выезд для устранения коротких замыканий, обрывов сети и опасных ситуаций. Восстанавливаем электроснабжение быстро и безопасно.",
    priceStart: "от 15 $ за выезд",
    priceLogic: "Базовая цена включает оперативный выезд и диагностику неисправности. Ремонтные работы оплачиваются по смете после обнаружения причины.",
    includes: [
      "Оперативный выезд в течение 30-60 минут",
      "Поиск места короткого замыкания или обрыва",
      "Устранение искрения и возгораний проводки",
      "Временное или постоянное восстановление питания",
      "Замена сгоревших автоматов или розеток"
    ],
    timeline: "Выезд: от 30 минут. Устранение: обычно 1-3 часа.",
    commonFaults: [
      "Пропал свет во всей квартире или части комнат",
      "Запах горелой изоляции в щитке",
      "Короткое замыкание при включении света",
      "Затопили соседи, и пропало электричество"
    ],
    isEmergency: true
  },
  "elektromontazh-v-kvartire": {
    title: "Электромонтаж в квартире ПМР | ЭлектроМастер",
    heading: "Электромонтаж в квартире",
    description: "Комплексные электромонтажные работы в квартирах (новостройки и вторичный фонд). Проектируем эргономичную электрику под ваш дизайн-проект.",
    priceStart: "от 150 $ (однокомнатная)",
    priceLogic: "Расчет идет по количеству электроточек (розетки, выключатели, выводы) и метражу кабеля. Составляем точную смету до начала работ.",
    includes: [
      "Разметка всех точек по дизайн-проекту",
      "Штробление без пыли",
      "Укладка слаботочных сетей (интернет, ТВ)",
      "Сборка распределительного щита в квартире",
      "Установка механизмов (после чистовой отделки)"
    ],
    timeline: "От 3 до 14 дней в зависимости от этапа ремонта.",
    commonFaults: [
      "Мало розеток, везде удлинители",
      "Капитальный ремонт или покупка новостройки",
      "Старая алюминиевая проводка не тянет новые приборы"
    ]
  },
  "elektromontazh-v-dome": {
    title: "Электрика в частном доме ПМР | ЭлектроМастер",
    heading: "Электромонтаж в частном доме",
    description: "Проектирование и монтаж электросетей для частных домов, коттеджей и дач. Включает ввод электричества, заземление, уличное освещение.",
    priceStart: "от 300 $",
    priceLogic: "Оценивается площадь дома, количество этажей, наличие фасадного/ландшафтного освещения, системы заземления и сложность электрощита.",
    includes: [
      "Проектирование системы электроснабжения",
      "Ввод кабеля от опоры в дом (СИП/подземный)",
      "Монтаж контура заземления",
      "Разводка по этажам и комнатам",
      "Подключение котлов, насосов, вентиляции",
      "Уличное и ландшафтное освещение"
    ],
    timeline: "От 7 до 21 дня (можно разбить на этапы).",
    commonFaults: [
      "Отсутствие контура заземления",
      "Строительство нового дома",
      "Нестабильное напряжение в сети (нужен стабилизатор)",
      "Перенос счетчика на трубостойку"
    ]
  }
};

interface ServiceLandingProps {
  serviceKey: keyof typeof SERVICE_CONTENT;
}

export default function ServiceLanding({ serviceKey }: ServiceLandingProps) {
  const content = SERVICE_CONTENT[serviceKey];

  if (!content) return null;

  return (
    <Layout
      title={content.title}
      description={content.description}
    >
      {/* Schema.org for Service */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": content.heading,
          "provider": {
            "@type": "LocalBusiness",
            "name": "ЭлектроМастер ПМР",
            "image": "https://electricpmr.vercel.app/logo-192x192.png",
            "telephone": "+37377746642",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Тирасполь",
              "addressRegion": "ПМР",
              "addressCountry": "MD"
            }
          },
          "areaServed": ["Тирасполь", "Бендеры", "Слободзея", "ПМР"],
          "description": content.description,
          "offers": {
            "@type": "Offer",
            "priceSpecification": {
              "@type": "UnitPriceSpecification",
              "priceType": "Minimum",
              "price": content.priceStart.replace(/[^0-9]/g, ''),
              "priceCurrency": "USD"
            }
          }
        })}
      </script>

      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_12%_8%,rgba(234,179,8,0.10),transparent_28%),linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--secondary))_100%)] pt-10 pb-12 md:pt-16 md:pb-20">
        <div className="tech-grid absolute inset-0 text-foreground/[0.06]" />
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="container-main relative z-10">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column */}
            <div>
              <p className="technical-label mb-4">
                {content.isEmergency ? "Срочный вызов" : "Услуги электромонтажа"}
              </p>
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">
                {content.heading}
              </h1>
              <p className="text-base md:text-lg text-muted-foreground mb-8 leading-relaxed">
                {content.description}
              </p>

              <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-8">
                {[
                  { icon: Calculator, label: "Расчёт", value: "до начала" },
                  { icon: ShieldCheck, label: "Гарантия", value: "на работы" },
                  { icon: CheckCircle2, label: "Проверка", value: "после монтажа" },
                ].map((item) => (
                  <div key={item.label} className="card-engineering bg-card/80 p-3 sm:p-4">
                    <item.icon className="mb-2 sm:mb-3 h-5 w-5 text-primary" />
                    <div className="text-[10px] sm:text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">{item.label}</div>
                    <div className="font-display text-sm sm:text-lg font-bold leading-tight text-foreground">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-4 mb-10">
                <Button size="lg" asChild className="h-14 px-8 text-base shadow-lg shadow-primary/20">
                  <Link to="/#request-form">Оставить заявку</Link>
                </Button>
                {content.isEmergency ? (
                  <Button size="lg" variant="destructive" asChild className="h-14 px-8 text-base">
                    <a href="tel:+37377746642">
                      <AlertTriangle className="h-5 w-5 mr-2" /> Срочный выезд
                    </a>
                  </Button>
                ) : (
                  <Button size="lg" variant="outline" asChild className="h-14 px-8 text-base border-primary/20 hover:bg-primary/5">
                    <a href="tel:+37377746642">
                      <Phone className="h-5 w-5 mr-2 text-primary" /> Позвонить
                    </a>
                  </Button>
                )}
              </div>

              {/* Work Areas */}
              <div className="card-engineering bg-card/85 p-5">
                <div className="flex items-center gap-3 text-sm text-foreground/80 font-medium">
                  <MapPin className="h-5 w-5 text-primary shrink-0" />
                  <span>Работаем: Тирасполь, Бендеры, Слободзея и районы.</span>
                </div>
              </div>
            </div>

            {/* Right Column (Cards) */}
            <div className="space-y-6">
              {/* Pricing Card */}
              <div className="relative overflow-hidden rounded-xl border border-white/10 bg-industrial-dark p-6 text-white shadow-[0_26px_80px_-42px_rgba(0,0,0,0.75)] md:p-8">
                <div className="tech-grid absolute inset-0 text-white/[0.08] [background-size:34px_34px]" />
                <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-primary/25 blur-3xl" />
                <h3 className="relative font-display text-xl font-semibold mb-4 flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  Цена и расчет
                </h3>
                <div className="relative text-4xl font-bold text-white mb-3">
                  {content.priceStart}
                </div>
                <p className="relative text-white/70 text-sm leading-relaxed">
                  {content.priceLogic}
                </p>
                <div className="relative mt-6 grid grid-cols-3 gap-2 border-t border-white/10 pt-4">
                  {["Прозрачно", "По этапам", "Без сюрпризов"].map((label) => (
                    <div key={label} className="rounded-lg border border-white/10 bg-white/[0.06] px-2 py-2 text-center text-[11px] font-semibold text-white/75">
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              {/* What's Included */}
              <div className="card-engineering p-6 md:p-8">
                <h3 className="font-display text-xl font-semibold mb-5 flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-primary" />
                  Что входит в услугу
                </h3>
                <ul className="space-y-3">
                  {content.includes.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                      <span className="text-foreground/90">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          {/* Bottom Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
             {/* Timeline Card */}
             <div className="card-engineering p-6">
                <h3 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
                  <Clock3 className="h-5 w-5 text-primary" />
                  Сроки работы
                </h3>
                <p className="text-muted-foreground">{content.timeline}</p>
              </div>

              {/* Common Faults */}
              <div className="card-engineering p-6 border-destructive/20 bg-destructive/5">
                <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Частые проблемы (когда вызывать)
                </h3>
                <ul className="space-y-2">
                  {content.commonFaults.map((fault, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                      <div className="h-1.5 w-1.5 rounded-full bg-destructive mt-2 shrink-0" />
                      <span>{fault}</span>
                    </li>
                  ))}
                </ul>
              </div>
          </div>

        </div>
      </section>
    </Layout>
  );
}
