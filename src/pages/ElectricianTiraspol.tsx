import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const ElectricianTiraspol = () => {
  return (
    <Layout 
      title="Электрик в Тирасполе — ЭлектроМастер | Профессиональный электромонтаж"
      description="Электрик в Тирасполе — замена проводки, установка розеток, сборка щитов, подключение техники. Работаем по ПУЭ, гарантия, без посредников."
    >
      <div className="container-main py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">Электрик в Тирасполе</h1>
            <p className="text-lg text-muted-foreground">
              Профессиональный электромонтаж в Тирасполе: квартиры, частные дома, новостройки. 
              Работаем аккуратно, по нормам безопасности, с гарантией.
            </p>
          </div>
          
          <div className="prose max-w-none">
            <h2 className="font-display text-2xl font-bold mt-8 mb-4">Электромонтажные работы в Тирасполе</h2>
            <p>
              В Тирасполе мы выполняем полный спектр электромонтажных работ: от замены старой проводки до 
              комплексного электромонтажа в новых домах и квартирах. Наша команда знает особенности 
              местной электросети и работает строго по ПУЭ.
            </p>
            
            <h3 className="font-semibold mt-6 mb-3">Что мы делаем в Тирасполе:</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Замена и монтаж электропроводки</li>
              <li>Установка розеток, выключателей, освещения</li>
              <li>Сборка и модернизация электрощитов</li>
              <li>Подключение бытовой техники</li>
              <li>Диагностика и ремонт электросетей</li>
              <li>Автоматизация и умный дом</li>
            </ul>
            
            <h3 className="font-semibold mt-6 mb-3">Почему выбирают нас:</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Работаем по нормам ПУЭ</li>
              <li>Без посредников — своей командой</li>
              <li>Гарантия до 5 лет на работы</li>
              <li>Чёткая смета без скрытых доплат</li>
              <li>Аккуратная работа, соблюдение чистоты</li>
            </ul>
            
            <div className="mt-8 p-6 bg-muted/30 rounded-lg border">
              <h3 className="font-semibold mb-3">Услуги электрика в Тирасполе по адресам:</h3>
              <p className="text-muted-foreground mb-4">
                ул. Московская, ул. Кишинёвское шоссе, ул. Сеченова, ул. Гагарина, ул. Ленина, 
                ул. Театральная, ул. Пушкинская, ул. Армянская, ул. Украинская, ул. Днестровская, 
                ул. Румынская, ул. Советская, ул. Бендерская, ул. Слободзейская и другие районы Тирасполя.
              </p>
              <Button asChild>
                <Link to="/#request-form">Вызвать электрика в Тирасполь</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ElectricianTiraspol;