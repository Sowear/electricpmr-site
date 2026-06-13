const fs = require('fs');

const files = [
  'src/components/home/CompanyInfoSection.tsx',
  'src/components/home/ServicesSection.tsx',
  'src/components/portfolio/WorkExamplesSection.tsx',
  'src/pages/ElectricianBendery.tsx',
  'src/pages/ElectricianSlobozia.tsx',
  'src/pages/ElectricianTiraspol.tsx',
  'src/pages/Features.tsx',
  'src/pages/Index.tsx',
  'src/pages/Pricing.tsx',
  'src/pages/ServiceLanding.tsx',
  'src/pages/NotFound.tsx',
  'src/pages/CityLanding.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.log('Not found:', file);
    continue;
  }
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(/<Link/g, '<a');
  content = content.replace(/<\/Link>/g, '</a>');
  content = content.replace(/ to="/g, ' href="');
  content = content.replace(/ to=\{/g, ' href=\{');
  content = content.replace(/import \{\s*Link\s*\} from "react-router-dom";?\n?/g, '');
  content = content.replace(/import \{\s*Link,\s*/g, 'import { ');
  content = content.replace(/,\s*Link\s*\} from "react-router-dom"/g, ' } from "react-router-dom"');
  
  if (file.includes('NotFound.tsx')) {
    content = content.replace(/import \{\s*useLocation\s*\} from "react-router-dom";?\n?/g, '');
    content = content.replace(/const location = useLocation\(\);/g, 'const location = { pathname: typeof window !== "undefined" ? window.location.pathname : "/" };');
  }

  fs.writeFileSync(file, content);
}
console.log('Links replaced!');
