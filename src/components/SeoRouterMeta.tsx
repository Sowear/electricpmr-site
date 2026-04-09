import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

type SeoConfig = {
  title: string;
  description: string;
  index?: boolean;
};

const SITE_URL = "https://electricpmr.vercel.app";

const SEO_BY_ROUTE: Record<string, SeoConfig> = {
  "/": {
    title: "Электрик в Тирасполе и ПМР | Электромонтаж под ключ",
    description: "Профессиональный электромонтаж в Тирасполе, Бендерах и Слободзее: монтаж проводки, щитов, розеток и освещения.",
    index: true,
  },
  "/features": {
    title: "Услуги электромонтажа | ЭлектроМастер ПМР",
    description: "Полный список электромонтажных услуг: проводка, щиты, освещение, диагностика и модернизация электросетей.",
    index: true,
  },
  "/pricing": {
    title: "Цены на электромонтаж | ЭлектроМастер ПМР",
    description: "Актуальные цены на электромонтажные работы в ПМР. Прозрачная смета, понятные этапы и фиксированная стоимость.",
    index: true,
  },
  "/uslugi": {
    title: "Услуги электрика в ПМР | ЭлектроМастер",
    description: "Электромонтажные услуги в ПМР: розетки, освещение, автоматы, щиты, диагностика и аварийные работы.",
    index: true,
  },
  "/stoimost": {
    title: "Стоимость услуг электрика в ПМР | ЭлектроМастер",
    description: "Узнайте стоимость электромонтажных работ в Тирасполе, Бендерах и Слободзее. Быстрый расчет и прозрачная смета.",
    index: true,
  },
  "/elektrik-v-tiraspole": {
    title: "Электрик в Тирасполе | Вызов электрика",
    description: "Услуги электрика в Тирасполе: монтаж, ремонт, диагностика и срочный выезд. Работаем быстро и аккуратно.",
    index: true,
  },
  "/elektrik-v-benderah": {
    title: "Электрик в Бендерах | Электромонтаж",
    description: "Электромонтажные работы в Бендерах: монтаж проводки, щитов, розеток и освещения с гарантией.",
    index: true,
  },
  "/elektrik-v-slobodzee": {
    title: "Электрик в Слободзее | ЭлектроМастер",
    description: "Профессиональные услуги электрика в Слободзее: ремонт и монтаж электрики для квартир, домов и бизнеса.",
    index: true,
  },
  "/auth": {
    title: "Вход в личный кабинет | ЭлектроМастер",
    description: "Авторизация в системе ЭлектроМастер для работы со сметами, проектами и заявками.",
    index: true,
  },
  "/dashboard": {
    title: "Личный кабинет | ЭлектроМастер",
    description: "Личный кабинет для управления сметами, проектами и финансовыми данными.",
    index: true,
  },
};

const DEFAULT_SEO: SeoConfig = {
  title: "ЭлектроМастер ПМР",
  description: "Электромонтажные услуги в ПМР: Тирасполь, Бендеры, Слободзея.",
  index: true,
};

const normalizePath = (pathname: string) => {
  if (pathname === "/") return "/";
  return pathname.replace(/\/+$/, "") || "/";
};

export default function SeoRouterMeta() {
  const { pathname } = useLocation();
  const normalizedPath = normalizePath(pathname);
  const seo = SEO_BY_ROUTE[normalizedPath] || DEFAULT_SEO;
  const canonical = `${SITE_URL}${normalizedPath === "/" ? "" : normalizedPath}`;
  const robots = seo.index === false ? "noindex,nofollow" : "index,follow";

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

      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
    </Helmet>
  );
}
