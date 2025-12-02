import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Search, 
  Loader2, 
  Package,
  Mail,
  Phone,
  ChevronRight,
  X
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export default function VendorSuppliers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: suppliers = [], isLoading: suppliersLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => base44.entities.Supplier.filter({ active: true })
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ['allProducts'],
    queryFn: () => base44.entities.Product.filter({ active: true })
  });

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s =>
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [suppliers, searchTerm]);

  const supplierProducts = useMemo(() => {
    if (!selectedSupplier) return [];
    return allProducts.filter(p => p.supplier_id === selectedSupplier.id);
  }, [allProducts, selectedSupplier]);

  const productCounts = useMemo(() => {
    const counts = {};
    allProducts.forEach(p => {
      counts[p.supplier_id] = (counts[p.supplier_id] || 0) + 1;
    });
    return counts;
  }, [allProducts]);

  const handleSelectSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setSheetOpen(true);
  };

  if (suppliersLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#E53935]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#F5F5F5]">Proveedores</h1>
        <p className="text-[#B0B0B0] mt-1">Explora todos los proveedores disponibles y sus productos</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B0B0B0]" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar proveedores..."
          className="pl-10 bg-[#1E1E1E] border-[#2A2A2A] text-[#F5F5F5] placeholder:text-[#B0B0B0]"
        />
      </div>

      {filteredSuppliers.length === 0 ? (
        <div className="text-center py-20">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-[#2A2A2A]" />
          <p className="text-[#B0B0B0] text-lg">No se encontraron proveedores</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((supplier) => (
            <Card 
              key={supplier.id}
              className="cursor-pointer bg-[#1E1E1E] border-[#2A2A2A] hover:shadow-lg hover:border-[#E53935]/50 transition-all group"
              onClick={() => handleSelectSupplier(supplier)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#E53935]/20 flex items-center justify-center shrink-0">
                      <span className="text-[#E53935] font-bold text-lg">
                        {supplier.name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-[#F5F5F5] truncate">{supplier.name}</h3>
                      {supplier.company_name && (
                        <p className="text-sm text-[#B0B0B0] truncate">{supplier.company_name}</p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#B0B0B0] group-hover:text-[#E53935] transition-colors shrink-0" />
                </div>

                <div className="mt-4 pt-4 border-t border-[#2A2A2A] space-y-2">
                  {supplier.contact_person && (
                    <p className="text-sm text-[#F5F5F5]">{supplier.contact_person}</p>
                  )}
                  {supplier.email && (
                    <p className="text-sm text-[#B0B0B0] flex items-center gap-2">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{supplier.email}</span>
                    </p>
                  )}
                  {supplier.phone && (
                    <p className="text-sm text-[#B0B0B0] flex items-center gap-2">
                      <Phone className="w-3 h-3" />
                      {supplier.phone}
                    </p>
                  )}
                </div>

                <div className="mt-4">
                  <Badge variant="outline" className="bg-[#2A2A2A] border-[#2A2A2A] text-[#B0B0B0]">
                    <Package className="w-3 h-3 mr-1" />
                    {productCounts[supplier.id] || 0} productos
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Supplier Products Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-[#1E1E1E] border-[#2A2A2A]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#E53935]/20 flex items-center justify-center">
                <span className="text-[#E53935] font-bold">
                  {selectedSupplier?.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-lg font-semibold text-[#F5F5F5]">{selectedSupplier?.name}</p>
                <p className="text-sm text-[#B0B0B0] font-normal">{supplierProducts.length} productos</p>
              </div>
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-3">
            {supplierProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 mx-auto mb-3 text-[#2A2A2A]" />
                <p className="text-[#B0B0B0]">No hay productos disponibles</p>
              </div>
            ) : (
              supplierProducts.map(product => (
                <Link
                  key={product.id}
                  to={createPageUrl(`ProductDetail?id=${product.id}`)}
                  className="flex items-center gap-4 p-4 rounded-xl border border-[#2A2A2A] hover:border-[#E53935]/50 hover:bg-[#2A2A2A] transition-all"
                >
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-16 h-16 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-[#2A2A2A] flex items-center justify-center shrink-0">
                      <Package className="w-8 h-8 text-[#B0B0B0]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#F5F5F5]">{product.name}</p>
                    {product.description && (
                      <p className="text-sm text-[#B0B0B0] line-clamp-2 mt-1">{product.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="font-semibold text-[#E53935]">
                        ${product.base_price?.toFixed(2)}
                      </span>
                      <span className="text-xs text-[#B0B0B0]">
                        per {product.unit_of_measure || 'unit'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#B0B0B0] shrink-0" />
                </Link>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}