import React, { useState, useMemo } from 'react';
import { api } from "@/api/apiClient";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { 
  ShoppingCart, 
  Loader2, 
  Package,
  Trash2,
  Building2,
  TrendingUp,
  Percent,
  DollarSign,
  ArrowRight,
  MessageCircle
} from 'lucide-react';

export default function VendorCart() {
  const [globalMarginInput, setGlobalMarginInput] = useState("20");
  const globalMarginNumber = globalMarginInput === "" ? 0 : Number(globalMarginInput);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const queryClient = useQueryClient(); // ✅ AGREGAR ESTO


  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api.auth.me()
  });

  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ['cartItems', user?.id],
    queryFn: () => api.entities.CartItem.filter({ vendor_id: user.id }),
    enabled: !!user?.id
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.entities.Supplier.filter({ active: true })
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.CartItem.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cartItems'] });
    },
    onError: (error) => {
      console.error('Failed to update cart item:', error);
      toast.error("Error al actualizar item", {
        description: "No se pudieron guardar los cambios."
      });
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id) => api.entities.CartItem.delete(id),
    onSuccess: () => {
      toast.success("Producto eliminado del carrito");
      queryClient.invalidateQueries({ queryKey: ['cartItems'] });
    },
    onError: (error) => {
      console.error('Failed to delete cart item:', error);
      toast.error("Error al eliminar producto", {
        description: "No se pudo eliminar el producto del carrito."
      });
    }
  });
  const handleQuantityChange = (item, newQuantity) => {
  const qty = Math.max(1, parseInt(newQuantity, 10) || 1);
  updateItemMutation.mutate({ id: item.id, data: { quantity: qty } });
};

  const handleMarginChange = (item, newMargin) => {
    const margin = newMargin === '' ? null : parseFloat(newMargin);
    updateItemMutation.mutate({ id: item.id, data: { margin_percent: margin } });
  };

  const handleDeleteItem = (item) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteItemMutation.mutate(itemToDelete.id);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const calculations = useMemo(() => {
    let subtotalCost = 0;
    let subtotalSale = 0;

    const itemDetails = cartItems.map(item => {
      const unitCost = parseFloat(item.unit_cost_price) || 0;
      const qty = parseFloat(item.quantity) || 0;
      const itemMargin = item.margin_percent !== null && item.margin_percent !== undefined
        ? parseFloat(item.margin_percent)
        : globalMarginNumber;

      const lineCostTotal = unitCost * qty;
      const unitSalePrice = unitCost * (1 + itemMargin / 100);
      const lineSaleTotal = unitSalePrice * qty;
      const lineProfitAmount = lineSaleTotal - lineCostTotal;

      subtotalCost += lineCostTotal;
      subtotalSale += lineSaleTotal;

      return {
        ...item,
        effectiveMargin: itemMargin,
        lineCostTotal,
        unitSalePrice,
        lineSaleTotal,
        lineProfitAmount
      };
    });

    return {
      items: itemDetails,
      subtotalCost,
      subtotalSale,
      totalProfit: subtotalSale - subtotalCost
    };
  }, [cartItems, globalMarginNumber]);

  const ordersBySupplier = useMemo(() => {
    const grouped = {};

    cartItems.forEach((item) => {
      const sid = item.supplier_id ?? item.supplierId;
      if (!sid) return;

      if (!grouped[sid]) {
        const supplier = suppliers.find((s) => s.id === sid);
        grouped[sid] = {
          supplierName: item.supplier_name ?? item.supplierName ?? supplier?.name ?? 'Proveedor',
          supplierPhone: supplier?.phone || item.supplier_phone || item.supplierPhone || '',
          items: [],
        };
      }

      grouped[sid].items.push(item);
    });

    return grouped;
  }, [cartItems, suppliers]);

  const getWhatsAppLink = (phone, items) => {
    if (!phone) return null;
    // Remove non-numeric chars
    const cleanPhone = phone.replace(/\D/g, '');
    
    let message = `Hola, me gustaría ordenar los siguientes productos:\n\n`;
    items.forEach(item => {
      message += `- ${item.quantity} ${item.unit_of_measure} x ${item.product_name}\n`;
    });
    
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#E53935]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F5F5]">Carrito</h1>
          <p className="text-[#B0B0B0] mt-1">Construye tu presupuesto con los productos seleccionados</p>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
        {/* ✅ Solo cuando hay items: botón en header derecha */}
        {cartItems.length > 0 && (
          <Link to={createPageUrl('VendorProducts')}>
            <Button
              className="
                h-9 rounded-xl
                bg-[#E53935] text-white
                hover:bg-[#C62828]
                disabled:opacity-60
              "
            >
              <Package className="w-4 h-4 mr-2" />
              Agregar productos
            </Button>
          </Link>
        )}

        <div className="flex items-center gap-2">
          <Label className="text-sm text-[#B0B0B0] whitespace-nowrap">Margen global:</Label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min="0"
              step="0.1"
              value={globalMarginInput}
              onChange={(e) => {
                setGlobalMarginInput(e.target.value); // ✅ permite "" sin forzar 0
              }}
              onBlur={() => {
                if (globalMarginInput === "") {
                  setGlobalMarginInput("20"); // <- si preferís que quede vacío, cambiá a "0" o dejalo ""
                  return;
                }
                let n = Number(globalMarginInput);
                if (Number.isNaN(n)) n = 20;
                n = Math.max(0, n);
                setGlobalMarginInput(String(n));
              }}
              className="w-20 bg-[#1E1E1E] border-[#2A2A2A] text-[#F5F5F5] text-left"
            />

            <span className="text-[#B0B0B0]">%</span>
          </div>
        </div>
      </div>

    </div>
      {cartItems.length === 0 ? (
        <Card className="bg-[#1E1E1E] border-[#2A2A2A]">
          <CardContent className="py-20 text-center">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-[#2A2A2A]" />
            <p className="text-[#B0B0B0] text-lg">Tu carrito está vacío</p>
            <p className="text-[#666] text-sm mt-1">Explora productos y agrégalos para construir tu presupuesto</p>
            <Link to={createPageUrl('VendorProducts')}>
              <Button className="mt-6 bg-[#E53935] hover:bg-[#C62828] text-white">
                <Package className="w-4 h-4 mr-2" />
                Explorar productos
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {calculations.items.map((item) => (
              <Card key={item.id} className="bg-[#1E1E1E] border-[#2A2A2A]">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Product Info */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {item.product_image_url ? (
                        <img
                          src={item.product_image_url}
                          alt={item.product_name}
                          className="w-20 h-20 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-[#2A2A2A] flex items-center justify-center shrink-0">
                          <Package className="w-10 h-10 text-[#B0B0B0]" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <Link 
                          to={createPageUrl(`ProductDetail?id=${item.product_id}`)}
                          className="font-medium text-[#F5F5F5] hover:text-[#E53935] transition-colors"
                        >
                          {item.product_name}
                        </Link>
                        <p className="text-sm text-[#B0B0B0] flex items-center gap-1 mt-1">
                          <Building2 className="w-3 h-3" />
                          {item.supplier_name}
                        </p>
                        {item.product_description && (
                          <p className="text-sm text-[#666] mt-1 line-clamp-1">
                            {item.product_description}
                          </p>
                        )}
                        <p className="text-sm text-[#B0B0B0] mt-2">
                          Costo unitario: <span className="font-medium text-[#F5F5F5]">${item.unit_cost_price?.toFixed(2)}</span>
                          <span className="text-[#666] ml-1">/ {item.unit_of_measure}</span>
                        </p>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col sm:items-end gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[#B0B0B0] hover:text-[#E53935] hover:bg-[#2A2A2A] self-end"
                        onClick={() => handleDeleteItem(item)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>

                      <div className="flex flex-wrap gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-[#B0B0B0]">Cant.</Label>
                          <Input
                         type="number"
                          min="1"
                          step="1"
                          inputMode="numeric"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item, e.target.value)}
                          className="bg-[#2A2A2A] border-[#2A2A2A] text-[#F5F5F5] focus-visible:ring-2 focus-visible:ring-[#E53935] focus-visible:ring-offset-0"
                                                />

                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Line Totals */}
                  <div className="mt-4 pt-4 border-t border-[#2A2A2A] grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-[#B0B0B0]">Total costo</p>
                      <p className="font-medium text-[#F5F5F5]">${item.lineCostTotal.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[#B0B0B0]">Venta unit.</p>
                      <p className="font-medium text-[#E53935]">${item.unitSalePrice.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[#B0B0B0]">Total venta</p>
                      <p className="font-semibold text-[#E53935]">${item.lineSaleTotal.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[#B0B0B0]">Ganancia</p>
                      <p className={`font-semibold ${item.lineProfitAmount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        ${item.lineProfitAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              <Card className="bg-[#1E1E1E] border-[#2A2A2A] text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-[#F5F5F5]">Resumen del presupuesto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[#B0B0B0] flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Subtotal costo
                    </span>
                    <span className="text-xl font-semibold text-[#F5F5F5]">
                      ${calculations.subtotalCost.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#B0B0B0] flex items-center gap-2">
                      <Percent className="w-4 h-4" />
                      Subtotal venta
                    </span>
                    <span className="text-xl font-semibold text-[#E53935]">
                      ${calculations.subtotalSale.toFixed(2)}
                    </span>
                  </div>
                  <div className="pt-4 border-t border-[#2A2A2A]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                        <span className="text-[#F5F5F5] font-medium">Ganancia total</span>
                      </div>
                      <span className={`text-2xl font-bold ${calculations.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        ${calculations.totalProfit.toFixed(2)}
                      </span>
                    </div>
                    {calculations.subtotalCost > 0 && (
                      <p className="text-right text-sm text-[#B0B0B0] mt-1">
                        {((calculations.totalProfit / calculations.subtotalCost) * 100).toFixed(1)}% Margen
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#1E1E1E] border-[#2A2A2A]">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#B0B0B0]">Ítems</span>
                    <span className="font-medium text-[#F5F5F5]">{cartItems.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#B0B0B0]">Margen global</span>
                    <span className="font-medium text-[#F5F5F5]">{globalMarginNumber}%</span>
                  </div>
                </CardContent>
              </Card>

              <Link to={createPageUrl('Quotes')} className='block mt-4'>
                <Button className="w-full bg-[#E53935] hover:bg-[#C62828] text-white">
                  Ver todos los presupuestos
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>

            {/* Contact Suppliers via WhatsApp */}
            <Card className="bg-[#1E1E1E] border-[#2A2A2A]">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-[#F5F5F5] flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-emerald-500" />
                  Contactar proveedores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                {Object.entries(ordersBySupplier).map(([supplierId, data]) => {
                  const whatsappLink = getWhatsAppLink(data.supplierPhone, data.items);
                  return (
                    <div key={supplierId} className="flex items-center justify-between p-3 rounded-lg bg-[#2A2A2A]">
                      <div>
                        <p className="font-medium text-[#F5F5F5]">{data.supplierName}</p>
                        <p className="text-xs text-[#B0B0B0]">{data.items.length} ítems</p>
                      </div>
                      {whatsappLink ? (
                        <a
                          href={whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Contactar por WhatsApp"
                          className="
                            inline-flex items-center justify-center
                            w-10 h-10
                            rounded-full
                            bg-emerald-600
                            hover:bg-emerald-700
                            transition-colors
                          "
                        >
                          <MessageCircle className="w-5 h-5 text-white" />
                        </a>
                      ) : (
                        <span className="text-xs text-[#B0B0B0] italic">Sin teléfono</span>
                      )}

                    </div>
                  );
                })}
              </CardContent>
            </Card>

            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#1E1E1E] border-[#2A2A2A]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#F5F5F5]">
              ¿Eliminar producto del carrito?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#B0B0B0]">
              {itemToDelete && (
                <>
                  Estás por eliminar <span className="font-semibold text-[#F5F5F5]">{itemToDelete.product_name}</span> del carrito.
                  Esta acción no se puede deshacer.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#2A2A2A] text-[#F5F5F5] hover:bg-[#3A3A3A] border-[#2A2A2A]">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-[#E53935] text-white hover:bg-[#C62828]"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}