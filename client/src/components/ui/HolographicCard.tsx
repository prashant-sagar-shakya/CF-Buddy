import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface HolographicCardProps {
  children: React.ReactNode;
  className?: string;
}

const HolographicCard = ({ children, className }: HolographicCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const rX = (mouseY / height - 0.5) * 20; // Rotate X based on Y axis
    const rY = (mouseX / width - 0.5) * -20; // Rotate Y based on X axis
    setRotateX(rX);
    setRotateY(rY);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      ref={ref}
      className={cn(
        "glass-card relative overflow-hidden p-6 transform-gpu perspective-1000 bg-card/40 dark:bg-white/5 border border-border/50 dark:border-white/10 shadow-lg dark:shadow-[0_4px_30px_rgba(0,0,0,0.1)]",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX,
        rotateY,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{
        transformStyle: "preserve-3d",
      }}
    >
      <div
        className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${50 - rotateY * 2}% ${
            50 - rotateX * 2
          }%, var(--primary) 0%, transparent 50%)`,
          opacity: 0.1,
        }}
      />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};

export default HolographicCard;
