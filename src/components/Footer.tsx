import React from "react";
import { Heart } from "lucide-react";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const portfolioLink = "https://my-first-portfolio-mu.vercel.app/";

  return (
    <footer className="glass border-t border-white/10 text-muted-foreground py-4 mt-auto w-full z-10">
      <div className="container mx-auto px-4 text-center text-sm font-mono">
        <div className="flex justify-center items-center space-x-2 sm:space-y-0 sm:space-x-2 mb-2">
          <span>Made with</span>
          <Heart className="inline-block h-4 w-4 text-accent fill-accent animate-pulse" />
          <span>by</span>
          <a
            href={portfolioLink}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-primary hover:text-white hover:shadow-[0_0_10px_rgba(168,85,247,0.5)] transition-all duration-300"
          >
            Prashant Sagar Shakya
          </a>
        </div>
        <p className="text-xs opacity-70">
          © {currentYear} Prashant Sagar Shakya. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
