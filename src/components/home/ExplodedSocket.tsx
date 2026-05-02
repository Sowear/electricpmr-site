import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const ExplodedSocket = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "center center"]
  });

  // Base isometric rotation
  const rotateX = 45;
  const rotateY = -35;
  const rotateZ = -15;

  // Spread animations (Explosion distance)
  const backBoxZ = useTransform(scrollYProgress, [0, 1], [0, -180]);
  const wiresZ = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const mechZ = useTransform(scrollYProgress, [0, 1], [0, 0]);
  const bracketZ = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const frameZ = useTransform(scrollYProgress, [0, 1], [0, 180]);

  // Opacity of connecting lines
  const linesOpacity = useTransform(scrollYProgress, [0.3, 1], [0, 0.4]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full aspect-square max-w-[600px] mx-auto flex items-center justify-center overflow-visible py-10"
      style={{ perspective: "1500px" }}
    >
      {/* Soft ambient backlight */}
      <div className="absolute inset-0 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        className="relative w-[50%] h-[50%] transform-gpu"
        style={{ transformStyle: "preserve-3d", rotateX, rotateY, rotateZ }}
      >
        {/* =========================================
            ASSEMBLY LINES (Connecting the parts) 
            ========================================= */}
        <motion.div className="absolute inset-0 pointer-events-none flex justify-center items-center" style={{ opacity: linesOpacity, transformStyle: "preserve-3d" }}>
          {/* Center line */}
          <motion.div className="absolute w-[2px] bg-primary/50" style={{ height: "400px", transform: "translateZ(-200px) rotateX(90deg)", transformOrigin: "top center" }} />
          {/* Corner mounting lines */}
          <motion.div className="absolute w-[1px] bg-primary/30" style={{ height: "300px", transform: "translate3d(-60px, -60px, -150px) rotateX(90deg)", transformOrigin: "top center" }} />
          <motion.div className="absolute w-[1px] bg-primary/30" style={{ height: "300px", transform: "translate3d(60px, -60px, -150px) rotateX(90deg)", transformOrigin: "top center" }} />
          <motion.div className="absolute w-[1px] bg-primary/30" style={{ height: "300px", transform: "translate3d(-60px, 60px, -150px) rotateX(90deg)", transformOrigin: "top center" }} />
          <motion.div className="absolute w-[1px] bg-primary/30" style={{ height: "300px", transform: "translate3d(60px, 60px, -150px) rotateX(90deg)", transformOrigin: "top center" }} />
        </motion.div>

        {/* =========================================
            LAYER 1: BACK BOX (Blue plastic housing)
            ========================================= */}
        <motion.div 
          className="absolute inset-0 flex justify-center items-center pointer-events-none" 
          style={{ z: backBoxZ, transformStyle: "preserve-3d" }}
        >
          {/* Outer edge */}
          <div className="w-[110%] h-[110%] rounded-full bg-blue-700/80 shadow-[0_0_20px_rgba(29,78,216,0.5)] border border-blue-500/50 flex items-center justify-center transform-gpu">
            {/* Depth simulation (inner cylinder) */}
            <div className="absolute inset-0 rounded-full border-[10px] border-blue-900 shadow-[inset_0_20px_40px_rgba(0,0,0,0.8)]" style={{ transform: "translateZ(-20px)" }} />
            <div className="absolute inset-0 rounded-full border-[10px] border-blue-950 shadow-[inset_0_20px_40px_rgba(0,0,0,0.8)]" style={{ transform: "translateZ(-40px)" }} />
            
            {/* Very back bottom */}
            <div className="w-full h-full rounded-full bg-slate-950 shadow-[inset_0_30px_50px_rgba(0,0,0,1)]" style={{ transform: "translateZ(-60px)" }}>
              {/* Breakout holes */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-black/60 border border-blue-900/50" />
            </div>

            {/* Screw posts */}
            <div className="absolute left-2 w-4 h-4 rounded-full bg-blue-800 border border-blue-600 shadow-[2px_2px_5px_rgba(0,0,0,0.5)] flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
            </div>
            <div className="absolute right-2 w-4 h-4 rounded-full bg-blue-800 border border-blue-600 shadow-[2px_2px_5px_rgba(0,0,0,0.5)] flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
            </div>
          </div>
        </motion.div>

        {/* =========================================
            LAYER 2: CABLES (3D cylindrical wires)
            ========================================= */}
        <motion.div 
          className="absolute inset-0 flex justify-center items-center pointer-events-none" 
          style={{ z: wiresZ, transformStyle: "preserve-3d" }}
        >
          {/* Main Black Cable Jacket */}
          <div className="absolute bottom-[-80px] w-12 h-32 bg-zinc-900 rounded-t-2xl shadow-[inset_4px_0_10px_rgba(255,255,255,0.1),-10px_10px_20px_rgba(0,0,0,0.8)] border-x border-t border-zinc-700" style={{ transform: "translateZ(-30px)" }}>
             <div className="absolute bottom-10 -left-6 text-[8px] font-mono text-zinc-600 -rotate-90">ВВГнг(А)-LS 3x2.5</div>
          </div>

          <div className="absolute flex gap-4" style={{ transform: "translateY(40px) translateZ(10px)" }}>
            {/* L (Brown) */}
            <div className="w-4 h-32 bg-amber-900 rounded-full shadow-[inset_2px_0_5px_rgba(255,255,255,0.2),-5px_5px_10px_rgba(0,0,0,0.5)] relative -rotate-12 transform-gpu" style={{ transform: "translateZ(10px)" }}>
              {/* Bare copper tip */}
              <div className="absolute top-[-15px] left-0 w-full h-8 bg-gradient-to-r from-orange-400 via-yellow-500 to-orange-700 rounded-full shadow-[inset_1px_0_3px_rgba(255,255,255,0.8)]" />
            </div>
            
            {/* PE (Yellow/Green) */}
            <div className="w-4 h-40 bg-[repeating-linear-gradient(45deg,#facc15,#facc15_8px,#22c55e_8px,#22c55e_16px)] rounded-full shadow-[inset_2px_0_5px_rgba(255,255,255,0.4),-5px_5px_10px_rgba(0,0,0,0.5)] relative">
              <div className="absolute top-[-15px] left-0 w-full h-8 bg-gradient-to-r from-orange-400 via-yellow-500 to-orange-700 rounded-full shadow-[inset_1px_0_3px_rgba(255,255,255,0.8)]" />
            </div>

            {/* N (Blue) */}
            <div className="w-4 h-32 bg-blue-700 rounded-full shadow-[inset_2px_0_5px_rgba(255,255,255,0.3),-5px_5px_10px_rgba(0,0,0,0.5)] relative rotate-12 transform-gpu" style={{ transform: "translateZ(-10px)" }}>
              <div className="absolute top-[-15px] left-0 w-full h-8 bg-gradient-to-r from-orange-400 via-yellow-500 to-orange-700 rounded-full shadow-[inset_1px_0_3px_rgba(255,255,255,0.8)]" />
            </div>
          </div>
        </motion.div>

        {/* =========================================
            LAYER 3: MECHANISM (Tech Core)
            ========================================= */}
        <motion.div 
          className="absolute inset-0 flex justify-center items-center pointer-events-none" 
          style={{ z: mechZ, transformStyle: "preserve-3d" }}
        >
          {/* Main body block */}
          <div className="w-[80%] h-[80%] bg-zinc-800 rounded-2xl shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1),-20px_20px_40px_rgba(0,0,0,0.6)] flex items-center justify-center relative overflow-hidden transform-gpu">
             {/* Ribbed texture on the face */}
             <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_49%,rgba(255,255,255,0.03)_50%,transparent_51%)] bg-[length:10px_100%]" />
             
             {/* Terminals block */}
             <div className="w-full h-1/3 bg-zinc-900 absolute top-0 border-b border-zinc-700 flex justify-between px-6 items-center">
                {/* Screws */}
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-500 shadow-inner flex items-center justify-center">
                  <div className="w-4 h-1 bg-zinc-800" />
                  <div className="w-1 h-4 bg-zinc-800 absolute" />
                </div>
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-500 shadow-inner flex items-center justify-center">
                  <div className="w-4 h-1 bg-zinc-800" />
                  <div className="w-1 h-4 bg-zinc-800 absolute" />
                </div>
             </div>

             <div className="text-zinc-500 font-mono text-[10px] font-bold tracking-widest mt-10">16A 250V~</div>
          </div>
        </motion.div>

        {/* =========================================
            LAYER 4: METAL BRACKET (Titanium Finish)
            ========================================= */}
        <motion.div 
          className="absolute inset-0 flex justify-center items-center pointer-events-none" 
          style={{ z: bracketZ, transformStyle: "preserve-3d" }}
        >
          <div className="w-[120%] h-[120%] relative flex justify-center items-center">
            {/* The metal plate (using complex gradients for brushed metal look) */}
            <div 
              className="absolute inset-0 bg-gradient-to-br from-zinc-200 via-zinc-400 to-zinc-500 shadow-[inset_2px_2px_5px_rgba(255,255,255,0.8),-15px_15px_30px_rgba(0,0,0,0.5)] border border-zinc-400 overflow-hidden"
              style={{ clipPath: "polygon(10% 0, 90% 0, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0 90%, 0 10%)" }}
            >
              {/* Brushed texture overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:4px_4px] opacity-20" />

              {/* Mounting holes (corners) */}
              <div className="absolute top-4 left-4 w-4 h-12 bg-zinc-900 rounded-full shadow-inner" />
              <div className="absolute top-4 right-4 w-4 h-12 bg-zinc-900 rounded-full shadow-inner" />
              <div className="absolute bottom-4 left-4 w-4 h-12 bg-zinc-900 rounded-full shadow-inner" />
              <div className="absolute bottom-4 right-4 w-4 h-12 bg-zinc-900 rounded-full shadow-inner" />
            </div>

            {/* Central dark plastic socket well */}
            <div className="w-[60%] h-[60%] rounded-full bg-zinc-900 shadow-[0_10px_20px_rgba(0,0,0,0.8)] border-[6px] border-zinc-800 flex items-center justify-center relative transform-gpu" style={{ transform: "translateZ(10px)" }}>
              {/* Plug holes */}
              <div className="flex gap-6">
                <div className="w-5 h-5 rounded-full bg-black shadow-inner" />
                <div className="w-5 h-5 rounded-full bg-black shadow-inner" />
              </div>

              {/* Grounding prongs (Brass/Gold) */}
              <div className="absolute top-0 w-3 h-6 bg-gradient-to-b from-yellow-400 to-amber-600 rounded-b-md shadow-lg border-x border-b border-amber-700 transform-gpu" style={{ transform: "translateZ(10px)" }} />
              <div className="absolute bottom-0 w-3 h-6 bg-gradient-to-t from-yellow-400 to-amber-600 rounded-t-md shadow-lg border-x border-t border-amber-700 transform-gpu" style={{ transform: "translateZ(10px)" }} />
            </div>
          </div>
        </motion.div>

        {/* =========================================
            LAYER 5: GLASS FRAME (Apple style)
            ========================================= */}
        <motion.div 
          className="absolute inset-0 flex justify-center items-center pointer-events-none" 
          style={{ z: frameZ, transformStyle: "preserve-3d" }}
        >
          <div className="w-[140%] h-[140%] relative flex justify-center items-center">
            {/* The Glass Outer Frame */}
            <div className="absolute inset-0 bg-white/10 dark:bg-black/10 backdrop-blur-2xl rounded-3xl border border-white/50 dark:border-white/10 shadow-[inset_2px_2px_10px_rgba(255,255,255,0.3),-20px_20px_50px_rgba(0,0,0,0.3)] overflow-hidden">
               {/* Diagonal glass glare */}
               <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -rotate-45 scale-150 translate-x-[20%] translate-y-[-20%]" />
            </div>

            {/* Central Matte Faceplate */}
            <div className="w-[50%] h-[50%] rounded-full bg-white dark:bg-zinc-800 shadow-[0_10px_20px_rgba(0,0,0,0.2),inset_0_-4px_10px_rgba(0,0,0,0.1)] flex items-center justify-center relative transform-gpu" style={{ transform: "translateZ(5px)" }}>
              {/* Plug holes with RED shutters */}
              <div className="flex gap-6 mb-2">
                <div className="w-5 h-5 rounded-full bg-black shadow-inner flex items-center justify-center overflow-hidden">
                  <div className="w-full h-1/2 bg-red-500 translate-y-[-2px]" />
                </div>
                <div className="w-5 h-5 rounded-full bg-black shadow-inner flex items-center justify-center overflow-hidden">
                  <div className="w-full h-1/2 bg-red-500 translate-y-[-2px]" />
                </div>
              </div>
              <div className="absolute bottom-5 text-[8px] font-mono text-zinc-400 font-bold tracking-widest">PMR PRO</div>
            </div>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
};

export default ExplodedSocket;
