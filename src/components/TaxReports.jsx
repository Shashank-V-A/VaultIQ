import { formatCurrency } from '../utils/format.js'
import { getTaxSummaryByFinancialYear } from '../utils/taxCalculator.js'

export default function TaxReports({ transactions, perSymbol, currency, surchargeRate = 0 }) {
  const taxSummaries = getTaxSummaryByFinancialYear(transactions, perSymbol, { surchargeRate })

  if (taxSummaries.length === 0) {
    return (
      <div className="panel py-12 text-center text-sm text-slate-soft">
        No transactions yet — add trades or sync CoinDCX to generate FY tax reports.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-soft">Compliance</div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Tax reports</h1>
      </div>

      <div className="panel border-signal/20 bg-signal/5">
        <div className="mb-2 text-sm font-semibold text-signal-deep">Current Indian VDA rules</div>
        <ul className="space-y-1.5 text-sm text-ink/80">
          <li>Flat <strong>30%</strong> on income from transfer of VDAs (Income-tax Act 2025 / erstwhile §115BBH), plus surcharge (if applicable) and <strong>4%</strong> cess.</li>
          <li><strong>Losses cannot be set off</strong> against other VDA gains or any other income, and cannot be carried forward.</li>
          <li>Only <strong>cost of acquisition</strong> is deductible — exchange fees are not.</li>
          <li><strong>1% TDS</strong> on specified transfers (thresholds ₹50,000 / ₹10,000 by person type). Credit against final liability.</li>
          <li>Budget 2025/2026 kept the rate structure; reporting obligations for crypto-asset service providers were tightened.</li>
        </ul>
      </div>

      <div className="panel overflow-x-auto">
        <div className="mb-4 text-sm font-semibold">By financial year (Apr–Mar)</div>
        <table className="table min-w-[960px] w-full">
          <thead>
            <tr>
              <th>FY</th>
              <th className="num text-right">Taxable gains</th>
              <th className="num text-right">Disregarded losses</th>
              <th className="num text-right">Tax 30%</th>
              <th className="num text-right">Surcharge</th>
              <th className="num text-right">Cess 4%</th>
              <th className="num text-right">TDS</th>
              <th className="num text-right">Net tax</th>
              <th className="num text-right">GST on fees</th>
            </tr>
          </thead>
          <tbody>
            {taxSummaries.map((s) => (
              <tr key={s.financialYear}>
                <td className="font-medium">{s.financialYear}</td>
                <td className="num text-right">{formatCurrency(s.taxableGains, currency)}</td>
                <td className="num text-right text-slate-soft">{formatCurrency(s.disregardedLosses, currency)}</td>
                <td className="num text-right text-loss">{formatCurrency(s.incomeTax30Percent, currency)}</td>
                <td className="num text-right text-loss">{formatCurrency(s.surcharge || 0, currency)}</td>
                <td className="num text-right text-loss">{formatCurrency(s.cess4Percent || 0, currency)}</td>
                <td className="num text-right text-warn">{formatCurrency(s.tdsDeducted, currency)}</td>
                <td className="num text-right font-semibold text-loss">{formatCurrency(s.netTaxLiability, currency)}</td>
                <td className="num text-right">{formatCurrency(s.gstOnFees, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel-tight text-xs leading-relaxed text-slate-soft">
        <p className="mb-2 font-semibold text-ink">ITR notes</p>
        Report VDA transfers in Schedule VDA. Tax base shown here is the sum of positive FIFO gains only — matching the statutory no-set-off rule. Confirm TDS in Form 26AS / AIS. This tool is guidance, not tax advice.
      </div>
    </div>
  )
}
