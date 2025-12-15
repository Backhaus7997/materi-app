import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from "@/api/apiClient";
import { useQuery } from '@tanstack/react-query';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Plus,
  Search,
  Loader2,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';

const STATUS_COLORS = {
  Draft: 'bg-[#2A2A2A] text-[#B0B0B0]',
  Sent: 'bg-blue-900/30 text-blue-400',
  Accepted: 'bg-emerald-900/30 text-emerald-400',
  Rejected: 'bg-red-900/30 text-red-400'
};

export default function Quotes() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // usuario actual
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api.auth.me()
  });

  // si es proveedor, lo saco
  useEffect(() => {
    if (user?.user_role === 'Supplier') {
      navigate(createPageUrl('SupplierDashboard'));
    }
  }, [user, navigate]);

  // presupuestos SOLO del vendedor actual
  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ['quotes', user?.id],
    enabled: !!user?.id,
    queryFn: () =>
      api.entities.Quote.filter({
        vendor_id: user.id,
        // si tu backend soporta orden, podrías pasar algo así:
        // order_by: '-createdAt'
      }),
  });

  // filtro por búsqueda + estado
  const filteredQuotes = useMemo(() => {
    return quotes.filter((q) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        q.customer_name?.toLowerCase().includes(term) ||
        q.quote_number?.toLowerCase().includes(term) ||
        q.customer_company?.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === 'all' || q.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [quotes, searchTerm, statusFilter]);

  // stats (sobre los que ve este vendedor)
  const stats = useMemo(() => {
    const total = filteredQuotes.length;
    const accepted = filteredQuotes.filter(q => q.status === 'Accepted').length;
    const totalProfit = filteredQuotes.reduce(
      (sum, q) => sum + (q.total_profit_amount || 0),
      0
    );
    return { total, accepted, totalProfit };
  }, [filteredQuotes]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F5F5]">Presupuestos</h1>
          <p className="text-[#B0B0B0] mt-1">
            Crea y gestiona presupuestos para clientes
          </p>
        </div>
        <Link to={createPageUrl('QuoteBuilder')}>
          <Button className="bg-[#E53935] hover:bg-[#C62828] text-white">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo presupuesto
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#1E1E1E] rounded-xl p-5 border border-[#2A2A2A]">
          <p className="text-sm text-[#B0B0B0]">Presupuestos totales</p>
          <p className="text-2xl font-bold text-[#F5F5F5] mt-1">{stats.total}</p>
        </div>
        <div className="bg-[#1E1E1E] rounded-xl p-5 border border-[#2A2A2A]">
          <p className="text-sm text-[#B0B0B0]">Aceptados</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            {stats.accepted}
          </p>
        </div>
        <div className="bg-[#1E1E1E] rounded-xl p-5 border border-[#2A2A2A]">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#B0B0B0]">Ganancia total</p>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-[#F5F5F5] mt-1">
            $
            {stats.totalProfit.toLocaleString('en-US', {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B0B0B0]" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar presupuestos..."
            className="pl-10 bg-[#1E1E1E] border-[#2A2A2A] text-[#F5F5F5] placeholder:text-[#B0B0B0]"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-[#1E1E1E] border-[#2A2A2A] text-[#F5F5F5]">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent className="bg-[#1E1E1E] border-[#2A2A2A]">
            <SelectItem
              value="all"
              className="text-[#F5F5F5] focus:bg-[#2A2A2A] focus:text-[#F5F5F5]"
            >
              Todos los estados
            </SelectItem>
            <SelectItem
              value="Draft"
              className="text-[#F5F5F5] focus:bg-[#2A2A2A] focus:text-[#F5F5F5]"
            >
              Borrador
            </SelectItem>
            <SelectItem
              value="Sent"
              className="text-[#F5F5F5] focus:bg-[#2A2A2A] focus:text-[#F5F5F5]"
            >
              Enviado
            </SelectItem>
            <SelectItem
              value="Accepted"
              className="text-[#F5F5F5] focus:bg-[#2A2A2A] focus:text-[#F5F5F5]"
            >
              Aceptado
            </SelectItem>
            <SelectItem
              value="Rejected"
              className="text-[#F5F5F5] focus:bg-[#2A2A2A] focus:text-[#F5F5F5]"
            >
              Rechazado
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-[#1E1E1E] rounded-xl border border-[#2A2A2A] overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#E53935]" />
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-16 h-16 mx-auto mb-4 text-[#2A2A2A]" />
            <p className="text-[#B0B0B0] text-lg">
              No se encontraron presupuestos
            </p>
            <p className="text-[#666] text-sm mt-1">
              Crea tu primer presupuesto para comenzar
            </p>
            <Link to={createPageUrl('QuoteBuilder')}>
              <Button className="mt-4 bg-[#E53935] hover:bg-[#C62828] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Crear presupuesto
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#2A2A2A] border-[#2A2A2A]">
                  <TableHead className="font-semibold text-[#B0B0B0] text-center">
                    Presupuesto #
                  </TableHead>
                  <TableHead className="font-semibold text-[#B0B0B0] text-center">
                    Cliente
                  </TableHead>
                  <TableHead className="font-semibold text-[#B0B0B0] hidden md:table-cell text-center">
                    Fecha
                  </TableHead>
                  <TableHead className="font-semibold text-[#B0B0B0] text-center">
                    Estado
                  </TableHead>
                  <TableHead className="font-semibold text-[#B0B0B0] text-center hidden sm:table-cell">
                    Costo
                  </TableHead>
                  <TableHead className="font-semibold text-[#B0B0B0] text-center hidden sm:table-cell">
                    Venta
                  </TableHead>
                  <TableHead className="font-semibold text-[#B0B0B0] text-center">
                    Ganancia
                  </TableHead>
                  <TableHead className="w-12 text-center"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.map((quote) => (
                  <TableRow
                    key={quote.id}
                    className="hover:bg-[#2A2A2A]/50 border-[#2A2A2A]"
                  >
                    <TableCell className="text-center align-middle">
                      <span className="font-mono font-medium text-[#E53935]">
                        {quote.quote_number || `Q-${quote.id?.slice(-6)}`}
                      </span>
                    </TableCell>
                    <TableCell className="text-center align-middle">
                      <div>
                        <p className="font-medium text-[#F5F5F5]">
                          {quote.customer_name}
                        </p>
                        {quote.customer_company && (
                          <p className="text-xs text-[#B0B0B0]">
                            {quote.customer_company}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center align-middle text-[#B0B0B0] hidden md:table-cell">
                      {(() => {
                        const created =
                          quote.created_date ??
                          quote.createdAt ??
                          quote.created_at ??
                          quote.createdDate                   ;

                        const updated =
                          quote.updated_date ??
                          quote.updatedAt ??
                          quote.updated_at ??
                          quote.updatedDate ??
                          quote.modified_date ??
                          quote.modifiedAt ??
                          quote.modified_at                   ;

                        const createdText = created ? format(new Date(created), "dd/MM/yyyy") : "—";
                        const updatedText = updated ? format(new Date(updated), "dd/MM/yyyy") : null                    ;

                        return (
                          <div className="leading-tight">
                            <div className="text-[#B0B0B0]">{createdText}</div                    >

                            {updatedText && (
                              <div className="text-xs text-[#666] mt-1">
                                Modificado: {updatedText}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </TableCell>

                    <TableCell className="text-center align-middle">
                      <Badge
                        className={
                          STATUS_COLORS[quote.status] || STATUS_COLORS.Draft
                        }
                      >
                        {quote.status || 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center align-middle text-[#B0B0B0] hidden sm:table-cell">
                      ${(quote.total_cost || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center align-middle font-medium text-[#F5F5F5] hidden sm:table-cell">
                      ${(quote.total_sale_price || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center align-middle">
                      <span
                        className={`font-semibold ${
                          (quote.total_profit_amount || 0) >= 0
                            ? 'text-emerald-400'
                            : 'text-red-400'
                        }`}
                      >
                        ${(quote.total_profit_amount || 0).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center align-middle">
                      <Link
                        to={createPageUrl(`QuoteBuilder?id=${quote.id}`)}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[#B0B0B0] hover:bg-[#2A2A2A] hover:text-[#F5F5F5]"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
