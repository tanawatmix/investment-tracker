import { supabase } from "@/lib/supabase";
import { Wallet, TrendingUp, TrendingDown, CircleDollarSign } from "lucide-react";
import TransactionForm from "@/app/Components/TransactionForm";

// --- ฟังก์ชันจำลองดึงราคาตลาด (เดี๋ยวเฟสหน้าเรามาต่อ API จริงกัน) ---
async function getCurrentPrice(symbol: string) {
  const mockPrices: Record<string, number> = {
    'MSFT': 425.50,
    'NVDA': 890.00,
    'VOO': 480.20,
    'AAPL': 175.00
  };
  // ถ้าพิมพ์ชื่อหุ้นตัวอื่นมา จะสมมติราคาให้เป็น 100$ ไปก่อน
  return mockPrices[symbol.toUpperCase()] || 100.00; 
}

export default async function Home() {
  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("*")
    .order("transaction_date", { ascending: false });

  const portfolioSummary = transactions?.reduce((acc, tx) => {
    if (!acc[tx.symbol]) {
      acc[tx.symbol] = { totalShares: 0, totalInvested: 0 }
    }
    
    const value = tx.shares * tx.price
    if (tx.type === 'BUY') {
      acc[tx.symbol].totalShares += tx.shares
      acc[tx.symbol].totalInvested += value
    } else if (tx.type === 'SELL') {
      acc[tx.symbol].totalShares -= tx.shares
      acc[tx.symbol].totalInvested -= value
    }
    return acc
  }, {} as Record<string, { totalShares: number, totalInvested: number }>)

  // ตัวแปรสำหรับคำนวณพอร์ต
  let totalInvested = 0
  let currentPortfolioValue = 0

  if (portfolioSummary) {
    const assets = Object.entries(portfolioSummary) as [string, { totalShares: number, totalInvested: number }][]
    
    // ใช้ Promise.all เพื่อคำนวณและจำลองดึงราคาหุ้นทุกตัวพร้อมกัน
    await Promise.all(assets.map(async ([symbol, asset]) => {
      if (asset.totalShares > 0) {
        totalInvested += asset.totalInvested
        
        // ดึงราคาปัจจุบันมาคูณกับจำนวนหุ้นที่มี
        const currentPrice = await getCurrentPrice(symbol)
        currentPortfolioValue += (currentPrice * asset.totalShares)
      }
    }))
  }

  // คำนวณส่วนต่างกำไร/ขาดทุน
  const profitLoss = currentPortfolioValue - totalInvested
  const profitLossPercentage = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0
  const isProfit = profitLoss >= 0

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Section */}
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Portfolio Tracker</h1>
            <p className="text-gray-500 mt-1">ติดตามการลงทุนของคุณแบบ Real-time</p>
          </div>
          <TransactionForm />
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: มูลค่าปัจจุบัน */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">มูลค่าพอร์ตปัจจุบัน</p>
              <h2 className="text-2xl font-bold text-gray-900">
                ${currentPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>
          </div>

          {/* Card 2: เงินลงทุนรวม */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
              <CircleDollarSign size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">เงินลงทุนรวม (ต้นทุน)</p>
              <h2 className="text-2xl font-bold text-indigo-600">
                ${totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>
          </div>

          {/* Card 3: กำไร/ขาดทุน */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-lg ${isProfit ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              {isProfit ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">กำไร / ขาดทุน</p>
              <h2 className={`text-2xl font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                {isProfit ? '+' : ''}${profitLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-sm ml-2 font-medium">
                  ({isProfit ? '+' : ''}{profitLossPercentage.toFixed(2)}%)
                </span>
              </h2>
            </div>
          </div>

        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">ประวัติการทำรายการ</h3>
          </div>
          <div className="p-0 overflow-x-auto">
            {transactions && transactions.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                    <th className="p-4 font-medium">วันที่</th>
                    <th className="p-4 font-medium">หุ้น/ETF</th>
                    <th className="p-4 font-medium">ประเภท</th>
                    <th className="p-4 font-medium">จำนวน</th>
                    <th className="p-4 font-medium">ราคาที่ได้มา</th>
                    <th className="p-4 font-medium">มูลค่ารวม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-sm text-gray-600">
                        {new Date(tx.transaction_date).toLocaleDateString("th-TH")}
                      </td>
                      <td className="p-4 font-bold text-gray-900">{tx.symbol}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${tx.type === "BUY" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {tx.type === "BUY" ? "ซื้อ" : "ขาย"}
                        </span>
                      </td>
                      <td className="p-4 text-gray-700">{tx.shares}</td>
                      <td className="p-4 text-gray-700">${tx.price.toLocaleString()}</td>
                      <td className="p-4 font-medium text-gray-900">${(tx.shares * tx.price).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                ยังไม่มีประวัติการทำรายการ กดปุ่ม "เพิ่มรายการ" เพื่อเริ่มต้น
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}