'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

export default function DeleteButton({ id }: { id: string }) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?')) return

    setIsDeleting(true)

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)

    if (error) {
      alert('เกิดข้อผิดพลาดในการลบ: ' + error.message)
      setIsDeleting(false)
    } else {
      router.refresh()
    }
  }

  return (
    <button 
      onClick={handleDelete}
      disabled={isDeleting}
      title="ลบรายการ"
      className={`p-2 rounded-lg transition-colors ${
        isDeleting 
        ? 'text-gray-300 cursor-not-allowed' 
        : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
      }`}
    >
      <Trash2 size={18} />
    </button>
  )
}