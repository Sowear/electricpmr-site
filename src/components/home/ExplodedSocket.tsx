import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

// === PREMIUM APPLE-STYLE SMART SOCKET ===

const Layer1BaseBracket = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)]">
    <defs>
      {/* Deep matte metallic texture */}
      <linearGradient id="base-metal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#27272a" />
        <stop offset="50%" stopColor="#18181b" />
        <stop offset="100%" stopColor="#09090b" />
      </linearGradient>
      {/* Precision milled edge reflection */}
      <linearGradient id="base-edge" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#52525b" />
        <stop offset="100%" stopColor="#000000" />
      </linearGradient>
    </defs>
    
    {/* Base bracket body */}
    <rect x="20" y="20" width="160" height="160" rx="25" fill="url(#base-metal)" stroke="url(#base-edge)" strokeWidth="2" />
    
    {/* Minimalist mounting holes with milled bevels */}
    {[
      {x: 35, y: 35}, {x: 165, y: 35}, {x: 35, y: 165}, {x: 165, y: 165}
    ].map((pos, i) => (
      <g key={i} transform={`translate(${pos.x}, ${pos.y})`}>
        <circle cx="0" cy="0" r="6" fill="#000" />
        <circle cx="0" cy="0" r="6" fill="none" stroke="#3f3f46" strokeWidth="1" />
        <circle cx="0" cy="0" r="3" fill="#18181b" />
      </g>
    ))}

    {/* Center Socket Cavity (Vantablack depth) */}
    <circle cx="100" cy="100" r="60" fill="#000" />
    <circle cx="100" cy="100" r="60" fill="none" stroke="#27272a" strokeWidth="3" />
  </svg>
);

const Layer2SmartCore = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible drop-shadow-[0_30px_40px_rgba(0,0,0,0.6)]">
    <defs>
      {/* The pristine dark face of the smart socket */}
      <linearGradient id="core-face" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#18181b" />
        <stop offset="100%" stopColor="#000000" />
      </linearGradient>
      {/* Chrome grounding prongs */}
      <linearGradient id="chrome" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#e4e4e7" />
        <stop offset="30%" stopColor="#ffffff" />
        <stop offset="70%" stopColor="#71717a" />
        <stop offset="100%" stopColor="#3f3f46" />
      </linearGradient>
      {/* Active LED Ring Glow */}
      <filter id="led-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Main Core Body */}
    <circle cx="100" cy="100" r="55" fill="url(#core-face)" stroke="#27272a" strokeWidth="2" />
    
    {/* Smart LED Ring (Electric Blue) */}
    <circle cx="100" cy="100" r="52" fill="none" stroke="#0ea5e9" strokeWidth="1.5" filter="url(#led-glow)" opacity="0.8" />
    
    {/* Inner depressed area */}
    <circle cx="100" cy="100" r="45" fill="#09090b" stroke="#18181b" strokeWidth="1" />

    {/* Plug Holes (Pure Black) */}
    <g transform="translate(0, 0)">
      <circle cx="75" cy="100" r="9" fill="#000" />
      <circle cx="75" cy="100" r="9" fill="none" stroke="#27272a" strokeWidth="1" />
      {/* Red safety shutters hidden deep inside */}
      <rect x="68" y="98" width="14" height="4" fill="#991b1b" rx="1" />
    </g>
    <g transform="translate(0, 0)">
      <circle cx="125" cy="100" r="9" fill="#000" />
      <circle cx="125" cy="100" r="9" fill="none" stroke="#27272a" strokeWidth="1" />
      <rect x="118" y="98" width="14" height="4" fill="#991b1b" rx="1" />
    </g>

    {/* Grounding Contacts (Polished Chrome) */}
    <rect x="94" y="48" width="12" height="15" fill="url(#chrome)" rx="2" />
    <rect x="94" y="137" width="12" height="15" fill="url(#chrome)" rx="2" />

    {/* Brand engraving */}
    <text x="100" y="102" fontSize="6" fontFamily="sans-serif" fontWeight="900" fill="#3f3f46" textAnchor="middle" letterSpacing="1">ELECTRIC PMR</text>
  </svg>
);

const Layer3GlassFrame = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible drop-shadow-[0_40px_50px_rgba(0,0,0,0.3)]">
    <defs>
      {/* Smooth glass surface gradient */}
      <linearGradient id="glass-surface" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
        <stop offset="40%" stopColor="rgba(255,255,255,0.1)" />
        <stop offset="60%" stopColor="rgba(255,255,255,0.05)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0.3)" />
      </linearGradient>
      
      {/* Intense diagonal glare mimicking premium device screens */}
      <linearGradient id="intense-glare" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="rgba(255,255,255,0)" />
        <stop offset="48%" stopColor="rgba(255,255,255,0.1)" />
        <stop offset="50%" stopColor="rgba(255,255,255,0.8)" />
        <stop offset="52%" stopColor="rgba(255,255,255,0.1)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
      </linearGradient>

      {/* Titanium outer rim */}
      <linearGradient id="titanium-rim" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e4e4e7" />
        <stop offset="50%" stopColor="#a1a1aa" />
        <stop offset="100%" stopColor="#d4d4d8" />
      </linearGradient>

      <mask id="glass-hole">
        <rect width="200" height="200" fill="white" />
        <circle cx="100" cy="100" r="50" fill="black" />
      </mask>
      
      <clipPath id="frame-clip">
        <rect x="0" y="0" width="200" height="200" rx="30" />
      </clipPath>
    </defs>

    {/* The Glass Panel */}
    <rect 
      x="0" y="0" 
      width="200" height="200" 
      rx="30" 
      fill="url(#glass-surface)" 
      stroke="rgba(255,255,255,0.6)" 
      strokeWidth="1.5" 
      mask="url(#glass-hole)" 
      className="backdrop-blur-3xl"
    />

    {/* Inner Chrome Bezel (around the hole) */}
    <circle cx="100" cy="100" r="50" fill="none" stroke="url(#titanium-rim)" strokeWidth="2" />
    
    {/* Sweeping Glare Effect */}
    <path 
      d="M-50,150 L150,-50 L250,50 L50,250 Z" 
      fill="url(#intense-glare)" 
      clipPath="url(#frame-clip)" 
      mask="url(#glass-hole)"
      opacity="0.5" 
    />

    {/* Outer Edge Highlight */}
    <rect x="1" y="1" width="198" height="198" rx="29" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.5" />
  </svg>
);


// === MAIN COMPONENT ===

const ExplodedSocket = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "center center"]
  });

  // Elegantly balanced perspective. 
  // Apple relies on shallow perspective to keep the UI perfectly legible and premium.
  const rotateX = 25;
  const rotateY = -15;

  // Ultra-smooth z-axis spread
  const baseZ = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const coreZ = useTransform(scrollYProgress, [0, 1], [0, 0]);
  const frameZ = useTransform(scrollYProgress, [0, 1], [0, 120]);

  // Cinematic fade-in of the assembly lines
  const lineOpacity = useTransform(scrollYProgress, [0.4, 1], [0, 0.5]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full aspect-square max-w-[600px] mx-auto flex items-center justify-center overflow-visible py-20"
      style={{ perspective: "2000px" }}
    >
      {/* Ethereal background glow highlighting the "Smart" aspect */}
      <div className="absolute inset-0 bg-sky-500/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        className="relative w-[65%] h-[65%] transform-gpu"
        style={{ transformStyle: "preserve-3d", rotateX, rotateY }}
      >
        {/* ASSEMBLY GUIDE LINES */}
        <motion.div className="absolute inset-0 pointer-events-none flex justify-center items-center z-10" style={{ opacity: lineOpacity, transformStyle: "preserve-3d" }}>
          {/* Main Core Axis */}
          <motion.div 
            className="absolute w-[2px] bg-sky-400/50 rounded-full shadow-[0_0_10px_rgba(56,189,248,0.8)]" 
            style={{ height: "300px", transform: "translateZ(-150px) rotateX(90deg)", transformOrigin: "top center" }} 
          />
        </motion.div>

        {/* LAYER 1: BASE BRACKET */}
        <motion.div className="absolute inset-0 flex justify-center items-center pointer-events-none" style={{ z: baseZ, transformStyle: "preserve-3d" }}>
          <Layer1BaseBracket />
        </motion.div>

        {/* LAYER 2: SMART CORE PUCK */}
        <motion.div className="absolute inset-0 flex justify-center items-center pointer-events-none" style={{ z: coreZ, transformStyle: "preserve-3d" }}>
          <Layer2SmartCore />
        </motion.div>

        {/* LAYER 3: PREMIUM GLASS FRAME */}
        <motion.div className="absolute inset-0 flex justify-center items-center pointer-events-none" style={{ z: frameZ, transformStyle: "preserve-3d" }}>
          <Layer3GlassFrame />
        </motion.div>

      </motion.div>
    </div>
  );
};

export default ExplodedSocket;
