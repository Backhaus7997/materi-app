import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Vendor"); // Vendor por defecto
  const [error, setError] = useState("");

  const registerMutation = useMutation({
    mutationFn: ({ name, email, password, user_role }) =>
      api.auth.register({ name, email, password, user_role }),
    onSuccess: (user) => {
      // redirigimos según rol
      if (user.user_role === "Supplier") {
        navigate("/SupplierDashboard");
      } else {
        navigate("/VendorDashboard");
      }
    },
    onError: async (err) => {
      console.error("Error al registrar", err);
      setError("No se pudo crear la cuenta. Revisá los datos e intentá de nuevo.");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password) {
      setError("Todos los campos son obligatorios.");
      return;
    }

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
        <CardHeader>
          <CardTitle className="text-[#F5F5F5] text-2xl text-center">
            Crear cuenta en Materi
          </CardTitle>
          <CardDescription className="text-[#B0B0B0] text-center">
            Registrate como vendedor o proveedor para empezar a usar la plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-sm text-red-400 bg-red-900/20 border border-red-900/40 rounded px-3 py-2">
                {error}
              </div>
            )}

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
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-[#121212] border-[#2A2A2A] text-[#F5F5F5]"
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="role" className="text-[#F5F5F5]">
                Tipo de cuenta
              </Label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-md border border-[#2A2A2A] bg-[#121212] text-[#F5F5F5] px-3 py-2 text-sm"
              >
                <option value="Vendor">Vendedor</option>
                <option value="Supplier">Proveedor</option>
              </select>
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
