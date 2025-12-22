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
import { Building2, X } from 'lucide-react';

export default function SupplierForm({ open, onOpenChange, supplier, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    payment_terms: '',
    active: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || '',
        company_name: supplier.company_name || '',
        contact_person: supplier.contact_person || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        notes: supplier.notes || '',
        payment_terms: supplier.payment_terms || '',
        active: supplier.active !== false
      });
    } else {
      setFormData({
        name: '',
        company_name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
        payment_terms: '',
        active: true
      });
    }
  }, [supplier, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(formData);
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-[#1E1E1E] border-[#2A2A2A] text-[#F5F5F5] materi-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#E53935]" />
        <h2 className="text-[#99999]">Editar proveedor</h2>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
         <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1 space-y-2">
              <Label htmlFor="company_name">Empresa *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="Ej: Mercado Libre"
                required
              />
            </div>

            <div className="col-span-2 sm:col-span-1 space-y-2">
              <Label htmlFor="name">Nombre comercial </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: ML Proveedor"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_person">Persona de contacto</Label>
            <Input
              id="contact_person"
              value={formData.contact_person}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              placeholder="Ej: Tobias Becerra"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1 space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@ejemplo.com"
              />
            </div>
            <div className="col-span-2 sm:col-span-1 space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 234 567 890"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Dirección comercial"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_terms">Términos de pago</Label>
            <Input
              id="payment_terms"
              value={formData.payment_terms}
              onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
              placeholder="Ej: 30 días"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas internas..."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-[#2A2A2A] rounded-xl">
            <div>
              <p className="font-medium text-[#F5F5F5]">Proveedor activo</p>
              <p className="text-sm text-[#B0B0B0]">Los proveedores inactivos no aparecerán en los formularios de productos</p>
            </div>
            <Switch
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
            />
          </div>

          <div className="flex gap-3 pt-2">
             <Button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  style={{ backgroundColor: "#2A2A2A", color: "#F5F5F5" }}
                  className="flex-1 hover:opacity-90"
                >
                  Cancelar
                </Button>
            <Button
              type="submit"
              disabled={saving || !formData.name}
              className="flex-1 bg-[#E53935] hover:bg-[#C62828]"
            >
              {saving ? 'Guardando...' : (supplier ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}