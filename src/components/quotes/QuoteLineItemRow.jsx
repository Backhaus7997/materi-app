import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Package } from "lucide-react";

export default function QuoteLineItemRow({
  item,
  index,
  globalMargin,
  onUpdate,
  onDelete,
}) {
  const computed = useMemo(() => {
    const unitCost = parseFloat(item.unit_cost_price) || 0;
    const qty = parseFloat(item.quantity) || 0;

    // ✅ SOLO margen global
    const margin = parseFloat(globalMargin) || 0;

    const lineCostTotal = unitCost * qty;
    const unitSalePrice = unitCost * (1 + margin / 100);
    const lineSaleTotal = unitSalePrice * qty;
    const lineProfitAmount = lineSaleTotal - lineCostTotal;

    return { lineCostTotal, unitSalePrice, lineSaleTotal, lineProfitAmount };
  }, [item.unit_cost_price, item.quantity, globalMargin]);

  const handleQtyChange = (value) => {
    const qty = value === "" ? "" : value;
    onUpdate(index, {
      ...item,
      quantity: qty,
      // ✅ bloquear margen por ítem
      margin_percent: null,
      line_cost_total: computed.lineCostTotal,
      unit_sale_price: computed.unitSalePrice,
      line_sale_total: computed.lineSaleTotal,
      line_profit_amount: computed.lineProfitAmount,
    });
  };

  return (
    <div className="bg-[#2A2A2A] border border-[#2A2A2A] rounded-xl p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-12 h-12 rounded-lg bg-[#1E1E1E] flex items-center justify-center shrink-0">
            <Package className="w-6 h-6 text-[#B0B0B0]" />
          </div>

          <div className="min-w-0">
            <p className="font-semibold text-[#F5F5F5] truncate">
              {item.product_name}
            </p>
            <p className="text-sm text-[#B0B0B0] truncate">
              {item.supplier_name}
            </p>
            <p className="text-sm text-[#B0B0B0] mt-1">
              Costo unitario:{" "}
              <span className="text-[#F5F5F5] font-medium">
                ${(parseFloat(item.unit_cost_price) || 0).toFixed(2)}
              </span>{" "}
              <span className="text-[#666]">/ {item.unit_of_measure}</span>
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onDelete(index)}
          className="border-[#2A2A2A] text-red-400 hover:bg-red-900/20 hover:text-red-400"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="mt-4 pt-4 border-t border-[#1E1E1E] grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-[#B0B0B0]">Cantidad</Label>
          <Input
            type="number"
            min="0.01"
            step="0.01"
            value={item.quantity ?? ""}
            onChange={(e) => handleQtyChange(e.target.value)}
            className="bg-[#1E1E1E] border-[#1E1E1E] text-[#F5F5F5]"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[#B0B0B0]">Margen</Label>
          <div className="h-10 rounded-md bg-[#1E1E1E] border border-[#1E1E1E] flex items-center px-3 text-[#F5F5F5]">
            {globalMargin}% (global)
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[#B0B0B0]">Venta unitaria</Label>
          <div className="h-10 rounded-md bg-[#1E1E1E] border border-[#1E1E1E] flex items-center px-3 font-semibold text-[#E53935]">
            ${computed.unitSalePrice.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-[#1E1E1E] grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-[#B0B0B0]">Total costo</p>
          <p className="font-medium text-[#F5F5F5]">
            ${computed.lineCostTotal.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-[#B0B0B0]">Total venta</p>
          <p className="font-semibold text-[#E53935]">
            ${computed.lineSaleTotal.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-[#B0B0B0]">Ganancia</p>
          <p
            className={`font-semibold ${
              computed.lineProfitAmount >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            ${computed.lineProfitAmount.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-[#B0B0B0]">Margen</p>
          <p className="font-medium text-[#F5F5F5]">{globalMargin}%</p>
        </div>
      </div>
    </div>
  );
}
