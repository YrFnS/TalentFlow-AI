// @ts-nocheck
import React from 'react';
import { CreditCard, Eye, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useI18n } from '@/store/i18n-store';
import { formatDate, useInvoiceStatusBadge } from './billing-helpers';

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
  pdfUrl: string | null;
}

interface InvoiceHistoryTableProps {
  invoices: InvoiceItem[];
}

export default function InvoiceHistoryTable({
  invoices,
}: InvoiceHistoryTableProps) {
  const { t } = useI18n();
  const getInvoiceStatusBadge = useInvoiceStatusBadge();

  return (
    <Card className="card-animate-fade-in-up">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{t.billing.billingHistory}</CardTitle>
        <CardDescription className="text-xs">{invoices.length} {t.billing.billingHistory.toLowerCase()}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">{t.billing.invoiceNumber}</TableHead>
                <TableHead className="text-xs">{t.billing.amount}</TableHead>
                <TableHead className="text-xs">{t.billing.status}</TableHead>
                <TableHead className="text-xs">{t.billing.date}</TableHead>
                <TableHead className="text-xs text-end">{t.billing.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-8 text-center">
                    <CreditCard className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">{t.common.noResults}</p>
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv) => (
                  <TableRow key={inv.id} className="table-row-accent">
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{inv.invoiceNumber}</code>
                    </TableCell>
                    <TableCell className="text-sm font-medium">${inv.amount}</TableCell>
                    <TableCell>{getInvoiceStatusBadge(inv.status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(inv.date)}</TableCell>
                    <TableCell className="text-end">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-7 text-blue-600 hover:text-blue-700">
                          <Eye className="h-3.5 w-3.5 me-1" />
                          {t.billing.view}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-blue-600 hover:text-blue-700">
                          <Download className="h-3.5 w-3.5 me-1" />
                          {t.billing.download}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
