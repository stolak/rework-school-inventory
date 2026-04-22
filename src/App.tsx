import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Students from "./pages/Students";
import Classes from "./pages/Classes";
import Purchases from "./pages/Purchases";
import Sales from "./pages/Sales";
import Suppliers from "./pages/Suppliers";
import Categories from "./pages/Categories";
import SubCategories from "./pages/SubCategories";
import Brands from "./pages/Brands";
import Uoms from "./pages/Uoms";
import Sessions from "./pages/Sessions";
import ClassEntitlements from "./pages/ClassEntitlements";
import ClassInventoryDistributions from "./pages/ClassInventoryDistributions";
import StudentItemCollections from "./pages/StudentItemCollections";
import StudentInventoryReport from "./pages/StudentInventoryReport";
import InventoryCollectionsReport from "./pages/InventoryCollectionsReport";
import DistributionCollectionReport from "./pages/DistributionCollectionReport";
import ClassTeachers from "./pages/ClassTeachers";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/students" element={<Students />} />
        <Route path="/classes" element={<Classes />} />
        <Route path="/class-teachers" element={<ClassTeachers />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/sub-categories" element={<SubCategories />} />
          <Route path="/brands" element={<Brands />} />
          <Route path="/uoms" element={<Uoms />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/class-entitlements" element={<ClassEntitlements />} />
          <Route path="/class-distributions" element={<ClassInventoryDistributions />} />
          <Route path="/student-collections" element={<StudentItemCollections />} />
          <Route path="/reports/student-inventory" element={<StudentInventoryReport />} />
          <Route path="/reports/inventory-collections" element={<InventoryCollectionsReport />} />
          <Route path="/reports/distribution-collection" element={<DistributionCollectionReport />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
