import "./globals.css"
import { Inter } from "next/font/google"
import { Providers } from "./providers"
import ClientLayout from "./clientLayout"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "CineVault - Decentralized Movie Platform",
  description: "Upload, rent, and watch movies on a decentralized platform.",
    generator: 'v0.app'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-900`}>
        <Providers>
          <ClientLayout>{children}</ClientLayout>
        </Providers>
      </body>
    </html>
  )
}
