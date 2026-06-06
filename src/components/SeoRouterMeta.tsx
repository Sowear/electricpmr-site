import { useEffect } from "react";
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
    title: "ЭлектроМастер - электрик в Тирасполе и ПМР | Электромонтаж под ключ, замена проводки",
    description:
      "Электромонтажная компания ЭлектроМастер в Тирасполе и ПМР. Замена проводки, сборка электрощитов, монтаж розеток и освещения, поиск неисправностей. Работаем с квартирами и домами.",
    index: true,
    changefreq: "weekly",
    priority: 1.0,
  },
  "/uslugi": {
    title: "ЭлектроМастер - услуги электрика в Тирасполе и ПМР | Электромонтажные работы",
    description:
      "Монтаж и ремонт электрики: проводка, розетки, выключатели, автоматы, освещение, электрощиты, поиск неисправностей и аварийный выезд.",
    index: true,
    changefreq: "weekly",
    priority: 0.8,
  },
  "/stoimost": {
    title: "ЭлектроМастер - цены на электромонтажные работы в Тирасполе и ПМР | Стоимость услуг",
    description:
      "Актуальные цены на электромонтажные работы: замена проводки, монтаж розеток, сборка щитов, подключение оборудования и ремонт электрики.",
    index: true,
    changefreq: "weekly",
    priority: 0.8,
  },
  "/elektrik-v-tiraspole": {
    title: "ЭлектроМастер - электрик в Тирасполе | Электромонтаж, замена проводки, аварийный выезд",
    description:
      "Услуги электрика в Тирасполе. Замена проводки, установка розеток и выключателей, сборка электрощитов, поиск неисправностей и аварийный выезд по городу.",
    index: true,
    changefreq: "monthly",
    priority: 0.7,
  },
  "/elektrik-v-benderah": {
    title: "ЭлектроМастер - электрик в Бендерах | Электромонтажные работы и ремонт электрики",
    description:
      "Профессиональный электрик в Бендерах. Монтаж проводки, подключение автоматов, сборка электрощитов, ремонт и обслуживание электрических сетей.",
    index: true,
    changefreq: "monthly",
    priority: 0.7,
  },
  "/elektrik-v-slobodzee": {
    title: "ЭлектроМастер - электрик в Слободзее | Замена проводки, монтаж электрики под ключ",
    description:
      "Электромонтажные работы в Слободзее. Замена старой проводки, монтаж розеток и освещения, сборка электрощитов, устранение неисправностей и консультации.",
    index: true,
    changefreq: "monthly",
    priority: 0.7,
  },
  "/zamena-provodki": {
    title: "ЭлектроМастер - замена проводки в Тирасполе и ПМР | Электрик, монтаж новой проводки",
    description:
      "Полная и частичная замена электропроводки в квартирах, домах и новостройках. Расчёт нагрузки, безопасный монтаж, современные материалы.",
    index: true,
    changefreq: "monthly",
    priority: 0.8,
  },
  "/sborka-elektroshchita": {
    title: "ЭлектроМастер - сборка электрощитов в Тирасполе и ПМР | Автоматы, УЗО, щиты",
    description:
      "Профессиональная сборка и монтаж электрощитов. Установка автоматов, УЗО, дифавтоматов, маркировка и подключение по нормам.",
    index: true,
    changefreq: "monthly",
    priority: 0.8,
  },
  "/avariynyy-elektrik": {
    title: "ЭлектроМастер - Аварийный электрик Тирасполь и ПМР | Срочный выезд электрика",
    description:
      "Срочный вызов электрика. Короткое замыкание, выбивает автомат, пропал свет, неисправность проводки. Диагностика и устранение аварий.",
    index: true,
    changefreq: "monthly",
    priority: 0.9,
  },
  "/elektromontazh-v-kvartire": {
    title: "ЭлектроМастер - электромонтаж в квартире Тирасполь и ПМР | Проводка, розетки, освещение",
    description:
      "Комплексный электромонтаж квартир. Замена проводки, установка розеток, выключателей, освещения и электрощитов под ключ.",
    index: true,
    changefreq: "monthly",
    priority: 0.8,
  },
  "/elektromontazh-v-dome": {
    title: "ЭлектроМастер - электромонтаж в частном доме Тирасполь и ПМР | Электрика под ключ",
    description:
      "Проектирование и монтаж электрики в частных домах. Ввод питания, электрощиты, освещение, розетки, заземление и защита сети.",
    index: true,
    changefreq: "monthly",
    priority: 0.8,
  },
  "/contact": {
    title: "ЭлектроМастер - Контакты электрика в Тирасполе | Связаться с ЭлектроМастер",
    description:
      "Контакты для заказа электромонтажных работ в Тирасполе и ПМР. Консультация, расчёт стоимости и запись на выезд специалиста.",
    index: true,
    changefreq: "monthly",
    priority: 0.8,
  },
  "/catalog": {
    title: "Управление каталогом | ЭлектроМастер",
    description: "Управление каталогом цен и материалов в системе ЭлектроМастер.",
    index: false,
    changefreq: "monthly",
    priority: 0.1,
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

  useEffect(() => {
    const startTime = Date.now();
    let isDispatched = false;

    const checkAndTrigger = () => {
      if (isDispatched) return;

      const currentTitle = document.title;
      const titleMatches = currentTitle === seo.title;

      const canonicalEl = document.querySelector("link[rel='canonical']");
      const canonicalMatches = canonicalEl ? canonicalEl.getAttribute("href") === canonical : false;

      const timeElapsed = Date.now() - startTime;

      if ((titleMatches && canonicalMatches) || timeElapsed > 10000) {
        isDispatched = true;
        document.dispatchEvent(new Event("x-prerender-trigger"));
      } else {
        setTimeout(checkAndTrigger, 50);
      }
    };

    // Delay the initial check slightly to let react-helmet-async batch updates
    const timer = setTimeout(checkAndTrigger, 50);
    return () => {
      isDispatched = true;
      clearTimeout(timer);
    };
  }, [pathname, seo.title, canonical]);
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
      <meta property="og:image" content={`${SITE_URL}/social_og_image.png`} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image" content={`${SITE_URL}/social_og_image.png`} />

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
