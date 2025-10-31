import { useState } from 'react'
import { getCoinIconUrl } from '../utils/coins.js'

export default function CoinBadge({ symbol, size = 18 }) {
  const [imgOk, setImgOk] = useState(true)
  const src = getCoinIconUrl(symbol)
  const s = String(symbol || '').toUpperCase()
  return (
    <span className="inline-flex items-center gap-2">
      {imgOk && src ? (
        <img
          src={src}
          alt={s}
          width={size}
          height={size}
          className="rounded-sm"
          onError={() => setImgOk(false)}
        />
      ) : (
        <span
          style={{ width: size, height: size }}
          className="inline-flex items-center justify-center rounded-sm bg-neutral-200 text-[10px] font-semibold text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200"
        >
          {s.slice(0, 2)}
        </span>
      )}
      <span className="tabular-nums">{s}</span>
    </span>
  )
}

