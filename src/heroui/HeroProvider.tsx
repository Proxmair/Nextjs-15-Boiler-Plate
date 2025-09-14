// app/providers.tsx
'use client'

import { HeroUIProvider } from '@heroui/react'

const HeroProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <HeroUIProvider>
      {children}
    </HeroUIProvider>
  )
}

export default HeroProvider;