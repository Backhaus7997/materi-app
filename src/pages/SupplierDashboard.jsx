import React, { useState, useEffect } from 'react';
import { api } from "@/api/apiClient";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
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
    toast.error("No se puede guardar el proveedor", {
      description: errors.join("\n")
    });
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
    onSuccess: async () => {
      toast.success("Perfil creado exitosamente", {
        description: "Iniciá sesión nuevamente para continuar."
      });
      setSupplierFormOpen(false);

      // Hacer logout para que el usuario vuelva a iniciar sesión
      // y el JWT se regenere con el supplier_id correcto
      setTimeout(async () => {
        await api.auth.logout();
        navigate(createPageUrl('login'));
      }, 1500);
    },
    onError: (error) => {
      console.error('Failed to create supplier:', error);
      toast.error("Error al crear proveedor", {
        description: "No se pudo crear el proveedor. Intentá de nuevo."
      });
    }
  });

  const updateSupplierMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Supplier.update(id, data),
    onSuccess: () => {
      toast.success("Proveedor actualizado", {
        description: "Los cambios se guardaron correctamente."
      });
      queryClient.invalidateQueries({ queryKey: ['mySupplier'] });
      setSupplierFormOpen(false);
    },
    onError: (error) => {
      console.error('Failed to update supplier:', error);
      toast.error("Error al actualizar proveedor", {
        description: "No se pudieron guardar los cambios."
      });
    }
  });

  const createProductMutation = useMutation({
    mutationFn: (data) => api.entities.Product.create({
      ...data,
      supplier_id: user.supplier_id,
      supplier_name: supplierData?.name || ''
    }),
    onSuccess: () => {
      toast.success("Producto creado", {
        description: "El producto se agregó al catálogo."
      });
      queryClient.invalidateQueries({ queryKey: ['supplierProducts'] });
      setProductFormOpen(false);
      setSelectedProduct(null);
    },
    onError: (error) => {
      console.error('Failed to create product:', error);
      toast.error("Error al crear producto", {
        description: "No se pudo crear el producto. Intentá de nuevo."
      });
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Product.update(id, data),
    onSuccess: () => {
      toast.success("Producto actualizado", {
        description: "Los cambios se guardaron correctamente."
      });
      queryClient.invalidateQueries({ queryKey: ['supplierProducts'] });
      setProductFormOpen(false);
      setSelectedProduct(null);
    },
    onError: (error) => {
      console.error('Failed to update product:', error);
      toast.error("Error al actualizar producto", {
        description: "No se pudieron guardar los cambios."
      });
    }
  });

  // 🔐 logout real para proveedores
  const logoutMutation = useMutation({
    mutationFn: () => api.auth.logout(),
    onSuccess: async () => {
      toast.success("Sesión cerrada", {
        description: "Hasta pronto!"
      });
      await queryClient.clear();
      navigate('/login');
    },
    onError: async (err) => {
      console.error('Error al cerrar sesión (supplier)', err);
      toast.error("Error al cerrar sesión", {
        description: "Hubo un problema. Volvé a intentarlo."
      });
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
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 md:h-16">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg md:rounded-xl bg-gradient-to-br from-[#E53935] to-[#C62828] flex items-center justify-center">
                <span className="text-white font-bold text-base md:text-lg">M</span>
              </div>
              <span className="text-base md:text-xl font-semibold text-[#F5F5F5]">Materi</span>
              <Badge className="bg-[#E53935]/20 text-[#E53935] ml-1 md:ml-2 text-[10px] md:text-xs">Proveedor</Badge>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <span className="text-xs md:text-sm text-[#B0B0B0] hidden sm:block truncate max-w-[120px] md:max-w-none">{user?.email}</span>

              <Button
                variant="ghost"
                size="sm"
                className="text-[#B0B0B0] hover:text-[#E53935] hover:bg-[#2A2A2A] h-8 md:h-9 text-xs md:text-sm px-2 md:px-3"
                onClick={handleLogout}
                disabled={logoutMutation.isLoading}
              >
                <LogOut className="w-3.5 h-3.5 md:w-4 md:h-4 md:mr-2" />
                <span className="hidden md:inline">{logoutMutation.isLoading ? "Cerrando..." : "Cerrar sesión"}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8">
        {needsSupplierSetup ? (
          <Card className="max-w-xl mx-auto bg-[#1E1E1E] border-[#2A2A2A]">
            <CardContent className="p-6 md:p-8 text-center">
              <Building2 className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-[#B0B0B0]" />
              <h2 className="text-base md:text-xl font-bold text-[#F5F5F5] mb-2">Configura tu perfil de proveedor</h2>
              <p className="text-[#B0B0B0] mb-4 md:mb-6 text-xs md:text-sm">
                Crea tu perfil de proveedor para empezar a agregar productos que los vendedores puedan explorar y cotizar.
              </p>
              <Button
                onClick={() => setSupplierFormOpen(true)}
                className="bg-[#E53935] hover:bg-[#C62828] text-white h-9 md:h-10 text-xs md:text-sm"
              >
                <Plus className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2" />
                Crear perfil de proveedor
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 md:space-y-8">
            {/* Supplier Info Card */}
            <Card className="bg-[#1E1E1E] border-[#2A2A2A]">
              <CardHeader className="flex flex-row items-center justify-between pb-3 md:pb-6">
                <CardTitle className="flex items-center gap-2 text-[#F5F5F5] text-sm md:text-base">
                  <Building2 className="w-4 h-4 md:w-5 md:h-5 text-[#E53935]" />
                  Información del proveedor
                </CardTitle>
                <Button variant="outline" size="sm" className="border-[#2A2A2A] text-[#99999] hover:bg-[#2A2A2A] hover:text-[#F5F5F5] h-8 md:h-9 px-2 md:px-3 text-xs md:text-sm" onClick={() => setSupplierFormOpen(true)}>
                  <Pencil className="w-3.5 h-3.5 md:w-4 md:h-4 md:mr-2" />
                  <span className="hidden md:inline">Editar</span>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  <div>
                    <p className="text-xs md:text-sm text-[#B0B0B0]">Nombre de la empresa</p>
                    <p className="font-semibold text-[#F5F5F5] mt-1 text-sm md:text-base">{supplierData?.name}</p>
                    {supplierData?.company_name && (
                      <p className="text-xs md:text-sm text-[#B0B0B0]">{supplierData.company_name}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-[#B0B0B0]">Persona de contacto</p>
                    <p className="font-medium text-[#F5F5F5] mt-1 text-sm md:text-base">
                      {supplierData?.contact_person || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-[#B0B0B0]">Información de contacto</p>
                    <div className="mt-1 space-y-1">
                      {supplierData?.email && (
                        <p className="text-xs md:text-sm flex items-center gap-2 text-[#F5F5F5]">
                          <Mail className="w-3 h-3 text-[#B0B0B0]" />
                          <span className="truncate">{supplierData.email}</span>
                        </p>
                      )}
                      {supplierData?.phone && (
                        <p className="text-xs md:text-sm flex items-center gap-2 text-[#F5F5F5]">
                          <Phone className="w-3 h-3 text-[#B0B0B0]" />
                          {supplierData.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-[#B0B0B0]">Dirección</p>
                    <p className="text-xs md:text-sm text-[#F5F5F5] mt-1 flex items-start gap-2">
                      {supplierData?.address ? (
                        <>
                          <MapPin className="w-3 h-3 text-[#B0B0B0] mt-0.5 shrink-0" />
                          <span className="line-clamp-2">{supplierData.address}</span>
                        </>
                      ) : '—'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Products Section */}
            <div className="space-y-3 md:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
                <div>
                  <h2 className="text-base md:text-xl font-bold text-[#F5F5F5]">Mis productos</h2>
                  <p className="text-[#B0B0B0] text-xs md:text-sm">Administra tu catálogo de productos</p>
                </div>
                <Button
                  onClick={() => { setSelectedProduct(null); setProductFormOpen(true); }}
                  className="bg-[#E53935] hover:bg-[#C62828] text-white h-9 md:h-10 text-xs md:text-sm"
                >
                  <Plus className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2" />
                  Agregar producto
                </Button>
              </div>

              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-[#B0B0B0]" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar productos..."
                  className="pl-9 md:pl-10 bg-[#1E1E1E] border-[#2A2A2A] text-[#F5F5F5] placeholder:text-[#B0B0B0] h-9 md:h-10 text-xs md:text-sm"
                />
              </div>

              <Card className="bg-[#1E1E1E] border-[#2A2A2A] overflow-hidden">
                {productsLoading ? (
                  <div className="flex items-center justify-center py-12 md:py-20">
                    <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin text-[#E53935]" />
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-12 md:py-20">
                    <Package className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-[#2A2A2A]" />
                    <p className="text-[#B0B0B0] text-base md:text-lg">Todavía no hay productos</p>
                    <p className="text-[#666] text-xs md:text-sm mt-1">Agrega tu primer producto para comenzar</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#2A2A2A] border-[#2A2A2A]">
                          <TableHead className="text-[#B0B0B0] text-center text-xs md:text-sm">Producto</TableHead>
                          <TableHead className="hidden md:table-cell text-[#B0B0B0] text-center text-xs md:text-sm">Código</TableHead>
                          <TableHead className="hidden lg:table-cell text-[#B0B0B0] text-center text-xs md:text-sm">Categoría</TableHead>
                          <TableHead className="text-[#B0B0B0] text-center text-xs md:text-sm">Precio</TableHead>
                          <TableHead className="text-[#B0B0B0] text-center text-xs md:text-sm">Estado</TableHead>
                          <TableHead className="w-10 md:w-12 text-center"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.map((product) => (
                          <TableRow key={product.id} className="border-[#2A2A2A]">
                            <TableCell className="align-middle py-3">
                              <div className="flex items-center justify-center gap-2 md:gap-3">
                                {product.image_url ? (
                                  <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="w-8 h-8 md:w-10 md:h-10 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-[#2A2A2A] flex items-center justify-center">
                                    <Package className="w-4 h-4 md:w-5 md:h-5 text-[#B0B0B0]" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="font-medium text-[#F5F5F5] text-xs md:text-sm truncate">{product.name}</p>
                                  {product.description && (
                                    <p className="text-[10px] md:text-xs text-[#B0B0B0] line-clamp-1 max-w-[120px] md:max-w-[200px]">
                                      {product.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-[#B0B0B0] font-mono text-xs md:text-sm hidden md:table-cell text-center align-middle py-3">
                              {product.internal_code || '—'}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-center align-middle py-3">
                              {product.category ? (
                                <Badge variant="outline" className="border-[#2A2A2A] text-[#B0B0B0] mx-auto text-xs">{product.category}</Badge>
                              ) : '—'}
                            </TableCell>
                            <TableCell className="text-center align-middle py-3">
                              <div className="flex flex-col items-center">
                                <span className="font-semibold text-[#F5F5F5] text-xs md:text-sm">
                                  {product.base_price?.toFixed(2)} {product.currency || 'USD'}
                                </span>
                                <span className="text-[10px] md:text-xs text-[#B0B0B0]">
                                  /{product.unit_of_measure}
                                </span>
                              </div>
                            </TableCell>

                            <TableCell className="text-center align-middle py-3">
                              <Badge className={`text-[10px] md:text-xs ${product.active !== false
                                ? 'bg-emerald-900/30 text-emerald-400 mx-auto'
                                : 'bg-[#2A2A2A] text-[#B0B0B0] mx-auto'}`}>
                                {product.active !== false ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center align-middle py-3">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 text-[#B0B0B0] hover:bg-[#2A2A2A]">
                                    <MoreHorizontal className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-[#1E1E1E] border-[#2A2A2A]">
                                  <DropdownMenuItem onClick={() => handleEditProduct(product)} className="text-[#F5F5F5] focus:bg-[#2A2A2A] focus:text-[#F5F5F5] text-xs md:text-sm">
                                    <Pencil className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => toggleProductActive(product)} className="text-[#F5F5F5] focus:bg-[#2A2A2A] focus:text-[#F5F5F5] text-xs md:text-sm">
                                    <Power className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2" />
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