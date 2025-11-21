import React, { useState, useRef } from 'react';
import { useStore } from '../contexts/StoreContext';
import { X, Printer, Calendar, Download } from 'lucide-react';

interface ReportsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Period = 'today' | 'week' | 'month' | 'custom';

export default function ReportsModal({ isOpen, onClose }: ReportsModalProps) {
    const { transactions, cashFlows } = useStore();
    const [period, setPeriod] = useState<Period>('today');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const printRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

    const getFilteredData = () => {
        const now = new Date();
        let start = new Date();
        let end = new Date();

        if (period === 'today') {
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
        } else if (period === 'week') {
            start.setDate(now.getDate() - 7);
            start.setHours(0, 0, 0, 0);
        } else if (period === 'month') {
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
        } else if (period === 'custom') {
            if (!startDate || !endDate) return { filteredTx: [], filteredCf: [] };
            start = new Date(startDate);
            end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
        }

        const filteredTx = transactions.filter(t => t.timestamp >= start.getTime() && t.timestamp <= end.getTime());
        const filteredCf = cashFlows.filter(c => c.timestamp >= start.getTime() && c.timestamp <= end.getTime());

        return { filteredTx, filteredCf, start, end };
    };

    const { filteredTx, filteredCf, start, end } = getFilteredData();

    // Calculate Stats
    const productSales = filteredTx.reduce((sum, t) => sum + t.productTotal, 0);
    const serviceSales = filteredTx.reduce((sum, t) => sum + t.serviceTotal, 0);
    const totalSales = productSales + serviceSales;

    const expenses = filteredCf.filter(c => c.type === 'expense').reduce((sum, c) => sum + c.amount, 0);
    const withdrawals = filteredCf.filter(c => c.type === 'withdrawal').reduce((sum, c) => sum + c.amount, 0);
    const netCashFlow = totalSales - expenses - withdrawals;

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        const originalContents = document.body.innerHTML;
        document.body.innerHTML = printContent.innerHTML;
        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload(); // Reload to restore event listeners
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-indigo-600" />
                        Business Reports
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X className="w-6 h-6 text-slate-500" />
                    </button>
                </div>

                {/* Controls */}
                <div className="p-6 border-b border-slate-200 flex flex-wrap gap-4 items-center">
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        {(['today', 'week', 'month', 'custom'] as Period[]).map(p => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-all ${period === p ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>

                    {period === 'custom' && (
                        <div className="flex gap-2 items-center">
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="p-2 border rounded-lg text-sm"
                            />
                            <span className="text-slate-400">-</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="p-2 border rounded-lg text-sm"
                            />
                        </div>
                    )}

                    <div className="ml-auto flex gap-2">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            <Printer className="w-4 h-4" /> Print Report
                        </button>
                    </div>
                </div>

                {/* Report Preview */}
                <div className="flex-1 overflow-auto p-8 bg-slate-50">
                    <div ref={printRef} className="bg-white p-8 shadow-sm max-w-[210mm] mx-auto min-h-[297mm] text-slate-900">
                        {/* Print Header */}
                        <div className="text-center mb-8 border-b-2 border-slate-800 pb-4">
                            <h1 className="text-3xl font-bold uppercase tracking-wide mb-2">Business Summary Report</h1>
                            <p className="text-slate-500">
                                Period: {start.toLocaleDateString()} - {end.toLocaleDateString()}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">Generated on {new Date().toLocaleString()}</p>
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-3 gap-6 mb-8">
                            <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                                <p className="text-sm text-slate-500 uppercase font-bold">Total Revenue</p>
                                <p className="text-2xl font-bold text-indigo-600">${totalSales.toFixed(2)}</p>
                            </div>
                            <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                                <p className="text-sm text-slate-500 uppercase font-bold">Total Expenses</p>
                                <p className="text-2xl font-bold text-red-600">${expenses.toFixed(2)}</p>
                            </div>
                            <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                                <p className="text-sm text-slate-500 uppercase font-bold">Net Cash Flow</p>
                                <p className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ${netCashFlow.toFixed(2)}
                                </p>
                            </div>
                        </div>

                        {/* Detailed Breakdown */}
                        <div className="space-y-8">
                            {/* Sales Breakdown */}
                            <div>
                                <h3 className="text-lg font-bold border-b border-slate-300 pb-2 mb-4">Sales Breakdown</h3>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-100 text-left">
                                            <th className="p-2">Type</th>
                                            <th className="p-2 text-right">Count</th>
                                            <th className="p-2 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="p-2 border-b">Product Sales</td>
                                            <td className="p-2 border-b text-right">{filteredTx.filter(t => t.productTotal > 0).length}</td>
                                            <td className="p-2 border-b text-right">${productSales.toFixed(2)}</td>
                                        </tr>
                                        <tr>
                                            <td className="p-2 border-b">Service Revenue</td>
                                            <td className="p-2 border-b text-right">{filteredTx.filter(t => t.serviceTotal > 0).length}</td>
                                            <td className="p-2 border-b text-right">${serviceSales.toFixed(2)}</td>
                                        </tr>
                                        <tr className="font-bold bg-slate-50">
                                            <td className="p-2">Total</td>
                                            <td className="p-2 text-right">{filteredTx.length}</td>
                                            <td className="p-2 text-right">${totalSales.toFixed(2)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Expenses Breakdown */}
                            <div>
                                <h3 className="text-lg font-bold border-b border-slate-300 pb-2 mb-4">Expenses & Withdrawals</h3>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-100 text-left">
                                            <th className="p-2">Category</th>
                                            <th className="p-2 text-right">Count</th>
                                            <th className="p-2 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="p-2 border-b">Operational Expenses</td>
                                            <td className="p-2 border-b text-right">{filteredCf.filter(c => c.type === 'expense').length}</td>
                                            <td className="p-2 border-b text-right text-red-600">${expenses.toFixed(2)}</td>
                                        </tr>
                                        <tr>
                                            <td className="p-2 border-b">Withdrawals</td>
                                            <td className="p-2 border-b text-right">{filteredCf.filter(c => c.type === 'withdrawal').length}</td>
                                            <td className="p-2 border-b text-right text-amber-600">${withdrawals.toFixed(2)}</td>
                                        </tr>
                                        <tr className="font-bold bg-slate-50">
                                            <td className="p-2">Total Outflow</td>
                                            <td className="p-2 text-right">{filteredCf.length}</td>
                                            <td className="p-2 text-right text-red-700">${(expenses + withdrawals).toFixed(2)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-12 pt-4 border-t border-slate-200 text-center text-xs text-slate-400">
                            <p>End of Report</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
