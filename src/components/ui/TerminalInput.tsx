import React, { useState } from "react";
import { cn } from "@/lib/utils";
import useCyberSound from "@/hooks/useCyberSound";

interface TerminalInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const TerminalInput = React.forwardRef<HTMLInputElement, TerminalInputProps>(
  ({ className, label, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const { playType } = useCyberSound();

    return (
      <div className="relative w-full group">
        {label && (
          <label className="block text-xs font-mono text-primary/70 mb-1 uppercase tracking-wider group-focus-within:text-primary transition-colors">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <span className="absolute left-3 text-primary font-mono text-lg">
            {">"}
          </span>
          <input
            ref={ref}
            className={cn(
              "cyber-input pl-8 bg-background text-foreground border-primary/50 placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary",
              isFocused && "box-glow",
              className
            )}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            onKeyDown={(e) => {
              playType();
              props.onKeyDown?.(e);
            }}
            {...props}
          />
          <div className="absolute right-3 w-2 h-4 bg-primary/50 animate-pulse" />
        </div>
      </div>
    );
  }
);

TerminalInput.displayName = "TerminalInput";

export default TerminalInput;
