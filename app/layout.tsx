import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fin Tax E-Way Bill Generator | Developed by Vishu Rohilla",
  description:
    "Professional Indian GST E-Way Bill JSON Generator software for official NIC portal bulk generation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen overflow-hidden">
        {children}
      </body>
    </html>
  );
}
