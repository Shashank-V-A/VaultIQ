import { formatCurrency } from '../utils/format.js'

export default function PortfolioHeader({ totals, currency }) {
  const positive = totals.totalCurrentValue - totals.totalInvested >= 0
  return (
    <div className="surface">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-sm text-neutral-500">Portfolio Value</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">{formatCurrency(totals.totalCurrentValue, currency)}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className={positive ? 'badge-green' : 'badge-red'}>
            {formatCurrency(totals.totalCurrentValue - totals.totalInvested, currency)}
          </span>
          <span className={(totals.totalUnrealized >= 0) ? 'badge-green' : 'badge-red'}>
            Unrealized {formatCurrency(totals.totalUnrealized, currency)}
          </span>
          <span className={(totals.totalRealized >= 0) ? 'badge-green' : 'badge-red'}>
            Realized {formatCurrency(totals.totalRealized, currency)}
          </span>
        </div>
      </div>
    </div>
  )
}

