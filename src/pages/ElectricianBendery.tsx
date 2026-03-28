import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const ElectricianBendery = () => {
  return (
    <Layout
      title="Электрик в Бендерах — ЭлектроМастер | Электромонтажные работы"
      description="Электрик в Бендерах — замена проводки, установка розеток, сборка щитов. Профессиональный подход, гарантия качества, без посредников."
    >
      <div className="container-main py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">Электрик в Бендерах</h1>
            <p className="text-lg text-muted-foreground">
              Квалифицированный электромонтаж в Бендерах: квартиры, дома, коммерческие объекты. 
              Работаем по нормам ПУЭ, с гарантией и понятной сметой.
            </p>
          </div>
          
          <div className="prose max-w-none">
            <h2 className="font-display text-2xl font-bold mt-8 mb-4">Электромонтажные услуги в Бендерах</h2>
            <p>
              В Бендерах наша команда выполняет все виды электромонтажных работ: от мелкого ремонта и подключения 
              техники до комплексного электромонтажа в новых домах и квартирах. Мы знакомы с особенностями 
              местной инфраструктуры и электросетей.
            </p>
            
            <h3 className="font-semibold mt-6 mb-3">Наше обслуживание в Бендерах:</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Монтаж и замена проводки</li>
              <li>Установка розеток, выключателей, освещения</li>
              <li>Сборка и модернизация электрощитов</li>
              <li>Подключение бытовой техники</li>
              <li>Диагностика и ремонт электросетей</li>
              <li>Автоматизация и умный дом</li>
            </ul>
            
            <h3 className="font-semibold mt-6 mb-3">Преимущества работы в Бендерах:</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Работаем по ПУЭ и нормам безопасности</li>
              <li>Без посредников — напрямую с вами</li>
              <li>Гарантия до 5 лет на работы</li>
              <li>Чёткая смета без скрытых плат</li>
              <li>Аккуратность и профессионализм</li>
            </ul>
            
            <div className="mt-8 p-6 bg-muted/30 rounded-lg border">
              <h3 className="font-semibold mb-3">Работаем в районах Бендер:</h3>
              <p className="text-muted-foreground mb-4">
                ул. Комсомольская, ул. Мира, ул. Ленина, ул. Пушкинская, ул. Театральная, ул. Киевская, 
                ул. Лермонтова, ул. Суворова, ул. Строителей, ул. Гагарина, ул. Маяковского, ул. Фрунзе, 
                ул. Шевченко, ул. Бендерская, ул. Рыбницкая и другие микрорайоны Бендер.
              </p>
              <Button asChild>
                <Link to="/#request-form">Вызвать электрика в Бендеры</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ElectricianBendery;