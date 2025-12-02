import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, ShoppingCart, Loader2 } from 'lucide-react';

export default function RoleSelection() {
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const selectRole = async (role) => {
    setSaving(true);
    await base44.auth.updateMe({ user_role: role });
    
    if (role === 'Supplier') {
      navigate(createPageUrl('SupplierDashboard'));
    } else {
      navigate(createPageUrl('VendorDashboard'));
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E53935] to-[#C62828] flex items-center justify-center mx-auto mb-6">
            <span className="text-white font-bold text-3xl">M</span>
          </div>
          <h1 className="text-3xl font-bold text-[#F5F5F5]">Bienvenido a Materi</h1>
          <p className="text-[#B0B0B0] mt-2 text-lg">Elige tu rol para comenzar</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card 
            className="cursor-pointer bg-[#1E1E1E] border-[#2A2A2A] hover:shadow-lg hover:border-[#E53935]/50 transition-all duration-300 group"
            onClick={() => !saving && selectRole('Supplier')}
          >
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 rounded-2xl bg-[#E53935]/20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Building2 className="w-10 h-10 text-[#E53935]" />
              </div>
              <h2 className="text-xl font-bold text-[#F5F5F5] mb-2">Soy proveedor</h2>
              <p className="text-[#B0B0B0]">
                Administra tu catálogo de productos, precios e información para que los vendedores puedan explorar
              </p>
              <Button 
                className="mt-6 bg-[#E53935] hover:bg-[#C62828] text-white w-full"
                disabled={saving}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continuar como proveedor'}
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer bg-[#1E1E1E] border-[#2A2A2A] hover:shadow-lg hover:border-[#E53935]/50 transition-all duration-300 group"
            onClick={() => !saving && selectRole('Vendor')}
          >
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 rounded-2xl bg-[#E53935]/20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <ShoppingCart className="w-10 h-10 text-[#E53935]" />
              </div>
              <h2 className="text-xl font-bold text-[#F5F5F5] mb-2">Soy vendedor</h2>
              <p className="text-[#B0B0B0]">
                Explora proveedores y productos, crea presupuestos con márgenes de ganancia para clientes
              </p>
              <Button 
                className="mt-6 bg-[#E53935] hover:bg-[#C62828] text-white w-full"
                disabled={saving}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continuar como vendedor'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}