import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "E-Way Bill Generator | Bulk JSON & Verification Portal",
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
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
