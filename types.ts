
export type InvoiceStatus = 'New' | 'Grace Period' | 'Overdue' | 'Paid';

export interface Invoice {
  invoice_id: string;
  customer_name: string;
  invoice_date: string; // ISO string
  due_date: string; // ISO string
  original_amount: number;
  remaining_amount: number;
  grace_period: number; // in days
  status: InvoiceStatus;
  is_active: boolean;
  last_updated: string; // ISO string
}

export interface ProcessingSummary {
  newInvoices: number;
  updatedInvoices: number;
  paidInvoices: number;
}

export interface ExcelRow {
  invoice_id: string;
  customer_name: string;
  invoice_date: string;
  due_date: string;
  original_amount: number;
  remaining_amount: number;
  grace_period: number;
}
