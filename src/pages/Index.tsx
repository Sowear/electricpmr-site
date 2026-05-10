import Layout from "@/components/layout/Layout";
import HeroSection from "@/components/home/HeroSection";
import AboutSection from "@/components/home/AboutSection";
import ServicesSection from "@/components/home/ServicesSection";
import WorkExamplesSection from "@/components/portfolio/WorkExamplesSection";
import RequestForm from "@/components/home/RequestForm";
import ContactSection from "@/components/contact/ContactSection";
import FloatingContactBar from "@/components/contact/FloatingContactBar";
import FaqAccordion from "@/components/common/FaqAccordion";
import CompanyInfoSection from "@/components/home/CompanyInfoSection";
import ProcessSection from "@/components/home/ProcessSection";
import QualityPassportSection from "@/components/home/QualityPassportSection";
import { Link } from "react-router-dom";

const Index = () => {
  return (
      <Layout
        title="ЭлектроМастер — электромонтаж в Тирасполе и Слободзее"
        description="ЭлектроМастер — профессиональный электромонтаж в Тирасполе и Слободзее. Квартиры и частные дома, аварийный выезд и гарантия. Также работаем в Бендерах."
      >
      <HeroSection />
      <QualityPassportSection />
      <ServicesSection />
      <AboutSection />
      <CompanyInfoSection />
      <WorkExamplesSection />
      <ProcessSection />
      <RequestForm />
      <ContactSection />
      <FloatingContactBar />
      
      {/* FAQ Section */}
      <section className="section-padding bg-secondary/30">
        <div className="container-main">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-8">
              Частые вопросы
            </h2>
            
            <FaqAccordion 
              items={[
                {
                  question: "Сколько стоит электромонтаж?",
                  answer: "Стоимость зависит от объёма работ, состояния проводки и сложности проекта. Мы не называем \"примерно\", а сначала уточняем задачу и даём понятный расчёт без скрытых доплат."
                },
                {
                  question: "Вы работаете только в Тирасполе?",
                  answer: "Работаем в Тирасполе, Слободзее, Бендерах, Днестровске и Григориополе. Выезд в другие населённые пункты — по договорённости."
                },
                {
                  question: "Делаете ли аварийные выезды?",
                  answer: "Да, помогаем в аварийных ситуациях: пропал свет, выбивает автомат, перегрев проводки. Стараемся максимально быстро реагировать на такие заявки."
                },
                {
                  question: "Как происходит работа?",
                  answer: "Вы оставляете заявку → мы уточняем задачу → даём расчёт → после согласования приступаем к работе. Все этапы понятны заранее."
                },
                {
                  question: "Даете ли вы гарантию?",
                  answer: "Да, предоставляем гарантию на выполненные работы. Используем проверенные материалы и соблюдаем нормы безопасности."
                },
                {
                  question: "Можно ли сначала проконсультироваться?",
                  answer: "Да, вы можете написать нам или отправить фото/видео задачи. Подскажем решение и сориентируем по стоимости."
                },
                {
                  question: "Вы работаете с частными домами и квартирами?",
                  answer: "Да, выполняем электромонтаж в квартирах, частных домах, новостройках и коммерческих помещениях."
                }
              ]}
              className="max-w-2xl mx-auto"
              itemClassName="bg-background"
            />
            
            <div className="text-center pt-6">
              <p className="text-sm text-muted-foreground mb-4">Не нашли свой вопрос?</p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <button 
                  onClick={() => document.getElementById('request-form')?.scrollIntoView({ behavior: 'smooth' })}
                  className="inline-flex items-center justify-center h-10 px-4 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity"
                >
                  Написать нам
                </button>
              </div>
             </div>
           </div>
         </div>
       </section>
       
       {/* Cities Coverage */}
       <section className="section-padding bg-secondary/30">
         <div className="container-main text-center">
           <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
             Работаем по Приднестровью
           </h2>
           <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
             Мы выполняем электромонтажные работы в Тирасполе, Бендерах и Слободзее.
           </p>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
             <Link 
               to="/elektrik-v-tiraspole" 
               className="card-industrial p-6 text-center hover:shadow-lg transition-shadow"
             >
               <h3 className="font-semibold text-lg mb-2">Тирасполь</h3>
               <p className="text-sm text-muted-foreground">Электромонтаж, замена проводки, установка оборудования</p>
             </Link>
             
             <Link 
               to="/elektrik-v-benderah" 
               className="card-industrial p-6 text-center hover:shadow-lg transition-shadow"
             >
               <h3 className="font-semibold text-lg mb-2">Бендеры</h3>
               <p className="text-sm text-muted-foreground">Ремонт, диагностика, подключение техники</p>
             </Link>
             
             <Link 
               to="/elektrik-v-slobodzee" 
               className="card-industrial p-6 text-center hover:shadow-lg transition-shadow"
             >
               <h3 className="font-semibold text-lg mb-2">Слободзея</h3>
               <p className="text-sm text-muted-foreground">Комплексные работы, сборка щитов, автоматизация</p>
             </Link>
           </div>
         </div>
       </section>
     </Layout>
   );
 };
 
 export default Index;
