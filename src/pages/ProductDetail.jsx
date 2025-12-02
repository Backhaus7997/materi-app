import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
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
  Minus
} from 'lucide-react';

export default function ProductDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => base44.entities.Product.filter({ id: productId }),
    enabled: !!productId
  });

  const product = products[0];

  const { data: supplier } = useQuery({
    queryKey: ['supplier', product?.supplier_id],
    queryFn: () => base44.entities.Supplier.filter({ id: product.supplier_id }),
    enabled: !!product?.supplier_id
  });

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      // Check if item already exists in cart
      const existingItems = await base44.entities.CartItem.filter({
        vendor_id: user.id,
        product_id: product.id
      });

      if (existingItems.length > 0) {
        // Update quantity
        const existingItem = existingItems[0];
        return base44.entities.CartItem.update(existingItem.id, {
          quantity: existingItem.quantity + quantity
        });
      } else {
        // Create new cart item
        return base44.entities.CartItem.create({
          vendor_id: user.id,
          supplier_id: product.supplier_id,
          supplier_name: product.supplier_name,
          product_id: product.id,
          product_name: product.name,
          product_description: product.description || '',
          product_image_url: product.image_url || '',
          unit_of_measure: product.unit_of_measure || 'unit',
          quantity: quantity,
          unit_cost_price: product.base_price,
          margin_percent: null
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cartItems'] });
      toast.success('Added to cart!');
    }
  });

  const handleAddToCart = async () => {
    if (!user) {
      navigate(createPageUrl('RoleSelection'));
      return;
    }
    setAdding(true);
    await addToCartMutation.mutateAsync();
    setAdding(false);
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
              ${product.base_price?.toFixed(2)}
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
                    <p className="font-medium text-[#F5F5F5]">{supplierData.name}</p>
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
                      ${(product.base_price * quantity).toFixed(2)}
                    </p>
                  </div>
                  <Button
                    size="lg"
                    onClick={handleAddToCart}
                    disabled={adding}
                    className="bg-[#E53935] hover:bg-[#C62828] text-white"
                  >
                    {adding ? (
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