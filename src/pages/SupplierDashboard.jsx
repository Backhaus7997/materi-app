import React, { useState, useEffect } from 'react';
import { api } from "@/api/apiClient";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Building2, 
  Package, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Pencil, 
  Power, 
  Loader2,
  Mail,
  Phone,
  MapPin,
  LogOut,
  RefreshCw
} from 'lucide-react';
import SupplierForm from '@/components/suppliers/SupplierForm';
import ProductForm from '@/components/products/ProductForm';

// ----------------- VALIDACIONES (SUPPLIER) -----------------

const isValidEmail = (email) => {
  if (!email) return true; // opcional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
};

const isValidPhone = (phone) => {
  if (!phone) return true; // opcional
  const digits = String(phone).replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
};

const normalizePhone = (phone) => {
  if (!phone) return "";
  return String(phone).replace(/[^0-9+\-\s()]/g, ""); // deja números, +, -, espacios, ()
};

const validateSupplierBeforeSave = (data) => {
  const errors = [];

  if (!data?.name?.trim()) errors.push("• El nombre del proveedor es requerido.");

  if (data?.email && !isValidEmail(data.email)) {
    errors.push("• Email inválido. Ej: proveedor@empresa.com");
  }

  if (data?.phone && !isValidPhone(data.phone)) {
    errors.push("• Teléfono inválido. Ej: +54 11 2345-6789");
  }

  if (errors.length) {
    alert("No se puede guardar el proveedor:\n\n" + errors.join("\n"));
    return false;
  }

  return true;
};

export default function SupplierDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [supplierFormOpen, setSupplierFormOpen] = useState(false);
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api.auth.me()
  });

  // Redirect if not a supplier
  useEffect(() => {
    if (user && user.user_role !== 'Supplier') {
      navigate(createPageUrl('VendorDashboard'));
    } else if (user && !user.user_role) {
      navigate(createPageUrl('RoleSelection'));
    }
  }, [user, navigate]);

  const { data: supplierData, isLoading: supplierLoading } = useQuery({
    queryKey: ['mySupplier', user?.supplier_id],
    queryFn: async () => {
      if (!user?.supplier_id) return null;
      const results = await api.entities.Supplier.filter({ id: user.supplier_id });
      return results[0] || null;
    },
    enabled: !!user?.supplier_id
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['supplierProducts', user?.supplier_id],
    queryFn: () => api.entities.Product.filter({ supplier_id: user.supplier_id }, '-created_date'),
    enabled: !!user?.supplier_id
  });

  const createSupplierMutation = useMutation({
    mutationFn: async (data) => {
      const supplier = await api.entities.Supplier.create(data);
      await api.auth.updateMe({ supplier_id: supplier.id });
      return supplier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mySupplier'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setSupplierFormOpen(false);
    }
  });

  const updateSupplierMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Supplier.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mySupplier'] });
      setSupplierFormOpen(false);
    }
  });

  const createProductMutation = useMutation({
    mutationFn: (data) => api.entities.Product.create({
      ...data,
      supplier_id: user.supplier_id,
      supplier_name: supplierData?.name || ''
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplierProducts'] });
      setProductFormOpen(false);
      setSelectedProduct(null);
    },
    onError: (error) => {
      console.error('Failed to create product:', error);
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Product.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplierProducts'] });
      setProductFormOpen(false);
      setSelectedProduct(null);
    }
  });

  // 🔐 logout real para proveedores
  const logoutMutation = useMutation({
    mutationFn: () => api.auth.logout(),
    onSuccess: async () => {
      await queryClient.clear();
      navigate('/login');
    },
    onError: async (err) => {
      console.error('Error al cerrar sesión (supplier)', err);
      await queryClient.clear();
      navigate('/login');
    },
  });

  const handleSupplierSave = async (data) => {
    if (!validateSupplierBeforeSave(data)) return;

    const payload = {
      ...data,
      email: data?.email?.trim() || null,
      phone: normalizePhone(data?.phone),
    };

    if (supplierData) {
      await updateSupplierMutation.mutateAsync({ id: supplierData.id, data: payload });
    } else {
      await createSupplierMutation.mutateAsync(payload);
    }
  };


  const handleProductSave = async (data) => {
    if (selectedProduct) {
      await updateProductMutation.mutateAsync({ id: selectedProduct.id, data });
    } else {
      const productData = {
        ...data,
        supplier_id: user.supplier_id,
        supplier_name: supplierData?.name || ''
      };
      await createProductMutation.mutateAsync(productData);
    }
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setProductFormOpen(true);
  };

  const toggleProductActive = async (product) => {
    await updateProductMutation.mutateAsync({
      id: product.id,
      data: { active: !product.active }
    });
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.internal_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isLoading = userLoading || supplierLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <Loader2 className="w-8 h-8 animate-spin text-[#E53935]" />
      </div>
    );
  }

  const needsSupplierSetup = !user?.supplier_id || !supplierData;

  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Header */}
      <header className="bg-[#1E1E1E] border-b border-[#2A2A2A] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E53935] to-[#C62828] flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="text-xl font-semibold text-[#F5F5F5]">Materi</span>
              <Badge className="bg-[#E53935]/20 text-[#E53935] ml-2">Proveedor</Badge>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-[#B0B0B0] hidden sm:block">{user?.email}</span>

              <Button
                variant="ghost"
                size="sm"
                className="text-[#B0B0B0] hover:text-[#E53935] hover:bg-[#2A2A2A]"
                onClick={handleLogout}
                disabled={logoutMutation.isLoading}
              >
                <LogOut className="w-4 h-4 mr-2" />
                {logoutMutation.isLoading ? "Cerrando..." : "Cerrar sesión"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {needsSupplierSetup ? (
          <Card className="max-w-xl mx-auto bg-[#1E1E1E] border-[#2A2A2A]">
            <CardContent className="p-8 text-center">
              <Building2 className="w-16 h-16 mx-auto mb-4 text-[#B0B0B0]" />
              <h2 className="text-xl font-bold text-[#F5F5F5] mb-2">Configura tu perfil de proveedor</h2>
              <p className="text-[#B0B0B0] mb-6">
                Crea tu perfil de proveedor para empezar a agregar productos que los vendedores puedan explorar y cotizar.
              </p>
              <Button 
                onClick={() => setSupplierFormOpen(true)}
                className="bg-[#E53935] hover:bg-[#C62828] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear perfil de proveedor
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Supplier Info Card */}
            <Card className="bg-[#1E1E1E] border-[#2A2A2A]">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-[#F5F5F5]">
                  <Building2 className="w-5 h-5 text-[#E53935]" />
                  Información del proveedor
                </CardTitle>
                <Button variant="outline" size="sm" className="border-[#2A2A2A] text-[#B0B0B0] hover:bg-[#2A2A2A] hover:text-[#F5F5F5]" onClick={() => setSupplierFormOpen(true)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-[#B0B0B0]">Nombre de la empresa</p>
                    <p className="font-semibold text-[#F5F5F5] mt-1">{supplierData?.name}</p>
                    {supplierData?.company_name && (
                      <p className="text-sm text-[#B0B0B0]">{supplierData.company_name}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#B0B0B0]">Persona de contacto</p>
                    <p className="font-medium text-[#F5F5F5] mt-1">
                      {supplierData?.contact_person || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[#B0B0B0]">Información de contacto</p>
                    <div className="mt-1 space-y-1">
                      {supplierData?.email && (
                        <p className="text-sm flex items-center gap-2 text-[#F5F5F5]">
                          <Mail className="w-3 h-3 text-[#B0B0B0]" />
                          {supplierData.email}
                        </p>
                      )}
                      {supplierData?.phone && (
                        <p className="text-sm flex items-center gap-2 text-[#F5F5F5]">
                          <Phone className="w-3 h-3 text-[#B0B0B0]" />
                          {supplierData.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-[#B0B0B0]">Dirección</p>
                    <p className="text-sm text-[#F5F5F5] mt-1 flex items-start gap-2">
                      {supplierData?.address ? (
                        <>
                          <MapPin className="w-3 h-3 text-[#B0B0B0] mt-0.5 shrink-0" />
                          {supplierData.address}
                        </>
                      ) : '—'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Products Section */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#F5F5F5]">Mis productos</h2>
                  <p className="text-[#B0B0B0]">Administra tu catálogo de productos</p>
                </div>
                <Button
                  onClick={() => { setSelectedProduct(null); setProductFormOpen(true); }}
                  className="bg-[#E53935] hover:bg-[#C62828] text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar producto
                </Button>
              </div>

              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B0B0B0]" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar productos..."
                  className="pl-10 bg-[#1E1E1E] border-[#2A2A2A] text-[#F5F5F5] placeholder:text-[#B0B0B0]"
                />
              </div>

              <Card className="bg-[#1E1E1E] border-[#2A2A2A] overflow-hidden">
                {productsLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-[#E53935]" />
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-20">
                    <Package className="w-16 h-16 mx-auto mb-4 text-[#2A2A2A]" />
                    <p className="text-[#B0B0B0] text-lg">Todavía no hay productos</p>
                    <p className="text-[#666] text-sm mt-1">Agrega tu primer producto para comenzar</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#2A2A2A] border-[#2A2A2A] rounded-none">
                          <TableHead className="text-[#B0B0B0]">Producto</TableHead>
                          <TableHead className="hidden md:table-cell text-[#B0B0B0]">Código</TableHead>
                          <TableHead className="hidden lg:table-cell text-[#B0B0B0]">Categoría</TableHead>
                          <TableHead className="text-right text-[#B0B0B0]">Precio</TableHead>
                          <TableHead className="text-[#B0B0B0]">Estado</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.map((product) => (
                          <TableRow key={product.id} className="border-[#2A2A2A]">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {product.image_url ? (
                                  <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="w-10 h-10 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-[#2A2A2A] flex items-center justify-center">
                                    <Package className="w-5 h-5 text-[#B0B0B0]" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-[#F5F5F5]">{product.name}</p>
                                  {product.description && (
                                    <p className="text-xs text-[#B0B0B0] line-clamp-1 max-w-[200px]">
                                      {product.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-[#B0B0B0] font-mono text-sm hidden md:table-cell">
                              {product.internal_code || '—'}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {product.category ? (
                                <Badge variant="outline" className="border-[#2A2A2A] text-[#B0B0B0]">{product.category}</Badge>
                              ) : '—'}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-semibold text-[#F5F5F5]">
                                {product.base_price?.toFixed(2)} {product.currency || 'USD'}
                              </span>
                              <span className="text-xs text-[#B0B0B0] ml-1">
                                /{product.unit_of_measure}
                              </span>
                            </TableCell>

                            <TableCell>
                              <Badge className={product.active !== false
                                ? 'bg-emerald-900/30 text-emerald-400'
                                : 'bg-[#2A2A2A] text-[#B0B0B0]'}>
                                {product.active !== false ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-[#B0B0B0] hover:bg-[#2A2A2A]">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-[#1E1E1E] border-[#2A2A2A]">
                                  <DropdownMenuItem onClick={() => handleEditProduct(product)} className="text-[#F5F5F5] focus:bg-[#2A2A2A] focus:text-[#F5F5F5]">
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => toggleProductActive(product)} className="text-[#F5F5F5] focus:bg-[#2A2A2A] focus:text-[#F5F5F5]">
                                    <Power className="w-4 h-4 mr-2" />
                                    {product.active !== false ? 'Desactivar' : 'Activar'}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}
      </main>

      <SupplierForm
        open={supplierFormOpen}
        onOpenChange={setSupplierFormOpen}
        supplier={supplierData}
        onSave={handleSupplierSave}
      />

      <ProductForm
        open={productFormOpen}
        onOpenChange={setProductFormOpen}
        product={selectedProduct}
        suppliers={supplierData ? [supplierData] : []}
        onSave={handleProductSave}
        hideSupplierSelect={true}
      />
    </div>
  );
}
