'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'

export default function TransactionForm() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // State เก็บข้อมูลฟอร์ม
  const [symbol, setSymbol] = useState('')
  const [type, setType] = useState('BUY')
  const [shares, setShares] = useState('')
  const [price, setPrice] = useState('')
  
  // เพิ่ม State สำหรับเก็บวันที่ (ค่าเริ่มต้นคือวันนี้)
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from('transactions').insert([
      { 
        symbol: symbol.toUpperCase(), 
        type, 
        shares: Number(shares), 
        price: Number(price), 
        transaction_date: transactionDate // <--- ใช้วันที่ที่ผู้ใช้เลือกแทนของเดิม
      }
    ])

    setLoading(false)

    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message)
    } else {
      setIsOpen(false)
      setSymbol(''); setShares(''); setPrice(''); 
      setTransactionDate(new Date().toISOString().split('T')[0]); // รีเซ็ตวันที่กลับเป็นวันนี้
      router.refresh() 
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
      >
        <Plus size={20} />
        <span>เพิ่มรายการ</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">เพิ่มรายการซื้อขาย</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 p-1 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อหุ้น / ETF</label>
                <input 
                  type="text" required placeholder="เช่น MSFT, NVDA, VOO"
                  className="w-full border border-gray-300 rounded-lg p-2.5 uppercase focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={symbol} onChange={(e) => setSymbol(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ประเภท</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                    value={type} onChange={(e) => setType(e.target.value)}
                  >
                    <option value="BUY">ซื้อ (Buy)</option>
                    <option value="SELL">ขาย (Sell)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">วันที่ทำรายการ</label>
                  {/* ปลดล็อก disabled ออก และผูกค่ากับ transactionDate */}
                  <input 
                    type="date" required 
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนหุ้น</label>
                  {/* เปลี่ยน step เป็น any เพื่อให้ใส่ทศนิยมได้ไม่จำกัดตำแหน่ง */}
                  <input 
                    type="number" step="any" required min="0" placeholder="0.0000"
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    value={shares} onChange={(e) => setShares(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ราคาต่อหุ้น ($)</label>
                  <input 
                    type="number" step="any" required min="0" placeholder="0.00"
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    value={price} onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors mt-6 shadow-sm"
              >
                {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}