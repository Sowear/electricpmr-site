import { motion, MotionValue, useTransform } from "framer-motion";

interface CableRevealProps {
  progress: MotionValue<number>;
}

const CableReveal = ({ progress }: CableRevealProps) => {
  // Outer black jacket cuts from top to bottom
  const strip1Y = useTransform(progress, [0.1, 0.7], ["0%", "100%"]);
  // Colored insulation cuts from top to bottom
  const strip2Y = useTransform(progress, [0.3, 0.9], ["0%", "100%"]);

  return (
    <div className="relative w-16 md:w-20 h-full flex justify-center overflow-visible drop-shadow-2xl">
      {/* Background Glow for Copper */}
      <motion.div 
        className="absolute top-0 w-32 h-64 bg-primary/20 blur-[50px] -z-10 rounded-full"
        style={{ top: useTransform(strip2Y, y => y) }}
      />

      {/* Layer 1: Bare Copper Wires (Base) */}
      <div className="absolute inset-0 flex justify-center gap-1.5 md:gap-2 px-2 pt-10">
        {/* Phase Copper */}
        <div className="w-3 md:w-4 h-full bg-gradient-to-r from-[#b87333] via-[#e5aa70] to-[#8a3324] shadow-[inset_2px_0_4px_rgba(255,255,255,0.4),inset_-2px_0_4px_rgba(0,0,0,0.6)] rounded-t-sm" />
        {/* Ground Copper */}
        <div className="w-3 md:w-4 h-full bg-gradient-to-r from-[#b87333] via-[#e5aa70] to-[#8a3324] shadow-[inset_2px_0_4px_rgba(255,255,255,0.4),inset_-2px_0_4px_rgba(0,0,0,0.6)] rounded-t-sm" />
        {/* Neutral Copper */}
        <div className="w-3 md:w-4 h-full bg-gradient-to-r from-[#b87333] via-[#e5aa70] to-[#8a3324] shadow-[inset_2px_0_4px_rgba(255,255,255,0.4),inset_-2px_0_4px_rgba(0,0,0,0.6)] rounded-t-sm" />
      </div>

      {/* Layer 2: Colored Insulation */}
      <motion.div 
        className="absolute inset-0 flex justify-center gap-1.5 md:gap-2 px-2 pt-4"
        style={{ clipPath: useTransform(strip2Y, y => `inset(${y} 0 0 0)`) }}
      >
        {/* Brown (Phase) */}
        <div className="w-3 md:w-4 h-full bg-gradient-to-r from-amber-900 via-amber-700 to-amber-950 shadow-[inset_2px_0_4px_rgba(255,255,255,0.2),inset_-2px_0_6px_rgba(0,0,0,0.8)] rounded-t-md border-t-2 border-amber-500/50" />
        {/* Yellow-Green (Ground) */}
        <div className="w-3 md:w-4 h-full bg-[repeating-linear-gradient(45deg,#facc15,#facc15_8px,#22c55e_8px,#22c55e_16px)] shadow-[inset_2px_0_4px_rgba(255,255,255,0.3),inset_-2px_0_6px_rgba(0,0,0,0.8)] rounded-t-md border-t-2 border-yellow-200/50" />
        {/* Blue (Neutral) */}
        <div className="w-3 md:w-4 h-full bg-gradient-to-r from-blue-700 via-blue-500 to-blue-900 shadow-[inset_2px_0_4px_rgba(255,255,255,0.2),inset_-2px_0_6px_rgba(0,0,0,0.8)] rounded-t-md border-t-2 border-blue-400/50" />
      </motion.div>

      {/* Layer 3: Outer Black PVC Jacket */}
      <motion.div 
        className="absolute inset-0 flex justify-center"
        style={{ clipPath: useTransform(strip1Y, y => `inset(${y} 0 0 0)`) }}
      >
        <div className="w-full h-full bg-gradient-to-r from-[#111] via-[#2a2a2a] to-[#0a0a0a] shadow-[inset_3px_0_8px_rgba(255,255,255,0.15),inset_-4px_0_12px_rgba(0,0,0,0.9)] rounded-t-xl flex justify-center items-center relative overflow-hidden border-t border-white/10">
           
           {/* Surface texture/grain */}
           <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
           }}></div>

           {/* Central highlight */}
           <div className="absolute left-[20%] w-[15%] h-full bg-white/5 blur-[2px]" />
           
           {/* Engineering Text */}
           <div className="absolute top-[30%] -translate-y-1/2 rotate-90 whitespace-nowrap text-white/20 text-[10px] md:text-xs font-mono tracking-[0.2em] font-semibold mix-blend-overlay">
              ВВГнг(А)-LS 3x2.5 ГОСТ 31996-2012
           </div>
           <div className="absolute top-[70%] -translate-y-1/2 rotate-90 whitespace-nowrap text-white/20 text-[10px] md:text-xs font-mono tracking-[0.2em] font-semibold mix-blend-overlay">
              ELECTRIC MASTER PRO
           </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CableReveal;
