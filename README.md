# Crypto Expense Tracker (Client-side)

React + Vite + Tailwind app to track crypto transactions, FIFO P/L, and portfolio.

## Run

```bash
npm install
npm run dev
```

## Features

- Local-only persistence via localStorage
- Transaction form (BUY/SELL, fee, date)
- Transaction table with filters and CSV export
- FIFO realized P/L, average cost, unrealized P/L
- Dashboard summary and simple pie chart (Recharts)
- Manual current price manager
- Dark/light theme, toast notifications

## Structure

- `src/components/*` UI components
- `src/hooks/useLocalStorage.js` persistence hook
- `src/utils/calcProfit.js` FIFO engine and filters
- `src/utils/format.js` currency/CSV helpers
- `src/App.jsx` main app shell

## Notes

- Currency setting affects formatting only; prices are entered in the selected currency.
- All data is client-side and can be reset in Settings.
