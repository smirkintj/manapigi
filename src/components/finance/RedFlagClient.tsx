'use client'

import React, { useState } from 'react'
import RedFlagStrip from './RedFlagStrip'

const FLAG_DATA = {
  title: 'Shopping spike',
  metric: '+257%',
  detail: "You've spent RM 1,540 on Shopping this month — 3.6× your 3-month average (RM 432).",
  tip: "Two large hits at Mid Valley & Shopee account for 75% of the spike. Set a RM 600 cap for the rest of May and the budget recovers.",
}

export default function RedFlagClient() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return <RedFlagStrip flag={FLAG_DATA} onDismiss={() => setDismissed(true)} />
}
