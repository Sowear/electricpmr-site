import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

// --- HYPER-REALISTIC SVG COMPONENTS ---

// 1. Подрозетник (Photorealistic Back Box)
const Layer1BackBox = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
    <defs>
      <radialGradient id="box-bg" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
        <stop offset="0%" stopColor="#2563eb" /> {/* Bright plastic reflection */}
        <stop offset="60%" stopColor="#1e3a8a" /> 
        <stop offset="90%" stopColor="#172554" /> 
        <stop offset="100%" stopColor="#020617" />
      </radialGradient>
      <linearGradient id="screw-tower" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#1e3a8a" />
        <stop offset="20%" stopColor="#60a5fa" /> {/* Specular highlight */}
        <stop offset="50%" stopColor="#2563eb" />
        <stop offset="100%" stopColor="#172554" />
      </linearGradient>
      <radialGradient id="screw-head-3d" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
        <stop offset="0%" stopColor="#f4f4f5" />
        <stop offset="70%" stopColor="#71717a" />
        <stop offset="100%" stopColor="#27272a" />
      </radialGradient>
      <filter id="box-shadow-inner">
        <feOffset dx="0" dy="15"/>
        <feGaussianBlur stdDeviation="15" result="offset-blur"/>
        <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse"/>
        <feFlood floodColor="black" floodOpacity="1" result="color"/>
        <feComposite operator="in" in="color" in2="inverse" result="shadow"/>
        <feComposite operator="over" in="shadow" in2="SourceGraphic"/>
      </filter>
    </defs>
    
    {/* Ribbed outer shell */}
    <circle cx="100" cy="100" r="95" fill="#1e40af" stroke="#0f172a" strokeWidth="2" />
    <circle cx="100" cy="100" r="90" fill="none" stroke="#60a5fa" strokeWidth="1" strokeDasharray="10 5" opacity="0.5" />
    <circle cx="100" cy="100" r="87" fill="#172554" />

    {/* Main depth */}
    <circle cx="100" cy="100" r="85" fill="url(#box-bg)" filter="url(#box-shadow-inner)" />

    {/* Breakout hole for cables */}
    <ellipse cx="100" cy="160" rx="25" ry="15" fill="#000" />
    <ellipse cx="100" cy="160" rx="25" ry="15" fill="none" stroke="#1e3a8a" strokeWidth="3" opacity="0.6" />

    {/* 3D Screw Towers */}
    <g transform="translate(10, 85)">
      <rect x="0" y="0" width="25" height="30" rx="5" fill="url(#screw-tower)" stroke="#0f172a" strokeWidth="1" />
      <circle cx="12.5" cy="15" r="7" fill="#000" /> {/* Hole */}
      <circle cx="12.5" cy="15" r="5" fill="url(#screw-head-3d)" /> {/* Screw */}
      <path d="M10,15 H15 M12.5,12.5 V17.5" stroke="#18181b" strokeWidth="1.5" /> {/* PZ Cross */}
      <path d="M10,12.5 L15,17.5 M10,17.5 L15,12.5" stroke="#18181b" strokeWidth="0.5" /> {/* PZ inner cross */}
    </g>
    <g transform="translate(165, 85)">
      <rect x="0" y="0" width="25" height="30" rx="5" fill="url(#screw-tower)" stroke="#0f172a" strokeWidth="1" />
      <circle cx="12.5" cy="15" r="7" fill="#000" />
      <circle cx="12.5" cy="15" r="5" fill="url(#screw-head-3d)" />
      <path d="M10,15 H15 M12.5,12.5 V17.5" stroke="#18181b" strokeWidth="1.5" />
      <path d="M10,12.5 L15,17.5 M10,17.5 L15,12.5" stroke="#18181b" strokeWidth="0.5" />
    </g>
  </svg>
);

// 2. Вводной кабель (Photorealistic Cables & Stranded Copper)
const Layer2Cables = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_20px_20px_rgba(0,0,0,0.8)] overflow-visible">
    <defs>
      <linearGradient id="jacket-black" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#09090b" />
        <stop offset="20%" stopColor="#3f3f46" /> {/* Specular */}
        <stop offset="40%" stopColor="#18181b" />
        <stop offset="100%" stopColor="#000000" />
      </linearGradient>
      <linearGradient id="wire-brown" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#451a03" />
        <stop offset="30%" stopColor="#a16207" /> {/* Specular */}
        <stop offset="60%" stopColor="#78350f" />
        <stop offset="100%" stopColor="#2e1001" />
      </linearGradient>
      <linearGradient id="wire-blue" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#1e3a8a" />
        <stop offset="30%" stopColor="#60a5fa" /> {/* Specular */}
        <stop offset="60%" stopColor="#2563eb" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
      <linearGradient id="wire-yg" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#eab308" />
        <stop offset="20%" stopColor="#fef08a" /> {/* Specular */}
        <stop offset="40%" stopColor="#22c55e" />
        <stop offset="60%" stopColor="#86efac" /> {/* Specular */}
        <stop offset="80%" stopColor="#eab308" />
        <stop offset="100%" stopColor="#166534" />
      </linearGradient>
      
      {/* Hyper-realistic copper strands */}
      <linearGradient id="copper-strand" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#92400e" />
        <stop offset="30%" stopColor="#fcd34d" /> {/* Bright copper reflection */}
        <stop offset="50%" stopColor="#d97706" />
        <stop offset="80%" stopColor="#fef3c7" /> {/* Secondary reflection */}
        <stop offset="100%" stopColor="#78350f" />
      </linearGradient>
    </defs>

    {/* Внешняя оболочка ВВГнг */}
    <path d="M80,220 L80,160 C80,140 120,140 120,160 L120,220 Z" fill="url(#jacket-black)" stroke="#000" strokeWidth="1" />
    <text x="100" y="200" transform="rotate(-90 100 200)" fill="#71717a" fontSize="6" fontFamily="monospace">ВВГ-Пнг(А)-LS 3x2.5 ГОСТ</text>

    {/* Провода с изгибами */}
    <g style={{ transform: "translateY(20px)" }}>
      {/* Фаза (L) */}
      <g>
        <path d="M85,150 Q50,110 50,60 L65,58 Q80,110 95,150 Z" fill="url(#wire-brown)" stroke="#2e1001" strokeWidth="0.5" />
        {/* Оголенная медь (Stranded) - 7 жилок */}
        <path d="M50,60 L45,35 M52,59 L48,34 M55,58 L52,35 M58,58 L56,36 M60,58 L60,38 M63,58 L64,40 M65,58 L68,42" stroke="url(#copper-strand)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </g>

      {/* Земля (PE) */}
      <g>
        <path d="M95,145 Q100,90 100,50 L115,50 Q110,90 105,145 Z" fill="url(#wire-yg)" stroke="#166534" strokeWidth="0.5" />
        {/* Оголенная медь */}
        <path d="M100,50 L95,25 M102,50 L99,24 M105,50 L103,24 M108,50 L107,25 M111,50 L111,27 M114,50 L115,29 M115,50 L118,32" stroke="url(#copper-strand)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </g>

      {/* Ноль (N) */}
      <g>
        <path d="M105,150 Q140,110 150,60 L135,58 Q120,110 115,150 Z" fill="url(#wire-blue)" stroke="#0f172a" strokeWidth="0.5" />
        {/* Оголенная медь */}
        <path d="M150,60 L155,35 M148,59 L152,34 M145,58 L148,35 M142,58 L144,36 M140,58 L140,38 M137,58 L136,40 M135,58 L132,42" stroke="url(#copper-strand)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </g>
    </g>
  </svg>
);

// 3. Керамическая колодка (Photorealistic Ceramic Mechanism)
const Layer3MechanismBase = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_30px_30px_rgba(0,0,0,0.6)] overflow-visible">
    <defs>
      {/* Glossy ceramic texture */}
      <linearGradient id="ceramic-base" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="20%" stopColor="#e4e4e7" />
        <stop offset="80%" stopColor="#a1a1aa" />
        <stop offset="100%" stopColor="#52525b" />
      </linearGradient>
      <radialGradient id="terminal-screw" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="50%" stopColor="#a1a1aa" />
        <stop offset="100%" stopColor="#3f3f46" />
      </radialGradient>
    </defs>

    {/* Основной керамический блок с вырезами */}
    <path 
      d="M60,20 L140,20 L170,50 L170,150 L140,180 L60,180 L30,150 L30,50 Z" 
      fill="url(#ceramic-base)" 
      stroke="#71717a" 
      strokeWidth="2" 
    />
    
    {/* Внутренний рельеф и охлаждающие ребра (Cooling fins) */}
    <path d="M70,30 L130,30 L160,60 L160,140 L130,170 L70,170 L40,140 L40,60 Z" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.5" />
    <path d="M72,32 L128,32 L158,62 L158,138 L128,168 L72,168 L42,138 L42,62 Z" fill="none" stroke="#52525b" strokeWidth="2" opacity="0.5" />

    {/* Линии формовки пластика */}
    <line x1="100" y1="30" x2="100" y2="170" stroke="#71717a" strokeWidth="1" strokeDasharray="4 2" />
    <line x1="40" y1="100" x2="160" y2="100" stroke="#71717a" strokeWidth="1" strokeDasharray="4 2" />

    {/* Текст с эффектом гравировки (Engraved text) */}
    <g transform="translate(100, 85)">
      <text x="0" y="1" fontSize="14" fontFamily="sans-serif" fontWeight="900" fill="#ffffff" textAnchor="middle">16A 250V~</text>
      <text x="0" y="0" fontSize="14" fontFamily="sans-serif" fontWeight="900" fill="#52525b" textAnchor="middle">16A 250V~</text>
    </g>
    <g transform="translate(100, 115)">
      <text x="0" y="1" fontSize="12" fontFamily="sans-serif" fontWeight="900" fill="#ffffff" textAnchor="middle">IP20 CE</text>
      <text x="0" y="0" fontSize="12" fontFamily="sans-serif" fontWeight="900" fill="#52525b" textAnchor="middle">IP20 CE</text>
    </g>

    {/* Клеммы (Реалистичные латунные/стальные зажимы) */}
    {[
      { x: 15, y: 75, w: 25, h: 50 }, // Left (L)
      { x: 160, y: 75, w: 25, h: 50 }, // Right (N)
      { x: 75, y: -5, w: 50, h: 25 }, // Top (PE)
    ].map((term, i) => (
      <g key={i} transform={`translate(${term.x}, ${term.y})`}>
        {/* Корпус клеммы */}
        <rect x="0" y="0" width={term.w} height={term.h} rx="4" fill="#3f3f46" stroke="#18181b" strokeWidth="2" />
        {/* Отверстия под провода */}
        {term.h > term.w ? (
          <>
            <circle cx={term.w/2} cy={15} r="8" fill="url(#terminal-screw)" />
            <path d={`M${term.w/2 - 4},15 H${term.w/2 + 4} M${term.w/2},11 V19`} stroke="#18181b" strokeWidth="1" />
            <circle cx={term.w/2} cy={35} r="8" fill="url(#terminal-screw)" />
            <path d={`M${term.w/2 - 4},35 H${term.w/2 + 4} M${term.w/2},31 V39`} stroke="#18181b" strokeWidth="1" />
          </>
        ) : (
          <>
            <circle cx={25} cy={12.5} r="8" fill="url(#terminal-screw)" />
            <path d={`M21,12.5 H29 M25,8.5 V16.5`} stroke="#18181b" strokeWidth="1" />
          </>
        )}
      </g>
    ))}
  </svg>
);

// 4. Стальной суппорт (Photorealistic Galvanized Steel Plate)
const Layer4SupportPlate = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_40px_40px_rgba(0,0,0,0.5)] overflow-visible">
    <defs>
      {/* Complex metallic texture using overlapping gradients */}
      <linearGradient id="metal-base" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e5e7eb" />
        <stop offset="25%" stopColor="#9ca3af" />
        <stop offset="50%" stopColor="#d1d5db" />
        <stop offset="75%" stopColor="#4b5563" />
        <stop offset="100%" stopColor="#e5e7eb" />
      </linearGradient>
      <linearGradient id="metal-bevel" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#374151" />
      </linearGradient>
      <linearGradient id="brass-contact" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="30%" stopColor="#ca8a04" />
        <stop offset="70%" stopColor="#a16207" />
        <stop offset="100%" stopColor="#422006" />
      </linearGradient>
    </defs>

    {/* Суппорт с фасками и сложной формой обрезки */}
    <path 
      d="M20,20 L180,20 L180,180 L20,180 Z" 
      fill="url(#metal-base)" 
      stroke="url(#metal-bevel)" 
      strokeWidth="2" 
    />
    {/* Угловые скосы (Штамповка Legrand/Schneider) */}
    <path d="M20,40 L40,20 M180,40 L160,20 M20,160 L40,180 M180,160 L160,180" stroke="url(#metal-bevel)" strokeWidth="2" fill="none" />

    {/* Ребра жесткости (Embossed stamping) */}
    <g fill="none">
      <rect x="25" y="25" width="150" height="150" stroke="#ffffff" strokeWidth="1" opacity="0.6" />
      <rect x="26" y="26" width="148" height="148" stroke="#374151" strokeWidth="1" opacity="0.6" />
      <circle cx="100" cy="100" r="60" stroke="#ffffff" strokeWidth="1" opacity="0.6" />
      <circle cx="100" cy="100" r="59" stroke="#374151" strokeWidth="1" opacity="0.6" />
    </g>

    {/* Отверстия для монтажа (Keyholes) */}
    <g fill="#000" stroke="#374151" strokeWidth="1">
      {/* Верхнее */}
      <path d="M98,25 A4,4 0 1,1 102,25 L102,35 A4,4 0 1,1 98,35 Z" />
      {/* Нижнее */}
      <path d="M98,165 A4,4 0 1,1 102,165 L102,175 A4,4 0 1,1 98,175 Z" />
      {/* Левое */}
      <path d="M25,98 A4,4 0 1,1 25,102 L35,102 A4,4 0 1,1 35,98 Z" />
      {/* Правое */}
      <path d="M165,98 A4,4 0 1,1 165,102 L175,102 A4,4 0 1,1 175,98 Z" />
    </g>

    {/* Дополнительные перфорации */}
    {[35, 165].map(x => [35, 165].map(y => (
      <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill="#000" stroke="#374151" strokeWidth="1" />
    )))}

    {/* Распорные лапки (Sharp claws) */}
    <g transform="translate(0, 70)" stroke="#111827" strokeWidth="1">
      <path d="M20,0 L0,10 L5,20 L0,30 L5,40 L0,50 L20,60 Z" fill="url(#metal-base)" />
      <path d="M0,10 L10,15 M0,30 L10,30 M0,50 L10,45" stroke="#ffffff" strokeWidth="1" opacity="0.5" /> {/* Блики на остриях */}
    </g>
    <g transform="translate(180, 70)" stroke="#111827" strokeWidth="1">
      <path d="M0,0 L20,10 L15,20 L20,30 L15,40 L20,50 L0,60 Z" fill="url(#metal-base)" />
      <path d="M20,10 L10,15 M20,30 L10,30 M20,50 L10,45" stroke="#ffffff" strokeWidth="1" opacity="0.5" />
    </g>

    {/* Внутренний пластиковый "стакан" розетки */}
    <circle cx="100" cy="100" r="55" fill="#18181b" stroke="#3f3f46" strokeWidth="4" />
    
    {/* Отверстия для вилки */}
    <circle cx="70" cy="100" r="10" fill="#000" />
    <circle cx="130" cy="100" r="10" fill="#000" />
    
    {/* Медные контакты внутри отверстий */}
    <path d="M68,95 A5,5 0 0,0 68,105 L72,105 A5,5 0 0,0 72,95 Z" fill="url(#brass-contact)" />
    <path d="M128,95 A5,5 0 0,0 128,105 L132,105 A5,5 0 0,0 132,95 Z" fill="url(#brass-contact)" />

    {/* Усики заземления (Schuko Grounding Brackets) */}
    <g fill="url(#brass-contact)" stroke="#422006" strokeWidth="1.5">
      {/* Верхний ус */}
      <path d="M92,45 C92,60 95,65 100,65 C105,65 108,60 108,45 Z" filter="drop-shadow(0 5px 5px rgba(0,0,0,0.8))" />
      {/* Нижний ус */}
      <path d="M92,155 C92,140 95,135 100,135 C105,135 108,140 108,155 Z" filter="drop-shadow(0 -5px 5px rgba(0,0,0,0.8))" />
    </g>
  </svg>
);

// 5. Лицевая панель (Photorealistic Glass Frame & Faceplate)
const Layer5FrontCover = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_50px_50px_rgba(0,0,0,0.6)] overflow-visible">
    <defs>
      <linearGradient id="glass-face" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
        <stop offset="50%" stopColor="rgba(255,255,255,0.05)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0.3)" />
      </linearGradient>
      <linearGradient id="plastic-faceplate" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#e2e8f0" />
      </linearGradient>
      {/* Curved glossy reflection */}
      <linearGradient id="gloss-curve" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="rgba(255,255,255,0)" />
        <stop offset="50%" stopColor="rgba(255,255,255,0.6)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
      </linearGradient>
    </defs>

    {/* Внешняя стеклянная рамка */}
    <rect x="0" y="0" width="200" height="200" rx="20" fill="url(#glass-face)" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" className="backdrop-blur-xl" />
    
    {/* Фаска на стекле (Inner Bevel) */}
    <rect x="2" y="2" width="196" height="196" rx="18" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
    
    {/* Изогнутый блик на стекле */}
    <path d="M0,100 Q100,50 200,100 L200,0 L0,0 Z" fill="url(#gloss-curve)" opacity="0.4" clipPath="url(#frame-clip)" />
    <clipPath id="frame-clip">
      <rect x="0" y="0" width="200" height="200" rx="20" />
    </clipPath>

    {/* Центральная лицевая пластиковая накладка */}
    <g filter="drop-shadow(0 15px 15px rgba(0,0,0,0.4))">
      <circle cx="100" cy="100" r="52" fill="url(#plastic-faceplate)" stroke="#cbd5e1" strokeWidth="1" />
      
      {/* Внутренний срез под механизм */}
      <circle cx="100" cy="100" r="48" fill="none" stroke="#f8fafc" strokeWidth="2" />
      
      {/* Отверстия для вилки со шторками */}
      <g transform="translate(70, 100)">
        <circle cx="0" cy="0" r="10" fill="#0f172a" />
        <rect x="-8" y="-2" width="16" height="12" fill="#ef4444" rx="1" /> {/* Защитная шторка */}
        <path d="M-8,-2 L8,-2" stroke="#b91c1c" strokeWidth="1" />
        <circle cx="0" cy="0" r="10" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
      </g>
      <g transform="translate(130, 100)">
        <circle cx="0" cy="0" r="10" fill="#0f172a" />
        <rect x="-8" y="-2" width="16" height="12" fill="#ef4444" rx="1" />
        <path d="M-8,-2 L8,-2" stroke="#b91c1c" strokeWidth="1" />
        <circle cx="0" cy="0" r="10" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
      </g>

      {/* Центральный крепежный винт лицевой панели */}
      <circle cx="100" cy="100" r="4" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
      <line x1="97" y1="100" x2="103" y2="100" stroke="#475569" strokeWidth="1" />

      {/* Логотип */}
      <text x="100" y="140" fontSize="8" fontFamily="sans-serif" fontWeight="900" fill="#64748b" textAnchor="middle" letterSpacing="1">ELECTRIC_PMR</text>
    </g>
  </svg>
);


// === ОСНОВНОЙ КОМПОНЕНТ АНИМАЦИИ ===

const ExplodedSocket = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "center center"]
  });

  // Изометрический 3D-поворот сцены
  const rotateX = 25;
  const rotateY = -40;

  // Динамическое распределение слоев
  const layer1Z = useTransform(scrollYProgress, [0, 1], [0, -250]); // Подрозетник
  const layer2Z = useTransform(scrollYProgress, [0, 1], [0, -150]); // Провода
  const layer3Z = useTransform(scrollYProgress, [0, 1], [0, -50]);  // Керамика
  const layer4Z = useTransform(scrollYProgress, [0, 1], [0, 50]);   // Металл
  const layer5Z = useTransform(scrollYProgress, [0, 1], [0, 150]);  // Стекло

  const lineOpacity = useTransform(scrollYProgress, [0.3, 1], [0, 0.7]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full aspect-square max-w-[600px] mx-auto flex items-center justify-center overflow-visible py-20"
      style={{ perspective: "2500px" }}
    >
      {/* Глубокое атмосферное свечение */}
      <div className="absolute inset-0 bg-primary/20 rounded-full blur-[150px]" />

      <motion.div 
        className="relative w-[50%] h-[50%] transform-gpu"
        style={{ transformStyle: "preserve-3d", rotateX, rotateY }}
      >
        {/* === ОПОРНЫЕ ЛИНИИ СБОРКИ === */}
        <motion.div className="absolute inset-0 pointer-events-none flex justify-center items-center z-10" style={{ opacity: lineOpacity, transformStyle: "preserve-3d" }}>
          {/* Центральная ось */}
          <motion.div 
            className="absolute w-[2px] bg-primary/50 rounded-full" 
            style={{ height: "450px", transform: "translateZ(-225px) rotateX(90deg)", transformOrigin: "top center" }} 
          />
          {/* Направляющие крепежных винтов */}
          <motion.div className="absolute w-[1px] bg-primary/30" style={{ height: "350px", transform: "translate3d(-50px, 0, -150px) rotateX(90deg)", transformOrigin: "top center" }} />
          <motion.div className="absolute w-[1px] bg-primary/30" style={{ height: "350px", transform: "translate3d(50px, 0, -150px) rotateX(90deg)", transformOrigin: "top center" }} />
        </motion.div>

        {/* СЛОИ С ИДЕАЛЬНЫМ РАЗДЕЛЕНИЕМ */}
        <motion.div className="absolute inset-0 flex justify-center items-center pointer-events-none" style={{ z: layer1Z, transformStyle: "preserve-3d" }}>
          <Layer1BackBox />
        </motion.div>

        <motion.div className="absolute inset-0 flex justify-center items-center pointer-events-none z-10" style={{ z: layer2Z, transformStyle: "preserve-3d" }}>
          <Layer2Cables />
        </motion.div>

        <motion.div className="absolute inset-0 flex justify-center items-center z-20 pointer-events-none" style={{ z: layer3Z, transformStyle: "preserve-3d" }}>
          <Layer3MechanismBase />
        </motion.div>

        <motion.div className="absolute inset-0 flex justify-center items-center z-30 pointer-events-none" style={{ z: layer4Z, transformStyle: "preserve-3d" }}>
          <Layer4SupportPlate />
        </motion.div>

        <motion.div className="absolute inset-0 flex justify-center items-center z-40 pointer-events-none" style={{ z: layer5Z, transformStyle: "preserve-3d" }}>
          <Layer5FrontCover />
        </motion.div>

      </motion.div>
    </div>
  );
};

export default ExplodedSocket;
