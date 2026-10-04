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
      className={`${outfit.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
              try {
                var theme = localStorage.getItem('theme');
                if (theme === 'light') {
                  document.documentElement.classList.add('light');
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                }
              } catch (e) {
                document.documentElement.classList.add('dark');
              }
            })()`,
          }}
        />
      </head>
      <body className="min-h-full flex bg-background text-foreground font-sans transition-colors duration-150">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
