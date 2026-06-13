import { Building2, Zap, MapPin, ShieldCheck, ArrowRight, Star } from "lucide-react";
import { motion } from "framer-motion";

const cards = [
  {
    icon: Zap,
    title: "Что мы делаем",
    text: "Разводка и замена проводки, сборка электрощитов, подключение техники и освещения, диагностика электросетей.",
    accent: "10+ лет опыта",
    link: { label: "Все услуги", to: "/uslugi" },
    delay: 0,
  },
  {
    icon: Building2,
    title: "Типы объектов",
    text: "Квартиры, частные дома, новостройки, коммерческие помещения. От однушки до многоэтажного офиса.",
    accent: "Любой масштаб",
    link: { label: "Примеры работ", to: "/#work-examples" },
    delay: 0.1,
  },
  {
    icon: MapPin,
    title: "Где работаем",
    text: "Тирасполь, Слободзея, Бендеры, Днестровск, Григориополь и все населённые пункты ПМР.",
    accent: "Весь регион",
    link: { label: "Зоны выезда", to: "/#request-form" },
    delay: 0.2,
  },
  {
    icon: ShieldCheck,
    title: "Наши принципы",
    text: "Работаем по ПУЭ. Только после согласования сметы. Всё по договору, с актом и гарантией.",
    accent: "5 лет гарантии",
    link: { label: "Получить расчёт", to: "/#request-form" },
    delay: 0.3,
  },
];

const stats = [
  { value: "150+", label: "объектов сдано" },
  { value: "5 лет", label: "гарантия" },
  { value: "24ч", label: "время ответа" },
];

const CompanyInfoSection = () => {
  return (
    <section className="section-padding bg-muted/20 relative overflow-hidden">
      {/* Subtle background grid */}
      <div className="tech-grid absolute inset-0 text-foreground/[0.025]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="container-main relative">
        {/* Header */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
        >
          <span className="technical-label mb-4 inline-flex">О компании</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            {"Профессиональный электромонтаж "}
            <span className="text-primary">в Приднестровье</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            ЭлектроМастер — команда специалистов. Работаем по всему ПМР: квартиры, дома, коммерция.
          </p>

          {/* Stats row */}
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-3 rounded-full border border-border/70 bg-card/80 px-5 py-2.5 shadow-sm backdrop-blur-sm"
              >
                <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                <span className="font-display text-lg font-bold text-foreground">{s.value}</span>
                <span className="text-sm text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {cards.map((card) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: card.delay }}
              className="group relative flex flex-col rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_30px_-8px_rgba(234,179,8,0.25)] hover:-translate-y-1"
            >
              {/* Top accent line on hover */}
              <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-primary/0 to-transparent transition-all duration-300 group-hover:via-primary/70" />

              {/* Icon */}
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 transition-colors duration-300 group-hover:bg-primary/20">
                <card.icon className="h-7 w-7 text-primary" strokeWidth={1.75} />
              </div>

              {/* Content */}
              <h3 className="font-display text-lg font-semibold text-foreground mb-3">{card.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground flex-1">{card.text}</p>

              {/* Accent badge */}
              <div className="mt-4 mb-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary self-start">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {card.accent}
              </div>

              {/* Link */}
              <a
                href={card.link.to}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary group/link"
              >
                {card.link.label}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-1" />
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CompanyInfoSection;
