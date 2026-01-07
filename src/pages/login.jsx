// src/pages/Login.jsx
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  // 👇 ahora empiezan vacíos
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Obtener el rol seleccionado
  const selectedRole = localStorage.getItem('selectedRole') || 'Vendor';

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }) => {
      return api.auth.login({ email, password });
    },
    onSuccess: async (data) => {
      // Cerrar toast de loading
      toast.dismiss("login-loading");

      // El backend devuelve { user: {...} }
      const user = data.user || data;

      toast.success("Sesión iniciada", {
        description: `Bienvenido/a de nuevo, ${user.name}!`
      });

      // refrescar el currentUser en React Query
      await queryClient.invalidateQueries({ queryKey: ["currentUser"] });

      // redirigir según rol
      if (user.user_role === "Supplier") {
        navigate("/SupplierDashboard");
      } else {
        navigate("/VendorDashboard");
      }
    },
    onError: (err) => {
      // Cerrar toast de loading
      toast.dismiss("login-loading");

      console.error(err);
      // Intentar extraer el mensaje de error del servidor
      let errorMessage = "Email o contraseña incorrectos";
      try {
        const errorData = JSON.parse(err.message);
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        // Si no se puede parsear, usar el mensaje por defecto
      }
      toast.error("Error al iniciar sesión", {
        description: errorMessage
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    toast.loading("Iniciando sesión...", {
      description: "Esto puede tardar un minuto la primera vez.",
      id: "login-loading"
    });

    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121212] px-4 py-8">
      <Card className="w-full max-w-md bg-[#1E1E1E] border-[#2A2A2A]">
        <CardHeader className="space-y-3 md:space-y-4 pb-4">
          {/* Logo de Materi */}
          <div className="flex justify-center">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-[#E53935] to-[#C62828] flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl md:text-3xl">M</span>
            </div>
          </div>
          <CardTitle className="text-center text-xl md:text-2xl font-bold text-[#F5F5F5]">
            Materi
          </CardTitle>
          <p className="text-center text-xs md:text-sm text-[#B0B0B0]">
            Iniciar sesión como <span className="text-[#E53935] font-semibold">{selectedRole === 'Supplier' ? 'Proveedor' : 'Vendedor'}</span>
          </p>
          <Link
            to="/"
            className="text-xs text-[#666] hover:text-[#E53935] transition-colors text-center block"
          >
            Cambiar tipo de cuenta
          </Link>
        </CardHeader>
        <CardContent className="pt-2">
          <form className="space-y-3 md:space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="email" className="text-[#F5F5F5] text-sm">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#121212] border-[#2A2A2A] text-[#F5F5F5] h-10 md:h-11"
                placeholder="tu@email.com"
              />
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="password" className="text-[#F5F5F5] text-sm">
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#121212] border-[#2A2A2A] text-[#F5F5F5] pr-10 h-10 md:h-11"
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
              className="w-full bg-[#E53935] hover:bg-[#C62828] text-white h-10 md:h-11 text-sm md:text-base"
              disabled={loginMutation.isLoading}
            >
              {loginMutation.isLoading && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {loginMutation.isLoading ? "Ingresando..." : "Entrar"}
            </Button>

            {/* Olvidé mi contraseña */}
            <div className="text-center pt-1">
              <Link
                to="/forgot-password"
                className="text-xs text-[#B0B0B0] hover:text-[#E53935] transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <p className="text-xs text-[#B0B0B0] text-center">
              ¿No tenés cuenta?{" "}
              <Link to="/register" className="text-[#E53935] hover:underline">
                Crear cuenta
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
