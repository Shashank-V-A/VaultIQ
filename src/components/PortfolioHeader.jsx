import { formatCurrency } from '../utils/format.js'

export default function PortfolioHeader({ totals, currency }) {
  return (
    <div className="surface">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-sm text-neutral-500">Portfolio Value</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">{formatCurrency(totals.totalCurrentValue, currency)}</div>
        </div>
      </div>
    </div>
  )
}

