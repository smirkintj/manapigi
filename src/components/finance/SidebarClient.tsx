'use client'

import React, { useState } from 'react'
import Sidebar from './Sidebar'

export default function SidebarClient() {
  const [active, setActive] = useState('dashboard')
  const [expanded, setExpanded] = useState(true)

  return (
    <Sidebar
      active={active}
      setActive={setActive}
      expanded={expanded}
      setExpanded={setExpanded}
    />
  )
}
