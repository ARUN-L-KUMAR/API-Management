import type { Metadata } from "next"
import { Outfit } from "next/font/google"
import "./globals.css"
import Providers from "@/components/providers"

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
})

export const metadata: Metadata = {
  title: "AI Provider Registry & Model Discovery Platform",
  description: "Securely vault API keys, auto-discover models, and monitor provider health & latency in real-time.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex bg-[#030303] text-zinc-100 font-sans">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
