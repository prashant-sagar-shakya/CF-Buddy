import React from "react";
import { Heart } from "lucide-react";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const portfolioLink = "https://my-first-portfolio-mu.vercel.app/";

  return (
    <footer className="bg-card/80 dark:bg-dark-blue/20 backdrop-blur-sm border-t border-border dark:border-dark-blue/30 text-muted-foreground py-2 mt-auto w-full">
      <div className="container mx-auto px-4 text-center text-sm">
        <div className="flex justify-center items-center space-x-2 sm:space-y-0 sm:space-x-2 mb-2">
          <span>Made with</span>
          <Heart className="inline-block h-4 w-4 text-red-500 fill-red-500 dark:text-red-400 dark:fill-red-400" />
          <span>by</span>
          <a
            href={portfolioLink}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary dark:text-dark-purple hover:underline transition-colors duration-200"
          >
            Prashant Sagar Shakya
          </a>
        </div>
        <p>© {currentYear} Prashant Sagar Shakya. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
