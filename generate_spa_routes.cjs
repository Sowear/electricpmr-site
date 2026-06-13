const fs = require('fs');

const spaRoutes = ['admin', 'auth', 'dashboard', 'projects', 'estimator', 'catalog'];

const getPathsContent = `
export function getStaticPaths() {
  return [
    { params: { all: undefined } },
    { params: { all: 'users' } },
    { params: { all: 'work-examples' } },
    { params: { all: 'finance-settings' } },
    { params: { all: 'edit' } },
    { params: { all: 'edit/1' } },
    { params: { all: 'new' } },
    { params: { all: 'reset-password' } },
    { params: { all: 'update-password' } }
  ];
}
`;

for (const route of spaRoutes) {
  const dir = `src/pages/${route}`;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const indexContent = `---
import App from '@/App';
import Layout from '@/layouts/Layout.astro';
---
<Layout title="ЭлектроМастер ПМР" description="Личный кабинет" robots="noindex,nofollow">
  <App client:only="react" />
</Layout>
`;
  fs.writeFileSync(`${dir}/index.astro`, indexContent);

  const allContent = `---
import App from '@/App';
import Layout from '@/layouts/Layout.astro';
${getPathsContent}
---
<Layout title="ЭлектроМастер ПМР" description="Личный кабинет" robots="noindex,nofollow">
  <App client:only="react" />
</Layout>
`;
  fs.writeFileSync(`${dir}/[...all].astro`, allContent);
}

console.log('SPA routes generated');
