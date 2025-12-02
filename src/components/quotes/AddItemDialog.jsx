import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Search } from 'lucide-react';

export default function AddItemDialog({ open, onOpenChange, suppliers, products, onAdd }) {
  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const activeSuppliers = useMemo(() => 
    suppliers.filter(s => s.active !== false),
    [suppliers]
  );

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => p.active !== false)
      .filter(p => selectedSupplier === 'all' || p.supplier_id === selectedSupplier)
      .filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.internal_code && p.internal_code.toLowerCase().includes(searchTerm.toLowerCase()))
      );
  }, [products, selectedSupplier, searchTerm]);

  const handleAdd = () => {
    if (!selectedProduct) return;
    
    onAdd({
      supplier_id: selectedProduct.supplier_id,
      supplier_name: selectedProduct.supplier_name,
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      product_description_snapshot: selectedProduct.description || '',
      unit_of_measure: selectedProduct.unit_of_measure || 'unit',
      quantity: parseFloat(quantity) || 1,
      unit_cost_price: selectedProduct.base_price,
      margin_percent: null
    });

    setSelectedProduct(null);
    setQuantity(1);
    setSearchTerm('');
    onOpenChange(false);
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col bg-[#1E1E1E] border-[#2A2A2A]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#F5F5F5]">
            <Package className="w-5 h-5 text-[#E53935]" />
            Agregar ítem al presupuesto
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="flex-1">
            <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
              <SelectTrigger className="bg-[#2A2A2A] border-[#2A2A2A] text-[#F5F5F5]">
                <SelectValue placeholder="Todos los proveedores" />
              </SelectTrigger>
              <SelectContent className="bg-[#1E1E1E] border-[#2A2A2A]">
                <SelectItem value="all" className="text-[#F5F5F5] focus:bg-[#2A2A2A]">Todos los proveedores</SelectItem>
                {activeSuppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id} className="text-[#F5F5F5] focus:bg-[#2A2A2A]">
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B0B0B0]" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar productos..."
              className="pl-10 bg-[#2A2A2A] border-[#2A2A2A] text-[#F5F5F5] placeholder:text-[#B0B0B0]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto mt-4 -mx-6 px-6">
          <div className="space-y-2">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-[#B0B0B0]">
                <Package className="w-12 h-12 mx-auto mb-3 text-[#2A2A2A]" />
                <p>No se encontraron productos</p>
              </div>
            ) : (
              filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleProductSelect(product)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    selectedProduct?.id === product.id
                      ? 'border-[#E53935] bg-[#E53935]/10 ring-2 ring-[#E53935]/20'
                      : 'border-[#2A2A2A] hover:border-[#E53935]/50 bg-[#2A2A2A]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-[#1E1E1E] flex items-center justify-center shrink-0">
                        <Package className="w-6 h-6 text-[#B0B0B0]" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-[#F5F5F5]">{product.name}</p>
                          <p className="text-sm text-[#B0B0B0]">{product.supplier_name}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-semibold text-[#E53935]">
                            ${product.base_price?.toFixed(2)} {product.currency}
                          </p>
                          <p className="text-xs text-[#B0B0B0]">por {product.unit_of_measure}</p>
                        </div>
                      </div>
                      {product.internal_code && (
                        <p className="text-xs text-[#666] mt-1">SKU: {product.internal_code}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {selectedProduct && (
          <div className="pt-4 border-t border-[#2A2A2A] mt-4 space-y-4">
            <div className="p-4 bg-[#E53935]/20 rounded-xl">
              <p className="text-sm text-[#E53935] font-medium">Seleccionado: {selectedProduct.name}</p>
              <p className="text-xs text-[#E53935]/80 mt-1">
                ${selectedProduct.base_price?.toFixed(2)} por {selectedProduct.unit_of_measure}
              </p>
            </div>
            <div className="flex items-end gap-4">
              <div className="flex-1 space-y-2">
                <Label className="text-[#B0B0B0]">Cantidad</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="bg-[#2A2A2A] border-[#2A2A2A] text-[#F5F5F5]"
                />
              </div>
              <Button
                onClick={handleAdd}
                className="bg-[#E53935] hover:bg-[#C62828] px-8"
              >
                Agregar ítem
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}