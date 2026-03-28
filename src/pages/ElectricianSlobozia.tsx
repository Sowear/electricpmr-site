import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const ElectricianSlobozia = () => {
  return (
    <Layout
      title="Электрик в Слободзее — ЭлектроМастер | Профессиональные услуги"
      description="Электрик в Слободзее — замена проводки, установка щитов, подключение техники. Работаем по ПУЭ, с гарантией, без посредников."
    >
      <div className="container-main py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">Электрик в Слободзее</h1>
            <p className="text-lg text-muted-foreground">
              Профессиональный электромонтаж в Слободзее: ремонт, новостройки, замена проводки. 
              Быстрое реагирование, качество, соблюдение норм безопасности.
            </p>
          </div>
          
          <div className="prose max-w-none">
            <h2 className="font-display text-2xl font-bold mt-8 mb-4">Электромонтаж в Слободзее</h2>
            <p>
              В Слободзее мы оказываем полный комплекс электромонтажных услуг: от простой замены розетки до 
              комплексного электромонтажа в новых домах. Работаем с учётом местных особенностей и по 
              действующим нормам ПУЭ.
            </p>
            
            <h3 className="font-semibold mt-6 mb-3">Перечень работ в Слободзее:</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Замена и прокладка электропроводки</li>
              <li>Установка розеток, выключателей, осветительных приборов</li>
              <li>Сборка и модернизация электрощитов</li>
              <li>Подключение электроплит, духовых шкафов, бойлеров</li>
              <li>Диагностика и устранение неисправностей</li>
              <li>Проектирование и монтаж систем умного дома</li>
            </ul>
            
            <h3 className="font-semibold mt-6 mb-3">Почему выбирают нас в Слободзее:</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Соблюдение норм ПУЭ при всех работах</li>
              <li>Работаем без посредников — своей командой</li>
              <li>Гарантия на все виды работ до 5 лет</li>
              <li>Составляем чёткую смету без скрытых расходов</li>
              <li>Аккуратно выполняем работу, соблюдаем чистоту на объекте</li>
            </ul>
            
            <div className="mt-8 p-6 bg-muted/30 rounded-lg border">
              <h3 className="font-semibold mb-3">Обслуживаем районы Слободзеи:</h3>
              <p className="text-muted-foreground mb-4">
                ул. Республиканская, ул. Ленина, ул. Центральная, ул. Мира, ул. Новая, ул. Школьная, 
                ул. Парковая, ул. Заводская, ул. Садовая, ул. Юбилейная, ул. Пролетарская, ул. Октябрьская, 
                ул. Строительная, ул. Энергетиков, ул. Молодёжная и другие улицы Слободзеи.
              </p>
              <Button asChild>
                <Link to="/#request-form">Вызвать электрика в Слободзею</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ElectricianSlobozia;