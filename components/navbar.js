"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAccount } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { Menu, Clapperboard, Compass, User, History, Upload, ImageIcon } from "lucide-react"

export function Navbar() {
  const { isConnected } = useAccount()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const productionPaths = ["/profile", "/upload"]
  const isProductionHousePortal = productionPaths.some((path) => pathname.startsWith(path))

  const userNavItems = [
    { href: "/explore", label: "Explore", icon: Compass },
    { href: "/memes", label: "Memes", icon: ImageIcon },
    ...(isConnected ? [{ href: "/history", label: "My Rentals", icon: History }] : []),
  ]

  const productionNavItems = [
    { href: "/profile", label: "My Movies", icon: User },
    { href: "/memes", label: "Memes", icon: ImageIcon },
    ...(isConnected ? [{ href: "/upload", label: "Upload", icon: Upload }] : []),
  ]

  const navItems = isProductionHousePortal ? productionNavItems : userNavItems

  return (
    <nav className="bg-gray-900/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <Clapperboard className="h-8 w-8 text-blue-400 transition-transform duration-300 ease-in-out group-hover:rotate-6" />
            <span className="text-xl font-extrabold tracking-tight hidden sm:inline bg-gradient-to-r from-blue-300 to-green-400 bg-clip-text text-transparent">
              CineVault
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1 transition-colors hover:text-white ${pathname.startsWith(item.href) ? "text-white font-semibold" : "text-gray-400"}`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* Wallet Connection */}
          <div className="hidden md:block">
            <ConnectButton />
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setIsOpen(true)}
              className="p-2 rounded text-white hover:bg-gray-800 transition"
            >
              <Menu className="h-6 w-6" />
            </button>

            {isOpen ? (
              <>
                {/* overlay */}
                <div className="fixed inset-0 bg-black/60" onClick={() => setIsOpen(false)} aria-hidden="true" />
                {/* drawer */}
                <aside className="fixed right-0 top-0 h-full w-72 bg-black/95 backdrop-blur-md border-l border-gray-800 text-white p-6">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-lg font-semibold">Menu</span>
                    <button
                      type="button"
                      aria-label="Close menu"
                      onClick={() => setIsOpen(false)}
                      className="p-2 rounded hover:bg-gray-800 transition"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex flex-col space-y-4">
                    {navItems.map((item) => {
                      const Icon = item.icon
                      const active = pathname.startsWith(item.href)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center space-x-3 p-3 rounded-lg text-lg transition-colors ${
                            active ? "bg-blue-500/20 text-blue-300" : "text-gray-300 hover:bg-gray-800"
                          }`}
                          onClick={() => setIsOpen(false)}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </Link>
                      )
                    })}
                    <div className="pt-4 border-t border-gray-800">
                      <ConnectButton />
                    </div>
                  </div>
                </aside>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  )
}
