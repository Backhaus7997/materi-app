import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from "@/api/apiClient";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Plus,
  Save,
  Loader2,
  User,
  Percent,
  Package,
  TrendingUp,
  ShoppingCart,
  Trash2
} from 'lucide-react';
import { toast } from "sonner";
import QuoteLineItemRow from '@/components/quotes/QuoteLineItemRow';
import AddItemDialog from '@/components/quotes/AddItemDialog';

const STATUS_LABELS = {
  Draft: "Borrador",
  Sent: "Enviado",
  Accepted: "Aceptado",
  Rejected: "Rechazado",
};

const STATUSES = Object.keys(STATUS_LABELS);

// ----------------- VALIDACIONES -----------------

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

export default function QuoteBuilder() {
  const requestedNextNumber = useRef(false);
  const urlParams = new URLSearchParams(window.location.search);
  const quoteId = urlParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [addItemOpen, setAddItemOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api.auth.me()
  });

  // Redirects away
  useEffect(() => {
    if (user?.user_role === 'Supplier') {
      navigate(createPageUrl('SupplierDashboard'));
    }
  }, [user, navigate]);

  const [quoteData, setQuoteData] = useState({
    quote_seq_id: null,
    quote_number: '',
    customer_name: '',
    customer_company: '',
    customer_email: '',
    customer_phone: '',
    status: 'Draft',
    global_margin_percent: 20,
    notes: ''
  });

  const [lineItems, setLineItems] = useState([]);

  const { data: existingQuote, isLoading: quoteLoading } = useQuery({
    queryKey: ['quote', quoteId],
    queryFn: () => api.entities.Quote.filter({ id: quoteId }),
    enabled: !!quoteId
  });

  const { data: existingLineItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['quoteLineItems', quoteId],
    queryFn: () => api.entities.QuoteLineItem.filter({ quote_id: quoteId }),
    enabled: !!quoteId
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.entities.Supplier.list()
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.entities.Product.filter({ active: true })
  });

  useEffect(() => {
    if (existingQuote?.length > 0) {
      const q = existingQuote[0];
      setQuoteData({
        quote_number: q.quote_number || '',
        customer_name: q.customer_name || '',
        customer_company: q.customer_company || '',
        customer_email: q.customer_email || '',
        customer_phone: q.customer_phone || '',
        status: q.status || 'Draft',
        global_margin_percent: q.global_margin_percent ?? 20,
        notes: q.notes || ''
      });
    }
  }, [existingQuote]);

  useEffect(() => {
    if (existingLineItems.length > 0) {
      setLineItems(
        existingLineItems.map((item) => ({
          ...item,
        
          // ✅ normalización de ids (backend puede devolver camelCase)
          quote_id: item.quote_id ?? item.quoteId,
          supplier_id: item.supplier_id ?? item.supplierId ?? '',
          product_id: item.product_id ?? item.productId ?? '',
        
          // ✅ normalización de nombres
          supplier_name: item.supplier_name ?? item.supplierName ?? '',
          product_name: item.product_name ?? item.productName ?? '',
          product_description_snapshot:
            item.product_description_snapshot ??
            item.product_description ??
            item.productDescriptionSnapshot ??
            '',
        
          // ✅ normalización de otros campos comunes
          unit_of_measure: item.unit_of_measure ?? item.unitOfMeasure ?? 'unit',
          unit_cost_price: item.unit_cost_price ?? item.unitCostPrice ?? 0,
        
          isExisting: true,
        }))
      );
    }
  }, [existingLineItems]);


  // Generate quote number for new quotes
  useEffect(() => {
    const loadNextNumber = async () => {
      // si edito, no pido nada
      if (quoteId) return;
    
      // 🔒 candado: evita doble ejecución (StrictMode)
      if (requestedNextNumberRef.current) return;
      requestedNextNumberRef.current = true;
    
      // si ya lo tenés seteado, no lo pidas
      if (quoteData.quote_number) return;
    
      try {
        const res = await api.entities.Quote.nextNumber(); // { seqId, quote_number }
        if (res?.quote_number && res?.seqId) {
          setQuoteData(prev => ({
            ...prev,
            quote_number: res.quote_number,
            quote_seq_id: res.seqId,
          }));
        }
      } catch (e) {
        console.error("Error obteniendo número de presupuesto:", e);
        // si falla, liberamos el candado para que pueda reintentar
        requestedNextNumberRef.current = false;
      }
    };
  
    loadNextNumber();
    // NO pongas quoteData en deps, sino se vuelve a disparar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteId]);




  const globalMargin = parseFloat(quoteData.global_margin_percent) || 0;

  const totals = useMemo(() => {
    let totalCost = 0;
    let totalSale = 0;

    lineItems.forEach(item => {
      const unitCost = parseFloat(item.unit_cost_price) || 0;
      const qty = parseFloat(item.quantity) || 0;
      const itemMargin = globalMargin; // SOLO margen global

      const lineCost = unitCost * qty;
      const unitSale = unitCost * (1 + itemMargin / 100);
      const lineSale = unitSale * qty;

      totalCost += lineCost;
      totalSale += lineSale;
    });

    return {
      totalCost,
      totalSale,
      totalProfit: totalSale - totalCost
    };
  }, [lineItems, globalMargin]);

  const handleAddItem = (item) => {
    const unitCost = parseFloat(item.unit_cost_price) || 0;
    const qty = parseFloat(item.quantity) || 1;
    const unitSale = unitCost * (1 + globalMargin / 100);

    setLineItems([...lineItems, {
      ...item,
      margin_percent: null,
      line_cost_total: unitCost * qty,
      unit_sale_price: unitSale,
      line_sale_total: unitSale * qty,
      line_profit_amount: (unitSale * qty) - (unitCost * qty),
      isNew: true
    }]);
  };

  const handleUpdateItem = (index, updatedItem) => {
    const newItems = [...lineItems];
    newItems[index] = { ...updatedItem, margin_percent: null,isModified: true };
    setLineItems(newItems);
  };

  const handleDeleteItem = (index) => {
    const item = lineItems[index];
    if (item.isExisting) {
      setLineItems(lineItems.map((li, i) =>
        i === index ? { ...li, isDeleted: true } : li
      ));
    } else {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const validateBeforeSave = () => {
    const errors = [];

    // requerido
    if (!quoteData.customer_name?.trim()) {
      errors.push("• Nombre del cliente es requerido.");
    }

    // email opcional pero si hay, válido
    if (quoteData.customer_email && !isValidEmail(quoteData.customer_email)) {
      errors.push("• Email inválido. Ej: juan@ejemplo.com");
    }

    // teléfono opcional pero si hay, válido
    if (quoteData.customer_phone && !isValidPhone(quoteData.customer_phone)) {
      errors.push("• Teléfono inválido. Ej: +54 11 2345-6789");
    }

    // usuario logueado
    if (!user?.id) {
      errors.push("• No hay usuario autenticado. Volvé a iniciar sesión.");
    }

    if (errors.length > 0) {
      alert("No se puede guardar:\n\n" + errors.join("\n"));
      return false;
    }

    return true;
  };


  const handleSave = async () => {
    if (!validateBeforeSave()) return;

    setSaving(true);

      try {
        // Datos comunes del presupuesto
        const basePayload = {
          ...quoteData,
          vendor_id: user.id,
          global_margin_percent: parseFloat(quoteData.global_margin_percent) || 0,
          total_cost: totals.totalCost,
          total_sale_price: totals.totalSale,
          total_profit_amount: totals.totalProfit,
          customer_phone: normalizePhone(quoteData.customer_phone),
          customer_email: quoteData.customer_email?.trim() || '',
        };


        if(!quoteId) delete basePayload.quote_number;

        let savedQuoteId = quoteId;

        // → si es edición
        if (quoteId) {
          await api.entities.Quote.update(quoteId, basePayload);
        } else {
          const created = await api.entities.Quote.create(basePayload);
        
          savedQuoteId = created.id;
        
          // ✅ Mostramos el número real asignado por backend
          if (created?.quote_number) {
            setQuoteData(prev => ({ ...prev, quote_number: created.quote_number }));
          }
        }


        // ---------- Line items ----------
        for (const item of lineItems) {
          const itemPayload = {
            quote_id: savedQuoteId,
            supplier_id: item.supplier_id,
            supplier_name: item.supplier_name,
            product_id: item.product_id,
            product_name: item.product_name,
            product_description_snapshot: item.product_description_snapshot,
            unit_of_measure: item.unit_of_measure,
            quantity: parseFloat(item.quantity) || 1,
            unit_cost_price: parseFloat(item.unit_cost_price) || 0,
            line_cost_total: parseFloat(item.line_cost_total) || 0,
            margin_percent:
              item.margin_percent !== null && item.margin_percent !== ''
                ? parseFloat(item.margin_percent)
                : null,
            unit_sale_price: parseFloat(item.unit_sale_price) || 0,
            line_sale_total: parseFloat(item.line_sale_total) || 0,
            line_profit_amount: parseFloat(item.line_profit_amount) || 0,
          };

          if (item.isDeleted && item.id) {
            await api.entities.QuoteLineItem.delete(item.id);
          } else if (item.isNew) {
            await api.entities.QuoteLineItem.create(itemPayload);
          } else if (item.isModified && item.id) {
            await api.entities.QuoteLineItem.update(item.id, itemPayload);
          }
        }

        // Refrescar caches
        queryClient.invalidateQueries({ queryKey: ['quotes', user?.id] });
        queryClient.invalidateQueries({ queryKey: ['quotes'] });
        queryClient.invalidateQueries({ queryKey: ['quote', savedQuoteId] });
        queryClient.invalidateQueries({ queryKey: ['quoteLineItems', savedQuoteId] });

        toast.success("Presupuesto guardado ✅");
        navigate(createPageUrl('Quotes'));
      } catch (err) {
        console.error("Error guardando presupuesto:", err);
        toast.error("Error al guardar el presupuesto");
      } finally {
        setSaving(false);
      }
    };

  const handleDeleteQuote = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este presupuesto? Esta acción no se puede deshacer.')) {
      return;
    }

    setSaving(true);
    try {
      const items = await api.entities.QuoteLineItem.filter({ quote_id: quoteId });
      await Promise.all(items.map(item => api.entities.QuoteLineItem.delete(item.id)));

      await api.entities.Quote.delete(quoteId);

      toast.success('Presupuesto eliminado');
      navigate(createPageUrl('Quotes'));
    } catch (error) {
      console.error('Error deleting quote:', error);
      toast.error('Error al eliminar el presupuesto');
      setSaving(false);
    }
  };

  const handleExportToCart = async () => {
    const itemsToExport = lineItems.filter(item => !item.isDeleted);

    if (itemsToExport.length === 0) {
      toast.error('No hay ítems para exportar');
      return;
    }

    setExporting(true);
    try {
      // 1. Ensure Cart exists
      let cartId;
      const carts = await api.entities.Cart.filter({ vendor_id: user.id });

      if (carts.length > 0) {
        cartId = carts[0].id;
      } else {
        const newCart = await api.entities.Cart.create({
          vendor_id: user.id,
          global_margin_percent: 20
        });
        cartId = newCart.id;
      }

      // 2. Process items
      for (const item of itemsToExport) {
        const existingItems = await api.entities.CartItem.filter({
          vendor_id: user.id,
          product_id: item.product_id
        });

        if (existingItems.length > 0) {
          const existingItem = existingItems[0];
          await api.entities.CartItem.update(existingItem.id, {
            quantity: existingItem.quantity + (parseFloat(item.quantity) || 1)
          });
        } else {
          const productInfo = products.find(p => p.id === item.product_id);

          await api.entities.CartItem.create({
            cart_id: cartId,
            vendor_id: user.id,
            supplier_id: item.supplier_id,
            supplier_name: item.supplier_name,
            product_id: item.product_id,
            product_name: item.product_name,
            product_description: item.product_description_snapshot || '',
            product_image_url: productInfo?.image_url || '',
            unit_of_measure: item.unit_of_measure || 'unit',
            quantity: parseFloat(item.quantity) || 1,
            unit_cost_price: parseFloat(item.unit_cost_price) || 0,
            margin_percent: item.margin_percent !== null && item.margin_percent !== ''
              ? parseFloat(item.margin_percent)
              : null
          });
        }
      }

      toast.success('Productos exportados al carrito correctamente');
      queryClient.invalidateQueries({ queryKey: ['cartItems', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['cartItems'] });
      navigate(createPageUrl('VendorCart'));
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Error al exportar al carrito');
    } finally {
      setExporting(false);
    }
  };

  const visibleItems = lineItems.filter(item => !item.isDeleted);
  const isLoading = quoteLoading || itemsLoading;

  if (isLoading && quoteId) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#E53935]" />
      </div>
    );
  }

  return (

        <div className="space-y-4 md:space-y-6 pb-24">
          <div className="flex items-center gap-2 md:gap-4">
            <Link to={createPageUrl('Quotes')}>
              <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9 md:h-10 md:w-10">
                <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </Link>

            <div className="flex-1 min-w-0">
              <h1 className="text-base md:text-2xl font-bold text-[#F5F5F5] truncate">
                {quoteId ? 'Editar presupuesto' : 'Nuevo presupuesto'}
              </h1>
              <p className="text-xs md:text-sm text-[#B0B0B0] truncate">
                {quoteData.quote_number || 'Crear un nuevo presupuesto'}
              </p>
            </div>

          <div className="flex items-center gap-2 md:gap-2">
      {quoteId && (
        <Button
          variant="outline"
          size="icon"
          onClick={handleDeleteQuote}
          disabled={saving}
          className="h-10 w-10 md:h-11 md:w-11 rounded-lg md:rounded-xl border-[#2A2A2A] text-red-400 hover:bg-red-900/20 hover:text-red-400 disabled:opacity-60"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}

      <Button
        onClick={handleExportToCart}
        disabled={exporting || visibleItems.length === 0}
        className="h-10 w-10 md:h-11 md:w-auto md:px-6 rounded-lg md:rounded-xl font-medium bg-[#2A2A2A] text-[#F5F5F5] hover:bg-[#3A3A3A] disabled:bg-[#2A2A2A] disabled:text-[#777] disabled:opacity-100 disabled:cursor-not-allowed"
      >
        {exporting ? (
          <Loader2 className="w-4 h-4 md:mr-2 animate-spin" />
        ) : (
          <ShoppingCart className="w-4 h-4 md:mr-2" />
        )}
        <span className="hidden md:inline text-sm">Exportar al carrito</span>
      </Button>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="h-10 w-10 md:h-11 md:w-auto md:px-6 rounded-lg md:rounded-xl font-medium bg-[#E53935] text-white hover:bg-[#C62828] disabled:bg-[#E53935] disabled:text-white disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 md:mr-2 animate-spin" />
        ) : (
          <Save className="w-4 h-4 md:mr-2" />
        )}
        <span className="hidden md:inline text-sm">Guardar presupuesto</span>
      </Button>
    </div>
          </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {/* Customer Info */}
          <Card className="bg-[#1E1E1E] border-[#2A2A2A]">
            <CardHeader className="pb-3 md:pb-4">
              <CardTitle className="flex items-center gap-2 text-sm md:text-lg text-[#F5F5F5]">
                <User className="w-4 h-4 md:w-5 md:h-5 text-[#E53935]" />
                Información del cliente
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 md:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-[#B0B0B0] text-xs md:text-sm">Nombre del cliente *</Label>
                  <Input
                    value={quoteData.customer_name}
                    onChange={(e) => {
                      const cleanValue = e.target.value.replace(/[^a-zA-ZÀ-ÿ\s'.-]/g, "");
                      setQuoteData({ ...quoteData, customer_name: cleanValue });
                    }}
                    placeholder="Juan Pérez"
                    className="bg-[#2A2A2A] border-[#2A2A2A] text-[#F5F5F5] h-9 md:h-10 text-sm"
                  />
                </div>

                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-[#B0B0B0] text-xs md:text-sm">Empresa</Label>
                  <Input
                    value={quoteData.customer_company}
                    onChange={(e) => setQuoteData({ ...quoteData, customer_company: e.target.value })}
                    placeholder="Empresa S.A."
                    className="bg-[#2A2A2A] border-[#2A2A2A] text-[#F5F5F5] h-9 md:h-10 text-sm"
                  />
                </div>

                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-[#B0B0B0] text-xs md:text-sm">Correo electrónico</Label>
                  <Input
                    type="email"
                    inputMode="email"
                    value={quoteData.customer_email}
                    onChange={(e) => setQuoteData({ ...quoteData, customer_email: e.target.value })}
                    placeholder="juan@ejemplo.com"
                    className="bg-[#2A2A2A] border-[#2A2A2A] text-[#F5F5F5] h-9 md:h-10 text-sm"
                  />
                </div>

                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-[#B0B0B0] text-xs md:text-sm">Teléfono</Label>
                  <Input
                    type="tel"
                    inputMode="tel"
                    value={quoteData.customer_phone}
                    onChange={(e) => {
                      const v = normalizePhone(e.target.value);
                      setQuoteData({ ...quoteData, customer_phone: v });
                    }}
                    placeholder="+54 11 2345-6789"
                    className="bg-[#2A2A2A] border-[#2A2A2A] text-[#F5F5F5] h-9 md:h-10 text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quote Settings */}
          <Card className="bg-[#1E1E1E] border-[#2A2A2A]">
            <CardHeader className="pb-3 md:pb-4">
              <CardTitle className="flex items-center gap-2 text-sm md:text-lg text-[#F5F5F5]">
                <Percent className="w-4 h-4 md:w-5 md:h-5 text-[#E53935]" />
                Configuración del presupuesto
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-[#B0B0B0] text-xs md:text-sm">Número de presupuesto</Label>

                  {quoteData?.quote_number ? (
                 <div className="h-9 md:h-10 w-full px-3 flex items-center text-xs md:text-sm rounded-md bg-[#2A2A2A] border border-[#2A2A2A] text-[#B0B0B0] opacity-80 cursor-not-allowed select-none">
                     {quoteData.quote_number}
                  </div>

                  ) : (
                    <Input
                      value=""
                      disabled
                      placeholder="Se asigna automáticamente"
                      className="bg-[#2A2A2A] border-[#2A2A2A] text-[#B0B0B0] disabled:opacity-100 h-9 md:h-10 text-xs md:text-sm"
                    />
                  )}
                </div>


                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-[#B0B0B0] text-xs md:text-sm">Estado</Label>

                  <Select
                    value={quoteData.status || "Draft"}
                    onValueChange={(v) => setQuoteData({ ...quoteData, status: v })}
                  >
                    <SelectTrigger className="h-9 md:h-10 w-full bg-[#2A2A2A] border-[#2A2A2A] text-white text-xs md:text-sm">
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>

                    <SelectContent className="bg-[#1E1E1E] border-[#2A2A2A] p-1">
                      {STATUSES.map((s) => (
                        <SelectItem
                          key={s}
                          value={s}
                          className="
                            text-white cursor-pointer text-xs md:text-sm
                            focus:bg-[#2A2A2A] focus:text-white
                            data-[highlighted]:bg-[#2A2A2A] data-[highlighted]:text-white
                            data-[state=checked]:bg-[#2A2A2A] data-[state=checked]:text-white
                          "
                        >
                          {STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                </div>


                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-[#B0B0B0] text-xs md:text-sm">Margen global %</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={quoteData.global_margin_percent}
                    onChange={(e) => setQuoteData({ ...quoteData, global_margin_percent: e.target.value })}
                    placeholder="20"
                    className="h-9 md:h-10 w-full bg-[#2A2A2A] border-[#2A2A2A] text-[#F5F5F5] text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card className="bg-[#1E1E1E] border-[#2A2A2A]">
            <CardHeader className="pb-3 md:pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm md:text-lg text-[#F5F5F5]">
                  <Package className="w-4 h-4 md:w-5 md:h-5 text-[#E53935]" />
                  Ítems ({visibleItems.length})
                </CardTitle>

            <Button
            onClick={() => setAddItemOpen(true)}
            size="sm"
            className="bg-[#E53935] text-white hover:bg-[#C62828] h-8 md:h-9 px-2.5 md:px-4 text-xs md:text-sm"
          >
            <Plus className="w-3.5 h-3.5 md:w-4 md:h-4 md:mr-2" />
            <span className="hidden sm:inline">Agregar ítem</span>
          </Button>

              </div>
            </CardHeader>

            <CardContent>
              {visibleItems.length === 0 ? (
                <div className="text-center py-8 md:py-12 border-2 border-dashed border-[#2A2A2A] rounded-xl">
                  <Package className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 text-[#2A2A2A]" />
                  <p className="text-[#B0B0B0] text-sm md:text-base">Todavía no hay ítems</p>
              <Button
                onClick={() => setAddItemOpen(true)}
                className="mt-3 md:mt-4 bg-[#E53935] text-white hover:bg-[#C62828] h-9 md:h-10 text-xs md:text-sm"
              >
                <Plus className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2" />
                Agregar primer ítem
              </Button>

                </div>
              ) : (
                <div className="space-y-2 md:space-y-3">
                  {lineItems.map((item, index) => (
                    !item.isDeleted && (
                      <QuoteLineItemRow
                        key={item.id || index}
                        item={item}
                        index={index}
                        globalMargin={globalMargin}
                        onUpdate={handleUpdateItem}
                        onDelete={handleDeleteItem}
                      />
                    )
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="bg-[#1E1E1E] border-[#2A2A2A]">
            <CardHeader className="pb-3 md:pb-4">
              <CardTitle className="text-sm md:text-lg text-[#F5F5F5]">Notas internas</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={quoteData.notes}
                onChange={(e) => setQuoteData({ ...quoteData, notes: e.target.value })}
                placeholder="Agregar notas internas sobre este presupuesto..."
                rows={3}
                className="bg-[#2A2A2A] border-[#2A2A2A] text-[#F5F5F5] placeholder:text-[#666] text-xs md:text-sm"
              />
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-6 space-y-3 md:space-y-4">
            <Card className="bg-[#1E1E1E] border-[#2A2A2A] text-white">
              <CardHeader className="pb-2 md:pb-3">
                <CardTitle className="text-sm md:text-lg text-[#F5F5F5]">Resumen del presupuesto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[#B0B0B0] text-xs md:text-sm">Costo total</span>
                  <span className="text-base md:text-xl font-semibold text-[#F5F5F5]">
                    ${totals.totalCost.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#B0B0B0] text-xs md:text-sm">Venta total</span>
                  <span className="text-base md:text-xl font-semibold text-[#E53935]">
                    ${totals.totalSale.toFixed(2)}
                  </span>
                </div>
                <div className="pt-3 md:pt-4 border-t border-[#2A2A2A]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
                      <span className="text-[#F5F5F5] font-medium text-xs md:text-base">Ganancia</span>
                    </div>
                    <span className={`text-lg md:text-2xl font-bold ${totals.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      ${totals.totalProfit.toFixed(2)}
                    </span>
                  </div>
                  {totals.totalCost > 0 && (
                    <p className="text-right text-[10px] md:text-sm text-[#B0B0B0] mt-1">
                      {((totals.totalProfit / totals.totalCost) * 100).toFixed(1)}% Margen
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1E1E1E] border-[#2A2A2A]">
              <CardContent className="pt-4 md:pt-6">
                <div className="space-y-2 md:space-y-3 text-xs md:text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#B0B0B0]">Ítems</span>
                    <span className="font-medium text-[#F5F5F5]">{visibleItems.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#B0B0B0]">Margen global</span>
                    <span className="font-medium text-[#F5F5F5]">{globalMargin}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#B0B0B0]">Estado</span>
                    <span className="font-medium text-[#F5F5F5]">{STATUS_LABELS[quoteData.status] || quoteData.status}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AddItemDialog
        open={addItemOpen}
        onOpenChange={setAddItemOpen}
        suppliers={suppliers}
        products={products}
        onAdd={handleAddItem}
      />
    </div>
  );
}
