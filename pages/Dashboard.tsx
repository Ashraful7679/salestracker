
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../contexts/StoreContext';
import { generateBusinessInsights } from '../services/geminiService';
import ReportsModal from '../components/ReportsModal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import {
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Package,
  Sparkles,
  ShoppingBag,
  Wrench,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  Clock
} from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, subtext, colorClass }: any) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-start justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
      {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
    </div>
    <div className={`p-3 rounded-lg ${colorClass}`}>
      <Icon className="w-5 h-5" />
    </div>
  </div>
);

type TimeRange = 'day' | 'week' | 'month' | 'year' | 'all';

export default function Dashboard() {
  const { user } = useAuth();
  const { transactions: Sales, products, cashFlows } = useStore();
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [insights, setInsights] = useState<string>('');
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('month');

  const isAdmin = user?.role === 'admin';

  // Helper to check if a date is within the selected range
  const isInRange = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();

    // Reset times to start of day for accurate comparison
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const n = new Date(now);
    n.setHours(0, 0, 0, 0);

    switch (timeRange) {
      case 'day':
        return d.getTime() === n.getTime();
      case 'week':
        const dayOfWeek = n.getDay(); // 0 (Sun) - 6 (Sat)
        const diff = n.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
        const monday = new Date(n.setDate(diff));
        return d >= monday;
      case 'month':
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      case 'year':
        return d.getFullYear() === now.getFullYear();
      case 'all':
        return true;
      default:
        return true;
    }
  };

  // Filter Data based on Time Range
  const filteredTansections = Sales.filter(t => isInRange(t.timestamp));
  const filteredCashFlows = cashFlows.filter(c => isInRange(c.timestamp));

  // Determine which dataset to analyze for Sales (Admin vs Manager)
  const dataToAnalyze = isAdmin
    ? filteredTansections
    : filteredTansections.filter(t => t.createdBy === user?.id);

  const timeLabel = {
    day: "Today",
    week: "This Week",
    month: "This Month",
    year: "This Year",
    all: "All Time"
  }[timeRange];

  // 1. Revenue
  const totalRevenue = dataToAnalyze.reduce((sum, t) => sum + t.totalAmount, 0);
  const productRevenue = dataToAnalyze.reduce((sum, t) => sum + (t.productTotal - (t.productDiscount || 0)), 0);
  const serviceRevenue = dataToAnalyze.reduce((sum, t) => sum + (t.serviceTotal - (t.serviceDiscount || 0)), 0);

  // 2. Cash Flow (Admin sees all)
  const totalExpenses = filteredCashFlows.filter(c => c.type === 'expense').reduce((sum, c) => sum + c.amount, 0);
  const totalWithdrawals = filteredCashFlows.filter(c => c.type === 'withdrawal').reduce((sum, c) => sum + c.amount, 0);

  // Cash on Hand (Net Cash Flow for the period)
  // If 'all', it's true Cash on Hand. If filtered, it's Net Change.
  // We'll label it "Net Cash Flow" if filtered, "Cash on Hand" if all time? 
  // For simplicity, let's keep "Cash Flow" label consistent or dynamic.
  const cashFlowLabel = timeRange === 'all' ? "Cash on Hand" : "Net Cash Flow";
  const cashOnHand = totalRevenue - (totalExpenses + totalWithdrawals);

  // 3. Profit (Admin Only)
  const totalProfit = isAdmin
    ? dataToAnalyze.reduce((sum, t) => sum + t.totalProfit, 0)
    : 0;

  const lowStockItems = products.filter(p => p.stock < 5);

  // Chart Data (Last 7 days - kept as is for trend context, or could be filtered? 
  // Usually charts are better with fixed context like "Last 7 Days" regardless of the summary filter, 
  // OR we make the chart match the filter. 
  // Let's keep the chart as "Last 7 Days" for now as it's a specific widget, 
  // unless the user asked to filter EVERYTHING. 
  // "filter everything by year, week, day..." implies the stats. 
  // Let's leave the chart as "Last 7 Days" for trend visualization unless requested otherwise, 
  // as a "Month" chart is complex to render in the same bar format without aggregation changes.
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });

    const dayTx = Sales.filter(t => {
      const txDate = new Date(t.timestamp);
      txDate.setHours(0, 0, 0, 0);
      return txDate.getTime() === d.getTime();
    });

    return {
      name: dayStr,
      Sales: dayTx.reduce((acc, t) => acc + t.totalAmount, 0),
      profit: isAdmin ? dayTx.reduce((acc, t) => acc + t.totalProfit, 0) : 0,
    };
  }).reverse();

  // Today's Specific Data (New Section)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaySalesTransactions = Sales.filter(t => t.timestamp >= today.getTime());
  const todaySalesAmount = todaySalesTransactions.reduce((sum, t) => sum + t.totalAmount, 0);

  const fetchInsights = async () => {
    setLoadingInsights(true);
    const result = await generateBusinessInsights(Sales, products);
    setInsights(result);
    setLoadingInsights(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">Welcome back, {user?.name}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Range Filter */}
          <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
            {(['day', 'week', 'month', 'year', 'all'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${timeRange === range
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50'
                  }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>

          {isAdmin && (
            <button
              onClick={fetchInsights}
              disabled={loadingInsights}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              {loadingInsights ? 'Analyzing...' : 'Ask AI Advisor'}
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Row 1: Tansections & Cash */}
        <StatCard
          title={isAdmin ? "Total Revenue" : "My Total Sales"}
          value={`$${totalRevenue.toFixed(2)}`}
          icon={DollarSign}
          colorClass="bg-emerald-100 text-emerald-600"
          subtext={`${timeLabel}`}
        />

        {isAdmin && (
          <StatCard
            title={cashFlowLabel}
            value={`$${cashOnHand.toFixed(2)}`}
            icon={Wallet}
            colorClass="bg-blue-100 text-blue-600"
            subtext={`${timeLabel}`}
          />
        )}

        {!isAdmin && (
          <StatCard
            title="My Total Expenses"
            value={`$${filteredCashFlows.filter(c => c.type === 'expense' && c.createdBy === user?.id).reduce((sum, c) => sum + c.amount, 0).toFixed(2)}`}
            icon={ArrowDownCircle}
            colorClass="bg-red-100 text-red-600"
            subtext={`${timeLabel}`}
          />
        )}

        <StatCard
          title="Product Sales"
          value={`$${productRevenue.toFixed(2)}`}
          icon={Package}
          colorClass="bg-indigo-100 text-indigo-600"
          subtext={`${timeLabel}`}
        />

        <StatCard
          title="Service Income"
          value={`$${serviceRevenue.toFixed(2)}`}
          icon={Wrench}
          colorClass="bg-purple-100 text-purple-600"
          subtext={`${timeLabel}`}
        />

        {/* Row 2: Expenses & Profit (Admin Only mostly) */}
        {isAdmin && (
          <>
            <StatCard
              title="Total Profit"
              value={`$${totalProfit.toFixed(2)}`}
              icon={TrendingUp}
              colorClass="bg-green-100 text-green-600"
              subtext={`${timeLabel} (Net)`}
            />
            <StatCard
              title="Total Expenses"
              value={`$${totalExpenses.toFixed(2)}`}
              icon={ArrowDownCircle}
              colorClass="bg-red-100 text-red-600"
              subtext={`${timeLabel}`}
            />
            <StatCard
              title="Withdrawals"
              value={`$${totalWithdrawals.toFixed(2)}`}
              icon={ArrowUpCircle}
              colorClass="bg-orange-100 text-orange-600"
              subtext={`${timeLabel}`}
            />
          </>
        )}

        <StatCard
          title="Low Stock Alerts"
          value={lowStockItems.length}
          icon={AlertTriangle}
          colorClass={lowStockItems.length > 0 ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400"}
          subtext="Items below 5 units"
        />
      </div>

      {/* Today's Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Overview */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              Today's Activity
            </h3>
            <span className="text-2xl font-bold text-indigo-600">${todaySalesAmount.toFixed(2)}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-3 font-medium text-slate-500">Time</th>
                  <th className="pb-3 font-medium text-slate-500">Customer</th>
                  <th className="pb-3 font-medium text-slate-500">Items</th>
                  <th className="pb-3 font-medium text-slate-500 text-right">Amount</th>
                  {isAdmin && <th className="pb-3 font-medium text-slate-500">Author</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {todaySalesTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No Sales today yet.
                    </td>
                  </tr>
                ) : (
                  todaySalesTransactions.slice().reverse().map((t) => (
                    <tr key={t.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="py-3 text-slate-600">
                        {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 font-medium text-slate-900">{t.customerName}</td>
                      <td className="py-3 text-slate-600">
                        {t.items.length} items ({t.items.map(i => i.name).join(', ').slice(0, 30)}{t.items.map(i => i.name).join(', ').length > 30 ? '...' : ''})
                      </td>
                      <td className="py-3 text-right font-bold text-slate-900">
                        ${t.totalAmount.toFixed(2)}
                      </td>
                      {isAdmin && (
                        <td className="py-3 text-slate-600 text-xs">
                          {t.createdByName}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock / Recent Activity */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Low Stock Alert</h3>
          <div className="flex-1 overflow-y-auto max-h-80">
            {lowStockItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 py-8">
                <Package className="w-12 h-12 mb-2 opacity-20" />
                <p>Stock levels are healthy.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {lowStockItems.map(item => (
                  <li key={item.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">SKU: {item.sku}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {item.stock} left
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* AI Insights Area */}
      {isAdmin && insights && (
        <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-xl border border-indigo-100 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2 mb-3 text-indigo-800 font-semibold">
            <Sparkles className="w-5 h-5" />
            <h2>AI Business Advisor</h2>
          </div>
          <div
            className="prose prose-sm prose-indigo text-slate-700 max-w-none"
            dangerouslySetInnerHTML={{ __html: insights }}
          />
        </div>
      )}

      {/* Charts & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-3 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Sales Performance (Last 7 Days)</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="Sales" name="Revenue" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={32} />
                {isAdmin && <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <ReportsModal isOpen={isReportsOpen} onClose={() => setIsReportsOpen(false)} />
    </div>
  );
}
