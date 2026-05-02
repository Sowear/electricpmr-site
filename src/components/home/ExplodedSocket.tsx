import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const ExplodedSocket = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "center center"]
  });

  // Rotate the entire assembly to give a strong 3D isometric perspective
  const rotateX = 25;
  const rotateY = -35;

  // Layer 1: Back Box (Подрозетник) - Moves deep backwards
  const layer1Z = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const layer1Opacity = useTransform(scrollYProgress, [0, 1], [1, 0.8]);

  // Layer 2: Mechanism (Суппорт) - Stays relatively central
  const layer2Z = useTransform(scrollYProgress, [0, 1], [0, 0]);

  // Layer 3: Front Frame (Лицевая панель) - Moves forward significantly
  const layer3Z = useTransform(scrollYProgress, [0, 1], [0, 80]);
  
  // Connection lines to show how parts align
  const lineOpacity = useTransform(scrollYProgress, [0.3, 1], [0, 0.5]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full aspect-square max-w-[500px] mx-auto flex items-center justify-center hud-corner overflow-visible"
      style={{ perspective: "1500px" }}
    >
      <div className="absolute inset-0 bg-primary/5 rounded-full blur-[100px]" />

      <motion.div 
        className="relative w-[50%] h-[50%] transform-gpu"
        style={{ transformStyle: "preserve-3d", rotateX, rotateY }}
      >
        {/* Dynamic Connecting Lines (Between corners) */}
        <motion.div className="absolute inset-0 pointer-events-none flex justify-center items-center z-10" style={{ opacity: lineOpacity, transformStyle: "preserve-3d" }}>
          {/* 4 corner screws connecting mechanism to back box */}
          <motion.div className="absolute w-[2px] bg-primary/50" style={{ height: "160px", transform: "translate3d(-50px, -50px, -80px) rotateX(90deg)", transformOrigin: "top center" }} />
          <motion.div className="absolute w-[2px] bg-primary/50" style={{ height: "160px", transform: "translate3d(50px, -50px, -80px) rotateX(90deg)", transformOrigin: "top center" }} />
          <motion.div className="absolute w-[2px] bg-primary/50" style={{ height: "160px", transform: "translate3d(-50px, 50px, -80px) rotateX(90deg)", transformOrigin: "top center" }} />
          <motion.div className="absolute w-[2px] bg-primary/50" style={{ height: "160px", transform: "translate3d(50px, 50px, -80px) rotateX(90deg)", transformOrigin: "top center" }} />
        </motion.div>

        {/* LAYER 1: Back Box (Подрозетник) */}
        <motion.div
          className="absolute inset-0 flex justify-center items-center pointer-events-none"
          style={{ z: layer1Z, opacity: layer1Opacity, transformStyle: "preserve-3d" }}
        >
          {/* Main blue cup */}
          <div className="w-[100%] h-[100%] bg-gradient-to-br from-blue-700 to-blue-950 rounded-full shadow-[inset_-10px_-10px_30px_rgba(0,0,0,0.8),0_20px_40px_rgba(0,0,0,0.6)] border-2 border-blue-500/30 flex items-center justify-center relative">
            {/* Cup depth inner shadow */}
            <div className="absolute inset-4 rounded-full bg-slate-900 shadow-[inset_10px_10px_20px_rgba(0,0,0,0.9)]" />
            
            {/* Wires coming from the wall */}
            <div className="absolute flex gap-3" style={{ transform: "translateZ(10px)" }}>
              {/* L (Brown) */}
              <div className="w-3 h-28 bg-gradient-to-r from-amber-900 to-amber-700 rounded-full border border-black shadow-lg relative -rotate-12 translate-y-4">
                <div className="absolute top-0 w-full h-4 bg-gradient-to-r from-orange-300 to-orange-500 rounded-t-full shadow-[inset_0_-2px_4px_rgba(0,0,0,0.5)]" />
              </div>
              {/* PE (Green-Yellow) */}
              <div className="w-3 h-32 bg-[repeating-linear-gradient(45deg,#facc15,#facc15_4px,#22c55e_4px,#22c55e_8px)] rounded-full border border-black shadow-lg relative -rotate-6">
                <div className="absolute top-0 w-full h-4 bg-gradient-to-r from-orange-300 to-orange-500 rounded-t-full shadow-[inset_0_-2px_4px_rgba(0,0,0,0.5)]" />
              </div>
              {/* N (Blue) */}
              <div className="w-3 h-28 bg-gradient-to-r from-blue-600 to-blue-800 rounded-full border border-black shadow-lg relative rotate-12 translate-y-4">
                <div className="absolute top-0 w-full h-4 bg-gradient-to-r from-orange-300 to-orange-500 rounded-t-full shadow-[inset_0_-2px_4px_rgba(0,0,0,0.5)]" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* LAYER 2: Metal Mechanism (Суппорт) */}
        <motion.div
          className="absolute inset-0 flex justify-center items-center z-20 pointer-events-none"
          style={{ z: layer2Z, transformStyle: "preserve-3d" }}
        >
          <div className="w-[120%] h-[120%] relative flex justify-center items-center">
             {/* Galvanized Metal Plate */}
             <div 
               className="absolute inset-0 bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 border border-gray-600 shadow-[0_10px_20px_rgba(0,0,0,0.5),inset_1px_1px_0_rgba(255,255,255,0.8)] overflow-hidden" 
               style={{ clipPath: "polygon(15% 0%, 85% 0%, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0% 85%, 0% 15%)" }}
             >
                {/* Mounting holes */}
                <div className="absolute top-3 left-3 w-3 h-8 bg-zinc-800 rounded-full border border-zinc-500 shadow-inner" />
                <div className="absolute top-3 right-3 w-3 h-8 bg-zinc-800 rounded-full border border-zinc-500 shadow-inner" />
                <div className="absolute bottom-3 left-3 w-3 h-8 bg-zinc-800 rounded-full border border-zinc-500 shadow-inner" />
                <div className="absolute bottom-3 right-3 w-3 h-8 bg-zinc-800 rounded-full border border-zinc-500 shadow-inner" />
             </div>

             {/* Central Plastic Housing */}
             <div className="w-[60%] h-[60%] bg-zinc-900 rounded-full shadow-2xl border-[6px] border-zinc-700 flex items-center justify-center relative transform-gpu" style={{ transform: "translateZ(15px)" }}>
                {/* Contact holes */}
                <div className="flex gap-6">
                  <div className="w-5 h-5 rounded-full bg-black shadow-[inset_2px_2px_4px_rgba(0,0,0,1)] border border-zinc-800 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 bg-gradient-to-r from-amber-600 to-amber-800 rounded-full" />
                  </div>
                  <div className="w-5 h-5 rounded-full bg-black shadow-[inset_2px_2px_4px_rgba(0,0,0,1)] border border-zinc-800 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 bg-gradient-to-r from-amber-600 to-amber-800 rounded-full" />
                  </div>
                </div>

                {/* Grounding pins (Schuko) */}
                <div className="absolute top-0 w-3 h-6 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-b-md shadow-md border border-yellow-300" />
                <div className="absolute bottom-0 w-3 h-6 bg-gradient-to-t from-yellow-400 to-yellow-600 rounded-t-md shadow-md border border-yellow-300" />
             </div>
          </div>
        </motion.div>

        {/* LAYER 3: Glass/Plastic Front Frame */}
        <motion.div
          className="absolute inset-0 flex justify-center items-center z-30 pointer-events-none"
          style={{ z: layer3Z, transformStyle: "preserve-3d" }}
        >
          {/* Glass frame */}
          <div className="w-[150%] h-[150%] bg-white/20 dark:bg-black/20 backdrop-blur-2xl rounded-3xl border border-white/50 dark:border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.4),inset_2px_2px_10px_rgba(255,255,255,0.4)] flex items-center justify-center relative overflow-hidden">
            
            {/* Glossy diagonal highlight */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -rotate-45 translate-x-[20%] translate-y-[-20%] w-[200%] h-[200%]" />

            {/* Central cutout */}
            <div className="w-[45%] h-[45%] rounded-full border border-white/30 dark:border-zinc-700 shadow-[inset_0_10px_20px_rgba(0,0,0,0.3)] bg-transparent backdrop-blur-none mix-blend-destination" />
            
            <div className="absolute bottom-5 text-[10px] font-bold tracking-widest text-foreground/40 font-mono">ELECTRIC_PMR</div>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
};

export default ExplodedSocket;
