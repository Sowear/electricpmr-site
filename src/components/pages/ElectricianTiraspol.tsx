import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";

const workStages = [
  "Созваниваемся, уточняем задачу и договариваемся по времени выезда.",
  "На месте проверяем нагрузку, состояние щита, соединений и линий по квартире или дому.",
  "Даём понятную смету до начала работ и отдельно проговариваем, что можно сделать сразу, а что поэтапно.",
  "После монтажа проверяем линии, автоматы, розетки и освещение под рабочей нагрузкой.",
];

const serviceList = [
  "Замена и монтаж электропроводки",
  "Установка розеток, выключателей и освещения",
  "Сборка и модернизация электрощитов",
  "Подключение бойлеров, варочных панелей и другой техники",
  "Диагностика неисправностей и устранение перегрева проводки",
  "Подготовка линий под кондиционеры, интернет и системы умного дома",
];

const advantages = [
  "Работаем по нормам ПУЭ и без случайных решений на месте",
  "Даём понятную смету до начала работ",
  "Берём как мелкий ремонт, так и комплексный электромонтаж",
  "Проверяем результат под нагрузкой после монтажа",
];

const tiraspolFaq = [
  {
    question: "Вы работаете только по Тирасполю?",
    answer:
      "Основной выезд делаем по Тирасполю, но также работаем по Бендерам, Слободзее и ближайшим населённым пунктам по согласованию.",
  },
  {
    question: "Можно вызвать электрика вечером или в выходной?",
    answer:
      "Да. Для срочных ситуаций стараемся подобрать ближайшее свободное окно, включая вечерние часы и выходные дни.",
  },
  {
    question: "Делаете только мелкий ремонт или и полный электромонтаж?",
    answer:
      "Берём и точечные задачи вроде замены автомата или розетки, и полноценный электромонтаж квартиры, дома или коммерческого помещения.",
  },
];

const ElectricianTiraspol = () => {
  return (
    <Layout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: "Услуги электрика в Тирасполе",
            serviceType: "Электромонтажные работы и ремонт электрики",
            areaServed: {
              "@type": "City",
              name: "Тирасполь",
            },
            provider: {
              "@type": "LocalBusiness",
              name: "ЭлектроМастер ПМР",
              telephone: "+37377746642",
              url: "https://electricpmr.vercel.app/elektrik-v-tiraspole",
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: tiraspolFaq.map((item) => ({
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

      <div className="container-main py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="font-display text-3xl font-bold mb-4 md:text-4xl">Услуги электрика в Тирасполе</h1>
            <p className="text-lg text-muted-foreground">
              Выполняем электромонтаж и ремонт электрики в квартирах, частных домах, новостройках и небольших
              коммерческих помещениях Тирасполя. Работаем аккуратно, с понятной сметой и проверкой результата после
              монтажа.
            </p>
          </div>

          <div className="prose max-w-none">
            <h2 className="font-display text-2xl font-bold mt-8 mb-4">Какие задачи решаем по Тирасполю</h2>
            <p>
              На городских объектах чаще всего приходится работать со старой проводкой, перегруженными группами,
              неудобным расположением розеток и слабой защитой в щите. Поэтому мы не ограничиваемся только заменой
              точки или автомата: сначала проверяем причину проблемы, потом предлагаем безопасное и долговечное
              решение под реальную нагрузку.
            </p>

            <h3 className="font-semibold mt-6 mb-3">Что делаем на объектах</h3>
            <ul className="list-disc list-inside space-y-2">
              {serviceList.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h3 className="font-semibold mt-6 mb-3">Почему нас выбирают</h3>
            <ul className="list-disc list-inside space-y-2">
              {advantages.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <div className="mt-8 rounded-lg border bg-muted/30 p-6">
              <h3 className="font-semibold mb-3">Выезжаем по районам Тирасполя</h3>
              <p className="text-muted-foreground mb-4">
                Работаем по районам и улицам города: Балка, Кировский, Центр, Западный, Октябрьский, а также по
                ближайшим пригородам по договорённости. Часто берём объекты на Московской, Краснодонской,
                Шевченко, Мира, 25 Октября, Свердлова и соседних улицах.
              </p>
              <Button asChild>
                <a href="/#request-form">Вызвать электрика в Тирасполе</a>
              </Button>
            </div>

            <div className="grid gap-6 mt-10 md:grid-cols-2">
              <div className="rounded-lg border bg-card p-6">
                <h3 className="font-display text-xl font-bold mb-4">Когда чаще всего вызывают электрика</h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li>После покупки квартиры со старой алюминиевой проводкой.</li>
                  <li>Перед установкой бойлера, варочной панели, кондиционера или другой мощной техники.</li>
                  <li>Когда выбивает автомат, греются розетки или мигает свет под нагрузкой.</li>
                  <li>Во время ремонта, когда нужно заново развести свет, розетки и слаботочные линии.</li>
                </ul>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <h3 className="font-display text-xl font-bold mb-4">Что проверяем в первую очередь</h3>
                <p className="text-muted-foreground mb-3">
                  На объектах в Тирасполе особенно важно проверить вводной автомат, распределение нагрузки по
                  комнатам, линии кухни и санузла, а также качество старых соединений в коробках и щите.
                </p>
                <p className="text-muted-foreground">
                  Такой подход помогает не просто убрать симптом, а исключить повторяющиеся отключения и перегрев
                  проводки в будущем.
                </p>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-6 mt-10">
              <h3 className="font-display text-xl font-bold mb-4">Как проходит работа</h3>
              <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
                {workStages.map((stage) => (
                  <li key={stage}>{stage}</li>
                ))}
              </ol>
            </div>

            <div className="rounded-lg border bg-card p-6 mt-10">
              <h3 className="font-display text-xl font-bold mb-4">Частые вопросы</h3>
              <div className="space-y-4">
                {tiraspolFaq.map((item) => (
                  <div key={item.question}>
                    <h4 className="font-semibold mb-1">{item.question}</h4>
                    <p className="text-muted-foreground">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ElectricianTiraspol;
