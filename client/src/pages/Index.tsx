import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import NeonButton from "@/components/ui/NeonButton";
import HolographicCard from "@/components/ui/HolographicCard";
import { BarChart3Icon, BrainCircuit, Trophy } from "lucide-react";
import { useClerk, useUser } from "@clerk/clerk-react";

const Index = () => {
  const navigate = useNavigate();
  const { openSignIn } = useClerk();
  const { isSignedIn } = useUser();

  useEffect(() => {
    if (isSignedIn) {
      navigate("/dashboard");
    }
  }, [isSignedIn, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-8 relative z-10 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-6xl md:text-8xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-secondary animate-gradient-x pb-2">
            CF-BUDDY
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mt-4 font-light tracking-wide">
            THE <span className="text-primary font-bold">FUTURE</span> OF
            COMPETITIVE PROGRAMMING
          </p>
        </motion.div>

        <motion.div
          className="w-full max-w-md mx-auto space-y-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <NeonButton onClick={() => openSignIn()} className="w-full text-lg">
            INITIALIZE SYSTEM
          </NeonButton>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl px-4">
        <HolographicCard className="space-y-4">
          <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
            <BarChart3Icon className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-display font-bold text-foreground">
            Holographic Analytics
          </h3>
          <p className="text-sm text-muted-foreground">
            Visualize your progress with next-gen 3D charts and deep insights.
          </p>
        </HolographicCard>

        <HolographicCard className="space-y-4">
          <div className="h-12 w-12 rounded-full bg-secondary/20 flex items-center justify-center">
            <BrainCircuit className="h-6 w-6 text-secondary" />
          </div>
          <h3 className="text-xl font-display font-bold text-foreground">
            AI Companion
          </h3>
          <p className="text-sm text-muted-foreground">
            Get real-time strategy advice from our advanced AI core.
          </p>
        </HolographicCard>

        <HolographicCard className="space-y-4">
          <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center">
            <Trophy className="h-6 w-6 text-accent" />
          </div>
          <h3 className="text-xl font-display font-bold text-foreground">
            Gamified Growth
          </h3>
          <p className="text-sm text-muted-foreground">
            Unlock achievements and climb the global leaderboard.
          </p>
        </HolographicCard>
      </section>
    </div>
  );
};

export default Index;
