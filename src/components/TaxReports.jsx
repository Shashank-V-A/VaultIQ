import { formatCurrency } from '../utils/format.js'
import { getTaxSummaryByFinancialYear } from '../utils/taxCalculator.js'

export default function TaxReports({ transactions, perSymbol, currency }) {
  const taxSummaries = getTaxSummaryByFinancialYear(transactions, perSymbol)

  if (taxSummaries.length === 0) {
    return (
      <div className="card">
        <div className="text-center text-gray-500 py-8">No transactions found for tax calculation</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="mb-2 text-sm font-semibold text-blue-800 dark:text-blue-200">Important Tax Information</div>
        <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1 list-disc list-inside">
          <li>As per Union Budget 2022, all crypto gains are taxed at flat 30% rate + 4% Health & Education Cess</li>
          <li>1% TDS is applicable on transfers above ₹50,000</li>
          <li>TDS can be adjusted against final tax liability (including cess)</li>
          <li>GST on trading fees is separate and not deductible from income tax</li>
        </ul>
      </div>

      <div className="card">
        <div className="mb-4 text-sm font-semibold">Tax Summary by Financial Year</div>
        <div className="overflow-x-auto">
          <table className="table min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left dark:border-gray-800">
                <th className="px-2 py-2">Financial Year</th>
                <th className="num px-2 py-2">Realized Profit</th>
                <th className="num px-2 py-2">Tax @ 30%</th>
                <th className="num px-2 py-2">Cess @ 4%</th>
                <th className="num px-2 py-2">Total Tax</th>
                <th className="num px-2 py-2">TDS Deducted</th>
                <th className="num px-2 py-2">Net Tax Payable</th>
                <th className="num px-2 py-2">GST on Fees</th>
              </tr>
            </thead>
            <tbody>
              {taxSummaries.map((summary) => (
                <tr key={summary.financialYear} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="px-2 py-2 font-medium">{summary.financialYear}</td>
                  <td className="num px-2 py-2">{formatCurrency(summary.totalRealizedProfit, currency)}</td>
                  <td className="num px-2 py-2 text-red-600 dark:text-red-400">
                    {formatCurrency(summary.incomeTax30Percent, currency)}
                  </td>
                  <td className="num px-2 py-2 text-red-600 dark:text-red-400">
                    {formatCurrency(summary.cess4Percent || 0, currency)}
                  </td>
                  <td className="num px-2 py-2 text-red-600 dark:text-red-400 font-semibold">
                    {formatCurrency(summary.totalTaxWithCess || (summary.incomeTax30Percent + (summary.incomeTax30Percent * 0.04)), currency)}
                  </td>
                  <td className="num px-2 py-2 text-yellow-600 dark:text-yellow-400">
                    {formatCurrency(summary.tdsDeducted, currency)}
                  </td>
                  <td className="num px-2 py-2 font-semibold text-red-600 dark:text-red-400">
                    {formatCurrency(summary.netTaxLiability, currency)}
                  </td>
                  <td className="num px-2 py-2">{formatCurrency(summary.gstOnFees, currency)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-300 dark:border-gray-700 font-semibold">
                <td className="px-2 py-2">Total</td>
                <td className="num px-2 py-2">
                  {formatCurrency(
                    taxSummaries.reduce((sum, s) => sum + s.totalRealizedProfit, 0),
                    currency
                  )}
                </td>
                <td className="num px-2 py-2 text-red-600 dark:text-red-400">
                  {formatCurrency(
                    taxSummaries.reduce((sum, s) => sum + s.incomeTax30Percent, 0),
                    currency
                  )}
                </td>
                <td className="num px-2 py-2 text-red-600 dark:text-red-400">
                  {formatCurrency(
                    taxSummaries.reduce((sum, s) => sum + (s.cess4Percent || 0), 0),
                    currency
                  )}
                </td>
                <td className="num px-2 py-2 text-red-600 dark:text-red-400">
                  {formatCurrency(
                    taxSummaries.reduce((sum, s) => sum + (s.totalTaxWithCess || (s.incomeTax30Percent + (s.incomeTax30Percent * 0.04))), 0),
                    currency
                  )}
                </td>
                <td className="num px-2 py-2 text-yellow-600 dark:text-yellow-400">
                  {formatCurrency(
                    taxSummaries.reduce((sum, s) => sum + s.tdsDeducted, 0),
                    currency
                  )}
                </td>
                <td className="num px-2 py-2 text-red-600 dark:text-red-400">
                  {formatCurrency(
                    taxSummaries.reduce((sum, s) => sum + s.netTaxLiability, 0),
                    currency
                  )}
                </td>
                <td className="num px-2 py-2">
                  {formatCurrency(
                    taxSummaries.reduce((sum, s) => sum + s.gstOnFees, 0),
                    currency
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card bg-gray-50 dark:bg-gray-900/50">
        <div className="text-xs text-gray-600 dark:text-gray-400">
          <p className="font-semibold mb-2">For ITR Filing:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Report crypto gains under "Income from Other Sources" or "Capital Gains"</li>
            <li>Taxable income: Realized Profit (after deducting cost basis)</li>
            <li>Tax rate: 30% flat + 4% Health & Education Cess (no deductions/exemptions)</li>
            <li>Include TDS deducted in Form 26AS</li>
            <li>GST on fees is separate and not included in income tax calculation</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

