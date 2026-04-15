import Link from 'next/link'
import { ArrowUpRight, DollarSign, Inbox, ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/cn'

export type Activity = {
  id: string
  type: 'purchase' | 'sale'
  title: string
  description: string
  amount: number
  date: string | Date
  status: string
}

const statusTone: Record<string, string> = {
  delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  pending: 'bg-amber-50 text-amber-800 ring-amber-200',
  shipped: 'bg-sky-50 text-sky-700 ring-sky-200',
  cancelled: 'bg-rose-50 text-rose-700 ring-rose-200',
}

export function RecentActivity({ items }: { items: Activity[] }) {
  return (
    <div className="bg-white rounded-2xl ring-1 ring-emerald-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-emerald-950">Recent activity</h3>
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-900"
        >
          View all
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
            <Inbox className="w-7 h-7 text-emerald-500" />
          </div>
          <p className="text-sm font-semibold text-emerald-900">No activity yet</p>
          <p className="text-xs text-slate-500 mt-1">Orders and sales will show up here.</p>
        </div>
      ) : (
        <ul className="divide-y divide-emerald-50">
          {items.map((a) => {
            const Icon = a.type === 'purchase' ? ShoppingCart : DollarSign
            const tone = a.type === 'purchase' ? 'sky' : 'emerald'
            return (
              <li key={a.id} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                    tone === 'sky' ? 'bg-sky-50 text-sky-600' : 'bg-emerald-50 text-emerald-600',
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-emerald-950 truncate">{a.title}</p>
                  <p className="text-xs text-slate-600 truncate">{a.description}</p>
                  <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                    {new Date(a.date).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-extrabold text-emerald-950">
                    ₹{Number(a.amount || 0).toLocaleString()}
                  </p>
                  <span
                    className={cn(
                      'inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset',
                      statusTone[a.status?.toLowerCase?.()] ||
                        'bg-slate-50 text-slate-600 ring-slate-200',
                    )}
                  >
                    {a.status}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
