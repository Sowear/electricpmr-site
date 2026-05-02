import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

// --- Вспомогательные SVG Компоненты для слоев ---

// 1. Подрозетник (Монтажная коробка)
const Layer1BackBox = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
    <defs>
      <radialGradient id="box-bg" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
        <stop offset="0%" stopColor="#1e3a8a" /> {/* blue-900 */}
        <stop offset="80%" stopColor="#172554" /> {/* blue-950 */}
        <stop offset="100%" stopColor="#020617" /> {/* slate-950 */}
      </radialGradient>
      <linearGradient id="screw-tower" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#1e3a8a" />
        <stop offset="50%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#172554" />
      </linearGradient>
      <filter id="inner-shadow">
        <feOffset dx="0" dy="10"/>
        <feGaussianBlur stdDeviation="15" result="offset-blur"/>
        <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse"/>
        <feFlood floodColor="black" floodOpacity="0.9" result="color"/>
        <feComposite operator="in" in="color" in2="inverse" result="shadow"/>
        <feComposite operator="over" in="shadow" in2="SourceGraphic"/>
      </filter>
    </defs>
    
    {/* Внешний ребристый контур (гофра) */}
    <path 
      d="M100,5 
         C110,5 115,10 120,12 
         C130,15 135,10 145,15 
         C155,20 160,25 165,35 
         C170,45 175,50 185,55 
         C190,65 185,75 190,85 
         C195,95 195,105 190,115 
         C185,125 190,135 185,145 
         C175,150 170,155 165,165 
         C160,175 155,180 145,185 
         C135,190 130,185 120,188 
         C115,190 110,195 100,195 
         C90,195 85,190 80,188 
         C70,185 65,190 55,185 
         C45,180 40,175 35,165 
         C30,155 25,150 15,145 
         C10,135 15,125 10,115 
         C5,105 5,95 10,85 
         C15,75 10,65 15,55 
         C25,50 30,45 35,35 
         C40,25 45,20 55,15 
         C65,10 70,15 80,12 
         C85,10 90,5 100,5 Z" 
      fill="#1e40af" 
      stroke="#1e3a8a" 
      strokeWidth="2"
    />

    {/* Основное дно */}
    <circle cx="100" cy="100" r="85" fill="url(#box-bg)" filter="url(#inner-shadow)" />

    {/* Выломанное отверстие ввода кабеля снизу */}
    <circle cx="100" cy="155" r="20" fill="#000000" />
    {/* Остатки пластика на краях отверстия */}
    <path d="M80,155 Q85,150 82,145 M120,155 Q115,150 118,145" stroke="#1e3a8a" strokeWidth="2" fill="none" />

    {/* Крепежные башенки (Screw towers) */}
    <g transform="translate(15, 90)">
      <rect x="0" y="0" width="20" height="20" rx="5" fill="url(#screw-tower)" />
      <circle cx="10" cy="10" r="4" fill="#000" />
      <circle cx="10" cy="10" r="3" fill="#a1a1aa" /> {/* Шляпка самореза */}
      <path d="M8,10 H12 M10,8 V12" stroke="#3f3f46" strokeWidth="1" /> {/* Крест PZ */}
    </g>
    <g transform="translate(165, 90)">
      <rect x="0" y="0" width="20" height="20" rx="5" fill="url(#screw-tower)" />
      <circle cx="10" cy="10" r="4" fill="#000" />
      <circle cx="10" cy="10" r="3" fill="#a1a1aa" />
      <path d="M8,10 H12 M10,8 V12" stroke="#3f3f46" strokeWidth="1" />
    </g>
  </svg>
);

// 2. Вводной кабель с многопроволочными жилами
const Layer2Cables = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl overflow-visible">
    <defs>
      <linearGradient id="copper" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#b45309" />
        <stop offset="25%" stopColor="#fbbf24" />
        <stop offset="50%" stopColor="#d97706" />
        <stop offset="75%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#92400e" />
      </linearGradient>
      <linearGradient id="wire-brown" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#451a03" />
        <stop offset="50%" stopColor="#78350f" />
        <stop offset="100%" stopColor="#451a03" />
      </linearGradient>
      <linearGradient id="wire-blue" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#1e3a8a" />
        <stop offset="50%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1e3a8a" />
      </linearGradient>
      <linearGradient id="wire-yg" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#eab308" />
        <stop offset="25%" stopColor="#22c55e" />
        <stop offset="50%" stopColor="#eab308" />
        <stop offset="75%" stopColor="#22c55e" />
        <stop offset="100%" stopColor="#eab308" />
      </linearGradient>
      <linearGradient id="black-jacket" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#09090b" />
        <stop offset="50%" stopColor="#27272a" />
        <stop offset="100%" stopColor="#09090b" />
      </linearGradient>
    </defs>

    {/* Основной черный кабель (ВВГ) */}
    <path d="M85,200 L85,150 C85,130 115,130 115,150 L115,200 Z" fill="url(#black-jacket)" />
    
    {/* Фаза (Коричневый) */}
    <g>
      {/* Изоляция */}
      <path d="M90,140 Q60,110 50,60 L62,55 Q70,110 98,140 Z" fill="url(#wire-brown)" />
      {/* Медные волокна (Stranded copper) */}
      <path d="M50,60 L45,40 M53,58 L50,38 M56,57 L55,39 M59,56 L60,40 M62,55 L65,42" stroke="url(#copper)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </g>

    {/* Ноль (Синий) */}
    <g>
      {/* Изоляция */}
      <path d="M110,140 Q140,110 150,60 L138,55 Q130,110 102,140 Z" fill="url(#wire-blue)" />
      {/* Медные волокна */}
      <path d="M150,60 L155,40 M147,58 L150,38 M144,57 L145,39 M141,56 L140,40 M138,55 L135,42" stroke="url(#copper)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </g>

    {/* Земля (Желто-зеленый) */}
    <g>
      {/* Изоляция */}
      <path d="M98,135 Q100,90 100,50 L112,50 Q110,90 106,135 Z" fill="url(#wire-yg)" />
      {/* Медные волокна */}
      <path d="M100,50 L95,30 M103,50 L100,28 M106,50 L105,29 M109,50 L110,30 M112,50 L115,32" stroke="url(#copper)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </g>
  </svg>
);

// 3. Керамическая колодка механизма
const Layer3MechanismBase = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl">
    <defs>
      <linearGradient id="ceramic" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e4e4e7" />
        <stop offset="50%" stopColor="#d4d4d8" />
        <stop offset="100%" stopColor="#a1a1aa" />
      </linearGradient>
      <linearGradient id="screw-head" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f4f4f5" />
        <stop offset="50%" stopColor="#a1a1aa" />
        <stop offset="100%" stopColor="#52525b" />
      </linearGradient>
    </defs>

    {/* Форма колодки (восьмиугольник) */}
    <polygon points="50,20 150,20 180,50 180,150 150,180 50,180 20,150 20,50" fill="url(#ceramic)" stroke="#71717a" strokeWidth="2" />
    
    {/* Внутренние углубления и технологические линии */}
    <polygon points="60,30 140,30 160,60 160,140 140,170 60,170 40,140 40,60" fill="none" stroke="#a1a1aa" strokeWidth="1" />
    <circle cx="100" cy="100" r="40" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeDasharray="5,5" />
    
    {/* Маркировка */}
    <text x="100" y="90" fontSize="12" fontFamily="monospace" fontWeight="bold" fill="#71717a" textAnchor="middle">ELECTRIC_PMR</text>
    <text x="100" y="110" fontSize="10" fontFamily="monospace" fontWeight="bold" fill="#71717a" textAnchor="middle">16A 250V~ CE</text>

    {/* Клеммные зажимы с винтами (PZ2) */}
    {/* Левый (Фаза) */}
    <g transform="translate(10, 80)">
      <rect x="0" y="0" width="15" height="40" rx="2" fill="#52525b" />
      <circle cx="7.5" cy="10" r="5" fill="url(#screw-head)" />
      <path d="M5,10 H10 M7.5,7.5 V12.5 M4,6.5 L11,13.5 M4,13.5 L11,6.5" stroke="#27272a" strokeWidth="0.5" />
      <circle cx="7.5" cy="30" r="5" fill="url(#screw-head)" />
      <path d="M5,30 H10 M7.5,27.5 V32.5 M4,26.5 L11,33.5 M4,33.5 L11,26.5" stroke="#27272a" strokeWidth="0.5" />
    </g>

    {/* Правый (Ноль) */}
    <g transform="translate(175, 80)">
      <rect x="0" y="0" width="15" height="40" rx="2" fill="#52525b" />
      <circle cx="7.5" cy="10" r="5" fill="url(#screw-head)" />
      <path d="M5,10 H10 M7.5,7.5 V12.5 M4,6.5 L11,13.5 M4,13.5 L11,6.5" stroke="#27272a" strokeWidth="0.5" />
      <circle cx="7.5" cy="30" r="5" fill="url(#screw-head)" />
      <path d="M5,30 H10 M7.5,27.5 V32.5 M4,26.5 L11,33.5 M4,33.5 L11,26.5" stroke="#27272a" strokeWidth="0.5" />
    </g>

    {/* Верхний (Земля) */}
    <g transform="translate(80, 5)">
      <rect x="0" y="0" width="40" height="15" rx="2" fill="#52525b" />
      <circle cx="20" cy="7.5" r="5" fill="url(#screw-head)" />
      <path d="M17.5,7.5 H22.5 M20,5 V10 M16.5,4 L23.5,11 M16.5,11 L23.5,4" stroke="#27272a" strokeWidth="0.5" />
    </g>
  </svg>
);

// 4. Металлический суппорт
const Layer4SupportPlate = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
    <defs>
      <linearGradient id="galvanized" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e5e7eb" />
        <stop offset="30%" stopColor="#9ca3af" />
        <stop offset="50%" stopColor="#d1d5db" />
        <stop offset="70%" stopColor="#6b7280" />
        <stop offset="100%" stopColor="#9ca3af" />
      </linearGradient>
      <linearGradient id="brass" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fde047" />
        <stop offset="50%" stopColor="#ca8a04" />
        <stop offset="100%" stopColor="#854d0e" />
      </linearGradient>
    </defs>

    {/* Основная металлическая пластина */}
    <path 
      d="M20,20 L180,20 L180,180 L20,180 Z" 
      fill="url(#galvanized)" 
      stroke="#4b5563" 
      strokeWidth="1" 
      rx="10" 
      ry="10" 
    />
    
    {/* Фаски (вырезы по углам) для большей реалистичности */}
    <path d="M10,40 L40,10 M160,10 L190,40 M190,160 L160,190 M40,190 L10,160" stroke="#4b5563" strokeWidth="1" fill="none" />

    {/* Центральное отверстие (для механизма) */}
    <circle cx="100" cy="100" r="55" fill="transparent" stroke="#374151" strokeWidth="3" />
    
    {/* Ребра жесткости (штамповка) */}
    <path d="M30,30 L170,30 M30,170 L170,170 M30,30 L30,170 M170,30 L170,170" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.5" />
    <path d="M32,32 L168,32 M32,168 L168,168 M32,32 L32,168 M168,32 L168,168" fill="none" stroke="#374151" strokeWidth="1" opacity="0.5" />

    {/* Монтажные отверстия (замочные скважины) */}
    <g transform="translate(20, 95)" fill="#111827" stroke="#4b5563" strokeWidth="1">
      <path d="M0,0 A5,5 0 1,1 0,10 L10,10 A5,5 0 1,1 10,0 Z" />
    </g>
    <g transform="translate(170, 95)" fill="#111827" stroke="#4b5563" strokeWidth="1">
      <path d="M0,0 A5,5 0 1,1 0,10 L-10,10 A5,5 0 1,1 -10,0 Z" />
    </g>
    <g transform="translate(95, 20)" fill="#111827" stroke="#4b5563" strokeWidth="1">
      <path d="M0,0 A5,5 0 1,1 10,0 L10,10 A5,5 0 1,1 0,10 Z" />
    </g>
    <g transform="translate(95, 170)" fill="#111827" stroke="#4b5563" strokeWidth="1">
      <path d="M0,0 A5,5 0 1,1 10,0 L10,-10 A5,5 0 1,1 0,-10 Z" />
    </g>

    {/* Распорные лапки (Claws) по бокам */}
    <g transform="translate(5, 75)">
      <path d="M10,0 L0,5 L5,10 L0,15 L5,20 L0,25 L10,30 Z" fill="url(#galvanized)" stroke="#374151" strokeWidth="1" />
    </g>
    <g transform="translate(185, 75)">
      <path d="M0,0 L10,5 L5,10 L10,15 L5,20 L10,25 L0,30 Z" fill="url(#galvanized)" stroke="#374151" strokeWidth="1" />
    </g>

    {/* Усики заземления (Schuko contacts) */}
    <path d="M95,45 L105,45 L108,60 L92,60 Z" fill="url(#brass)" stroke="#854d0e" strokeWidth="1" />
    <path d="M95,155 L105,155 L108,140 L92,140 Z" fill="url(#brass)" stroke="#854d0e" strokeWidth="1" />
    
    {/* Пластиковый колодец розетки (Внутренность) */}
    <circle cx="100" cy="100" r="50" fill="#18181b" stroke="#27272a" strokeWidth="2" />
    {/* Отверстия для контактов вилки */}
    <circle cx="75" cy="100" r="10" fill="#000" />
    <circle cx="125" cy="100" r="10" fill="#000" />
    <circle cx="75" cy="100" r="6" fill="url(#brass)" /> {/* Внутренняя медь */}
    <circle cx="125" cy="100" r="6" fill="url(#brass)" />
  </svg>
);

// 5. Лицевая панель
const Layer5FrontCover = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
    <defs>
      <linearGradient id="glass-glare" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
        <stop offset="40%" stopColor="rgba(255,255,255,0.1)" />
        <stop offset="50%" stopColor="rgba(255,255,255,0.4)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
      </linearGradient>
      <filter id="glass-blur">
        <feGaussianBlur stdDeviation="2" />
      </filter>
    </defs>

    {/* Стеклянная Рамка (внешняя) */}
    <rect x="0" y="0" width="200" height="200" rx="15" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
    {/* Блик на рамке */}
    <rect x="0" y="0" width="200" height="200" rx="15" fill="url(#glass-glare)" />

    {/* Центральная накладка (белый глянцевый пластик) */}
    <circle cx="100" cy="100" r="50" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" filter="drop-shadow(0 10px 10px rgba(0,0,0,0.3))" />
    
    {/* Отверстия для вилки со шторками (Защита от детей) */}
    <circle cx="75" cy="100" r="10" fill="#0f172a" shadow="inset 0 2px 5px black" />
    <rect x="65" y="98" width="20" height="10" fill="#dc2626" /> {/* Красная шторка */}
    <path d="M65,98 L85,98" stroke="#991b1b" strokeWidth="1" />

    <circle cx="125" cy="100" r="10" fill="#0f172a" shadow="inset 0 2px 5px black" />
    <rect x="115" y="98" width="20" height="10" fill="#dc2626" /> {/* Красная шторка */}
    <path d="M115,98 L135,98" stroke="#991b1b" strokeWidth="1" />

    {/* Логотип */}
    <text x="100" y="140" fontSize="8" fontFamily="monospace" fontWeight="bold" fill="#94a3b8" textAnchor="middle" letterSpacing="2">PMR PRO</text>
  </svg>
);


// === ОСНОВНОЙ КОМПОНЕНТ ===

const ExplodedSocket = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "center center"]
  });

  // Изометрический поворот сцены
  const rotateX = 25;
  const rotateY = -40;

  // Динамическое распределение слоев (огромный разлет на 450px)
  const layer1Z = useTransform(scrollYProgress, [0, 1], [0, -250]); // Подрозетник
  const layer2Z = useTransform(scrollYProgress, [0, 1], [0, -150]); // Провода
  const layer3Z = useTransform(scrollYProgress, [0, 1], [0, -50]);  // Колодка
  const layer4Z = useTransform(scrollYProgress, [0, 1], [0, 50]);   // Суппорт
  const layer5Z = useTransform(scrollYProgress, [0, 1], [0, 150]);  // Рамка

  const lineOpacity = useTransform(scrollYProgress, [0.3, 1], [0, 0.7]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full aspect-square max-w-[600px] mx-auto flex items-center justify-center overflow-visible"
      style={{ perspective: "2000px" }}
    >
      {/* Свечение на фоне */}
      <div className="absolute inset-0 bg-primary/10 rounded-full blur-[120px]" />

      <motion.div 
        className="relative w-[50%] h-[50%] transform-gpu"
        style={{ transformStyle: "preserve-3d", rotateX, rotateY }}
      >
        {/* === ЛИНИИ СБОРКИ (Центральная ось) === */}
        <motion.div className="absolute inset-0 pointer-events-none flex justify-center items-center z-10" style={{ opacity: lineOpacity, transformStyle: "preserve-3d" }}>
          {/* Главная ось сборки */}
          <motion.div 
            className="absolute w-[2px] bg-primary/40 rounded-full" 
            style={{ 
              height: "450px", 
              transform: "translateZ(-225px) rotateX(90deg)", 
              transformOrigin: "top center" 
            }} 
          />
          {/* Направляющие крепежных винтов */}
          <motion.div className="absolute w-[1px] bg-primary/20" style={{ height: "350px", transform: "translate3d(-50px, 0, -150px) rotateX(90deg)", transformOrigin: "top center" }} />
          <motion.div className="absolute w-[1px] bg-primary/20" style={{ height: "350px", transform: "translate3d(50px, 0, -150px) rotateX(90deg)", transformOrigin: "top center" }} />
        </motion.div>

        {/* СЛОЙ 1: Подрозетник */}
        <motion.div className="absolute inset-0 flex justify-center items-center pointer-events-none" style={{ z: layer1Z, transformStyle: "preserve-3d" }}>
          <Layer1BackBox />
        </motion.div>

        {/* СЛОЙ 2: Вводной кабель */}
        <motion.div className="absolute inset-0 flex justify-center items-center pointer-events-none z-10" style={{ z: layer2Z, transformStyle: "preserve-3d" }}>
          <Layer2Cables />
        </motion.div>

        {/* СЛОЙ 3: Основание (Керамика) */}
        <motion.div className="absolute inset-0 flex justify-center items-center z-20 pointer-events-none" style={{ z: layer3Z, transformStyle: "preserve-3d" }}>
          <Layer3MechanismBase />
        </motion.div>

        {/* СЛОЙ 4: Металлический суппорт */}
        <motion.div className="absolute inset-0 flex justify-center items-center z-30 pointer-events-none" style={{ z: layer4Z, transformStyle: "preserve-3d" }}>
          <Layer4SupportPlate />
        </motion.div>

        {/* СЛОЙ 5: Лицевая рамка */}
        <motion.div className="absolute inset-0 flex justify-center items-center z-40 pointer-events-none" style={{ z: layer5Z, transformStyle: "preserve-3d" }}>
          <Layer5FrontCover />
        </motion.div>

      </motion.div>
    </div>
  );
};

export default ExplodedSocket;
