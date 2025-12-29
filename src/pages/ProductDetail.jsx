import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

import {
  Package,
  ArrowLeft,
  Loader2,
  Building2,
  ShoppingCart,
  Check,
  Plus,
  Minus,
} from "lucide-react";


export default function ProductDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [quantity, setQuantity] = useState(1);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api.auth.me()
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => api.entities.Product.filter({ id: productId }),
    enabled: !!productId
  });

  const product = products[0];

  const { data: supplier } = useQuery({
    queryKey: ['supplier', product?.supplier_id],
    queryFn: () => api.entities.Supplier.filter({ id: product.supplier_id }),
    enabled: !!product?.supplier_id
  });

  const addToCartMutation = useMutation({
    mutationFn: async ({ user, quantityToAdd }) => {
      console.log("Starting add to cart mutation for user:", user.id, "Quantity:", quantityToAdd);
      if (!user?.id) throw new Error("No se pudo identificar al usuario");

      // 1. Ensure Cart exists
      let cartId;
      try {
        // Force fetch list of carts
        const carts = await api.entities.Cart.filter({ vendor_id: user.id });
        console.log("Found carts:", carts);
        
        if (carts && carts.length > 0) {
          cartId = carts[0].id;
        } else {
          console.log("Creating new cart");
          const newCart = await api.entities.Cart.create({
              vendor_id: user.id,
              global_margin_percent: 20
          });
          cartId = newCart.id;
        }
      } catch (e) {
        console.error("Error fetching/creating cart:", e);
        throw new Error("Error al acceder al carrito: " + e.message);
      }

      const existingItems = await api.entities.CartItem.filter({
        vendor_id: user.id,
        product_id: product.id
      });

      console.log("Existing items:", existingItems);

      if (existingItems && existingItems.length > 0) {
        const existingItem = existingItems[0];
        const currentQty = parseFloat(existingItem.quantity) || 0;
        const addQty = parseFloat(quantityToAdd) || 1;
        const newTotalQty = currentQty + addQty;

        const supplierId = product.supplier_id ?? product.supplierId ?? "";
        const supplierName =
          product.supplier_name ?? product.supplierName ?? product.supplier_name ?? "";

        return await api.entities.CartItem.update(existingItem.id, {
          quantity: newTotalQty,
          supplier_id: supplierId,
          supplier_name: supplierName,
        });
      
        } else {
        // Create new cart item
        console.log("Creating new cart item");
        const supplierId = product.supplier_id ?? product.supplierId ?? "";
        const supplierName = product.supplier_name ?? product.supplierName ?? product.supplier_name ?? "";

        return await api.entities.CartItem.create({
          cart_id: cartId,
          vendor_id: user.id,
        
          // CLAVE: que siempre quede guardado el supplier_id correcto
          supplier_id: supplierId,
          supplier_name: supplierName,
        
          product_id: product.id,
          product_name: product.name,
          product_description: product.description || "",
          product_image_url: product.image_url || "",
          unit_of_measure: product.unit_of_measure || "unit",
          quantity: parseFloat(quantityToAdd) || 1,
          unit_cost_price: parseFloat(product.base_price) || 0,
          margin_percent: null
        });

      }
    },
      
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["cartItems"] });
        toast.success("Producto agregado al carrito", {
          description: `${quantity} ${product.unit_of_measure || 'unidad'}(es) agregada(s).`
        });
      },
      onError: (error) => {
        toast.error("Error al agregar producto", {
          description: error?.message || "No se pudo agregar el producto al carrito."
        });
      },
  });

  const handleAddToCart = () => {
    if (!user) {
      navigate(createPageUrl('RoleSelection'));
      return;
    }
    // Pass the current state values directly to the mutation function
    addToCartMutation.mutate({ user, quantityToAdd: quantity });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#E53935]" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <Package className="w-16 h-16 mx-auto mb-4 text-[#2A2A2A]" />
        <p className="text-[#B0B0B0] text-lg">Producto no encontrado</p>
        <Link to={createPageUrl('VendorProducts')}>
          <Button variant="outline" className="mt-4 border-[#2A2A2A] text-[#B0B0B0] hover:bg-[#2A2A2A] hover:text-[#F5F5F5]">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a productos
          </Button>
        </Link>
      </div>
    );
  }

  const supplierData = supplier?.[0];

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 text-[#B0B0B0] hover:bg-[#2A2A2A] hover:text-[#F5F5F5]">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="space-y-4">
          <div className="aspect-square rounded-2xl overflow-hidden bg-[#1E1E1E] border border-[#2A2A2A]">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-24 h-24 text-[#B0B0B0]" />
              </div>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link 
                to={createPageUrl('VendorSuppliers')}
                className="text-sm text-[#E53935] hover:text-[#C62828] flex items-center gap-1"
              >
                <Building2 className="w-3 h-3" />
                {product.supplier_name}
              </Link>
              {product.category && (
                <Badge variant="outline" className="border-[#2A2A2A] text-[#B0B0B0]">{product.category}</Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold text-[#F5F5F5]">{product.name}</h1>
            {product.internal_code && (
              <p className="text-sm text-[#B0B0B0] mt-1 font-mono">SKU: {product.internal_code}</p>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-[#E53935]">
              {product.base_price?.toFixed(2)} {product.currency || 'USD'}
            </span>
            <span className="text-lg text-[#B0B0B0]">
              per {product.unit_of_measure || 'unit'}
            </span>
          </div>


          {product.description && (
            <div>
              <h3 className="font-semibold text-[#F5F5F5] mb-2">Descripción</h3>
              <p className="text-[#B0B0B0] whitespace-pre-wrap">{product.description}</p>
            </div>
          )}

          {/* Supplier Info */}
          {supplierData && (
            <Card className="bg-[#1E1E1E] border-[#2A2A2A]">
              <CardContent className="p-4">
                <h3 className="font-semibold text-[#F5F5F5] mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#E53935]" />
                  Información del proveedor
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                 <div>
                    <p className="text-[#B0B0B0]">Empresa</p>
                    <p className="text-lg font-semibold text-[#F5F5F5] leading-tight">
                      {supplierData.company_name || "—"}
                    </p>

                    {supplierData.name ? (
                      <p className="text-xs text-[#B0B0B0] mt-1">
                        {supplierData.name}
                      </p>
                    ) : null}

                  </div>

                  {supplierData.contact_person && (
                    <div>
                      <p className="text-[#B0B0B0]">Contacto</p>
                      <p className="font-medium text-[#F5F5F5]">{supplierData.contact_person}</p>
                    </div>
                  )}
                  {supplierData.email && (
                    <div>
                      <p className="text-[#B0B0B0]">Correo</p>
                      <p className="font-medium text-[#F5F5F5]">{supplierData.email}</p>
                    </div>
                  )}
                  {supplierData.phone && (
                    <div>
                      <p className="text-[#B0B0B0]">Teléfono</p>
                      <p className="font-medium text-[#F5F5F5]">{supplierData.phone}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add to Cart */}
          <Card className="bg-[#1E1E1E] border-[#2A2A2A]">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-[#B0B0B0]">Cantidad</Label>
                  <div className="flex items-center gap-3 mt-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="border-[#2A2A2A] text-[#B0B0B0] hover:bg-[#2A2A2A] hover:text-[#F5F5F5]"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center bg-[#2A2A2A] border-[#2A2A2A] text-[#F5F5F5]"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(quantity + 1)}
                      className="border-[#2A2A2A] text-[#B0B0B0] hover:bg-[#2A2A2A] hover:text-[#F5F5F5]"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-[#B0B0B0]">
                      {product.unit_of_measure || 'unit'}(s)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#2A2A2A]">
                  <div>
                    <p className="text-sm text-[#B0B0B0]">Subtotal</p>
                    <p className="text-2xl font-bold text-[#F5F5F5]">
                      {(((product.base_price ?? 0) * quantity).toFixed(2))} {product.currency || 'USD'}
                    </p>
                  </div>

                  <Button
                    size="lg"
                    onClick={handleAddToCart}
                    disabled={addToCartMutation.isPending || addToCartMutation.isLoading}
                    className="bg-[#E53935] hover:bg-[#C62828] text-white"
                  >
                    {(addToCartMutation.isPending || addToCartMutation.isLoading) ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <ShoppingCart className="w-4 h-4 mr-2" />
                    )}
                    Agregar al carrito
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}