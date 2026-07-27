import { formatCurrency } from '../utils/format.js'

export default function FeesAndTDSReport({ transactions, currency }) {
  const totals = transactions.reduce(
    (acc, t) => {
      const fee = Number(t.feeExchange || 0)
      const gst = Number(t.feeGst || 0)
      const tds = Number(t.tds || 0)
      acc.fee += fee
      acc.gst += gst
      acc.tds += tds
      if (t.type === 'BUY') {
        acc.buyFee += fee
        acc.buyGst += gst
      } else {
        acc.sellFee += fee
        acc.sellGst += gst
        acc.sellTds += tds
      }
      return acc
    },
    { fee: 0, gst: 0, tds: 0, buyFee: 0, buyGst: 0, sellFee: 0, sellGst: 0, sellTds: 0 }
  )

  const expectedGst = totals.fee * 0.18

  return (
    <div className="panel">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-soft">Costs</div>
          <h2 className="font-display text-xl font-semibold">Fees & TDS</h2>
        </div>
        <span className="text-xs text-slate-soft">Not deductible from VDA income tax</span>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Cell label="Platform fees" value={formatCurrency(totals.fee, currency)} />
        <Cell label="GST recorded" value={formatCurrency(totals.gst, currency)} />
        <Cell label="TDS recorded" value={formatCurrency(totals.tds, currency)} />
        <Cell label="Expected GST @18% of fees" value={formatCurrency(expectedGst, currency)} muted />
      </div>
    </div>
  )
}

function Cell({ label, value, muted }) {
  return (
    <div className="border border-ink/10 px-3 py-3">
      <div className="text-[11px] uppercase tracking-[0.08em] text-slate-soft">{label}</div>
      <div className={`num mt-1 text-sm font-medium ${muted ? 'text-slate-soft' : ''}`}>{value}</div>
    </div>
  )
}
