import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from 'lucide-react';

export default function QuoteLineItemRow({ item, index, globalMargin, onUpdate, onDelete }) {
  const effectiveMargin = item.margin_percent !== null && item.margin_percent !== undefined && item.margin_percent !== ''
    ? parseFloat(item.margin_percent)
    : globalMargin;

  const unitCost = parseFloat(item.unit_cost_price) || 0;
  const quantity = parseFloat(item.quantity) || 0;
  const lineCostTotal = unitCost * quantity;
  const unitSalePrice = unitCost * (1 + effectiveMargin / 100);
  const lineSaleTotal = unitSalePrice * quantity;
  const lineProfitAmount = lineSaleTotal - lineCostTotal;

  const handleQuantityChange = (value) => {
    const qty = parseFloat(value) || 0;
    onUpdate(index, {
      ...item,
      quantity: qty,
      line_cost_total: unitCost * qty,
      unit_sale_price: unitSalePrice,
      line_sale_total: unitSalePrice * qty,
      line_profit_amount: (unitSalePrice * qty) - (unitCost * qty)
    });
  };

  const handleMarginChange = (value) => {
    const margin = value === '' ? null : parseFloat(value);
    const newEffectiveMargin = margin !== null ? margin : globalMargin;
    const newUnitSalePrice = unitCost * (1 + newEffectiveMargin / 100);
    
    onUpdate(index, {
      ...item,
      margin_percent: margin,
      unit_sale_price: newUnitSalePrice,
      line_sale_total: newUnitSalePrice * quantity,
      line_profit_amount: (newUnitSalePrice * quantity) - lineCostTotal
    });
  };

  return (
    <div className="p-4 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-[#F5F5F5] truncate">{item.product_name}</p>
          <p className="text-sm text-[#B0B0B0] truncate">{item.supplier_name}</p>
          {item.product_description_snapshot && (
            <p className="text-xs text-[#666] mt-1 line-clamp-2">{item.product_description_snapshot}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(index)}
          className="text-[#B0B0B0] hover:text-[#E53935] hover:bg-[#2A2A2A] shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-[#B0B0B0]">Costo unit.</label>
          <div className="px-3 py-2 bg-[#2A2A2A] rounded-lg text-sm font-medium text-[#F5F5F5]">
            ${unitCost.toFixed(2)}
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-[#B0B0B0]">Cant. ({item.unit_of_measure || 'unit'})</label>
          <Input
            type="number"
            min="0.01"
            step="0.01"
            value={item.quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            className="h-9 bg-[#2A2A2A] border-[#2A2A2A] text-[#F5F5F5]"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-[#B0B0B0]">Margen %</label>
          <Input
            type="number"
            min="0"
            step="0.1"
            value={item.margin_percent ?? ''}
            onChange={(e) => handleMarginChange(e.target.value)}
            placeholder={`${globalMargin}%`}
            className="h-9 bg-[#2A2A2A] border-[#2A2A2A] text-[#F5F5F5] placeholder:text-[#666]"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-[#B0B0B0]">Venta unit.</label>
          <div className="px-3 py-2 bg-[#E53935]/20 rounded-lg text-sm font-medium text-[#E53935]">
            ${unitSalePrice.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-[#2A2A2A]">
        <div className="flex gap-4 text-sm">
          <span className="text-[#B0B0B0]">
            Costo: <span className="font-medium text-[#F5F5F5]">${lineCostTotal.toFixed(2)}</span>
          </span>
          <span className="text-[#B0B0B0]">
            Venta: <span className="font-medium text-[#E53935]">${lineSaleTotal.toFixed(2)}</span>
          </span>
        </div>
        <span className={`text-sm font-medium ${lineProfitAmount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          Ganancia: ${lineProfitAmount.toFixed(2)}
        </span>
      </div>
    </div>
  );
}