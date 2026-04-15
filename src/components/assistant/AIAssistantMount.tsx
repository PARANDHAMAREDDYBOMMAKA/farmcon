'use client'

import dynamic from 'next/dynamic'

const AIAssistant = dynamic(
  () => import('./AIAssistant').then((m) => m.AIAssistant),
  { ssr: false, loading: () => null },
)

export default function AIAssistantMount() {
  return <AIAssistant />
}
