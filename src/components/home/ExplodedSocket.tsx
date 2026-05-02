import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const ExplodedSocket = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "center center"]
  });

  // Layer 1: Back Box (Подрозетник)
  // Moves back and fades slightly
  const layer1Z = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const layer1X = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const layer1Y = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const layer1Opacity = useTransform(scrollYProgress, [0, 1], [1, 0.4]);

  // Layer 2: Mechanism (Механизм)
  // Stays roughly in the center
  const layer2Z = useTransform(scrollYProgress, [0, 1], [0, 0]);
  const layer2X = useTransform(scrollYProgress, [0, 1], [0, 0]);
  const layer2Y = useTransform(scrollYProgress, [0, 1], [0, 0]);

  // Layer 3: Front Frame (Рамка)
  // Moves forward
  const layer3Z = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const layer3X = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const layer3Y = useTransform(scrollYProgress, [0, 1], [0, 50]);

  // Connection lines (appear when separated)
  const lineOpacity = useTransform(scrollYProgress, [0.5, 1], [0, 0.5]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full aspect-square max-w-[400px] mx-auto flex items-center justify-center hud-corner"
      style={{ perspective: "1000px" }}
    >
      <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl" />

      {/* Connection Lines (Simulated with absolute SVG lines) */}
      <motion.svg 
        className="absolute inset-0 w-full h-full pointer-events-none z-10" 
        style={{ opacity: lineOpacity }}
      >
        {/* Top-left screw line */}
        <line x1="30%" y1="35%" x2="70%" y2="65%" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-primary/50" />
        {/* Bottom-right screw line */}
        <line x1="30%" y1="65%" x2="70%" y2="35%" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-primary/50" />
      </motion.svg>

      <motion.div 
        className="relative w-[60%] h-[60%] transform-gpu"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Layer 1: Back Box */}
        <motion.div
          className="absolute inset-0 flex justify-center items-center pointer-events-none"
          style={{ x: layer1X, y: layer1Y, z: layer1Z, opacity: layer1Opacity }}
        >
          <div className="w-[70%] h-[70%] bg-blue-900/20 border border-blue-500/30 rounded-full shadow-inner flex items-center justify-center backdrop-blur-sm">
            {/* Wires */}
            <div className="absolute top-[20%] left-[20%] w-[10%] h-[30%] bg-amber-700 rounded-full rotate-45" />
            <div className="absolute bottom-[20%] right-[20%] w-[10%] h-[30%] bg-blue-500 rounded-full rotate-45" />
            <div className="absolute bottom-[20%] left-[20%] w-[10%] h-[30%] bg-yellow-400 rounded-full -rotate-45 border border-green-500" />
          </div>
        </motion.div>

        {/* Layer 2: Mechanism */}
        <motion.div
          className="absolute inset-0 flex justify-center items-center z-20 pointer-events-none"
          style={{ x: layer2X, y: layer2Y, z: layer2Z }}
        >
          <div className="w-[80%] h-[80%] bg-slate-200 dark:bg-slate-800 rounded-sm shadow-xl border border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center relative">
             {/* Metal frame of the mechanism */}
             <div className="absolute inset-[-10%] border-2 border-slate-400/50 dark:border-slate-500/50 rounded-sm" />
             {/* Screws */}
             <div className="absolute top-[-5%] left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-slate-300 border border-slate-400" />
             <div className="absolute bottom-[-5%] left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-slate-300 border border-slate-400" />
             
             {/* Grounding pins */}
             <div className="absolute top-[10%] w-[8px] h-[20%] bg-gradient-to-b from-yellow-600 to-amber-700 rounded-sm" />
             <div className="absolute bottom-[10%] w-[8px] h-[20%] bg-gradient-to-t from-yellow-600 to-amber-700 rounded-sm" />

             {/* Socket holes */}
             <div className="flex gap-4">
               <div className="w-3 h-3 rounded-full bg-slate-900 shadow-inner" />
               <div className="w-3 h-3 rounded-full bg-slate-900 shadow-inner" />
             </div>
          </div>
        </motion.div>

        {/* Layer 3: Glass/Plastic Frame */}
        <motion.div
          className="absolute inset-0 flex justify-center items-center z-30 pointer-events-none"
          style={{ x: layer3X, y: layer3Y, z: layer3Z }}
        >
          <div className="w-full h-full bg-white/20 dark:bg-black/20 backdrop-blur-md rounded-xl border border-white/50 dark:border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.2)] flex items-center justify-center">
            {/* Center cutout */}
            <div className="w-[70%] h-[70%] rounded-full border border-white/30 dark:border-white/10 shadow-inner" />
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
};

export default ExplodedSocket;
