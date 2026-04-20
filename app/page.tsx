import { supabase } from "@/lib/supabase";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  CircleDollarSign,
  Briefcase,
} from "lucide-react";
import TransactionForm from "@/app/Components/TransactionForm";
import PortfolioChart from "@/app/Components/PortfolioChart";
import ThemeToggle from '@/app/Components/ThemeToggle'
import DeleteButton from "@/app/Components/DeleteButton";

async function getCurrentPrice(symbol: string) {
  try {
    const apiKey = process.env.FINNHUB_API_KEY;
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol.toUpperCase()}&token=${apiKey}`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) throw new Error("ดึงข้อมูล API ไม่สำเร็จ");
    const data = await res.json();
    return data.c && data.c > 0 ? data.c : 0;
  } catch {
    return 0;
  }
}

async function getExchangeRate() {
  try {
    const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD", {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    return data.rates.THB || 36.5;
  } catch {
    return 36.5;
  }
}

export default async function Home() {
  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .order("transaction_date", { ascending: false });

  const portfolioSummary = transactions?.reduce(
    (acc, tx) => {
      if (!acc[tx.symbol]) acc[tx.symbol] = { totalShares: 0, totalInvested: 0 };
      const value = tx.shares * tx.price;
      if (tx.type === "BUY") {
        acc[tx.symbol].totalShares += tx.shares;
        acc[tx.symbol].totalInvested += value;
      } else if (tx.type === "SELL") {
        acc[tx.symbol].totalShares -= tx.shares;
        acc[tx.symbol].totalInvested -= value;
      }
      return acc;
    },
    {} as Record<string, { totalShares: number; totalInvested: number }>,
  );

  let totalInvested = 0;
  let currentPortfolioValue = 0;

  if (portfolioSummary) {
    const assets = Object.entries(portfolioSummary) as [
      string,
      { totalShares: number; totalInvested: number },
    ][];
    await Promise.all(
      assets.map(async ([symbol, asset]) => {
        if (asset.totalShares > 0) {
          totalInvested += asset.totalInvested;
          const currentPrice = await getCurrentPrice(symbol);
          currentPortfolioValue += currentPrice * asset.totalShares;
        }
      }),
    );
  }

  const profitLoss = currentPortfolioValue - totalInvested;
  const profitLossPercentage =
    totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;
  const isProfit = profitLoss >= 0;

  const thbRate = await getExchangeRate();
  const currentPortfolioValueTHB = currentPortfolioValue * thbRate;
  const totalInvestedTHB = totalInvested * thbRate;
  const profitLossTHB = profitLoss * thbRate;

  const activeAssets = Object.entries(portfolioSummary || {})
    .filter(([_, asset]) => (asset as { totalShares: number }).totalShares > 0)
    .map(([symbol, asset]) => ({
      symbol,
      shares: (asset as { totalShares: number }).totalShares,
      invested: (asset as { totalInvested: number }).totalInvested,
    }));

  const chartData = activeAssets.map((asset) => ({
    name: asset.symbol,
    value: asset.invested,
    shares: asset.shares,
  }));

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <main className="min-h-screen bg-linear-b from-blue-400 to-green-200 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
              Portfolio Tracker
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              ติดตามการลงทุนแบบ Real-time · 1 USD = {thbRate.toFixed(2)} THB
            </p>
          </div>
          <ThemeToggle />
          <TransactionForm />
        </header>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
              <Wallet size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-0.5">มูลค่าพอร์ตปัจจุบัน</p>
              <p className="text-xl font-semibold text-slate-900 dark:text-white">${fmt(currentPortfolioValue)}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">≈ ฿{fmt(currentPortfolioValueTHB)}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex items-center gap-4">
            <div className="p-3 bg-violet-50 dark:bg-violet-900/30 rounded-xl">
              <CircleDollarSign size={20} className="text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-0.5">ต้นทุนรวม</p>
              <p className="text-xl font-semibold text-slate-900 dark:text-white">${fmt(totalInvested)}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">≈ ฿{fmt(totalInvestedTHB)}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${isProfit ? "bg-emerald-50 dark:bg-emerald-900/30" : "bg-red-50 dark:bg-red-900/30"}`}>
              {isProfit
                ? <TrendingUp size={20} className="text-emerald-600 dark:text-emerald-400" />
                : <TrendingDown size={20} className="text-red-600 dark:text-red-400" />}
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-0.5">กำไร / ขาดทุน</p>
              <p className={`text-xl font-semibold ${isProfit ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                {isProfit ? "+" : ""}${fmt(profitLoss)}
                <span className="text-sm font-medium ml-1.5 opacity-80">
                  ({isProfit ? "+" : ""}{profitLossPercentage.toFixed(2)}%)
                </span>
              </p>
              <p className={`text-xs mt-0.5 ${isProfit ? "text-emerald-500 dark:text-emerald-500" : "text-red-500"}`}>
                ≈ {isProfit ? "+" : ""}฿{fmt(profitLossTHB)}
              </p>
            </div>
          </div>
        </div>

        {/* Main content: chart + sidebar */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Chart */}
          <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
              สัดส่วนพอร์ตการลงทุน (ต้นทุน USD)
            </h2>
            <PortfolioChart data={chartData} />
          </div>

          {/* Sidebar: holdings */}
          <aside className="w-full lg:w-64 shrink-0">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 lg:sticky lg:top-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                  <Briefcase size={16} className="text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">หุ้นที่ถือครอง</h2>
              </div>

              <div className="space-y-2">
                {activeAssets.length > 0 ? (
                  activeAssets.map((asset) => (
                    <div
                      key={asset.symbol}
                      className="flex justify-between items-center bg-slate-50 dark:bg-slate-700/50 px-3 py-2.5 rounded-xl"
                    >
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {asset.symbol}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {asset.shares.toLocaleString(undefined, { maximumFractionDigits: 6 })} หุ้น
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-6">ยังไม่มีหุ้นในพอร์ต</p>
                )}
              </div>
            </div>
          </aside>
        </div>

        {/* Transaction history */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">ประวัติการทำรายการ</h2>
          </div>

          {transactions && transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-700/40">
                    <th className="px-6 py-3 text-left font-medium">วันที่</th>
                    <th className="px-6 py-3 text-left font-medium">หุ้น / ETF</th>
                    <th className="px-6 py-3 text-left font-medium">ประเภท</th>
                    <th className="px-6 py-3 text-left font-medium">จำนวน</th>
                    <th className="px-6 py-3 text-left font-medium">ราคา</th>
                    <th className="px-6 py-3 text-left font-medium">มูลค่ารวม</th>
                    <th className="px-6 py-3 text-center font-medium">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {transactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-6 py-3.5 text-slate-500 dark:text-slate-400">
                        {new Date(tx.transaction_date).toLocaleDateString("th-TH")}
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-slate-900 dark:text-white">
                        {tx.symbol}
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            tx.type === "BUY"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                              : "bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                          }`}
                        >
                          {tx.type === "BUY" ? "ซื้อ" : "ขาย"}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-700 dark:text-slate-300">{tx.shares}</td>
                      <td className="px-6 py-3.5 text-slate-700 dark:text-slate-300">
                        ${tx.price.toLocaleString()}
                      </td>
                      <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-white">
                        ${(tx.shares * tx.price).toLocaleString()}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <DeleteButton id={tx.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-sm">
              ยังไม่มีประวัติการทำรายการ กดปุ่ม &ldquo;เพิ่มรายการ&rdquo; เพื่อเริ่มต้น
            </div>
          )}
        </div>
      </div>
    </main>
  );
}