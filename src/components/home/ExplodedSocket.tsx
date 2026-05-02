import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const ExplodedSocket = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "center center"]
  });

  // Изометрический поворот всей сцены
  const rotateX = 25;
  const rotateY = -40;

  // Расположение слоев по оси Z при полном "взрыве" (распад на 400px)
  const layer1Z = useTransform(scrollYProgress, [0, 1], [0, -200]); // Подрозетник
  const layer2Z = useTransform(scrollYProgress, [0, 1], [0, -100]); // Провода
  const layer3Z = useTransform(scrollYProgress, [0, 1], [0, 0]);    // Керамическая колодка
  const layer4Z = useTransform(scrollYProgress, [0, 1], [0, 100]);  // Металлический суппорт
  const layer5Z = useTransform(scrollYProgress, [0, 1], [0, 200]);  // Лицевая панель

  const lineOpacity = useTransform(scrollYProgress, [0.2, 1], [0, 0.6]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full aspect-square max-w-[600px] mx-auto flex items-center justify-center overflow-visible"
      style={{ perspective: "2000px" }}
    >
      {/* Мягкое свечение на фоне */}
      <div className="absolute inset-0 bg-primary/10 rounded-full blur-[120px]" />

      <motion.div 
        className="relative w-[45%] h-[45%] transform-gpu"
        style={{ transformStyle: "preserve-3d", rotateX, rotateY }}
      >
        {/* === ЛИНИИ СБОРКИ (Центральная ось и угловые винты) === */}
        <motion.div className="absolute inset-0 pointer-events-none flex justify-center items-center z-10" style={{ opacity: lineOpacity, transformStyle: "preserve-3d" }}>
          {/* Центральная направляющая */}
          <motion.div className="absolute w-[1px] bg-primary/40" style={{ height: "400px", transform: "translateZ(-200px) rotateX(90deg)", transformOrigin: "top center" }} />
          
          {/* Направляющие крепежных винтов суппорта */}
          <motion.div className="absolute w-[1px] bg-primary/30" style={{ height: "300px", transform: "translate3d(-50px, 0, -100px) rotateX(90deg)", transformOrigin: "top center" }} />
          <motion.div className="absolute w-[1px] bg-primary/30" style={{ height: "300px", transform: "translate3d(50px, 0, -100px) rotateX(90deg)", transformOrigin: "top center" }} />
        </motion.div>

        {/* === СЛОЙ 1: ПОДРОЗЕТНИК (Монтажная коробка) === */}
        <motion.div
          className="absolute inset-0 flex justify-center items-center pointer-events-none"
          style={{ z: layer1Z, transformStyle: "preserve-3d" }}
        >
          {/* Внешний контур (ребристый) */}
          <div className="w-[110%] h-[110%] rounded-full bg-blue-800 border-[6px] border-blue-900 shadow-[inset_-15px_-15px_30px_rgba(0,0,0,0.8),0_30px_50px_rgba(0,0,0,0.7)] flex items-center justify-center relative">
            {/* Глубина коробки */}
            <div className="absolute inset-2 rounded-full bg-slate-900 shadow-[inset_15px_15px_30px_rgba(0,0,0,0.9)] flex items-center justify-center">
              {/* Крепежные саморезы внутри */}
              <div className="absolute left-1 w-3 h-3 rounded-full bg-zinc-400 shadow-sm border border-zinc-600 flex items-center justify-center">
                <div className="w-1.5 h-[1px] bg-zinc-700" />
              </div>
              <div className="absolute right-1 w-3 h-3 rounded-full bg-zinc-400 shadow-sm border border-zinc-600 flex items-center justify-center">
                <div className="w-1.5 h-[1px] bg-zinc-700" />
              </div>
              
              {/* Отверстие для ввода кабеля (выломанная заглушка) */}
              <div className="absolute bottom-4 w-12 h-6 bg-black rounded-full shadow-[inset_2px_2px_5px_rgba(0,0,0,1)]" />
            </div>
          </div>
        </motion.div>

        {/* === СЛОЙ 2: ПРОВОДКА (Вводной кабель) === */}
        <motion.div
          className="absolute inset-0 flex justify-center items-center pointer-events-none"
          style={{ z: layer2Z, transformStyle: "preserve-3d" }}
        >
          {/* Основной черный кабель (ВВГнг) */}
          <div className="absolute bottom-[-60px] w-8 h-20 bg-gradient-to-r from-zinc-800 to-black rounded-t-xl border-x border-zinc-700" />
          
          {/* Разделенные жилы */}
          <div className="absolute flex gap-4" style={{ transform: "translateY(20px)" }}>
            {/* Фаза (Коричневый) */}
            <div className="w-3.5 h-32 bg-gradient-to-r from-amber-900 to-amber-700 rounded-full border border-black shadow-2xl relative -rotate-12 origin-bottom">
              {/* Оголенная медь */}
              <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 w-2 h-5 bg-gradient-to-r from-orange-300 via-orange-400 to-orange-600 rounded-t-sm shadow-[inset_0_-2px_4px_rgba(0,0,0,0.5)]" />
            </div>
            {/* Земля (Желто-зеленый) */}
            <div className="w-3.5 h-36 bg-[repeating-linear-gradient(45deg,#facc15,#facc15_5px,#22c55e_5px,#22c55e_10px)] rounded-full border border-black shadow-2xl relative">
              {/* Оголенная медь */}
              <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 w-2 h-5 bg-gradient-to-r from-orange-300 via-orange-400 to-orange-600 rounded-t-sm shadow-[inset_0_-2px_4px_rgba(0,0,0,0.5)]" />
            </div>
            {/* Ноль (Синий) */}
            <div className="w-3.5 h-32 bg-gradient-to-r from-blue-700 to-blue-900 rounded-full border border-black shadow-2xl relative rotate-12 origin-bottom">
              {/* Оголенная медь */}
              <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 w-2 h-5 bg-gradient-to-r from-orange-300 via-orange-400 to-orange-600 rounded-t-sm shadow-[inset_0_-2px_4px_rgba(0,0,0,0.5)]" />
            </div>
          </div>
        </motion.div>

        {/* === СЛОЙ 3: ОСНОВАНИЕ МЕХАНИЗМА (Керамика/Пластик) === */}
        <motion.div
          className="absolute inset-0 flex justify-center items-center z-20 pointer-events-none"
          style={{ z: layer3Z, transformStyle: "preserve-3d" }}
        >
          {/* Задняя часть механизма (серая/белая колодка) */}
          <div className="w-[75%] h-[75%] bg-gradient-to-br from-zinc-200 to-zinc-400 rounded-lg shadow-[0_20px_40px_rgba(0,0,0,0.5),inset_-2px_-2px_10px_rgba(0,0,0,0.2)] border border-zinc-400 flex flex-col justify-between p-4 relative">
            
            {/* Клеммы (Шляпки винтов для проводов) */}
            <div className="absolute left-[-5px] top-[20%] w-3 h-5 bg-gradient-to-r from-zinc-400 to-zinc-600 rounded-sm border border-zinc-500 flex items-center justify-center shadow-md">
              <div className="w-2 h-2 rounded-full bg-zinc-300 border border-zinc-500 shadow-inner" />
            </div>
            <div className="absolute right-[-5px] top-[20%] w-3 h-5 bg-gradient-to-r from-zinc-400 to-zinc-600 rounded-sm border border-zinc-500 flex items-center justify-center shadow-md">
              <div className="w-2 h-2 rounded-full bg-zinc-300 border border-zinc-500 shadow-inner" />
            </div>
            <div className="absolute top-[-5px] left-1/2 -translate-x-1/2 w-5 h-3 bg-gradient-to-b from-zinc-400 to-zinc-600 rounded-sm border border-zinc-500 flex items-center justify-center shadow-md">
              <div className="w-2 h-2 rounded-full bg-zinc-300 border border-zinc-500 shadow-inner" />
            </div>

            {/* Рельеф корпуса механизма */}
            <div className="w-full h-full border-2 border-zinc-400/50 rounded-sm shadow-inner flex items-center justify-center">
              <div className="text-[10px] font-mono text-zinc-500 font-bold opacity-50">16A 250V~</div>
            </div>
          </div>
        </motion.div>

        {/* === СЛОЙ 4: МЕТАЛЛИЧЕСКИЙ СУППОРТ === */}
        <motion.div
          className="absolute inset-0 flex justify-center items-center z-30 pointer-events-none"
          style={{ z: layer4Z, transformStyle: "preserve-3d" }}
        >
          <div className="w-[125%] h-[125%] relative flex justify-center items-center">
             {/* Оцинкованная пластина (Суппорт) */}
             <div 
               className="absolute inset-0 bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 border border-gray-600 shadow-[0_15px_30px_rgba(0,0,0,0.6),inset_1px_1px_2px_rgba(255,255,255,0.9)] overflow-hidden" 
               style={{ clipPath: "polygon(15% 0%, 85% 0%, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0% 85%, 0% 15%)" }}
             >
                {/* Отверстия для монтажа */}
                <div className="absolute top-3 left-[45%] w-10 h-3 bg-zinc-800 rounded-full shadow-inner" />
                <div className="absolute bottom-3 left-[45%] w-10 h-3 bg-zinc-800 rounded-full shadow-inner" />
                <div className="absolute left-3 top-[45%] w-3 h-10 bg-zinc-800 rounded-full shadow-inner" />
                <div className="absolute right-3 top-[45%] w-3 h-10 bg-zinc-800 rounded-full shadow-inner" />
             </div>

             {/* Распорные лапки (по бокам) */}
             <div className="absolute left-[-15px] top-[40%] w-5 h-10 bg-gradient-to-r from-zinc-500 to-zinc-400 rounded-l-md shadow-lg border border-zinc-600" style={{ clipPath: "polygon(0 20%, 100% 0, 100% 100%, 0 80%)" }} />
             <div className="absolute right-[-15px] top-[40%] w-5 h-10 bg-gradient-to-l from-zinc-500 to-zinc-400 rounded-r-md shadow-lg border border-zinc-600" style={{ clipPath: "polygon(0 0, 100% 20%, 100% 80%, 0 100%)" }} />

             {/* Центральный пластиковый стакан механизма */}
             <div className="w-[60%] h-[60%] bg-zinc-900 rounded-full shadow-[0_10px_20px_rgba(0,0,0,0.8)] border-[4px] border-zinc-800 flex items-center justify-center relative transform-gpu" style={{ transform: "translateZ(20px)" }}>
                {/* Отверстия для вилки */}
                <div className="flex gap-6">
                  <div className="w-6 h-6 rounded-full bg-black shadow-[inset_3px_3px_6px_rgba(0,0,0,1)] border border-zinc-700 flex items-center justify-center">
                    <div className="w-3 h-3 bg-gradient-to-r from-amber-600 to-amber-800 rounded-full" />
                  </div>
                  <div className="w-6 h-6 rounded-full bg-black shadow-[inset_3px_3px_6px_rgba(0,0,0,1)] border border-zinc-700 flex items-center justify-center">
                    <div className="w-3 h-3 bg-gradient-to-r from-amber-600 to-amber-800 rounded-full" />
                  </div>
                </div>

                {/* Усики заземления (Schuko) */}
                <div className="absolute top-0 w-4 h-6 bg-gradient-to-b from-yellow-300 to-yellow-600 rounded-b-md shadow-lg border border-yellow-200 transform-gpu" style={{ transform: "translateZ(10px) rotateX(10deg)" }} />
                <div className="absolute bottom-0 w-4 h-6 bg-gradient-to-t from-yellow-300 to-yellow-600 rounded-t-md shadow-lg border border-yellow-200 transform-gpu" style={{ transform: "translateZ(10px) rotateX(-10deg)" }} />
             </div>
          </div>
        </motion.div>

        {/* === СЛОЙ 5: ЛИЦЕВАЯ ПАНЕЛЬ (Рамка и накладка) === */}
        <motion.div
          className="absolute inset-0 flex justify-center items-center z-40 pointer-events-none"
          style={{ z: layer5Z, transformStyle: "preserve-3d" }}
        >
          <div className="w-[160%] h-[160%] relative flex justify-center items-center">
            {/* Глянцевая рамка (матовое стекло + блики) */}
            <div className="absolute inset-0 bg-white/10 dark:bg-black/20 backdrop-blur-3xl rounded-[2rem] border-[1px] border-white/50 dark:border-white/20 shadow-[0_40px_80px_rgba(0,0,0,0.5),inset_2px_2px_15px_rgba(255,255,255,0.6)] overflow-hidden">
              {/* Диагональный блик (Glossy reflection) */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent -rotate-45 translate-x-[10%] translate-y-[-10%] w-[200%] h-[200%]" />
            </div>

            {/* Центральная лицевая накладка (Пластик) */}
            <div className="w-[50%] h-[50%] rounded-full bg-white/90 dark:bg-zinc-800 shadow-[0_10px_20px_rgba(0,0,0,0.3),inset_0_-2px_10px_rgba(0,0,0,0.1)] border border-white/40 dark:border-zinc-700 flex flex-col items-center justify-center relative transform-gpu" style={{ transform: "translateZ(15px)" }}>
              {/* Отверстия в лицевой панели с защитными шторками */}
              <div className="flex gap-6 mb-2">
                <div className="w-4 h-4 rounded-full bg-black shadow-inner flex items-center justify-center overflow-hidden">
                  <div className="w-full h-1/2 bg-red-600 translate-y-[-2px]" /> {/* Шторка защиты */}
                </div>
                <div className="w-4 h-4 rounded-full bg-black shadow-inner flex items-center justify-center overflow-hidden">
                  <div className="w-full h-1/2 bg-red-600 translate-y-[-2px]" /> {/* Шторка защиты */}
                </div>
              </div>
              <div className="text-[8px] font-mono font-bold text-zinc-400">PMR PRO</div>
            </div>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
};

export default ExplodedSocket;
