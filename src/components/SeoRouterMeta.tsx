import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

type SeoConfig = {
  title: string;
  description: string;
  index?: boolean;
  changefreq?: "daily" | "weekly" | "monthly";
  priority?: number;
};

const SITE_URL = "https://electricpmr.vercel.app";

const SEO_BY_ROUTE: Record<string, SeoConfig> = {
  "/": {
    title: "Электрик в Тирасполе и ПМР | Электромонтаж под ключ",
    description:
      "Профессиональный электромонтаж в Тирасполе, Бендерах и Слободзее: монтаж проводки, щитов, розеток и освещения.",
    index: true,
    changefreq: "weekly",
    priority: 1.0,
  },
  "/features": {
    title: "Услуги электромонтажа | ЭлектроМастер ПМР",
    description:
      "Полный список электромонтажных услуг: проводка, щиты, освещение, диагностика и модернизация электросетей.",
    index: true,
    changefreq: "weekly",
    priority: 0.9,
  },
  "/pricing": {
    title: "Цены на электромонтаж | ЭлектроМастер ПМР",
    description:
      "Актуальные цены на электромонтажные работы в ПМР. Прозрачная смета, понятные этапы и фиксированная стоимость.",
    index: true,
    changefreq: "weekly",
    priority: 0.9,
  },
  "/uslugi": {
    title: "Услуги электрика в ПМР | ЭлектроМастер",
    description:
      "Электромонтажные услуги в ПМР: розетки, освещение, автоматы, щиты, диагностика и аварийные работы.",
    index: true,
    changefreq: "weekly",
    priority: 0.8,
  },
  "/stoimost": {
    title: "Стоимость услуг электрика в ПМР | ЭлектроМастер",
    description:
      "Узнайте стоимость электромонтажных работ в Тирасполе, Бендерах и Слободзее. Быстрый расчет и прозрачная смета.",
    index: true,
    changefreq: "weekly",
    priority: 0.8,
  },
  "/elektrik-v-tiraspole": {
    title: "Электрик в Тирасполе | Вызов электрика",
    description:
      "Услуги электрика в Тирасполе: монтаж, ремонт, диагностика и срочный выезд. Работаем быстро и аккуратно.",
    index: true,
    changefreq: "monthly",
    priority: 0.7,
  },
  "/elektrik-v-benderah": {
    title: "Электрик в Бендерах | Электромонтаж",
    description:
      "Электромонтажные работы в Бендерах: монтаж проводки, щитов, розеток и освещения с гарантией.",
    index: true,
    changefreq: "monthly",
    priority: 0.7,
  },
  "/elektrik-v-slobodzee": {
    title: "Электрик в Слободзее | ЭлектроМастер",
    description:
      "Профессиональные услуги электрика в Слободзее: ремонт и монтаж электрики для квартир, домов и бизнеса.",
    index: true,
    changefreq: "monthly",
    priority: 0.7,
  },
  "/auth": {
    title: "Вход в личный кабинет | ЭлектроМастер",
    description: "Авторизация в системе ЭлектроМастер для работы со сметами, проектами и заявками.",
    index: false,
    changefreq: "monthly",
    priority: 0.1,
  },
  "/dashboard": {
    title: "Личный кабинет | ЭлектроМастер",
    description: "Личный кабинет для управления сметами, проектами и финансовыми данными.",
    index: false,
    changefreq: "monthly",
    priority: 0.1,
  },
  "/projects": {
    title: "Проекты | ЭлектроМастер",
    description: "Управление проектами электромонтажа: объекты, сметы, платежи и финансы.",
    index: false,
    changefreq: "weekly",
    priority: 0.1,
  },
  "/estimator": {
    title: "Сметтер электромонтажа | ЭлектроМастер",
    description: "Создание и редактирование смет по электромонтажу в рабочем кабинете.",
    index: false,
    changefreq: "weekly",
    priority: 0.1,
  },
};

const DEFAULT_SEO: SeoConfig = {
  title: "ЭлектроМастер ПМР",
  description: "Электромонтажные услуги в ПМР: Тирасполь, Бендеры, Слободзея.",
  index: true,
  changefreq: "weekly",
  priority: 0.5,
};

const normalizePath = (pathname: string) => {
  if (pathname === "/") return "/";
  return pathname.replace(/\/+$/, "") || "/";
};

const isDynamicInternalPath = (path: string) => {
  return (
    /^\/projects\/[^/]+$/.test(path) ||
    /^\/projects\/[^/]+\/estimates\/[^/]+$/.test(path) ||
    /^\/projects\/[^/]+\/finance\/payouts$/.test(path) ||
    /^\/estimator\/[^/]+$/.test(path) ||
    /^\/admin\/.+/.test(path)
  );
};

export default function SeoRouterMeta() {
  const { pathname } = useLocation();
  const normalizedPath = normalizePath(pathname);
  const isInternalDynamic = isDynamicInternalPath(normalizedPath);
  const baseSeo = SEO_BY_ROUTE[normalizedPath] || DEFAULT_SEO;

  const seo: SeoConfig = isInternalDynamic
    ? {
        ...baseSeo,
        index: false,
      }
    : baseSeo;

  const canonical = `${SITE_URL}${normalizedPath === "/" ? "" : normalizedPath}`;
  const robots = seo.index === false ? "noindex,nofollow" : "index,follow";

  const breadcrumbItems = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Главная",
      item: SITE_URL,
    },
    ...(normalizedPath !== "/"
      ? [
          {
            "@type": "ListItem",
            position: 2,
            name: seo.title,
            item: canonical,
          },
        ]
      : []),
  ];

  return (
    <Helmet>
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonical} />

      <meta property="og:type" content="website" />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content="ЭлектроМастер" />
      <meta property="og:locale" content="ru_RU" />

      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />

      <meta name="googlebot" content={robots} />

      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: seo.title,
          description: seo.description,
          url: canonical,
          inLanguage: "ru",
        })}
      </script>

      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: breadcrumbItems,
        })}
      </script>
    </Helmet>
  );
}
