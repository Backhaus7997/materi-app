import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, ShoppingCart } from "lucide-react";

export default function RoleSelectionInitial() {
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    // Guardar el rol seleccionado en localStorage
    localStorage.setItem('selectedRole', role);
    // Redirigir al login
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121212] px-4">
      <div className="w-full max-w-4xl">
        {/* Logo y título */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#E53935] to-[#C62828] flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-4xl">M</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-[#F5F5F5] mb-3">Bienvenido a Materi</h1>
          <p className="text-[#B0B0B0] text-lg">Seleccioná tu tipo de cuenta para continuar</p>
        </div>

        {/* Tarjetas de selección de rol */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Tarjeta Proveedor */}
          <Card
            className="bg-[#1E1E1E] border-[#2A2A2A] hover:border-[#E53935] transition-all cursor-pointer group"
            onClick={() => handleRoleSelect('Supplier')}
          >
            <CardContent className="p-8 text-center">
              <div className="mb-6 flex justify-center">
                <div className="w-20 h-20 rounded-xl bg-[#2A2A2A] group-hover:bg-[#E53935]/20 flex items-center justify-center transition-colors">
                  <Building2 className="w-10 h-10 text-[#E53935]" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-[#F5F5F5] mb-3">Soy Proveedor</h2>
              <p className="text-[#B0B0B0] text-sm">
                Gestioná productos y recibí pedidos
              </p>
            </CardContent>
          </Card>

          {/* Tarjeta Vendedor */}
          <Card
            className="bg-[#1E1E1E] border-[#2A2A2A] hover:border-[#E53935] transition-all cursor-pointer group"
            onClick={() => handleRoleSelect('Vendor')}
          >
            <CardContent className="p-8 text-center">
              <div className="mb-6 flex justify-center">
                <div className="w-20 h-20 rounded-xl bg-[#2A2A2A] group-hover:bg-[#E53935]/20 flex items-center justify-center transition-colors">
                  <ShoppingCart className="w-10 h-10 text-[#E53935]" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-[#F5F5F5] mb-3">Soy Vendedor</h2>
              <p className="text-[#B0B0B0] text-sm">
                Explorá productos y creá cotizaciones
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-[#666]">
            Al continuar, aceptás los términos y condiciones de uso de Materi
          </p>
        </div>
      </div>
    </div>
  );
}
