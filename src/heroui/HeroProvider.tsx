// app/providers.tsx
'use client'

import { HeroUIProvider, ToastProvider } from '@heroui/react'

const HeroProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <HeroUIProvider>
      <ToastProvider />
      {children}
    </HeroUIProvider>
  )
}

export default HeroProvider;