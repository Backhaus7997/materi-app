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
    <div className="min-h-screen flex items-center justify-center bg-[#121212] px-4 py-8">
      <div className="w-full max-w-4xl">
        {/* Logo y título */}
        <div className="text-center mb-8 md:mb-12">
          <div className="flex justify-center mb-4 md:mb-6">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-[#E53935] to-[#C62828] flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-3xl md:text-4xl">M</span>
            </div>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-[#F5F5F5] mb-2 md:mb-3">Bienvenido a Materi</h1>
          <p className="text-[#B0B0B0] text-sm md:text-lg">Seleccioná tu tipo de cuenta para continuar</p>
        </div>

        {/* Tarjetas de selección de rol */}
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          {/* Tarjeta Proveedor */}
          <Card
            className="bg-[#1E1E1E] border-[#2A2A2A] hover:border-[#E53935] transition-all cursor-pointer group"
            onClick={() => handleRoleSelect('Supplier')}
          >
            <CardContent className="p-6 md:p-8 text-center">
              <div className="mb-4 md:mb-6 flex justify-center">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-[#2A2A2A] group-hover:bg-[#E53935]/20 flex items-center justify-center transition-colors">
                  <Building2 className="w-8 h-8 md:w-10 md:h-10 text-[#E53935]" />
                </div>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-[#F5F5F5] mb-2 md:mb-3">Soy Proveedor</h2>
              <p className="text-[#B0B0B0] text-xs md:text-sm">
                Gestioná productos y recibí pedidos
              </p>
            </CardContent>
          </Card>

          {/* Tarjeta Vendedor */}
          <Card
            className="bg-[#1E1E1E] border-[#2A2A2A] hover:border-[#E53935] transition-all cursor-pointer group"
            onClick={() => handleRoleSelect('Vendor')}
          >
            <CardContent className="p-6 md:p-8 text-center">
              <div className="mb-4 md:mb-6 flex justify-center">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-[#2A2A2A] group-hover:bg-[#E53935]/20 flex items-center justify-center transition-colors">
                  <ShoppingCart className="w-8 h-8 md:w-10 md:h-10 text-[#E53935]" />
                </div>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-[#F5F5F5] mb-2 md:mb-3">Soy Vendedor</h2>
              <p className="text-[#B0B0B0] text-xs md:text-sm">
                Explorá productos y creá cotizaciones
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 md:mt-8">
          <p className="text-xs md:text-sm text-[#666]">
            Al continuar, aceptás los términos y condiciones de uso de Materi
          </p>
        </div>
      </div>
    </div>
  );
}
