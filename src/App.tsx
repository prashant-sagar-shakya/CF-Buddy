// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner"; // Assuming Sonner is a different toast library or type
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Page components
import IndexPageContent from "./pages/Index"; // Renamed to avoid conflict, this is just the Dashboard now
import AnalyticsPage from "./pages/AnalyticsPage"; // Your AnalyticsPage component
import NotFoundPage from "./pages/NotFound"; // Your NotFound component

// Layout components
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Context Providers
import { UserProvider } from "@/context/UserContext";
import { ThemeProvider } from "@/context/ThemeContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        {" "}
        {/* Global Theme Provider */}
        <UserProvider>
          {" "}
          {/* Global User Provider */}
          <BrowserRouter>
            {" "}
            {/* Router wraps everything that needs routing */}
            <div className="min-h-screen flex flex-col bg-code-bg dark:bg-dark-bg">
              {" "}
              {/* Global layout div */}
              <Header /> {/* Header is now part of the global layout */}
              <main className="flex-grow container mx-auto px-4 py-8">
                {" "}
                {/* Main content area */}
                <Routes>
                  <Route path="/" element={<IndexPageContent />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route
                    path="/analytics/:handleFromUrl"
                    element={<AnalyticsPage />}
                  />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </main>
              <Footer /> {/* Footer is now part of the global layout */}
            </div>
          </BrowserRouter>
          <Toaster /> {/* Shadcn Toaster */}
          <Sonner /> {/* Sonner Toaster */}
        </UserProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
