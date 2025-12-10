import React from "react";
import { cn } from "@/lib/utils";
import useCyberSound from "@/hooks/useCyberSound";

interface NeonButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "accent";
}

const NeonButton = React.forwardRef<HTMLButtonElement, NeonButtonProps>(
  ({ className, children, variant = "primary", ...props }, ref) => {
    const { playHover, playClick } = useCyberSound();

    return (
      <button
        ref={ref}
        onMouseEnter={() => playHover()}
        onClick={(e) => {
          playClick();
          props.onClick?.(e);
        }}
        className={cn(
          "neon-button",
          variant === "secondary" &&
            "border-secondary text-secondary hover:bg-secondary hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]",
          variant === "accent" &&
            "border-accent text-accent hover:bg-accent hover:shadow-[0_0_30px_rgba(236,72,153,0.6)]",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

NeonButton.displayName = "NeonButton";

export default NeonButton;
