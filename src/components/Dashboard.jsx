import { formatCurrency } from '../utils/format.js'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { calculateTaxLiability, currentFinancialYear } from '../utils/taxCalculator.js'
import FeesAndTDSReport from './FeesAndTDSReport.jsx'

const COLORS = ['#0D7377', '#1B6B4A', '#9A6700', '#B42318', '#3F3A34', '#2563EB']

export default function Dashboard({ perSymbol, totals, currency, transactions, surchargeRate = 0 }) {
  const data = Object.entries(perSymbol)
    .map(([symbol, v]) => ({ name: symbol, value: Math.max(0, v.currentValue) }))
    .filter((d) => d.value > 0)

  const fyTax = calculateTaxLiability(transactions || [], perSymbol, currentFinancialYear(), { surchargeRate })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-soft">Overview</div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Portfolio pulse</h1>
        </div>
        <div className="text-right text-xs text-slate-soft">
          FY {fyTax.financialYear}
          <div className="num text-sm font-medium text-ink">{formatCurrency(totals.totalCurrentValue, currency)} marked value</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat title="Invested" value={formatCurrency(totals.totalInvested, currency)} />
        <Stat title="Current" value={formatCurrency(totals.totalCurrentValue, currency)} />
        <Stat title="Realized P/L" value={formatCurrency(totals.totalRealized, currency)} tone={totals.totalRealized >= 0 ? 'gain' : 'loss'} />
        <Stat title="Unrealized P/L" value={formatCurrency(totals.totalUnrealized, currency)} tone={totals.totalUnrealized >= 0 ? 'gain' : 'loss'} />
      </div>

      <div className="panel animate-rise">
        <div className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-soft">VDA tax (current FY)</div>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl font-semibold">Taxable gains only</h2>
          <span className="chip-muted">No loss set-off · §115BBH</span>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          <Mini label="Taxable gains" value={formatCurrency(fyTax.taxableGains, currency)} />
          <Mini label="Disregarded losses" value={formatCurrency(fyTax.disregardedLosses, currency)} />
          <Mini label="Tax @ 30%" value={formatCurrency(fyTax.incomeTax30Percent, currency)} danger />
          <Mini label="Surcharge" value={formatCurrency(fyTax.surcharge || 0, currency)} danger />
          <Mini label="Cess @ 4%" value={formatCurrency(fyTax.cess4Percent, currency)} danger />
          <Mini label="Net after TDS" value={formatCurrency(fyTax.netTaxLiability, currency)} danger strong />
        </div>
        <p className="mt-4 text-xs leading-relaxed text-slate-soft">{fyTax.regimeNote}</p>
      </div>

      <FeesAndTDSReport transactions={transactions || []} currency={currency} />

      <div className="panel">
        <div className="mb-3 text-sm font-semibold">Allocation</div>
        {data.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-soft">No holdings with live value yet.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-[220px_1fr] md:items-center">
            <div className="h-52">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={data} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80} strokeWidth={0}>
                    {data.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v, currency)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {data.map((d, i) => (
                <div key={d.name} className="border border-ink/10 px-3 py-2">
                  <div className="flex items-center gap-2 text-xs text-slate-soft">
                    <span className="h-2 w-2" style={{ background: COLORS[i % COLORS.length] }} />
                    {d.name}
                  </div>
                  <div className="num mt-1 text-sm font-medium">{formatCurrency(d.value, currency)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ title, value, tone }) {
  return (
    <div className="panel-tight animate-rise">
      <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-soft">{title}</div>
      <div className={`stat-value mt-2 ${tone === 'gain' ? 'text-gain' : tone === 'loss' ? 'text-loss' : ''}`}>{value}</div>
    </div>
  )
}

function Mini({ label, value, danger, strong }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.08em] text-slate-soft">{label}</div>
      <div className={`num mt-1 text-sm ${danger ? 'text-loss' : 'text-ink'} ${strong ? 'font-semibold' : ''}`}>{value}</div>
    </div>
  )
}
