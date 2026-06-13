const fs = require('fs');
const SPA_ROUTES = ['auth', 'dashboard', 'admin', 'projects', 'estimator', 'catalog'];
for (const route of SPA_ROUTES) {
  const dir = 'src/pages/' + route;
  const content = `---
import App from '@/App';
import Layout from '@/layouts/Layout.astro';

export function getStaticPaths() {
  return [
    { params: { all: undefined } },
    { params: { all: 'users' } },
    { params: { all: 'work-examples' } },
    { params: { all: 'finance-settings' } }
  ];
}

---
<Layout title="ЭлектроМастер ПМР" description="Личный кабинет" robots="noindex,nofollow">
  <App client:only="react" />
</Layout>
`;
  fs.writeFileSync(dir + '/[...all].astro', content);
}
console.log('Fixed SPA routes!');
