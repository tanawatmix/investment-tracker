'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'

export default function TransactionForm() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // สร้าง State เก็บข้อมูลฟอร์ม
  const [symbol, setSymbol] = useState('')
  const [type, setType] = useState('BUY')
  const [shares, setShares] = useState('')
  const [price, setPrice] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // ส่งข้อมูลบันทึกลง Supabase
    const { error } = await supabase.from('transactions').insert([
      { 
        symbol: symbol.toUpperCase(), 
        type, 
        shares: Number(shares), 
        price: Number(price), 
        transaction_date: new Date().toISOString() 
      }
    ])

    setLoading(false)

    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message)
    } else {
      setIsOpen(false) // ปิด Modal
      setSymbol(''); setShares(''); setPrice('') // ล้างค่าฟอร์ม
      router.refresh() // สั่ง Next.js รีเฟรชหน้าเพื่อดึงข้อมูลใหม่มาแสดงทันที
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
      >
        <Plus size={20} />
        <span>เพิ่มรายการ</span>
      </button>

      {/* ถ้า isOpen เป็น true ให้แสดง Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">เพิ่มรายการซื้อขาย</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อหุ้น / ETF</label>
                <input 
                  type="text" required placeholder="เช่น MSFT, NVDA"
                  className="w-full border border-gray-300 rounded-lg p-2 uppercase"
                  value={symbol} onChange={(e) => setSymbol(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ประเภท</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg p-2"
                    value={type} onChange={(e) => setType(e.target.value)}
                  >
                    <option value="BUY">ซื้อ (Buy)</option>
                    <option value="SELL">ขาย (Sell)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">วันที่</label>
                  <input 
                    type="date" required disabled
                    className="w-full border border-gray-300 rounded-lg p-2 bg-gray-50"
                    value={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนหุ้น</label>
                  <input 
                    type="number" step="0.0001" required min="0" placeholder="0.00"
                    className="w-full border border-gray-300 rounded-lg p-2"
                    value={shares} onChange={(e) => setShares(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ราคาต่อหุ้น ($)</label>
                  <input 
                    type="number" step="0.01" required min="0" placeholder="0.00"
                    className="w-full border border-gray-300 rounded-lg p-2"
                    value={price} onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors mt-4"
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