import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const ExplodedSocket = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "center center"]
  });

  // Rotate the entire assembly to give a strong 3D isometric perspective
  const rotateX = 35;
  const rotateY = -35;

  // Layer 1: Back Box (Подрозетник) - Moves deep backwards
  const layer1Z = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const layer1Opacity = useTransform(scrollYProgress, [0, 1], [1, 0.8]);

  // Layer 2: Mechanism (Суппорт) - Stays relatively central
  const layer2Z = useTransform(scrollYProgress, [0, 1], [0, -20]);

  // Layer 3: Front Frame (Лицевая панель) - Moves forward significantly
  const layer3Z = useTransform(scrollYProgress, [0, 1], [0, 100]);
  
  // Connection lines to show how parts align
  const lineOpacity = useTransform(scrollYProgress, [0.4, 1], [0, 0.6]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full aspect-square max-w-[450px] mx-auto flex items-center justify-center hud-corner"
      style={{ perspective: "1200px" }}
    >
      <div className="absolute inset-0 bg-primary/5 rounded-full blur-[80px]" />

      <motion.div 
        className="relative w-[70%] h-[70%] transform-gpu"
        style={{ transformStyle: "preserve-3d", rotateX, rotateY }}
      >
        {/* Dynamic Connecting Lines (Between centers of layers) */}
        <motion.div className="absolute inset-0 pointer-events-none flex justify-center items-center z-10" style={{ opacity: lineOpacity, transformStyle: "preserve-3d" }}>
          {/* Main central axis line */}
          <motion.div 
            className="absolute w-0.5 bg-primary/40 rounded-full"
            style={{ 
              height: "220px",
              transform: "translateZ(-110px) rotateX(90deg)", 
              transformOrigin: "top center"
            }}
          />
        </motion.div>

        {/* LAYER 1: Back Box (Подрозетник) */}
        <motion.div
          className="absolute inset-0 flex justify-center items-center pointer-events-none"
          style={{ z: layer1Z, opacity: layer1Opacity, transformStyle: "preserve-3d" }}
        >
          {/* Main blue cup */}
          <div className="w-[65%] h-[65%] bg-gradient-to-br from-blue-700 to-blue-950 rounded-full shadow-[inset_-10px_-10px_20px_rgba(0,0,0,0.6),0_10px_20px_rgba(0,0,0,0.5)] border-2 border-blue-500/30 flex items-center justify-center relative">
            {/* Cup depth inner shadow */}
            <div className="absolute inset-3 rounded-full bg-black/40 shadow-[inset_4px_4px_10px_rgba(0,0,0,0.8)]" />
            
            {/* Wires coming from the wall */}
            <div className="absolute top-[20%] left-[30%] w-[15%] h-[40%] transform-gpu" style={{ transform: "translateZ(10px) rotateX(-20deg)" }}>
              {/* Phase */}
              <div className="w-full h-full bg-amber-700 rounded-full border border-black shadow-lg relative">
                <div className="absolute top-0 w-full h-[20%] bg-[#e5aa70] rounded-t-full shadow-[inset_0_-2px_4px_rgba(0,0,0,0.5)]" /> {/* Bare copper */}
              </div>
            </div>
            <div className="absolute bottom-[20%] right-[30%] w-[15%] h-[40%] transform-gpu" style={{ transform: "translateZ(10px) rotateX(-10deg)" }}>
              {/* Neutral */}
              <div className="w-full h-full bg-blue-500 rounded-full border border-black shadow-lg relative">
                <div className="absolute top-0 w-full h-[20%] bg-[#e5aa70] rounded-t-full shadow-[inset_0_-2px_4px_rgba(0,0,0,0.5)]" /> {/* Bare copper */}
              </div>
            </div>
            <div className="absolute bottom-[20%] left-[30%] w-[15%] h-[40%] transform-gpu" style={{ transform: "translateZ(10px) rotateX(-15deg)" }}>
              {/* Ground */}
              <div className="w-full h-full bg-[repeating-linear-gradient(45deg,#facc15,#facc15_4px,#22c55e_4px,#22c55e_8px)] rounded-full border border-black shadow-lg relative">
                <div className="absolute top-0 w-full h-[20%] bg-[#e5aa70] rounded-t-full shadow-[inset_0_-2px_4px_rgba(0,0,0,0.5)]" /> {/* Bare copper */}
              </div>
            </div>
          </div>
        </motion.div>

        {/* LAYER 2: Metal Mechanism (Суппорт) */}
        <motion.div
          className="absolute inset-0 flex justify-center items-center z-20 pointer-events-none"
          style={{ z: layer2Z, transformStyle: "preserve-3d" }}
        >
          <div className="w-[85%] h-[85%] relative flex justify-center items-center">
             {/* Metal Plate */}
             <div className="absolute inset-0 bg-gradient-to-br from-zinc-300 via-zinc-400 to-zinc-600 rounded-md shadow-[0_5px_15px_rgba(0,0,0,0.4),inset_1px_1px_1px_rgba(255,255,255,0.8)] border border-zinc-500 clip-metal-plate">
                {/* Mounting holes */}
                <div className="absolute top-2 left-2 w-3 h-8 border border-zinc-500 rounded-full bg-zinc-800 shadow-inner" />
                <div className="absolute top-2 right-2 w-3 h-8 border border-zinc-500 rounded-full bg-zinc-800 shadow-inner" />
                <div className="absolute bottom-2 left-2 w-3 h-8 border border-zinc-500 rounded-full bg-zinc-800 shadow-inner" />
                <div className="absolute bottom-2 right-2 w-3 h-8 border border-zinc-500 rounded-full bg-zinc-800 shadow-inner" />
             </div>

             {/* Central Plastic Housing */}
             <div className="w-[55%] h-[55%] bg-gradient-to-b from-zinc-800 to-black rounded-full border-4 border-zinc-700 shadow-2xl relative flex items-center justify-center transform-gpu" style={{ transform: "translateZ(15px)" }}>
                {/* Contact holes */}
                <div className="flex gap-4">
                  <div className="w-3.5 h-3.5 rounded-full bg-black shadow-[inset_2px_2px_4px_rgba(0,0,0,1)] flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-amber-600/50" /> {/* Copper inside */}
                  </div>
                  <div className="w-3.5 h-3.5 rounded-full bg-black shadow-[inset_2px_2px_4px_rgba(0,0,0,1)] flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-amber-600/50" /> {/* Copper inside */}
                  </div>
                </div>

                {/* Grounding pins (Schuko) */}
                <div className="absolute top-0 w-2 h-4 bg-gradient-to-b from-yellow-500 to-yellow-700 rounded-b-sm shadow-md border-b border-yellow-200" />
                <div className="absolute bottom-0 w-2 h-4 bg-gradient-to-t from-yellow-500 to-yellow-700 rounded-t-sm shadow-md border-t border-yellow-200" />
             </div>
          </div>
        </motion.div>

        {/* LAYER 3: Glass/Plastic Front Frame */}
        <motion.div
          className="absolute inset-0 flex justify-center items-center z-30 pointer-events-none"
          style={{ z: layer3Z, transformStyle: "preserve-3d" }}
        >
          <div className="w-[100%] h-[100%] bg-white/10 dark:bg-black/10 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.3),inset_2px_2px_5px_rgba(255,255,255,0.3)] flex items-center justify-center relative before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/20 before:to-transparent">
            {/* Center cutout (hole for the mechanism) */}
            <div className="w-[60%] h-[60%] rounded-full border border-white/30 dark:border-white/10 shadow-[inset_0_5px_10px_rgba(0,0,0,0.2)] bg-transparent backdrop-blur-none mix-blend-destination" />
            
            {/* Brand Logo / Text subtle */}
            <div className="absolute bottom-4 text-[8px] font-mono text-foreground/30 font-bold tracking-widest">
              ELECTRIC_PMR
            </div>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
};

export default ExplodedSocket;
