"use client"

import { Navbar } from "@/components/navbar"
import { Toaster } from "@/components/ui/toaster"
import { usePathname } from "next/navigation"

export default function ClientLayout({ children }) {
  const pathname = usePathname()
  const showNavbar = pathname !== "/"

  return (
    <>
      {showNavbar && <Navbar />}
      <main>{children}</main>
      <Toaster />
    </>
  )
}
