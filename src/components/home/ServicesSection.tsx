import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import SmartBlueprintSVG, { zonesData, ZoneId } from "./SmartBlueprintSVG";

const ServicesSection = () => {
  const [activeZone, setActiveZone] = useState<ZoneId | null>("hallway");

  // If no zone hovered, default to hallway to keep panel populated
  const currentData = activeZone ? zonesData[activeZone] : zonesData["hallway"];

  return (
    <section className="section-padding overflow-hidden">
      <div className="container-main">
        {/* Header */}
        <motion.div 
          className="text-center max-w-4xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:whitespace-nowrap">
            Проектируем электрику <span className="text-primary">с умом</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Наведите курсор на комнаты на плане, чтобы узнать особенности электромонтажа в каждой зоне.
          </p>
        </motion.div>

        {/* Blueprint Layout */}
        <div className="flex flex-col-reverse lg:grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: SVG Interactive Plan */}
          <motion.div 
            className="lg:col-span-7 xl:col-span-8 w-full"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <SmartBlueprintSVG activeZone={activeZone} onHover={(zone) => zone && setActiveZone(zone as ZoneId)} />
          </motion.div>

          {/* Right Column: Dynamic Info Panel */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col h-full justify-center w-full">
            <div className="card-industrial p-8 min-h-[400px] flex flex-col relative overflow-hidden">
              {/* Background glow matching primary color */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -z-10" />
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentData.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 flex flex-col"
                >
                  <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-6 w-fit">
                    Зона: {currentData.id === 'hallway' ? 'Входная группа' : 
                          currentData.id === 'kitchen' ? 'Высокая нагрузка' : 
                          currentData.id === 'living' ? 'Мультимедиа' :
                          currentData.id === 'bathroom' ? 'Влажная зона' : 'Зона отдыха'}
                  </div>
                  
                  <h3 className="font-display text-2xl md:text-3xl font-bold mb-4 text-foreground">
                    {currentData.title}
                  </h3>
                  
                  <p className="text-muted-foreground text-base leading-relaxed mb-8 flex-1">
                    {currentData.description}
                  </p>
                  
                  <div className="space-y-3 mb-8">
                    {currentData.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm font-medium text-foreground/90">{feature}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              <Button className="w-full group" asChild>
                <Link to="/contact">
                  Рассчитать проект
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default ServicesSection;