import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
  const navigate = useNavigate();

  // Obtener el rol seleccionado
  const selectedRole = localStorage.getItem('selectedRole') || 'Vendor';

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(selectedRole);
  const [showPassword, setShowPassword] = useState(false);

  const registerMutation = useMutation({
    mutationFn: ({ name, email, password, user_role }) =>
      api.auth.register({ name, email, password, user_role }),
    onSuccess: (data) => {
      // Cerrar toast de loading
      toast.dismiss("register-loading");

      // El backend devuelve { user: {...} }
      const user = data.user || data;

      toast.success("Cuenta creada exitosamente", {
        description: `Bienvenido/a, ${user.name}!`
      });

      // redirigimos según rol
      if (user.user_role === "Supplier") {
        navigate("/SupplierDashboard");
      } else {
        navigate("/VendorDashboard");
      }
    },
    onError: async (err) => {
      // Cerrar toast de loading
      toast.dismiss("register-loading");

      console.error("Error al registrar", err);
      // Intentar extraer el mensaje de error del servidor
      let errorMessage = "No se pudo crear la cuenta. Revisá los datos e intentá de nuevo.";
      try {
        const errorData = JSON.parse(err.message);
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        // Si no se puede parsear, usar el mensaje por defecto
      }
      toast.error("Error al crear cuenta", {
        description: errorMessage
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name || !email || !password) {
      toast.error("Campos incompletos", {
        description: "Todos los campos son obligatorios."
      });
      return;
    }

    toast.loading("Creando tu cuenta...", {
      description: "Esto puede tardar un minuto la primera vez.",
      id: "register-loading"
    });

    registerMutation.mutate({
      name,
      email,
      password,
      user_role: role,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121212] px-4">
      <Card className="w-full max-w-md bg-[#1E1E1E] border-[#2A2A2A]">
        <CardHeader className="space-y-4">
          {/* Logo de Materi */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E53935] to-[#C62828] flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-3xl">M</span>
            </div>
          </div>
          <CardTitle className="text-[#F5F5F5] text-2xl text-center">
            Materi
          </CardTitle>
          <p className="text-center text-sm text-[#B0B0B0]">
            Crear cuenta como <span className="text-[#E53935] font-semibold">{selectedRole === 'Supplier' ? 'Proveedor' : 'Vendedor'}</span>
          </p>
          <Link
            to="/"
            className="text-xs text-[#666] hover:text-[#E53935] transition-colors text-center block"
          >
            Cambiar tipo de cuenta
          </Link>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name" className="text-[#F5F5F5]">
                Nombre
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-[#121212] border-[#2A2A2A] text-[#F5F5F5]"
                placeholder="Tu nombre"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="email" className="text-[#F5F5F5]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#121212] border-[#2A2A2A] text-[#F5F5F5]"
                placeholder="tu@email.com"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-[#F5F5F5]">
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#121212] border-[#2A2A2A] text-[#F5F5F5] pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B0B0B0] hover:text-[#F5F5F5] transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#E53935] hover:bg-[#C62828] text-white mt-2"
              disabled={registerMutation.isLoading}
            >
              {registerMutation.isLoading && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Crear cuenta
            </Button>

            <p className="text-xs text-[#B0B0B0] text-center mt-2">
              ¿Ya tenés cuenta?{" "}
              <Link to="/login" className="text-[#E53935] hover:underline">
                Iniciar sesión
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
