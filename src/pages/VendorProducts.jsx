import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Package, 
  Search, 
  Loader2, 
  Grid3X3,
  List,
  Building2
} from 'lucide-react';

export default function VendorProducts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['allProducts'],
    queryFn: () => base44.entities.Product.filter({ active: true })
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => base44.entities.Supplier.filter({ active: true })
  });

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.internal_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSupplier = supplierFilter === 'all' || p.supplier_id === supplierFilter;
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
      return matchesSearch && matchesSupplier && matchesCategory;
    });
  }, [products, searchTerm, supplierFilter, categoryFilter]);

  if (productsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#E53935]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#F5F5F5]">Productos</h1>
        <p className="text-[#B0B0B0] mt-1">Explora todos los productos disponibles de proveedores</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B0B0B0]" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar productos..."
            className="pl-10 bg-[#1E1E1E] border-[#2A2A2A] text-[#F5F5F5] placeholder:text-[#B0B0B0]"
          />
        </div>
        <Select value={supplierFilter} onValueChange={setSupplierFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-[#1E1E1E] border-[#2A2A2A] text-[#F5F5F5]">
            <SelectValue placeholder="Todos los proveedores" />
          </SelectTrigger>
          <SelectContent className="bg-[#1E1E1E] border-[#2A2A2A]">
            <SelectItem value="all" className="text-[#F5F5F5] focus:bg-[#2A2A2A] focus:text-[#F5F5F5]">Todos los proveedores</SelectItem>
            {suppliers.map((supplier) => (
              <SelectItem key={supplier.id} value={supplier.id} className="text-[#F5F5F5] focus:bg-[#2A2A2A] focus:text-[#F5F5F5]">
                {supplier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-[#1E1E1E] border-[#2A2A2A] text-[#F5F5F5]">
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent className="bg-[#1E1E1E] border-[#2A2A2A]">
            <SelectItem value="all" className="text-[#F5F5F5] focus:bg-[#2A2A2A] focus:text-[#F5F5F5]">Todas las categorías</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat} className="text-[#F5F5F5] focus:bg-[#2A2A2A] focus:text-[#F5F5F5]">{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1 border border-[#2A2A2A] rounded-lg p-1 bg-[#1E1E1E]">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="icon"
            className={`h-8 w-8 ${viewMode === 'grid' ? 'bg-[#E53935] hover:bg-[#C62828] text-white' : 'text-[#B0B0B0] hover:bg-[#2A2A2A] hover:text-[#F5F5F5]'}`}
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="icon"
            className={`h-8 w-8 ${viewMode === 'list' ? 'bg-[#E53935] hover:bg-[#C62828] text-white' : 'text-[#B0B0B0] hover:bg-[#2A2A2A] hover:text-[#F5F5F5]'}`}
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-16 h-16 mx-auto mb-4 text-[#2A2A2A]" />
          <p className="text-[#B0B0B0] text-lg">No se encontraron productos</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <Link key={product.id} to={createPageUrl(`ProductDetail?id=${product.id}`)}>
              <Card className="h-full bg-[#1E1E1E] border-[#2A2A2A] hover:shadow-lg hover:border-[#E53935]/50 transition-all cursor-pointer group">
                <CardContent className="p-0">
                  <div className="aspect-square relative overflow-hidden rounded-t-xl bg-[#2A2A2A]">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-16 h-16 text-[#B0B0B0]" />
                      </div>
                    )}
                    {product.category && (
                      <Badge className="absolute top-3 left-3 bg-[#1E1E1E]/90 text-[#F5F5F5]">
                        {product.category}
                      </Badge>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-[#B0B0B0] flex items-center gap-1 mb-1">
                      <Building2 className="w-3 h-3" />
                      {product.supplier_name}
                    </p>
                    <h3 className="font-semibold text-[#F5F5F5] line-clamp-2">{product.name}</h3>
                    {product.description && (
                      <p className="text-sm text-[#B0B0B0] mt-1 line-clamp-2">{product.description}</p>
                    )}
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-xl font-bold text-[#E53935]">
                        {product.base_price?.toFixed(2)} {product.currency || 'USD'}
                      </span>
                      <span className="text-sm text-[#B0B0B0]">
                        / {product.unit_of_measure || 'unit'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((product) => (
            <Link key={product.id} to={createPageUrl(`ProductDetail?id=${product.id}`)}>
              <Card className="bg-[#1E1E1E] border-[#2A2A2A] hover:shadow-lg hover:border-[#E53935]/50 transition-all cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-20 h-20 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-[#2A2A2A] flex items-center justify-center shrink-0">
                        <Package className="w-10 h-10 text-[#B0B0B0]" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm text-[#B0B0B0] flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {product.supplier_name}
                        </p>
                        {product.category && (
                          <Badge variant="outline" className="text-xs border-[#2A2A2A] text-[#B0B0B0]">
                            {product.category}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-[#F5F5F5]">{product.name}</h3>
                      {product.description && (
                        <p className="text-sm text-[#B0B0B0] mt-1 line-clamp-1">{product.description}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xl font-bold text-[#E53935]">
                        {product.base_price?.toFixed(2)} {product.currency || 'USD'}
                      </p>
                      <p className="text-sm text-[#B0B0B0]">
                        per {product.unit_of_measure || 'unit'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}