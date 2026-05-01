import { Camera, CheckCircle2, ClipboardCheck, FileText, Gauge, ShieldCheck } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const passportCards = [
  {
    icon: FileText,
    title: "Смета до старта",
    text: "Фиксируем объём работ, материалы и этапы до выхода на объект.",
  },
  {
    icon: ClipboardCheck,
    title: "Маркировка линий",
    text: "Подписываем группы, автоматы и ключевые точки, чтобы систему было легко обслуживать.",
  },
  {
    icon: Gauge,
    title: "Проверка защиты",
    text: "После монтажа проверяем подключение, нагрузку и работу защитной автоматики.",
  },
  {
    icon: Camera,
    title: "Фотоотчёт",
    text: "Показываем результат и скрытые этапы, если объект требует поэтапного контроля.",
  },
];

const checklist = [
  "Понятная схема работ",
  "Аккуратный монтаж без хаоса в щите",
  "Гарантия и ответственность по договорённости",
  "Контакт с мастером на каждом этапе",
];

export default function QualityPassportSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-20% 0px" });

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-industrial-dark py-14 text-white md:py-20">
      {/* Conductor Merge Effect */}
      <div className="hidden md:block absolute left-[8%] top-0 z-30">
        {/* Glow spark when in view */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={isInView ? { opacity: [0, 1, 0.5, 1], scale: [0.5, 1.8, 1, 1.2] } : { opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute -left-2 -top-2 w-4 h-4 bg-primary rounded-full shadow-[0_0_20px_rgba(234,179,8,1),0_0_40px_rgba(234,179,8,0.8)]"
        />
        <div className="absolute -left-1 -top-1 w-2 h-2 bg-white rounded-full z-10 shadow-[0_0_10px_white]" />
      </div>

      {/* Continuing Conductor Line */}
      <motion.div 
        initial={{ height: 0 }}
        animate={isInView ? { height: "100%" } : { height: 0 }}
        transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
        className="hidden md:block absolute left-[8%] top-0 z-0 w-px bg-gradient-to-b from-primary/80 via-primary/20 to-transparent overflow-hidden"
      >
        <motion.div 
          className="absolute left-0 w-full h-[150px] bg-gradient-to-b from-transparent via-primary to-transparent"
          animate={{ top: ["-50%", "120%"] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear", delay: 1 }}
        />
      </motion.div>
      
      {/* Bottom diffusion to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-10 md:h-12 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
      {/* Glow divider line */}
      <div className="absolute right-0 bottom-0 h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent z-20" />

      <div className="container-main relative z-10">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="technical-label mb-5">Паспорт качества</span>
            <h2 className="font-display text-3xl font-bold leading-tight md:text-4xl">
              Инженерная аккуратность, которую видно в каждой детали
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/[0.68] md:text-lg">
              Мы показываем не только красивый финал, но и порядок внутри системы: как разведены линии,
              как подписан щит, как проверена защита и за что именно отвечает мастер.
            </p>

            <div className="mt-8 rounded-xl border border-white/[0.12] bg-white/[0.06] p-5 backdrop-blur-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Контрольный лист объекта</div>
                  <div className="text-xs text-white/50">перед сдачей работ</div>
                </div>
              </div>
              <div className="grid gap-2">
                {checklist.map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-lg bg-white/[0.05] px-3 py-2 text-sm text-white/[0.78]">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid gap-3 sm:grid-cols-2"
          >
            {passportCards.map((card, index) => (
              <div key={card.title} className="group relative min-h-[190px] overflow-hidden rounded-xl border border-white/[0.12] bg-white/[0.07] p-5 backdrop-blur-sm transition-colors hover:border-primary/55 hover:bg-white/[0.09]">
                <div className="absolute right-4 top-4 text-xs font-semibold text-white/20 transition-colors group-hover:text-primary/70">
                  0{index + 1}
                </div>
                <card.icon className="mb-6 h-7 w-7 text-primary" />
                <h3 className="font-display text-xl font-semibold">{card.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/[0.62]">{card.text}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
