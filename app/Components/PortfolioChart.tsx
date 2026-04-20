'use client'

import { useRef, useState } from 'react'
import { Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const COLORS = ['#378add', '#1D9E75', '#7F77DD', '#BA7517', '#D85A30', '#D4537E']

type PortfolioItem = {
  name: string
  value: number
  shares: number
}

const CustomTooltip = ({ item, pct }: { item: PortfolioItem; pct: string }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{item.name}</p>
    <p className="text-xl font-medium text-gray-900 dark:text-white">{pct}%</p>
    <p className="text-xs text-gray-500 dark:text-gray-400">
      ${item.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
    </p>
  </div>
)

export default function PortfolioChart({ data }: { data: PortfolioItem[] }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const chartRef = useRef<ChartJS<'doughnut'>>(null)

  if (!data || data.length === 0) {
    return (
      <div className="text-center text-gray-400 py-20 text-sm">
        ยังไม่มีข้อมูลสำหรับสร้างกราฟ
      </div>
    )
  }

  const total = data.reduce((s, d) => s + d.value, 0)
  const pcts = data.map(d => (d.value / total * 100).toFixed(1))
  const topItem = data.reduce((a, b) => (a.value > b.value ? a : b))

  const chartData = {
    labels: data.map(d => d.name),
    datasets: [
      {
        data: data.map(d => d.value),
        backgroundColor: COLORS,
        borderWidth: 2,
        borderColor: 'white',
        hoverOffset: 8,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    onHover: (_: unknown, els: { index: number }[]) => {
      setHovered(els.length ? els[0].index : null)
    },
    onClick: (_: unknown, els: { index: number }[]) => {
      if (els.length) setSelected(i => (i === els[0].index ? null : els[0].index))
    },
  }

  const activeIndex = hovered ?? selected
  const activeItem = activeIndex !== null ? data[activeIndex] : null

  return (
    <div className="w-full space-y-4">

      {/* Metric cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'มูลค่าพอร์ต', value: '$' + total.toLocaleString() },
          { label: 'จำนวน positions', value: data.length.toString() },
          {
            label: 'ใหญ่สุด',
            value: `${topItem.name} ${(topItem.value / total * 100).toFixed(0)}%`,
          },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3"
          >
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
            <p className="text-base font-medium text-gray-900 dark:text-white truncate">{value}</p>
          </div>
        ))}
      </div>

      {/* Chart + Legend */}
      <div className="flex flex-wrap gap-6 items-center">

        {/* Donut */}
        <div className="relative mx-auto" style={{ width: 220, height: 220, flexShrink: 0 }}>
          <Doughnut ref={chartRef} data={chartData} options={options as never} />
          {activeItem && (
            <CustomTooltip item={activeItem} pct={pcts[activeIndex!]} />
          )}
          {!activeItem && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-xs text-gray-400">hover เพื่อดูข้อมูล</p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2 flex-1 min-w-35">
          {data.map((item, i) => (
            <button
              key={item.name}
              onClick={() => setSelected(s => (s === i ? null : i))}
              className={`flex items-center gap-2 w-full text-left rounded-md px-2 py-1.5 transition-colors ${
                selected === i
                  ? 'bg-gray-100 dark:bg-gray-800'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400 flex-1">{item.name}</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{pcts[i]}%</span>
            </button>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      {selected !== null && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-2 mb-3">
            <span
              className="w-3 h-3 rounded-sm"
              style={{ background: COLORS[selected % COLORS.length] }}
            />
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {data[selected].name} — รายละเอียด
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label: 'ต้นทุน',
                value: '$' + data[selected].value.toLocaleString(undefined, { minimumFractionDigits: 2 }),
              },
              {
                label: 'จำนวนหุ้น',
                value: data[selected].shares.toLocaleString(undefined, { maximumFractionDigits: 4 }),
              },
              { label: 'สัดส่วน', value: pcts[selected] + '%' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}