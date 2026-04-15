'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  Download,
  FileJson,
  Loader2,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { authedFetch } from '@/lib/authedFetch'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'

export default function PrivacyPage() {
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [reason, setReason] = useState('')

  const exportData = async () => {
    setExporting(true)
    try {
      const res = await authedFetch('/api/user/export')
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err?.error?.message || 'Export failed')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const filename =
        res.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1] ||
        'farmcon-data.json'
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success('Your data has been downloaded')
    } catch {
      toast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  const deleteAccount = async () => {
    if (confirm !== 'DELETE MY ACCOUNT') {
      toast.error('Type the confirmation phrase exactly')
      return
    }
    setDeleting(true)
    try {
      const res = await authedFetch('/api/user/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm, reason: reason || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data?.error?.message || 'Delete failed')
        return
      }
      toast.success('Account deleted. Signing you out…')
      setTimeout(() => {
        window.location.href = '/'
      }, 1500)
    } catch {
      toast.error('Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Privacy & data"
        description="You’re in control. Export everything we know about you, or permanently delete your account."
      />

      <div className="bg-white rounded-2xl ring-1 ring-emerald-100 shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md flex-shrink-0">
            <FileJson className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-extrabold text-emerald-950">Export your data</h3>
            <p className="text-sm text-slate-600 mt-1 max-w-xl">
              Download a JSON archive with your profile, farm details, crops, listings, orders,
              reviews, cart, notifications, and newsletter subscription. Rate limited to 3
              exports per hour.
            </p>
            <div className="mt-4">
              <Button onClick={exportData} disabled={exporting}>
                {exporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Preparing download…
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download my data
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl ring-1 ring-emerald-100 shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-md flex-shrink-0">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-extrabold text-emerald-950">How we use your data</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
              <li>• To deliver the FarmCon platform and fulfil your orders</li>
              <li>• To send operational emails (OTP, order receipts, shipping)</li>
              <li>• To comply with tax, FSSAI, and agricultural marketing regulations</li>
              <li>• Never sold to third parties. Never used for ad targeting.</li>
            </ul>
            <p className="mt-3 text-sm text-emerald-700 font-semibold">
              Read the full{' '}
              <a className="underline" href="/privacy-policy">
                privacy policy
              </a>
              .
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl ring-1 ring-rose-200 shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-md flex-shrink-0">
            <Trash2 className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-extrabold text-emerald-950">Delete your account</h3>
            <p className="text-sm text-slate-600 mt-1 max-w-xl">
              This anonymises your profile and deactivates your account. Order history is
              retained (anonymised) for 7 years per taxation regulations. You cannot undo this.
            </p>

            {!showDelete ? (
              <div className="mt-4">
                <Button variant="destructive" onClick={() => setShowDelete(true)}>
                  <Trash2 className="w-4 h-4" />
                  Request account deletion
                </Button>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <Alert tone="error">
                  <span>
                    <strong>This cannot be undone.</strong> Make sure you’ve exported your data if you
                    need it later.
                  </span>
                </Alert>

                <div>
                  <Label htmlFor="reason">Reason (optional)</Label>
                  <Input
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Help us improve — why are you leaving?"
                    maxLength={500}
                  />
                </div>

                <div>
                  <Label htmlFor="confirm" required>
                    Type{' '}
                    <code className="px-1.5 py-0.5 rounded bg-rose-50 ring-1 ring-rose-200 text-rose-700 font-mono text-xs">
                      DELETE MY ACCOUNT
                    </code>{' '}
                    to confirm
                  </Label>
                  <Input
                    id="confirm"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="DELETE MY ACCOUNT"
                    autoFocus
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="destructive"
                    onClick={deleteAccount}
                    disabled={deleting || confirm !== 'DELETE MY ACCOUNT'}
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Deleting…
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4" />
                        Permanently delete my account
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDelete(false)
                      setConfirm('')
                      setReason('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
