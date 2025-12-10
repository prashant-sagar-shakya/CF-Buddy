import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import ThreeBackground from "./ThreeBackground";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden text-foreground">
      <ThreeBackground />

      <div className="z-10 flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 animate-fade-in">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
