
import React from 'react';
import { Invoice } from '../types';
import { format, parseISO } from 'date-fns';

interface InvoiceTableProps {
  invoices: Invoice[];
}

const statusColors = {
  'New': 'bg-blue-100 text-blue-700',
  'Grace Period': 'bg-amber-100 text-amber-700',
  'Overdue': 'bg-red-100 text-red-700',
  'Paid': 'bg-emerald-100 text-emerald-700',
};

const InvoiceTable: React.FC<InvoiceTableProps> = ({ invoices }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 rtl text-right" dir="rtl">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">رقم الفاتورة</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">العميل</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">تاريخ الفاتورة</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">تاريخ الاستحقاق</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">المتبقي</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">الحالة</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500 italic">
                  لا توجد بيانات حالياً. يرجى رفع ملف Excel للبدء.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.invoice_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{inv.invoice_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{inv.customer_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {format(parseISO(inv.invoice_date), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {format(parseISO(inv.due_date), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {inv.remaining_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[inv.status]}`}>
                      {inv.status === 'New' ? 'جديدة' : 
                       inv.status === 'Grace Period' ? 'فترة سماح' : 
                       inv.status === 'Overdue' ? 'متأخرة' : 'مدفوعة'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoiceTable;
