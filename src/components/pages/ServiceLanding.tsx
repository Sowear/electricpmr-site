import { CheckCircle2, Clock3, Wrench, ShieldCheck, MapPin, Calculator, Phone, AlertTriangle, ArrowRight } from "lucide-react";
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
  additionalSections?: Array<{
    title: string;
    paragraphs: string[];
  }>;
  faq?: Array<{
    question: string;
    answer: string;
  }>;
};

const SERVICE_CONTENT: Record<string, ServiceConfig> = {
  "zamena-provodki": {
    title: "Замена проводки в ПМР | ЭлектроМастер",
    heading: "Замена электропроводки под ключ",
    description:
      "Полная или частичная замена старой электропроводки на медную по стандартам ГОСТ. Выполняем штробление без пыли, аккуратную прокладку кабеля и сборку щитов.",
    priceStart: "от 50 $ за комнату",
    priceLogic:
      "Итоговая стоимость зависит от метража кабеля, количества точек, материала стен и сложности монтажа.",
    includes: [
      "Составление схемы разводки и расчёт нагрузок",
      "Демонтаж старой проводки при необходимости",
      "Штробление стен с пылесосом",
      "Прокладка нового медного кабеля",
      "Монтаж подрозетников и распределительных коробок",
      "Проверка изоляции и пусконаладочные работы",
    ],
    timeline: "От 2 до 7 дней в зависимости от площади объекта.",
    commonFaults: [
      "Часто выбивает автоматы при включении техники",
      "Искрят розетки или пахнет гарью",
      "Старая алюминиевая проводка уже не держит нагрузку",
      "Моргает свет или проседает напряжение",
    ],
    additionalSections: [
      {
        title: "Когда нужна замена проводки",
        paragraphs: [
          "В домах старой постройки алюминиевая проводка рассчитана на 2-3 кВт. Современная техника даёт нагрузку 7-15 кВт, и старая сеть просто не справляется — греется, искрит, выбивает автоматы. Замена на медный кабель ВВГнг-LS снимает эти риски и позволяет безопасно пользоваться техникой.",
          "Мы не просто прокладываем новый кабель, а пересчитываем нагрузку под ваше оборудование, ставим автоматы нужного номинала и собираем щит по современным стандартам. После замены вы получаете полноценную электрику на 15-20 лет без переделок.",
        ],
      },
    ],
    faq: [
      {
        question: "Нужно ли штробить стены при замене проводки?",
        answer: "Да, в большинстве случаев проводка прокладывается в штробах. Используем строительный пылесос — пыли практически нет. Если ремонт уже сделан, можем рассмотреть открытую прокладку в кабель-каналах.",
      },
      {
        question: "Сколько Points (розеток, выключателей) входит в базовую стоимость?",
        answer: "Базовая стоимость считается за комнату с типовым набором: 3-4 розетки, выключатель, точка под люстру. Каждая дополнительная точка обсчитывается отдельно — это честнее, чем завышать базовую цену.",
      },
    ],
  },
  "sborka-elektroshchita": {
    title: "Сборка и монтаж электрощитов в ПМР | ЭлектроМастер",
    heading: "Сборка и установка электрощита",
    description:
      "Профессиональная сборка электрощитов для квартир, домов и коммерческих объектов. Подбираем автоматику, защищаем технику от скачков напряжения и подписываем группы.",
    priceStart: "от 30 $",
    priceLogic:
      "Стоимость зависит от размера щита, количества модулей, типа установки и сложности схемы автоматики.",
    includes: [
      "Расчёт номиналов автоматов и сечений",
      "Подбор комплектующих",
      "Сборка щита по ПУЭ и ГОСТ",
      "Маркировка групп",
      "Монтаж и подключение к питающей сети",
      "Тестирование защит",
    ],
    timeline: "1-2 дня.",
    commonFaults: [
      "Постоянно срабатывают автоматы",
      "Нет УЗО и защиты по влажным зонам",
      "Старый щит греется или плавится",
      "Нужно подключить мощную технику",
    ],
    additionalSections: [
      {
        title: "Почему стоит заказать сборку щита у нас",
        paragraphs: [
          "Правильная сборка электрощита — это не просто навесить автоматы на DIN-рейку. Мы рассчитываем номиналы под фактические нагрузки, распределяем группы по фазам, ставим УЗО и дифференциальные автоматы на влажные зоны (ванна, кухня) и подписываем каждую группу. Такой щит понятен не только нам, а и любому электрику, который будет с ним работать через несколько лет.",
          "Используем качественную автоматику проверенных брендов (IEK, EKF, ABB или Schneider — под бюджет) и проводим тестирование всех защит перед подключением. Гарантия на сборку щита — два года.",
        ],
      },
    ],
    faq: [
      {
        question: "Какой щит нужен для квартиры, а какой для частного дома?",
        answer: "Для квартиры обычно хватает щита на 18-24 модуля с одним УЗО и автоматами на группы. Для дома нужен щит на 36-54 модуля с несколькими УЗО, УЗИП (защита от перенапряжения) и резервными местами под дополнительные группы.",
      },
      {
        question: "Нужно ли менять старый щит или можно добавить автоматы в существующий?",
        answer: "Если старый щит собран на советских пробках или алюминиевых шинах — меняем полностью. Если корпус современный и есть запас по модулям — можно модернизировать. Приедем, посмотрим и дадим варианты.",
      },
    ],
  },
  "avariynyy-elektrik": {
    title: "Срочный вызов электрика | Аварийный электрик ПМР",
    heading: "Аварийный вызов электрика",
    description:
      "Срочный выезд для устранения коротких замыканий, обрывов сети и опасных ситуаций. Восстанавливаем электроснабжение быстро и безопасно.",
    priceStart: "от 15 $ за выезд",
    priceLogic:
      "Базовая цена включает оперативный выезд и диагностику. Ремонтные работы считаются отдельно после обнаружения причины.",
    includes: [
      "Выезд в течение 30-60 минут",
      "Поиск короткого замыкания или обрыва",
      "Устранение искрения и перегрева проводки",
      "Временное или постоянное восстановление питания",
      "Замена сгоревших автоматов и розеток",
    ],
    timeline: "Обычно 1-3 часа после приезда.",
    commonFaults: [
      "Пропал свет во всей квартире или части комнат",
      "Запах горелой изоляции в щитке",
      "Короткое замыкание при включении света",
      "После затопления исчезло электричество",
    ],
    isEmergency: true,
    additionalSections: [
      {
        title: "Самые частые аварийные ситуации",
        paragraphs: [
          "Короткое замыкание — самая распространённая причина аварийного вызова. Проводка не рассчитана на современные нагрузки, изоляция со временем пересыхает и трескается, и при включении мощного прибора происходит замыкание с отключением автомата или даже возгоранием. Мы приезжаем, находим место повреждения, устраняем и проверяем всю цепь.",
          "Затопление соседями или протечка крыши тоже нередко выводят из строя электропроводку. Вода попадает в распределительные коробки и розетки, вызывая утечку тока. В таких случаях сначала обесточиваем квартиру, просушиваем линии и меняем повреждённые участки, после чего восстанавливаем питание.",
        ],
      },
    ],
    faq: [
      {
        question: "Вы выезжаете ночью?",
        answer: "Да, работаем круглосуточно, включая выходные и праздники. При аварийной ситуации звоните в любое время — выезд в течение часа по Тирасполю и Бендерам.",
      },
      {
        question: "Что делать до приезда электрика?",
        answer: "Если чувствуете запах гари или видите искрение — отключите вводной автомат в щитке и не включайте электроприборы. Не пытайтесь чинить проводку самостоятельно, это опасно.",
      },
    ],
  },
  "elektromontazh-v-kvartire": {
    title: "Электромонтаж в квартире ПМР | ЭлектроМастер",
    heading: "Электромонтаж в квартире",
    description:
      "Комплексные электромонтажные работы в квартирах: новостройки, вторичный фонд и капитальный ремонт. Проектируем удобную электрику под реальную мебель и технику.",
    priceStart: "от 150 $",
    priceLogic:
      "Расчёт идёт по количеству точек и метражу кабеля. Точную смету составляем до начала работ.",
    includes: [
      "Разметка точек по планировке",
      "Штробление без пыли",
      "Укладка слаботочных линий",
      "Сборка квартирного щита",
      "Установка механизмов после отделки",
    ],
    timeline: "От 3 до 14 дней.",
    commonFaults: [
      "Мало розеток и везде удлинители",
      "Нужен полный монтаж в новостройке",
      "Старая проводка не тянет новые приборы",
    ],
    additionalSections: [
      {
        title: "Чем электромонтаж в квартире отличается от дома",
        paragraphs: [
          "В квартире нагрузка обычно ниже, чем в частном доме, но требования к аккуратности выше — соседи, отделка, строительный мусор. Мы работаем по согласованному графику, используем пылесосы для штробления и убираем за собой каждый день.",
          "Отдельный вопрос — слаботочные линии: интернет, телевидение, сигнализация. В современных квартирах их прокладывают вместе с силовой электрикой, чтобы сделать в одной штробе, но с разными кабельными каналами. Проектируем сразу с учётом будущей мебели — чтобы розетки не оказались за шкафом или кроватью.",
        ],
      },
    ],
    faq: [
      {
        question: "Когда лучше делать электрику — до или после штукатурки?",
        answer: "Штробим и прокладываем кабель до штукатурки, а подрозетники и механизмы ставим после. После чистовой отделки монтируем розетки, выключатели и подключаем освещение. Так стены остаются ровными и розетки стоят точно в уровень.",
      },
      {
        question: "Можно ли заказать электромонтаж только в одной комнате?",
        answer: "Да. Если не нужен полный цикл по всей квартире, можем сделать разводку в отдельной комнате: от штробления до установки розеток. Единственное — проверяем, что линия от щита до комнаты выдержит нагрузку.",
      },
    ],
  },
  "elektromontazh-v-dome": {
    title: "Электрика в частном доме ПМР | ЭлектроМастер",
    heading: "Электромонтаж в частном доме",
    description:
      "Проектирование и монтаж электросетей для частных домов, коттеджей и дач. Включает ввод электричества, заземление, внутреннюю разводку и наружное освещение.",
    priceStart: "от 300 $",
    priceLogic:
      "Оцениваем площадь дома, этажность, фасадное и уличное освещение, состав оборудования, систему заземления и сложность щита.",
    includes: [
      "Проектирование системы электроснабжения",
      "Ввод кабеля от опоры или подземной линии",
      "Монтаж контура заземления",
      "Разводка по этажам и комнатам",
      "Подключение котлов, насосов и вентиляции",
      "Уличное и ландшафтное освещение",
    ],
    timeline: "От 7 до 21 дня, по этапам при необходимости.",
    commonFaults: [
      "Нет нормального контура заземления",
      "Идёт строительство нового дома",
      "Нестабильное напряжение и нужен стабилизатор",
      "Нужно перенести счётчик и переработать ввод",
    ],
    additionalSections: [
      {
        title: "Что отдельно учитываем в частном доме",
        paragraphs: [
          "В доме нагрузка распределяется иначе, чем в квартире: есть несколько этажей, котельная, насосы, фасадный свет, автоматика ворот и уличные линии. Поэтому проект сразу делим на группы с запасом по мощности и понятной логикой обслуживания.",
          "Отдельно проверяем ввод питания, защиту от перепадов напряжения, контур заземления и резерв под будущие потребители, чтобы потом не вскрывать стены и не переделывать щит.",
        ],
      },
      {
        title: "Для каких объектов подходит услуга",
        paragraphs: [
          "Делаем электромонтаж в новых домах, коттеджах, дачах и объектах после реконструкции. Можно заказать полный цикл под ключ или отдельный этап: ввод, щит, разводку по этажам, котельную или наружное освещение.",
          "Если дом строится поэтапно, собираем схему так, чтобы её было удобно расширять без переделки основных линий и автоматики.",
        ],
      },
    ],
    faq: [
      {
        question: "Можно сделать электрику в доме поэтапно?",
        answer:
          "Да. Часто сначала делаем ввод, заземление и основной щит, затем разводку по этажам и уже после отделки ставим механизмы и освещение.",
      },
      {
        question: "Вы подключаете котёл, насосы и уличное освещение?",
        answer:
          "Да, при проектировании сразу закладываем отдельные линии под котельную, насосное оборудование, фасадный свет, ворота и другие нагрузки дома.",
      },
      {
        question: "Что делать, если в доме ещё нет нормального заземления?",
        answer:
          "Это одна из типовых задач. Подбираем схему заземления под объект, монтируем контур и затем уже собираем защиту в щите с учётом реальных условий участка.",
      },
    ],
  },
};

const RELATED_LINKS: Record<string, Array<{ href: string; label: string }>> = {
  "zamena-provodki": [
    { href: "/elektromontazh-v-kvartire", label: "Электромонтаж в квартире" },
    { href: "/sborka-elektroshchita", label: "Сборка электрощита" },
    { href: "/avariynyy-elektrik", label: "Аварийный электрик" },
  ],
  "sborka-elektroshchita": [
    { href: "/zamena-provodki", label: "Замена проводки" },
    { href: "/elektromontazh-v-dome", label: "Электрика в частном доме" },
    { href: "/elektromontazh-v-kvartire", label: "Электромонтаж в квартире" },
  ],
  "avariynyy-elektrik": [
    { href: "/zamena-provodki", label: "Замена проводки" },
    { href: "/sborka-elektroshchita", label: "Сборка электрощита" },
    { href: "/elektromontazh-v-kvartire", label: "Электромонтаж в квартире" },
  ],
  "elektromontazh-v-kvartire": [
    { href: "/elektromontazh-v-dome", label: "Электрика в частном доме" },
    { href: "/zamena-provodki", label: "Замена проводки" },
    { href: "/sborka-elektroshchita", label: "Сборка электрощита" },
  ],
  "elektromontazh-v-dome": [
    { href: "/elektromontazh-v-kvartire", label: "Электромонтаж в квартире" },
    { href: "/zamena-provodki", label: "Замена проводки" },
    { href: "/sborka-elektroshchita", label: "Сборка электрощита" },
  ],
};

interface ServiceLandingProps {
  serviceKey: keyof typeof SERVICE_CONTENT;
}

export default function ServiceLanding({ serviceKey }: ServiceLandingProps) {
  const content = SERVICE_CONTENT[serviceKey];
  const isSborka = serviceKey === "sborka-elektroshchita";
  const related = RELATED_LINKS[serviceKey] ?? [];

  if (!content) return null;

  const faqItems = content.faq ?? [];

  return (
    <Layout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: content.heading,
            provider: {
              "@type": "LocalBusiness",
              name: "ЭлектроМастер ПМР",
              image: "https://electricpmr.vercel.app/logo-192x192.png",
              telephone: "+37377746642",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Тирасполь",
                addressRegion: "ПМР",
                addressCountry: "MD",
              },
            },
            areaServed: ["Тирасполь", "Бендеры", "Слободзея", "ПМР"],
            description: content.description,
            offers: {
              "@type": "Offer",
              priceSpecification: {
                "@type": "UnitPriceSpecification",
                priceType: "Minimum",
                price: content.priceStart.replace(/[^0-9]/g, ""),
                priceCurrency: "USD",
              },
            },
          }),
        }}
      />
      {faqItems.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqItems.map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: item.answer,
                },
              })),
            }),
          }}
        />
      )}

      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_12%_8%,rgba(234,179,8,0.10),transparent_28%),linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--secondary))_100%)] pt-10 pb-12 md:pt-16 md:pb-20">
        <div className="tech-grid absolute inset-0 text-foreground/[0.06]" />
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="container-main relative z-10">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="technical-label mb-4">{content.isEmergency ? "Срочный выезд" : "Услуги электромонтажа"}</p>
              <h1 className="font-display text-3xl font-bold tracking-tight mb-6 sm:text-4xl md:text-5xl">
                {content.heading}
              </h1>
              <p className="text-base leading-relaxed text-muted-foreground mb-8 md:text-lg">{content.description}</p>

              <div className="grid grid-cols-3 gap-2 mb-8 sm:gap-3">
                {[
                  { icon: Calculator, label: "Расчёт", value: "до начала", ariaLabel: "Расчёт" },
                  { icon: ShieldCheck, label: "Гарантия", value: "на работы", ariaLabel: "Гарантия" },
                  { icon: CheckCircle2, label: "Проверка", value: "после монтажа", ariaLabel: "Проверка" },
                ].map((item) => (
                  <div key={item.label} className="card-engineering bg-card/80 p-3 sm:p-4">
                    <item.icon className="mb-2 h-5 w-5 text-primary sm:mb-3" strokeWidth={2} aria-label={item.ariaLabel} />
                    <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground sm:text-xs">
                      {item.label}
                    </div>
                    <div className="font-display text-sm font-bold leading-tight text-foreground sm:text-lg">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-4 mb-10">
                <Button size="lg" asChild className="h-14 px-8 text-base shadow-lg shadow-primary/20">
                  <a href="/#request-form">Оставить заявку</a>
                </Button>
                {content.isEmergency ? (
                  <Button size="lg" variant="destructive" asChild className="h-14 px-8 text-base">
                    <a href="tel:+37377746642">
                      <AlertTriangle className="h-5 w-5 mr-2" strokeWidth={2} aria-hidden="true" />
                      Срочный выезд
                    </a>
                  </Button>
                ) : (
                  <Button size="lg" variant="outline" asChild className="h-14 px-8 text-base border-primary/20 hover:bg-primary/5">
                    <a href="tel:+37377746642">
                      <Phone className="h-5 w-5 mr-2 text-primary" strokeWidth={2} aria-hidden="true" />
                      Позвонить
                    </a>
                  </Button>
                )}
              </div>

              <div className="card-engineering bg-card/85 p-5">
                <div className="flex items-center gap-3 text-sm font-medium text-foreground/80">
                  <MapPin className="h-5 w-5 shrink-0 text-primary" strokeWidth={2} aria-hidden="true" />
                  <span>Работаем: Тирасполь, Бендеры, Слободзея и ближайшие районы.</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card p-6 text-foreground shadow-lg md:p-8">
                <div className="tech-grid absolute inset-0 text-foreground/[0.04] [background-size:34px_34px]" />
                <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-primary/15 blur-3xl" />
                <h3 className="relative flex items-center gap-2 font-display text-xl font-semibold mb-4">
                  <Calculator className="h-5 w-5 text-primary" strokeWidth={2} aria-hidden="true" />
                  Цена и расчёт
                </h3>
                <div className="relative text-4xl font-bold text-foreground mb-3">{content.priceStart}</div>
                <p className="relative text-sm leading-relaxed text-muted-foreground">{content.priceLogic}</p>
                <div className="relative mt-6 grid grid-cols-3 gap-2 border-t border-border/60 pt-4">
                  {["Прозрачно", "По этапам", "Без сюрпризов"].map((label) => (
                    <div
                      key={label}
                      className="rounded-lg border border-border/60 bg-muted/30 px-2 py-2 text-center text-[11px] font-semibold text-muted-foreground"
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-engineering p-6 md:p-8">
                <h3 className="flex items-center gap-2 font-display text-xl font-semibold mb-5">
                  <Wrench className="h-5 w-5 text-primary" strokeWidth={2} aria-hidden="true" />
                  Что входит в услугу
                </h3>
                <ul className="space-y-3">
                  {content.includes.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-success" strokeWidth={2} aria-hidden="true" />
                      <span className="text-foreground/90">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {isSborka && (
            <div className="mt-10">
              <h2 className="flex items-center gap-2 font-display text-xl font-semibold mb-4">
                <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
                Как мы собираем электрощит
              </h2>
              <div className="relative w-full overflow-hidden rounded-xl border border-border/60 bg-black shadow-2xl">
                <div className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded border border-border/30 bg-black/60 px-2 py-1 text-[10px] font-mono font-semibold text-primary backdrop-blur-md">
                  <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                  REC
                </div>
                <img
                  src="/hero-video.webp"
                  alt="Сборка электрощита — ЭлектроМастер ПМР"
                  loading="lazy"
                  className="block h-auto w-full"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 mt-6 md:grid-cols-2">
            <div className="card-engineering p-6">
              <h3 className="flex items-center gap-2 font-display text-lg font-semibold mb-3">
                <Clock3 className="h-5 w-5 text-primary" strokeWidth={2} aria-hidden="true" />
                Сроки работы
              </h3>
              <p className="text-muted-foreground">{content.timeline}</p>
            </div>

            <div className="card-engineering border-destructive/20 bg-destructive/5 p-6">
              <h3 className="flex items-center gap-2 font-display text-lg font-semibold mb-4 text-destructive">
                <AlertTriangle className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
                Частые проблемы
              </h3>
              <ul className="space-y-2">
                {content.commonFaults.map((fault) => (
                  <li key={fault} className="flex items-start gap-2 text-sm text-foreground/80">
                    <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                    <span>{fault}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {content.additionalSections && content.additionalSections.length > 0 && (
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {content.additionalSections.map((section) => (
                <div key={section.title} className="card-engineering p-6">
                  <h3 className="font-display text-lg font-semibold mb-4">{section.title}</h3>
                  <div className="space-y-3 text-muted-foreground">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {faqItems.length > 0 && (
            <div className="card-engineering mt-8 p-6 md:p-8">
              <h3 className="font-display text-xl font-semibold mb-5">Частые вопросы</h3>
              <div className="space-y-4">
                {faqItems.map((item) => (
                  <div key={item.question}>
                    <h4 className="font-semibold mb-2">{item.question}</h4>
                    <p className="text-muted-foreground">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {related.length > 0 && (
            <div className="card-engineering mt-8 p-6 md:p-8">
              <h3 className="font-display text-xl font-semibold mb-5">Другие услуги</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                {related.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-sm font-medium text-foreground/80 transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                  >
                    <ArrowRight className="h-4 w-4 text-primary" strokeWidth={2} aria-hidden="true" />
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
