import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import { useRef } from "react";

// === TRUE 3D EXTRUSION COMPONENT ===
// This stacks multiple copies of the same SVG to create solid 3D geometry
interface SolidExtrusionProps {
  depth: number;
  zOffset: MotionValue<number>;
  children: React.ReactNode;
  darkenSides?: boolean;
  blurTop?: boolean;
}

const SolidExtrusion = ({ depth, zOffset, children, darkenSides = true, blurTop = false }: SolidExtrusionProps) => {
  return (
    <motion.div 
      className="absolute inset-0 flex justify-center items-center pointer-events-none" 
      style={{ z: zOffset, transformStyle: "preserve-3d" }}
    >
      {Array.from({ length: depth }).map((_, i) => {
        const isTop = i === 0;
        const isBottom = i === depth - 1;
        // The deeper the layer, the darker it gets (simulates side-wall shading)
        const brightness = isTop ? 1 : darkenSides ? 0.6 - (i / depth) * 0.3 : 1;
        
        return (
          <div 
            key={i} 
            className="absolute inset-0 flex justify-center items-center" 
            style={{ 
              transform: `translateZ(${-i}px)`,
              filter: `brightness(${brightness})`,
              opacity: blurTop && !isTop ? 0 : 1 // Hide sides if we only want the top layer for glass
            }}
          >
            {children}
          </div>
        );
      })}
      
      {/* If it's a glass layer, add the actual blur only to the top face to save performance */}
      {blurTop && (
         <div className="absolute inset-0 flex justify-center items-center backdrop-blur-xl rounded-3xl" style={{ transform: `translateZ(0px)` }}>
            {children}
         </div>
      )}
    </motion.div>
  );
};

// === SVG PARTS (Pure 2D Cross-Sections) ===

const Layer1BackBoxRing = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
    <circle cx="100" cy="100" r="85" fill="none" stroke="#1e3a8a" strokeWidth="8" />
    <circle cx="100" cy="100" r="90" fill="none" stroke="#172554" strokeWidth="2" />
    {/* Screw posts cross section */}
    <circle cx="20" cy="100" r="8" fill="#1e3a8a" />
    <circle cx="180" cy="100" r="8" fill="#1e3a8a" />
  </svg>
);

const Layer1BackBoxBase = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
    <circle cx="100" cy="100" r="89" fill="#0f172a" />
    {/* Wire breakout hole */}
    <circle cx="100" cy="150" r="20" fill="#000" />
  </svg>
);

const Layer2Wires = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible drop-shadow-2xl">
    {/* 3D Wires drawn via thick SVG strokes */}
    <defs>
      <linearGradient id="wire-l" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#451a03" />
        <stop offset="50%" stopColor="#92400e" />
        <stop offset="100%" stopColor="#451a03" />
      </linearGradient>
      <linearGradient id="wire-n" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#1e3a8a" />
        <stop offset="50%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1e3a8a" />
      </linearGradient>
      <linearGradient id="wire-pe" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#166534" />
        <stop offset="50%" stopColor="#eab308" />
        <stop offset="100%" stopColor="#166534" />
      </linearGradient>
      <linearGradient id="jacket" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#000" />
        <stop offset="50%" stopColor="#3f3f46" />
        <stop offset="100%" stopColor="#000" />
      </linearGradient>
    </defs>
    
    <path d="M85,250 L85,150 C85,130 115,130 115,150 L115,250 Z" fill="url(#jacket)" />
    
    <path d="M90,140 Q70,120 70,70 L70,50" fill="none" stroke="url(#wire-l)" strokeWidth="8" strokeLinecap="round" />
    <path d="M70,50 L70,30" fill="none" stroke="#d97706" strokeWidth="6" strokeLinecap="round" /> {/* Copper tip */}
    
    <path d="M100,135 Q100,100 100,60 L100,40" fill="none" stroke="url(#wire-pe)" strokeWidth="8" strokeLinecap="round" />
    <path d="M100,40 L100,20" fill="none" stroke="#d97706" strokeWidth="6" strokeLinecap="round" />
    
    <path d="M110,140 Q130,120 130,70 L130,50" fill="none" stroke="url(#wire-n)" strokeWidth="8" strokeLinecap="round" />
    <path d="M130,50 L130,30" fill="none" stroke="#d97706" strokeWidth="6" strokeLinecap="round" />
  </svg>
);

const Layer3Mechanism = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
    <defs>
      <linearGradient id="mech-base" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#52525b" />
        <stop offset="100%" stopColor="#27272a" />
      </linearGradient>
    </defs>
    {/* Octagonal body */}
    <path d="M60,30 L140,30 L170,60 L170,140 L140,170 L60,170 L30,140 L30,60 Z" fill="url(#mech-base)" stroke="#3f3f46" strokeWidth="2" />
    {/* Inner details */}
    <circle cx="100" cy="100" r="30" fill="#18181b" />
    {/* Text */}
    <text x="100" y="90" fontSize="10" fontFamily="sans-serif" fontWeight="bold" fill="#71717a" textAnchor="middle">16A 250V~</text>
    {/* Terminals */}
    <rect x="20" y="80" width="15" height="40" rx="3" fill="#a1a1aa" />
    <rect x="165" y="80" width="15" height="40" rx="3" fill="#a1a1aa" />
    <rect x="80" y="20" width="40" height="15" rx="3" fill="#a1a1aa" />
  </svg>
);

const Layer4Bracket = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
    <defs>
      <linearGradient id="metal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e5e7eb" />
        <stop offset="50%" stopColor="#9ca3af" />
        <stop offset="100%" stopColor="#4b5563" />
      </linearGradient>
      <mask id="bracket-hole">
        <rect width="200" height="200" fill="white" />
        <circle cx="100" cy="100" r="55" fill="black" />
        {/* Keyholes */}
        <circle cx="100" cy="25" r="4" fill="black" />
        <circle cx="100" cy="175" r="4" fill="black" />
        <circle cx="25" cy="100" r="4" fill="black" />
        <circle cx="175" cy="100" r="4" fill="black" />
      </mask>
    </defs>
    <path 
      d="M20,20 L180,20 L180,180 L20,180 Z" 
      fill="url(#metal)" 
      mask="url(#bracket-hole)"
    />
    {/* Raised plastic socket well inside */}
    <circle cx="100" cy="100" r="55" fill="#18181b" />
    <circle cx="70" cy="100" r="10" fill="#000" />
    <circle cx="130" cy="100" r="10" fill="#000" />
    {/* Grounding prongs */}
    <rect x="95" y="45" width="10" height="15" fill="#ca8a04" rx="2" />
    <rect x="95" y="140" width="10" height="15" fill="#ca8a04" rx="2" />
  </svg>
);

const Layer5Frame = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible drop-shadow-[0_20px_20px_rgba(0,0,0,0.5)]">
    <defs>
      <mask id="frame-hole">
        <rect width="200" height="200" fill="white" />
        <circle cx="100" cy="100" r="48" fill="black" />
      </mask>
      <linearGradient id="glass-glare" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
        <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0.0)" />
      </linearGradient>
    </defs>
    
    {/* Frame Body (Glass) */}
    <rect x="0" y="0" width="200" height="200" rx="20" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.5)" strokeWidth="2" mask="url(#frame-hole)" />
    <rect x="0" y="0" width="200" height="200" rx="20" fill="url(#glass-glare)" mask="url(#frame-hole)" />

    {/* Center Faceplate (White Plastic) */}
    <circle cx="100" cy="100" r="48" fill="#f8fafc" />
    {/* Shutters */}
    <circle cx="70" cy="100" r="10" fill="#0f172a" />
    <rect x="62" y="97" width="16" height="6" fill="#ef4444" rx="1" />
    <circle cx="130" cy="100" r="10" fill="#0f172a" />
    <rect x="122" y="97" width="16" height="6" fill="#ef4444" rx="1" />
    {/* Brand */}
    <text x="100" y="140" fontSize="8" fontFamily="sans-serif" fontWeight="900" fill="#94a3b8" textAnchor="middle">ELECTRIC_PMR</text>
  </svg>
);


// === MAIN COMPONENT ===

const ExplodedSocket = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "center center"]
  });

  // Balanced Isometric Angle
  const rotateX = 55;
  const rotateY = 0;
  const rotateZ = -45;

  // Spacing (Z-axis explosion)
  const layer1Z = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const layer2Z = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const layer3Z = useTransform(scrollYProgress, [0, 1], [0, 0]);
  const layer4Z = useTransform(scrollYProgress, [0, 1], [0, 50]);
  const layer5Z = useTransform(scrollYProgress, [0, 1], [0, 150]);

  const lineOpacity = useTransform(scrollYProgress, [0.3, 1], [0, 0.4]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full aspect-square max-w-[600px] mx-auto flex items-center justify-center overflow-visible py-20"
      style={{ perspective: "1500px" }}
    >
      <div className="absolute inset-0 bg-primary/20 rounded-full blur-[120px]" />

      <motion.div 
        className="relative w-[60%] h-[60%] transform-gpu"
        style={{ transformStyle: "preserve-3d", rotateX, rotateY, rotateZ }}
      >
        {/* ASSEMBLY LINES */}
        <motion.div className="absolute inset-0 pointer-events-none flex justify-center items-center z-10" style={{ opacity: lineOpacity, transformStyle: "preserve-3d" }}>
          <motion.div className="absolute w-[2px] bg-primary/50 rounded-full" style={{ height: "400px", transform: "translateZ(-200px) rotateX(90deg)", transformOrigin: "top center" }} />
          <motion.div className="absolute w-[1px] bg-primary/30" style={{ height: "300px", transform: "translate3d(-60px, -60px, -150px) rotateX(90deg)", transformOrigin: "top center" }} />
          <motion.div className="absolute w-[1px] bg-primary/30" style={{ height: "300px", transform: "translate3d(60px, 60px, -150px) rotateX(90deg)", transformOrigin: "top center" }} />
        </motion.div>

        {/* LAYER 1: BACK BOX (Solid Cylinder Extrusion) */}
        {/* We render 40 rings to create the walls of the cup, then the base at the bottom */}
        <SolidExtrusion depth={40} zOffset={layer1Z}>
           <Layer1BackBoxRing />
        </SolidExtrusion>
        <motion.div className="absolute inset-0 flex justify-center items-center" style={{ z: layer1Z, transform: "translateZ(-40px)", transformStyle: "preserve-3d" }}>
           <Layer1BackBoxBase />
        </motion.div>

        {/* LAYER 2: WIRES */}
        <motion.div className="absolute inset-0 flex justify-center items-center" style={{ z: layer2Z, transformStyle: "preserve-3d" }}>
           <Layer2Wires />
        </motion.div>

        {/* LAYER 3: CERAMIC MECHANISM (Solid Extrusion) */}
        <SolidExtrusion depth={15} zOffset={layer3Z}>
           <Layer3Mechanism />
        </SolidExtrusion>

        {/* LAYER 4: METAL BRACKET (Solid Extrusion) */}
        <SolidExtrusion depth={4} zOffset={layer4Z}>
           <Layer4Bracket />
        </SolidExtrusion>

        {/* LAYER 5: GLASS FRAME (Solid Extrusion with Backdrop Blur) */}
        <SolidExtrusion depth={6} zOffset={layer5Z} blurTop={true} darkenSides={false}>
           <Layer5Frame />
        </SolidExtrusion>

      </motion.div>
    </div>
  );
};

export default ExplodedSocket;
