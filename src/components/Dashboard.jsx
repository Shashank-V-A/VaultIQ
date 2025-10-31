import { formatCurrency } from '../utils/format.js'
import PortfolioHeader from './PortfolioHeader.jsx'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

const COLORS = ['#10b981', '#f59e0b', '#8b5cf6', '#14b8a6', '#ef4444']

export default function Dashboard({ perSymbol, totals, currency }) {
  const data = Object.entries(perSymbol).map(([symbol, v]) => ({ name: symbol, value: v.currentValue }))

  return (
    <div className="space-y-4">
      <PortfolioHeader totals={totals} currency={currency} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Invested" value={formatCurrency(totals.totalInvested, currency)} positive={totals.totalInvested >= 0} />
        <StatCard title="Current Value" value={formatCurrency(totals.totalCurrentValue, currency)} positive={totals.totalCurrentValue >= 0} />
        <StatCard title="Realized P/L" value={formatCurrency(totals.totalRealized, currency)} positive={totals.totalRealized >= 0} />
        <StatCard title="Unrealized P/L" value={formatCurrency(totals.totalUnrealized, currency)} positive={totals.totalUnrealized >= 0} />
      </div>

      <div className="card">
        <div className="mb-3 text-sm font-medium">Portfolio Distribution</div>
        <div className="h-64 w-full">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" outerRadius={90} innerRadius={40}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, positive }) {
  return (
    <div className="card">
      <div className="text-sm text-gray-500 dark:text-gray-400">{title}</div>
      <div className={`mt-1 text-xl font-semibold ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{value}</div>
    </div>
  )
}

