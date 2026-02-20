import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { WorkExample } from "@/hooks/useWorkExamples";

interface WorkExampleLightboxProps {
  example: WorkExample | null;
  onClose: () => void;
}

const WorkExampleLightbox = ({ example, onClose }: WorkExampleLightboxProps) => {
  const [showAfter, setShowAfter] = useState(false);
  const [sliderValue, setSliderValue] = useState([0]);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Reset state when example changes
  useEffect(() => {
    if (example) {
      setShowAfter(false);
      setSliderValue([0]);
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [example]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") {
        setShowAfter(false);
        setSliderValue([0]);
      }
      if (e.key === "ArrowRight") {
        setShowAfter(true);
        setSliderValue([100]);
      }
    };

    if (example) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [example, onClose]);

  const handleSliderChange = useCallback((value: number[]) => {
    setSliderValue(value);
    setShowAfter(value[0] > 50);
  }, []);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.5, 1));
    if (zoom <= 1.5) setPosition({ x: 0, y: 0 });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!example) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleBackdropClick}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />

        {/* Content */}
        <motion.div
          className="relative z-10 w-full max-w-5xl mx-4 flex flex-col"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25 }}
        >
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute -top-12 right-0 text-white hover:bg-white/10"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Title */}
          <div className="text-center mb-4">
            <h3 className="text-white text-xl font-semibold">{example.title}</h3>
            {example.description && (
              <p className="text-white/70 text-sm mt-1">{example.description}</p>
            )}
          </div>

          {/* Image Container */}
          <div 
            className="relative aspect-[16/10] rounded-xl overflow-hidden bg-black cursor-grab active:cursor-grabbing"
            onMouseDown={() => zoom > 1 && setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onMouseMove={(e) => {
              if (isDragging && zoom > 1) {
                setPosition((prev) => ({
                  x: prev.x + e.movementX,
                  y: prev.y + e.movementY,
                }));
              }
            }}
          >
            {/* Before Image */}
            <motion.img
              src={example.before_image_url}
              alt="До"
              className="absolute inset-0 w-full h-full object-contain"
              style={{
                opacity: 1 - sliderValue[0] / 100,
                scale: zoom,
                x: position.x,
                y: position.y,
              }}
              draggable={false}
            />
            
            {/* After Image */}
            <motion.img
              src={example.after_image_url}
              alt="После"
              className="absolute inset-0 w-full h-full object-contain"
              style={{
                opacity: sliderValue[0] / 100,
                scale: zoom,
                x: position.x,
                y: position.y,
              }}
              draggable={false}
            />

            {/* Labels */}
            <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none">
              <span 
                className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${
                  !showAfter 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-black/50 text-white/70"
                }`}
              >
                ДО
              </span>
              <span 
                className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${
                  showAfter 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-black/50 text-white/70"
                }`}
              >
                ПОСЛЕ
              </span>
            </div>

            {/* Zoom Controls */}
            <div className="absolute bottom-4 right-4 flex gap-2">
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-black/50 hover:bg-black/70 border-0"
                onClick={handleZoomOut}
                disabled={zoom <= 1}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-black/50 hover:bg-black/70 border-0"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Slider Controls */}
          <div className="mt-6 px-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 shrink-0"
                onClick={() => {
                  setShowAfter(false);
                  setSliderValue([0]);
                }}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              
              <Slider
                value={sliderValue}
                onValueChange={handleSliderChange}
                max={100}
                step={1}
                className="flex-1"
              />
              
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 shrink-0"
                onClick={() => {
                  setShowAfter(true);
                  setSliderValue([100]);
                }}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
            
            <p className="text-center text-white/50 text-sm mt-3">
              Используйте слайдер или стрелки ← → для сравнения
            </p>
          </div>

          {/* Details */}
          {(example.category || example.city) && (
            <div className="mt-4 flex justify-center gap-4 text-white/60 text-sm">
              {example.category && <span>📂 {example.category}</span>}
              {example.city && <span>📍 {example.city}</span>}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WorkExampleLightbox;
