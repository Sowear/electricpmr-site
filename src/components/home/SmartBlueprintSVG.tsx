import { motion } from "framer-motion";

interface BlueprintProps {
  activeZone: string | null;
  onHover: (zone: string | null) => void;
}

export type ZoneId = "hallway" | "kitchen" | "living" | "bathroom" | "bedroom";

export const zonesData = {
  hallway: {
    id: "hallway",
    title: "Коридор и Щиток",
    description: "Сердце электрики вашего дома. Мы проектируем и собираем современные электрощиты с многоуровневой защитой от перепадов напряжения и коротких замыканий.",
    features: ["Сборка электрощитов", "Установка УЗО и реле напряжения", "Роутерные зоны"]
  },
  kitchen: {
    id: "kitchen",
    title: "Кухня",
    description: "Зона самой высокой нагрузки. Прокладываем выделенные линии для мощной бытовой техники, чтобы духовка, чайник и посудомойка работали одновременно без выбивания автоматов.",
    features: ["Выделенные линии (от 4 мм²)", "Розетки для рабочей зоны", "Подсветка кухонного гарнитура"]
  },
  living: {
    id: "living",
    title: "Гостиная",
    description: "Пространство для отдыха и технологий. Реализуем системы «Умный дом», проходные выключатели и скрытую разводку для домашних кинотеатров.",
    features: ["Умный дом", "Скрытая мультимедиа", "Многоуровневое освещение"]
  },
  bathroom: {
    id: "bathroom",
    title: "Ванная комната",
    description: "Влажная зона, требующая особого внимания к безопасности. Монтируем влагозащищенные розетки (IP44+), системы защиты от протечек и теплые полы.",
    features: ["Электрические теплые полы", "Защита от протечек", "Влагозащищенная фурнитура"]
  },
  bedroom: {
    id: "bedroom",
    title: "Спальня",
    description: "Уют и удобство превыше всего. Устанавливаем проходные выключатели у кровати, контурное освещение и розетки с USB для зарядки гаджетов.",
    features: ["Проходные выключатели", "USB-розетки", "Слаботочные сети"]
  }
};

const SmartBlueprintSVG = ({ activeZone, onHover }: BlueprintProps) => {
  // SVG Coordinates for rooms
  // ViewBox: 0 0 800 600
  const rooms = [
    { id: "bedroom", d: "M 20 20 L 300 20 L 300 300 L 20 300 Z", labelX: 160, labelY: 160, label: "Спальня" },
    { id: "bathroom", d: "M 20 300 L 300 300 L 300 580 L 20 580 Z", labelX: 160, labelY: 440, label: "Ванная" },
    { id: "hallway", d: "M 300 20 L 500 20 L 500 580 L 300 580 Z", labelX: 400, labelY: 300, label: "Коридор" },
    { id: "living", d: "M 500 20 L 780 20 L 780 350 L 500 350 Z", labelX: 640, labelY: 185, label: "Гостиная" },
    { id: "kitchen", d: "M 500 350 L 780 350 L 780 580 L 500 580 Z", labelX: 640, labelY: 465, label: "Кухня" },
  ];

  return (
    <div className="relative w-full aspect-[4/3] max-h-[600px] border border-white/10 bg-[#0f1115] rounded-xl overflow-hidden shadow-2xl">
      {/* Blueprint Grid Background */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      <svg
        viewBox="0 0 800 600"
        className="w-full h-full relative z-10 drop-shadow-xl"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Draw outer walls */}
        <path d="M 20 20 L 780 20 L 780 580 L 20 580 Z" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" strokeLinecap="square" />
        {/* Inner walls */}
        <path d="M 300 20 L 300 580" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
        <path d="M 500 20 L 500 580" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
        <path d="M 20 300 L 300 300" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
        <path d="M 500 350 L 780 350" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />

        {/* Doors (gaps in walls) - simplistic representation by overlaying dark rects */}
        <rect x="290" y="220" width="20" height="50" fill="#0f1115" /> {/* Bedroom door */}
        <rect x="290" y="400" width="20" height="50" fill="#0f1115" /> {/* Bathroom door */}
        <rect x="490" y="220" width="20" height="80" fill="#0f1115" /> {/* Living door */}
        <rect x="490" y="450" width="20" height="60" fill="#0f1115" /> {/* Kitchen door */}
        <rect x="380" y="570" width="40" height="20" fill="#0f1115" /> {/* Main entry */}

        {/* Interactive Zones */}
        {rooms.map((room) => {
          const isActive = activeZone === room.id;
          return (
            <g 
              key={room.id}
              onMouseEnter={() => onHover(room.id)}
              onMouseLeave={() => onHover(null)}
              className="cursor-pointer"
            >
              <motion.path
                d={room.d}
                initial={{ fill: "rgba(234, 179, 8, 0)" }}
                animate={{ 
                  fill: isActive ? "rgba(234, 179, 8, 0.15)" : "rgba(255, 255, 255, 0.02)",
                  stroke: isActive ? "rgba(234, 179, 8, 1)" : "rgba(255, 255, 255, 0)",
                  strokeWidth: isActive ? 2 : 0
                }}
                transition={{ duration: 0.3 }}
              />
              
              <motion.text
                x={room.labelX}
                y={room.labelY}
                textAnchor="middle"
                alignmentBaseline="middle"
                className="font-display text-sm font-medium select-none pointer-events-none"
                initial={{ fill: "rgba(255,255,255,0.4)" }}
                animate={{ 
                  fill: isActive ? "rgba(234, 179, 8, 1)" : "rgba(255,255,255,0.4)",
                  scale: isActive ? 1.1 : 1
                }}
              >
                {room.label}
              </motion.text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default SmartBlueprintSVG;
