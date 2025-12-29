
import React from 'react';
import { Invoice } from '../types';
import { DollarSign, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface StatsCardsProps {
  invoices: Invoice[];
}

const StatsCards: React.FC<StatsCardsProps> = ({ invoices }) => {
  const totalDebt = invoices.reduce((sum, i) => sum + i.remaining_amount, 0);
  const overdueDebt = invoices
    .filter(i => i.status === 'Overdue')
    .reduce((sum, i) => sum + i.remaining_amount, 0);
  const overdueCount = invoices.filter(i => i.status === 'Overdue').length;
  const activeInvoices = invoices.filter(i => i.is_active).length;

  const cards = [
    {
      title: 'Total Outstanding',
      value: `$${totalDebt.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Overdue Amount',
      value: `$${overdueDebt.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      icon: AlertCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      title: 'Overdue Invoices',
      value: overdueCount.toString(),
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      title: 'Active Accounts',
      value: activeInvoices.toString(),
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, idx) => (
        <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className={`${card.bg} p-3 rounded-lg mr-4`}>
            <card.icon className={`${card.color} w-6 h-6`} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">{card.title}</p>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
