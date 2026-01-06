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
    <div className="min-h-screen flex items-center justify-center bg-[#121212] px-4">
      <Card className="w-full max-w-md bg-[#1E1E1E] border-[#2A2A2A]">
        <CardHeader>
          <CardTitle className="text-center text-xl text-[#F5F5F5]">
            Iniciar sesión
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#F5F5F5]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#121212] border-[#2A2A2A] text-[#F5F5F5]"
                placeholder="tu@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#F5F5F5]">
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
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
              className="w-full bg-[#E53935] hover:bg-[#C62828] text-white"
              disabled={loginMutation.isLoading}
            >
              {loginMutation.isLoading && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {loginMutation.isLoading ? "Ingresando..." : "Entrar"}
            </Button>

            <p className="text-xs text-[#B0B0B0] text-center mt-2">
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
