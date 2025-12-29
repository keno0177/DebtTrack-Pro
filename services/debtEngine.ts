
import { format, parseISO, isAfter, addDays, startOfDay } from 'date-fns';
import { Invoice, InvoiceStatus, ExcelRow, ProcessingSummary } from '../types';

/**
 * Helper function to calculate and update the status based on current date, due_date, and grace_period.
 */
export const updateInvoiceStatus = (invoice: Invoice): InvoiceStatus => {
  if (invoice.remaining_amount <= 0) return 'Paid';
  
  const today = startOfDay(new Date());
  const dueDate = startOfDay(parseISO(invoice.due_date));
  const graceEndDate = addDays(dueDate, invoice.grace_period);

  if (!isAfter(today, dueDate)) {
    return 'New';
  } else if (!isAfter(today, graceEndDate)) {
    return 'Grace Period';
  } else {
    return 'Overdue';
  }
};

/**
 * Main logic for Excel synchronization.
 * Mimics the requested Python UPSERT logic.
 */
export const processDataSync = (
  currentDb: Invoice[],
  excelData: ExcelRow[]
): { updatedDb: Invoice[]; summary: ProcessingSummary } => {
  const now = new Date().toISOString();
  let newCount = 0;
  let updatedCount = 0;
  let paidCount = 0;

  const excelIds = new Set(excelData.map(row => row.invoice_id));
  const newDb: Invoice[] = [...currentDb];

  // 1. Data Synchronization (UPSERT)
  excelData.forEach((row) => {
    const existingIndex = newDb.findIndex(inv => inv.invoice_id === row.invoice_id);

    if (existingIndex !== -1) {
      // UPDATE logic
      const existing = newDb[existingIndex];
      const updatedInvoice: Invoice = {
        ...existing,
        remaining_amount: row.remaining_amount,
        customer_name: row.customer_name,
        invoice_date: row.invoice_date,
        due_date: row.due_date,
        original_amount: row.original_amount,
        grace_period: row.grace_period,
        last_updated: now,
      };
      // Re-calculate status
      updatedInvoice.status = updateInvoiceStatus(updatedInvoice);
      // Ensure it's active if there's balance
      if (updatedInvoice.remaining_amount > 0) {
        updatedInvoice.is_active = true;
      }
      newDb[existingIndex] = updatedInvoice;
      updatedCount++;
    } else {
      // INSERT logic
      const newInvoice: Invoice = {
        invoice_id: row.invoice_id,
        customer_name: row.customer_name,
        invoice_date: row.invoice_date,
        due_date: row.due_date,
        original_amount: row.original_amount,
        remaining_amount: row.remaining_amount,
        grace_period: row.grace_period,
        status: 'New',
        is_active: row.remaining_amount > 0,
        last_updated: now,
      };
      newInvoice.status = updateInvoiceStatus(newInvoice);
      newDb.push(newInvoice);
      newCount++;
    }
  });

  // 2. Fully Paid Handling (Records not in Excel)
  for (let i = 0; i < newDb.length; i++) {
    const inv = newDb[i];
    if (inv.is_active && !excelIds.has(inv.invoice_id)) {
      newDb[i] = {
        ...inv,
        remaining_amount: 0,
        status: 'Paid',
        is_active: false,
        last_updated: now,
      };
      paidCount++;
    }
  }

  return {
    updatedDb: newDb,
    summary: {
      newInvoices: newCount,
      updatedInvoices: updatedCount,
      paidInvoices: paidCount
    }
  };
};
