import { motion } from "framer-motion";

interface BlueprintProps {
  activeZone: string | null;
  onHover: (zone: string | null) => void;
}

export type ZoneId = "hallway" | "kitchen" | "living" | "bathroom" | "bedroom";

export const zonesData = {
  hallway: {
    id: "hallway",
    title: "Коридор и щиток",
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
      
      {/* HUD Elements */}
      <div className="absolute top-4 left-4 flex gap-1 items-center font-mono text-[10px] text-primary/70">
        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" /> [SYS_OK]
      </div>
      <div className="absolute top-4 right-4 font-mono text-[10px] text-muted-foreground">GRID_RES: 40px</div>
      <div className="absolute bottom-4 left-4 font-mono text-[10px] text-muted-foreground">AXIS: 800x600</div>

      <svg
        viewBox="0 0 800 600"
        className="w-full h-full relative z-10 drop-shadow-xl"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Draw outer walls with drawing animation */}
        <motion.path 
          d="M 20 20 L 780 20 L 780 580 L 20 580 Z" 
          fill="none" stroke="hsl(var(--muted))" strokeWidth="6" strokeLinecap="square"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
        {/* Inner walls */}
        <motion.path d="M 300 20 L 300 580" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.5 }} />
        <motion.path d="M 500 20 L 500 580" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.7 }} />
        <motion.path d="M 20 300 L 300 300" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.9 }} />
        <motion.path d="M 500 350 L 780 350" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 1.1 }} />

        {/* Doors (gaps in walls) */}
        <motion.rect x="290" y="220" width="20" height="50" fill="#0f1115" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 1.5 }} />
        <motion.rect x="290" y="400" width="20" height="50" fill="#0f1115" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 1.5 }} />
        <motion.rect x="490" y="220" width="20" height="80" fill="#0f1115" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 1.5 }} />
        <motion.rect x="490" y="450" width="20" height="60" fill="#0f1115" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 1.5 }} />
        <motion.rect x="380" y="570" width="40" height="20" fill="#0f1115" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 1.5 }} />

        {/* Electrical Panel in Hallway */}
        <motion.rect x="400" y="30" width="30" height="15" fill="hsl(var(--primary))" initial={{ scale: 0 }} whileInView={{ scale: 1 }} transition={{ delay: 1.8, type: "spring" }} />

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
                fontSize="32"
                className="font-display font-bold select-none pointer-events-none drop-shadow-md"
                initial={{ fill: "rgba(255,255,255,0.7)" }}
                animate={{ 
                  fill: isActive ? "rgba(234, 179, 8, 1)" : "rgba(255,255,255,0.7)",
                  scale: isActive ? 1.1 : 1
                }}
              >
                {room.label}
              </motion.text>

              {/* Wire path per room originating from main panel (415, 45) */}
              {isActive && room.id !== 'hallway' && (
                <motion.path
                  d={
                    room.id === 'bedroom' ? "M 415 45 L 415 80 L 160 80 L 160 140" :
                    room.id === 'living' ? "M 415 45 L 415 80 L 640 80 L 640 160" :
                    room.id === 'bathroom' ? "M 415 45 L 415 80 L 270 80 L 270 420 L 160 420" :
                    "M 415 45 L 415 80 L 470 80 L 470 440 L 640 440" // kitchen
                  }
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  strokeDasharray="6 8"
                  initial={{ strokeDashoffset: 0, opacity: 0 }}
                  animate={{ strokeDashoffset: -28, opacity: 1 }}
                  transition={{
                    strokeDashoffset: { repeat: Infinity, ease: "linear", duration: 0.8 },
                    opacity: { duration: 0.3 }
                  }}
                  className="drop-shadow-[0_0_8px_hsl(var(--primary))]"
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default SmartBlueprintSVG;
