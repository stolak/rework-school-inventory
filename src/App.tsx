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
import AccountSubheads from "./pages/AccountSubheads";
import Uoms from "./pages/Uoms";
import Sessions from "./pages/Sessions";
import Terms from "./pages/Terms";
import ProjectSetup from "./pages/ProjectSetup";
import StudentItemCollections from "./pages/StudentItemCollections";
import StaffItemCollections from "./pages/StaffItemCollections";
import ItemInventoryDonations from "./pages/ItemInventoryDonations";
import ProjectDisbursement from "./pages/ProjectDisbursement";
import StoreSetup from "./pages/StoreSetup";
import StoreItemTransfer from "./pages/StoreItemTransfer";
import StudentInventoryReport from "./pages/StudentInventoryReport";
import InventoryCollectionsReport from "./pages/InventoryCollectionsReport";
import ItemBalanceReport from "./pages/ItemBalanceReport";
import ItemTransactionLogReport from "./pages/ItemTransactionLogReport";
import SubClasses from "./pages/SubClasses";
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
        <Route path="/sub-classes" element={<SubClasses />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/sub-categories" element={<SubCategories />} />
          <Route path="/brands" element={<Brands />} />
          <Route path="/account-subheads" element={<AccountSubheads />} />
          <Route path="/uoms" element={<Uoms />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/projects" element={<ProjectSetup />} />
          <Route path="/student-collections" element={<StudentItemCollections />} />
          <Route path="/staff-collections" element={<StaffItemCollections />} />
          <Route path="/donations" element={<ItemInventoryDonations />} />
          <Route path="/project-disbursement" element={<ProjectDisbursement />} />
          <Route path="/store-setup" element={<StoreSetup />} />
          <Route path="/store-transfers" element={<StoreItemTransfer />} />
          <Route path="/reports/student-inventory" element={<StudentInventoryReport />} />
          <Route path="/reports/inventory-collections" element={<InventoryCollectionsReport />} />
          <Route path="/reports/item-balances" element={<ItemBalanceReport />} />
          <Route path="/reports/item-transaction-log" element={<ItemTransactionLogReport />} />
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
