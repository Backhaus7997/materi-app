
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Building2, 
  Package, 
  ShoppingCart,
  FileText, 
  Menu, 
  X,
  ChevronRight,
  LogOut,
  Home,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const vendorNavItems = [
  { name: 'Panel', icon: Home, page: 'VendorDashboard' },
  { name: 'Proveedores', icon: Building2, page: 'VendorSuppliers' },
  { name: 'Productos', icon: Package, page: 'VendorProducts' },
  { name: 'Carrito / Presupuesto', icon: ShoppingCart, page: 'VendorCart' },
  { name: 'Presupuestos', icon: FileText, page: 'Quotes' },
];

// Pages that don't need the layout
const noLayoutPages = ['RoleSelection', 'SupplierDashboard'];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });



  const { data: cartItems = [] } = useQuery({
    queryKey: ['cartItems', user?.id],
    queryFn: () => base44.entities.CartItem.filter({ vendor_id: user.id }),
    enabled: !!user?.id && user?.user_role === 'Vendor'
  });

  // Handle role-based redirects
  useEffect(() => {
    if (userLoading) return;
    
    if (user && !user.user_role && currentPageName !== 'RoleSelection') {
      navigate(createPageUrl('RoleSelection'));
      return;
    }

    if (user?.user_role === 'Supplier' && !noLayoutPages.includes(currentPageName)) {
      navigate(createPageUrl('SupplierDashboard'));
      return;
    }

    if (user?.user_role === 'Vendor' && currentPageName === 'SupplierDashboard') {
      navigate(createPageUrl('VendorDashboard'));
      return;
    }
  }, [user, userLoading, currentPageName, navigate]);

  const handleLogout = () => {
    base44.auth.logout();
  };

  // Show no layout for certain pages
  if (noLayoutPages.includes(currentPageName)) {
    return <>{children}</>;
  }

  // Loading state
  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <Loader2 className="w-8 h-8 animate-spin text-[#E53935]" />
      </div>
    );
  }

  // If user is a supplier, they shouldn't see the vendor layout
  if (user?.user_role === 'Supplier') {
    return <>{children}</>;
  }

  const navItems = vendorNavItems;
  const cartCount = cartItems.length;

  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#1E1E1E] border-b border-[#2A2A2A] z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-[#2A2A2A] transition-colors"
          >
            <Menu className="w-6 h-6 text-[#F5F5F5]" />
          </button>
          <span className="text-xl font-semibold text-[#F5F5F5] tracking-tight">Materi</span>
        </div>
        <Badge className="bg-[#E53935]/20 text-[#E53935]">Vendedor</Badge>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-72 bg-[#1E1E1E] border-r border-[#2A2A2A] z-50 transition-transform duration-300 ease-out flex flex-col",
        "lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-[#2A2A2A]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E53935] to-[#C62828] flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="text-xl font-semibold text-[#F5F5F5] tracking-tight">Materi</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-[#2A2A2A] transition-colors"
          >
            <X className="w-5 h-5 text-[#B0B0B0]" />
          </button>
        </div>

        <div className="px-4 py-3">
          <Badge className="bg-[#E53935]/20 text-[#E53935] w-full justify-center">Cuenta de vendedor</Badge>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentPageName === item.page || 
              (currentPageName === 'QuoteBuilder' && item.page === 'Quotes') ||
              (currentPageName === 'ProductDetail' && item.page === 'VendorProducts');
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  isActive 
                    ? "bg-[#E53935]/20 text-[#E53935]" 
                    : "text-[#B0B0B0] hover:bg-[#2A2A2A] hover:text-[#F5F5F5]"
                )}
              >
                <div className="relative">
                  <item.icon className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-[#E53935]" : "text-[#B0B0B0]"
                  )} />
                  {item.page === 'VendorCart' && cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#E53935] text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="font-medium">{item.name}</span>
                {isActive && (
                  <ChevronRight className="w-4 h-4 ml-auto text-[#E53935]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#2A2A2A] space-y-3">
          <div className="px-4 py-3 rounded-xl bg-[#2A2A2A]">
            <p className="text-xs text-[#B0B0B0] font-medium truncate">{user?.email}</p>
            <p className="text-sm text-[#F5F5F5] mt-0.5">Panel de vendedor</p>
          </div>

          <Button 
            variant="ghost" 
            className="w-full justify-start text-[#B0B0B0] hover:text-[#E53935] hover:bg-[#2A2A2A]"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-72 min-h-screen pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
