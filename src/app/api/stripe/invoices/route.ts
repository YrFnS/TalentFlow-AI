import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCompanyMember } from '@/lib/auth-guard';

// Get invoice history for the company
export async function GET() {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const companyId = auth.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    const subscription = await db.subscription.findUnique({
      where: { companyId },
      include: {
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 24,
        },
      },
    });

    if (!subscription) {
      return NextResponse.json({ invoices: [] });
    }

    const invoices = subscription.invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      amount: inv.amount,
      currency: inv.currency,
      status: inv.status,
      date: inv.paidAt || inv.createdAt,
      dueDate: inv.dueDate,
      pdfUrl: inv.pdfUrl || inv.invoicePdf,
      hostedInvoiceUrl: inv.hostedInvoiceUrl,
      stripeInvoiceId: inv.stripeInvoiceId,
    }));

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}
