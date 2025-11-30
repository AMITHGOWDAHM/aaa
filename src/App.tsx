
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Web3Provider } from "./contexts/Web3Context";
import Navbar from "./components/Navbar";
import Index from "./pages/Index";
import Marketplace from "./pages/Marketplace";
import Upload from "./pages/Upload";
import Profile from "./pages/Profile";
import Dataset from "./pages/DatasetDetail";
import NotFound from "./pages/NotFound";
import DatasetDetail from "./pages/DatasetDetail";
import QualityAnalyzer from "./pages/QualityAnalyzer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Web3Provider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <Navbar />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/profile" element={<Profile />} />
                 <Route path="/QualityAnalyzer" element={<QualityAnalyzer />} />

              <Route path="/dataset/:id" element={<DatasetDetail />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </Web3Provider>
  </QueryClientProvider>
);

export default App;
