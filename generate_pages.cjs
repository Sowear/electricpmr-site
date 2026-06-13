const fs = require('fs');

const SEO_BY_ROUTE = {
  '/': { file: 'index.astro', component: 'Index', title: 'ЭлектроМастер - электрик в Тирасполе и ПМР', description: 'Электромонтажная компания ЭлектроМастер в Тирасполе и ПМР. Замена проводки, сборка электрощитов, монтаж розеток и освещения, поиск неисправностей. Работаем с квартирами и домами.' },
  '/uslugi': { file: 'uslugi.astro', component: 'Features', title: 'Услуги электрика в Тирасполе и ПМР | ЭлектроМастер', description: 'Монтаж и ремонт электрики: проводка, розетки, выключатели, автоматы, освещение, электрощиты, поиск неисправностей и аварийный выезд.' },
  '/stoimost': { file: 'stoimost.astro', component: 'Pricing', title: 'Цены на электромонтаж в Тирасполе и ПМР | ЭлектроМастер', description: 'Актуальные цены на электромонтажные работы: замена проводки, монтаж розеток, сборка щитов, подключение оборудования и ремонт электрики.' },
  '/elektrik-v-tiraspole': { file: 'elektrik-v-tiraspole.astro', component: 'ElectricianTiraspol', title: 'Электрик в Тирасполе: услуги и цены | ЭлектроМастер', description: 'Услуги электрика в Тирасполе. Замена проводки, установка розеток и выключателей, сборка электрощитов, поиск неисправностей и аварийный выезд по городу.' },
  '/elektrik-v-benderah': { file: 'elektrik-v-benderah.astro', component: 'ElectricianBendery', title: 'Электрик в Бендерах: услуги и цены | ЭлектроМастер', description: 'Профессиональный электрик в Бендерах. Монтаж проводки, подключение автоматов, сборка электрощитов, ремонт и обслуживание электрических сетей.' },
  '/elektrik-v-slobodzee': { file: 'elektrik-v-slobodzee.astro', component: 'ElectricianSlobozia', title: 'Электрик в Слободзее: услуги и цены | ЭлектроМастер', description: 'Электромонтажные работы в Слободзее. Замена старой проводки, монтаж розеток и освещения, сборка электрощитов, устранение неисправностей и консультации.' },
  '/zamena-provodki': { file: 'zamena-provodki.astro', component: 'services/ServiceZamenaProvodki', title: 'Замена электропроводки в Тирасполе и ПМР | ЭлектроМастер', description: 'Полная и частичная замена электропроводки в квартирах, домах и новостройках. Расчёт нагрузки, безопасный монтаж, современные материалы.' },
  '/sborka-elektroshchita': { file: 'sborka-elektroshchita.astro', component: 'services/ServiceSborkaShchita', title: 'Сборка электрощитов в Тирасполе и ПМР | ЭлектроМастер', description: 'Профессиональная сборка и монтаж электрощитов. Установка автоматов, УЗО, дифавтоматов, маркировка и подключение по нормам.' },
  '/avariynyy-elektrik': { file: 'avariynyy-elektrik.astro', component: 'services/ServiceAvariynyy', title: 'Аварийный вызов электрика в Тирасполе и ПМР | ЭлектроМастер', description: 'Срочный вызов электрика. Короткое замыкание, выбивает автомат, пропал свет, неисправность проводки. Диагностика и устранение аварий.' },
  '/elektromontazh-v-kvartire': { file: 'elektromontazh-v-kvartire.astro', component: 'services/ServiceKvartira', title: 'Электромонтаж в квартире в Тирасполе и ПМР | ЭлектроМастер', description: 'Комплексный электромонтаж квартир. Замена проводки, установка розеток, выключателей, освещения и электрощитов под ключ.' },
  '/elektromontazh-v-dome': { file: 'elektromontazh-v-dome.astro', component: 'services/ServiceDom', title: 'Электромонтаж в частном доме в Тирасполе и ПМР | ЭлектроМастер', description: 'Проектирование и монтаж электрики в частных домах. Ввод питания, электрощиты, освещение, розетки, заземление и защита сети.' },
  '/contact': { file: 'contact.astro', component: 'Contact', title: 'Контакты электрика в Тирасполе и ПМР | ЭлектроМастер', description: 'Контакты для заказа электромонтажных работ в Тирасполе и ПМР. Консультация, расчёт стоимости и запись на выезд специалиста.' }
};

for (const [route, data] of Object.entries(SEO_BY_ROUTE)) {
  const content = `---
import Layout from '@/layouts/Layout.astro';
import PageComponent from '@/pages/${data.component}';
import PageWrapper from '@/components/PageWrapper';

const title = "${data.title}";
const description = "${data.description}";
---

<Layout title={title} description={description}>
  <PageWrapper Component={PageComponent} client:load />
</Layout>
`;
  fs.writeFileSync(`src/pages/${data.file}`, content);
}

const SPA_ROUTES = ['auth', 'dashboard', 'admin', 'projects', 'estimator', 'catalog'];
for (const route of SPA_ROUTES) {
  const dir = `src/pages/${route}`;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  const content = `---
import App from '@/App';
import Layout from '@/layouts/Layout.astro';
---
<Layout title="ЭлектроМастер ПМР" description="Личный кабинет" robots="noindex,nofollow">
  <App client:only="react" />
</Layout>
`;
  fs.writeFileSync(`${dir}/[...all].astro`, content);
}
console.log('Pages generated!');
