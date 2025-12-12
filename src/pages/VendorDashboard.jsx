import React, { useEffect } from 'react';
import { api } from "@/api/apiClient";
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Package, 
  ShoppingCart, 
  FileText,
  TrendingUp,
  Loader2,
  ArrowRight
} from 'lucide-react';

export default function VendorDashboard() {
  const navigate = useNavigate();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api.auth.me()
  });

  // Redirect if not a vendor
  useEffect(() => {
    if (user && user.user_role === 'Supplier') {
      navigate(createPageUrl('SupplierDashboard'));
    } else if (user && !user.user_role) {
      navigate(createPageUrl('RoleSelection'));
    }
  }, [user, navigate]);

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.entities.Supplier.filter({ active: true })
  });

  const { data: products = [] } = useQuery({
    queryKey: ['allProducts'],
    queryFn: () => api.entities.Product.filter({ active: true })
  });

  const { data: cartItems = [] } = useQuery({
    queryKey: ['cartItems', user?.id],
    queryFn: () => api.entities.CartItem.filter({ vendor_id: user.id }),
    enabled: !!user?.id
  });

  const { data: quotes = [], isLoading: quotesLoading, error: quotesError } = useQuery({
    queryKey: ['quotes', user?.id],
    enabled: !!user?.id,
    queryFn: () => api.entities.Quote.filter({ vendor_id: user.id }),
  });


  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <Loader2 className="w-8 h-8 animate-spin text-[#E53935]" />
      </div>
    );
  }

  const cartTotal = cartItems.reduce((sum, item) => {
    return sum + (item.unit_cost_price * item.quantity);
  }, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#F5F5F5]">¡Bienvenido de nuevo!</h1>
        <p className="text-[#B0B0B0] mt-1">Aquí tienes un resumen de tu actividad como vendedor</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#1E1E1E] border-[#2A2A2A]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#B0B0B0]">Proveedores activos</p>
                <p className="text-2xl font-bold text-[#F5F5F5] mt-1">{suppliers.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#E53935]/20 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-[#E53935]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1E1E1E] border-[#2A2A2A]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#B0B0B0]">Productos disponibles</p>
                <p className="text-2xl font-bold text-[#F5F5F5] mt-1">{products.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#E53935]/20 flex items-center justify-center">
                <Package className="w-6 h-6 text-[#E53935]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1E1E1E] border-[#2A2A2A]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#B0B0B0]">Ítems en carrito</p>
                <p className="text-2xl font-bold text-[#F5F5F5] mt-1">{cartItems.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#E53935]/20 flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-[#E53935]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1E1E1E] border-[#2A2A2A]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#B0B0B0]">Valor del carrito</p>
                <p className="text-2xl font-bold text-[#F5F5F5] mt-1">${cartTotal.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-900/30 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#1E1E1E] border-[#2A2A2A] hover:shadow-lg hover:border-[#E53935]/50 transition-all cursor-pointer group">
          <Link to={createPageUrl('VendorSuppliers')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#E53935]/20 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-[#E53935]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#F5F5F5]">Explorar proveedores</h3>
                    <p className="text-sm text-[#B0B0B0]">Ver todos los proveedores disponibles</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-[#B0B0B0] group-hover:text-[#E53935] transition-colors" />
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="bg-[#1E1E1E] border-[#2A2A2A] hover:shadow-lg hover:border-[#E53935]/50 transition-all cursor-pointer group">
          <Link to={createPageUrl('VendorProducts')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#E53935]/20 flex items-center justify-center">
                    <Package className="w-6 h-6 text-[#E53935]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#F5F5F5]">Explorar productos</h3>
                    <p className="text-sm text-[#B0B0B0]">Explora todos los productos</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-[#B0B0B0] group-hover:text-[#E53935] transition-colors" />
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="bg-[#1E1E1E] border-[#2A2A2A] hover:shadow-lg hover:border-[#E53935]/50 transition-all cursor-pointer group">
          <Link to={createPageUrl('VendorCart')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#E53935]/20 flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-[#E53935]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#F5F5F5]">Ver carrito</h3>
                    <p className="text-sm text-[#B0B0B0]">{cartItems.length} ítems en el carrito</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-[#B0B0B0] group-hover:text-[#E53935] transition-colors" />
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Recent Quotes */}
      <Card className="bg-[#1E1E1E] border-[#2A2A2A]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[#F5F5F5]">
            <FileText className="w-5 h-5 text-[#E53935]" />
            Presupuestos recientes
          </CardTitle>
          <Link to={createPageUrl('Quotes')}>
            <Button variant="ghost" size="sm" className="text-[#B0B0B0] hover:text-[#E53935] hover:bg-[#2A2A2A]">
              Ver todos
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {quotes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto mb-3 text-[#2A2A2A]" />
              <p className="text-[#B0B0B0]">Todavía no hay presupuestos</p>
              <Link to={createPageUrl('VendorCart')}>
                <Button variant="outline" className="mt-4 border-[#2A2A2A] text-[#B0B0B0] hover:bg-[#2A2A2A] hover:text-[#F5F5F5]">
                  Crea tu primer presupuesto
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {quotes.slice(0, 5).map(quote => (
                <Link 
                  key={quote.id}
                  to={createPageUrl(`QuoteBuilder?id=${quote.id}`)}
                  className="flex items-center justify-between p-4 rounded-lg border border-[#2A2A2A] hover:border-[#E53935]/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium text-[#F5F5F5]">{quote.customer_name}</p>
                      <p className="text-sm text-[#B0B0B0]">{quote.quote_number}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={
                      quote.status === 'Accepted' ? 'bg-emerald-900/30 text-emerald-400' :
                      quote.status === 'Sent' ? 'bg-blue-900/30 text-blue-400' :
                      quote.status === 'Rejected' ? 'bg-red-900/30 text-red-400' :
                      'bg-[#2A2A2A] text-[#B0B0B0]'
                    }>
                      {quote.status || 'Draft'}
                    </Badge>
                    <span className="font-semibold text-emerald-400">
                      ${(quote.total_profit_amount || 0).toFixed(2)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}