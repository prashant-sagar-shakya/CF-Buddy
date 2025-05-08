
import React from "react";
import Header from "@/components/Header";
import Dashboard from "@/components/Dashboard";
import { UserProvider } from "@/context/UserContext";
import { ThemeProvider } from "@/context/ThemeContext";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <ThemeProvider>
      <UserProvider>
        <div className="min-h-screen flex flex-col bg-code-bg dark:bg-dark-bg">
          <Dashboard />
        </div>
      </UserProvider>
    </ThemeProvider>
  );
};

export default Index;
