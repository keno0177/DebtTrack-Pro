
import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, BrainCircuit, RefreshCcw, Info, Download } from 'lucide-react';
import { Invoice, ProcessingSummary, ExcelRow } from './types';
import { processDataSync } from './services/debtEngine';
import { getCollectionInsights } from './services/gemini';
import StatsCards from './components/StatsCards';
import InvoiceTable from './components/InvoiceTable';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const App: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<ProcessingSummary | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize with some mock data for demo
  useEffect(() => {
    const today = new Date().toISOString();
    const initialData: Invoice[] = [
      {
        invoice_id: 'INV-1001',
        customer_name: 'شركة الأمل للتجارة',
        invoice_date: new Date(Date.now() - 86400000 * 15).toISOString(),
        due_date: new Date(Date.now() - 86400000 * 5).toISOString(),
        original_amount: 5000,
        remaining_amount: 5000,
        grace_period: 2,
        status: 'Overdue',
        is_active: true,
        last_updated: today
      },
      {
        invoice_id: 'INV-1002',
        customer_name: 'مؤسسة الحلول الذكية',
        invoice_date: new Date(Date.now() - 86400000 * 5).toISOString(),
        due_date: new Date(Date.now() + 86400000 * 10).toISOString(),
        original_amount: 2500,
        remaining_amount: 2500,
        grace_period: 7,
        status: 'New',
        is_active: true,
        last_updated: today
      }
    ];
    setInvoices(initialData);
  }, []);

  const downloadTemplate = () => {
    // الترتيب المطلوب: العميل، رقم الفاتورة، تاريخ الفاتورة، مبلغ الفاتورة، ما تبقى من اجمالي الفاتورة، فترة السماح، تاريخ الاستحقاق
    const templateData = [
      {
        "العميل": "شركة مثال",
        "رقم الفاتورة": "INV-001",
        "تاريخ الفاتورة": "2024-01-01",
        "مبلغ الفاتورة": 1000,
        "ما تبقى من اجمالي الفاتورة": 1000,
        "فترة السماح": 7,
        "تاريخ الاستحقاق": "2024-01-15"
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "نموذج التحصيل");
    XLSX.writeFile(wb, "Debt_Collection_Template.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(sheet);

        const parsedRows: ExcelRow[] = json.map(item => ({
          customer_name: String(item["العميل"] || item.customer_name || "عميل غير معروف"),
          invoice_id: String(item["رقم الفاتورة"] || item.invoice_id || ""),
          invoice_date: item["تاريخ الفاتورة"] ? new Date(item["تاريخ الفاتورة"]).toISOString() : new Date().toISOString(),
          original_amount: Number(item["مبلغ الفاتورة"] || item.original_amount || 0),
          remaining_amount: Number(item["ما تبقى من اجمالي الفاتورة"] || item.remaining_amount || 0),
          grace_period: Number(item["فترة السماح"] || item.grace_period || 0),
          due_date: item["تاريخ الاستحقاق"] ? new Date(item["تاريخ الاستحقاق"]).toISOString() : new Date().toISOString(),
        })).filter(row => row.invoice_id !== "");

        const { updatedDb, summary: syncSummary } = processDataSync(invoices, parsedRows);
        
        setInvoices(updatedDb);
        setSummary(syncSummary);
        setIsProcessing(false);
        handleAiAnalyze(updatedDb);
      } catch (err) {
        console.error("خطأ في معالجة الملف:", err);
        alert("حدث خطأ أثناء معالجة الملف. يرجى التأكد من استخدام التنسيق الصحيح.");
        setIsProcessing(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleAiAnalyze = async (data: Invoice[]) => {
    setIsAiLoading(true);
    const insight = await getCollectionInsights(data);
    setAiInsight(insight || "لا توجد مخاطر محددة حالياً.");
    setIsAiLoading(false);
  };

  const chartData = [
    { name: 'جديدة', count: invoices.filter(i => i.status === 'New').length, color: '#3b82f6' },
    { name: 'سماح', count: invoices.filter(i => i.status === 'Grace Period').length, color: '#f59e0b' },
    { name: 'متأخرة', count: invoices.filter(i => i.status === 'Overdue').length, color: '#ef4444' },
    { name: 'مدفوعة', count: invoices.filter(i => i.status === 'Paid').length, color: '#10b981' },
  ];

  return (
    <div className="min-h-screen pb-20 font-sans" dir="rtl">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <div className="bg-indigo-600 p-2 rounded-lg ml-3">
                <FileSpreadsheet className="text-white w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-800">
                DebtTrack Pro | نظام تتبع الديون
              </h1>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse">
              <button 
                onClick={downloadTemplate}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-all"
              >
                <Download className="ml-2 h-4 w-4" />
                تحميل النموذج المعتمد
              </button>
              <button 
                disabled={isProcessing}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-all active:scale-95"
              >
                {isProcessing ? <RefreshCcw className="ml-2 h-4 w-4 animate-spin" /> : <Upload className="ml-2 h-4 w-4" />}
                رفع وتحديث البيانات
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".xlsx, .xls, .csv" 
                onChange={handleFileUpload}
              />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">نظرة عامة على التحصيل</h2>
          <p className="text-gray-500">إدارة مديونيات العملاء بناءً على التنسيق الموحد: العميل، الفاتورة، التواريخ، والمبالغ.</p>
        </div>

        {summary && (
          <div className="mb-8 bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-start">
            <RefreshCcw className="w-5 h-5 text-indigo-600 ml-3 mt-1 animate-spin-slow" />
            <div>
              <h3 className="text-sm font-semibold text-indigo-900">اكتمل التحديث بنجاح</h3>
              <p className="text-sm text-indigo-700">
                تمت المعالجة: <strong>{summary.newInvoices}</strong> فواتير جديدة، <strong>{summary.updatedInvoices}</strong> تحديث مبالغ، و <strong>{summary.paidInvoices}</strong> فواتير تم تسويتها بالكامل.
              </p>
            </div>
          </div>
        )}

        <StatsCards invoices={invoices} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">سجل الفواتير (Ledger)</h3>
                <span className="text-xs font-medium text-gray-400">إجمالي الفواتير النشطة: {invoices.filter(i => i.is_active).length}</span>
              </div>
              <InvoiceTable invoices={invoices} />
            </section>
          </div>

          <div className="space-y-8">
            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 text-center">توزيع الحالات</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" fontSize={12} axisLine={false} tickLine={false} />
                    <YAxis fontSize={12} axisLine={false} tickLine={false} orientation="right" />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', textAlign: 'right' }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="bg-gradient-to-br from-indigo-900 to-indigo-800 p-6 rounded-xl shadow-lg text-white">
              <div className="flex items-center mb-4">
                <BrainCircuit className="w-6 h-6 ml-2 text-indigo-300" />
                <h3 className="text-lg font-bold">المحلل الذكي</h3>
              </div>
              {isAiLoading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-2 bg-indigo-700 rounded w-full"></div>
                  <div className="h-2 bg-indigo-700 rounded w-3/4"></div>
                </div>
              ) : aiInsight ? (
                <div className="text-sm text-indigo-100 leading-relaxed whitespace-pre-wrap">
                  {aiInsight}
                </div>
              ) : (
                <button 
                  onClick={() => handleAiAnalyze(invoices)}
                  className="w-full py-2 bg-indigo-500 hover:bg-indigo-400 rounded-lg text-sm font-medium transition-colors"
                >
                  تحليل استراتيجية التحصيل
                </button>
              )}
            </section>

            <section className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
              <div className="flex items-center mb-2">
                <Info className="w-4 h-4 text-amber-600 ml-2" />
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">الحقول المطلوبة في الملف</h4>
              </div>
              <ul className="text-xs text-amber-800 space-y-1">
                <li>• <strong>العميل:</strong> اسم الشركة أو الشخص.</li>
                <li>• <strong>رقم الفاتورة:</strong> المعرف الأساسي للمزامنة.</li>
                <li>• <strong>تاريخ الفاتورة:</strong> تاريخ إصدار المستند.</li>
                <li>• <strong>مبلغ الفاتورة:</strong> القيمة الإجمالية.</li>
                <li>• <strong>المتبقي:</strong> القيمة المطلوب تحصيلها حالياً.</li>
                <li>• <strong>فترة السماح:</strong> أيام إضافية بعد الاستحقاق.</li>
                <li>• <strong>تاريخ الاستحقاق:</strong> موعد السداد النهائي.</li>
              </ul>
            </section>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 text-center text-xs text-gray-400">
        نظام DebtTrack Pro المتطور &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default App;
