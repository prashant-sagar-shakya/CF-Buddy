import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "@/context/UserContext";
import { ThemeProvider } from "@/context/ThemeContext";

// Page components
import IndexPageContent from "./pages/Index";
import Dashboard from "@/components/Dashboard";
import AnalyticsPage from "./pages/AnalyticsPage";
import NotFoundPage from "./pages/NotFound";

// Layout components
import Layout from "@/components/Layout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <UserProvider>
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<IndexPageContent />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route
                  path="/analytics/:handleFromUrl"
                  element={<AnalyticsPage />}
                />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Layout>
          </BrowserRouter>
          <Toaster />
          <Sonner />
        </UserProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
