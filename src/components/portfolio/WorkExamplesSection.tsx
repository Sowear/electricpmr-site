import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useWorkExamples, WorkExample } from "@/hooks/useWorkExamples";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, ArrowRight } from "lucide-react";
import WorkExampleLightbox from "./WorkExampleLightbox";

const WorkExamplesSection = () => {
  const { data: examples, isLoading } = useWorkExamples(true);
  const [selectedExample, setSelectedExample] = useState<WorkExample | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94] as const,
      },
    },
  };

  return (
    <section 
      ref={sectionRef}
      id="examples" 
      className="py-20 lg:py-28 bg-muted/30"
    >
      <div className="container-main">
        {/* Header */}
        <motion.div 
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <Badge variant="outline" className="mb-4 px-4 py-1.5 text-sm font-medium">
            Портфолио
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Примеры <span className="text-primary">работ</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Реальные проекты от квартир до коммерческих объектов.
            Нажмите на карточку, чтобы увидеть результат.
          </p>
        </motion.div>

        {/* Gallery Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
            ))}
          </div>
        ) : examples && examples.length > 0 ? (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            {examples.map((example) => (
              <motion.div
                key={example.id}
                variants={itemVariants}
                className="group relative cursor-pointer"
                onClick={() => setSelectedExample(example)}
              >
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-card border border-border shadow-sm">
                  {/* Before Image */}
                  <img
                    src={example.before_image_url}
                    alt={`${example.title} - До`}
                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-0"
                    loading="lazy"
                  />
                  {/* After Image */}
                  <img
                    src={example.after_image_url}
                    alt={`${example.title} - После`}
                    className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    loading="lazy"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Labels */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="px-2 py-1 text-xs font-medium bg-black/60 text-white rounded-md backdrop-blur-sm">
                      ДО
                    </span>
                    <span className="px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      ПОСЛЕ
                    </span>
                  </div>
                  
                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <h3 className="text-white font-semibold text-lg mb-1">
                      {example.title}
                    </h3>
                    {example.city && (
                      <p className="text-white/80 text-sm">
                        📍 {example.city}
                      </p>
                    )}
                  </div>
                  
                  {/* View Icon */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300">
                    <Eye className="h-6 w-6 text-primary-foreground" />
                  </div>
                </div>

                {/* Category Tag */}
                {example.category && (
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {example.category}
                    </Badge>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <p>Примеры работ скоро появятся</p>
          </div>
        )}

        {/* CTA */}
        {examples && examples.length > 0 && (
          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.8 }}
          >
            <a
              href="#request"
              className="inline-flex items-center gap-2 text-primary font-medium hover:underline underline-offset-4"
            >
              Хотите так же? Оставьте заявку
              <ArrowRight className="h-4 w-4" />
            </a>
          </motion.div>
        )}
      </div>

      {/* Lightbox */}
      <WorkExampleLightbox
        example={selectedExample}
        onClose={() => setSelectedExample(null)}
      />
    </section>
  );
};

export default WorkExamplesSection;
