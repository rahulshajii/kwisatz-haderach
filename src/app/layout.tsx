import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KWISATZ HADERACH — PRAGYAN 2026 | ASIET",
  description:
    "Official Real-Time Technical Quiz Platform for PRAGYAN 2026, organized by the Department of Computer Applications, Adi Shankara Institute of Engineering and Technology (ASIET).",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-slate-50">
      <body className="h-full flex flex-col antialiased text-slate-900 selection:bg-sky-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
