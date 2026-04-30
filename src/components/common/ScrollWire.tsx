import { motion, useScroll, useSpring, useTransform } from "framer-motion";

const ScrollWire = () => {
  const { scrollYProgress } = useScroll();
  const pathLength = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });
  const distance = useTransform(pathLength, (val) => `${val * 100}%`);

  return (
    <div className="fixed top-0 left-[2%] md:left-[5%] xl:left-[8%] w-12 h-screen pointer-events-none z-40 hidden md:block opacity-90">
      <svg
        className="absolute top-0 left-0 w-full h-[120vh]"
        viewBox="0 0 50 1000"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M 25 0 V 150 C 25 180, 5 190, 5 220 V 400 C 5 430, 45 440, 45 470 V 700 C 45 730, 25 740, 25 770 V 1000"
          stroke="hsl(var(--muted))"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-20"
          vectorEffect="non-scaling-stroke"
        />
        <motion.path
          d="M 25 0 V 150 C 25 180, 5 190, 5 220 V 400 C 5 430, 45 440, 45 470 V 700 C 45 730, 25 740, 25 770 V 1000"
          stroke="hsl(var(--primary))"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ pathLength }}
          vectorEffect="non-scaling-stroke"
          className="drop-shadow-[0_0_12px_hsl(var(--primary))] animate-pulse"
        />
      </svg>
      {/* Moving Spark/Dot on the end of the wire */}
      <motion.div
        className="absolute left-1/2 -ml-[4px] w-2 h-2 rounded-full bg-white shadow-[0_0_10px_#fff,0_0_20px_hsl(var(--primary))]"
        style={{
          offsetDistance: distance,
          offsetPath: "path('M 25 0 V 150 C 25 180, 5 190, 5 220 V 400 C 5 430, 45 440, 45 470 V 700 C 45 730, 25 740, 25 770 V 1000')",
        }}
      />
    </div>
  );
};

export default ScrollWire;
