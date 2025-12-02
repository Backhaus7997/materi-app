import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { Package, Upload } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const UNITS = ['unit', 'box', 'm²', 'm³', 'kg', 'liter', 'meter', 'pack'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'MXN', 'BRL'];

export default function ProductForm({ open, onOpenChange, product, suppliers, onSave, hideSupplierSelect = false }) {
  const [formData, setFormData] = useState({
    supplier_id: '',
    supplier_name: '',
    name: '',
    internal_code: '',
    description: '',
    image_url: '',
    category: '',
    unit_of_measure: 'unit',
    base_price: '',
    currency: 'USD',
    active: true
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  // Get default supplier when hideSupplierSelect is true
  const defaultSupplier = hideSupplierSelect && suppliers.length > 0 ? suppliers[0] : null;

  useEffect(() => {
    if (product) {
      setFormData({
        supplier_id: product.supplier_id || '',
        supplier_name: product.supplier_name || '',
        name: product.name || '',
        internal_code: product.internal_code || '',
        description: product.description || '',
        image_url: product.image_url || '',
        category: product.category || '',
        unit_of_measure: product.unit_of_measure || 'unit',
        base_price: product.base_price || '',
        currency: product.currency || 'USD',
        active: product.active !== false
      });
    } else {
      // Pre-populate supplier when hideSupplierSelect is true
      setFormData({
        supplier_id: defaultSupplier?.id || '',
        supplier_name: defaultSupplier?.name || '',
        name: '',
        internal_code: '',
        description: '',
        image_url: '',
        category: '',
        unit_of_measure: 'unit',
        base_price: '',
        currency: 'USD',
        active: true
      });
    }
    setError(null);
  }, [product, open, defaultSupplier?.id, defaultSupplier?.name]);

  const handleSupplierChange = (supplierId) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    setFormData({
      ...formData,
      supplier_id: supplierId,
      supplier_name: supplier?.name || ''
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData({ ...formData, image_url: file_url });
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSave({
        ...formData,
        base_price: parseFloat(formData.base_price) || 0
      });
      setSaving(false);
    } catch (err) {
      setError(err.message || 'Failed to save product. Please try again.');
      setSaving(false);
    }
  };

  const activeSuppliers = suppliers.filter(s => s.active !== false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[#E53935]" />
            {product ? 'Editar producto' : 'Agregar producto'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          {!hideSupplierSelect && (
            <div className="space-y-2">
              <Label>Proveedor *</Label>
              <Select value={formData.supplier_id} onValueChange={handleSupplierChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {activeSuppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1 space-y-2">
              <Label htmlFor="name">Nombre del producto *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre del producto"
                required
              />
            </div>
            <div className="col-span-2 sm:col-span-1 space-y-2">
              <Label htmlFor="internal_code">SKU / Código</Label>
              <Input
                id="internal_code"
                value={formData.internal_code}
                onChange={(e) => setFormData({ ...formData, internal_code: e.target.value })}
                placeholder="Ej: SKU-001"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoría</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="Ej: Electrónica, Materiales de construcción"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción del producto..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-3 sm:col-span-1 space-y-2">
              <Label htmlFor="base_price">Precio base *</Label>
              <Input
                id="base_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.base_price}
                onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
            <div className="col-span-3 sm:col-span-1 space-y-2">
              <Label>Moneda</Label>
              <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-3 sm:col-span-1 space-y-2">
              <Label>Unidad</Label>
              <Select value={formData.unit_of_measure} onValueChange={(v) => setFormData({ ...formData, unit_of_measure: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Imagen del producto</Label>
            <div className="flex gap-3">
              <Input
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="URL de imagen o subir"
                className="flex-1"
              />
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button type="button" variant="outline" disabled={uploading} asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? 'Subiendo...' : 'Subir'}
                  </span>
                </Button>
              </label>
            </div>
            {formData.image_url && (
              <div className="mt-2 relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200">
                <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-4 bg-[#2A2A2A] rounded-xl">
            <div>
              <p className="font-medium text-[#F5F5F5]">Producto activo</p>
              <p className="text-sm text-[#B0B0B0]">Los productos inactivos no aparecerán en los presupuestos</p>
            </div>
            <Switch
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving || !formData.name || (!hideSupplierSelect && !formData.supplier_id) || !formData.base_price}
              className="flex-1 bg-[#E53935] hover:bg-[#C62828]"
            >
              {saving ? 'Guardando...' : (product ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}