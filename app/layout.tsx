import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
  axes: ["SOFT", "opsz"],
});

export const metadata: Metadata = {
  title: {
    default: "TDC Matchmaker",
    template: "%s · TDC Matchmaker",
  },
  description: "Thoughtful introductions, made by people, guided by data.",
};

export const viewport: Viewport = {
  themeColor: "#fbf7f2",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-ivory text-ink">
        {children}
        <Toaster
          position="top-center"
          closeButton
          toastOptions={{
            classNames: {
              toast:
                "!rounded-2xl !border !border-line !bg-white !text-ink !shadow-lift !font-sans",
              description: "!text-ink-soft",
              success: "[&_[data-icon]]:!text-emerald-600",
              error: "[&_[data-icon]]:!text-blush-600",
            },
          }}
        />
      </body>
    </html>
  );
}
