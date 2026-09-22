import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MidwayLab SaaS - Plataforma de Integração Autolac ↔ Softlab Apoio",
  description: "Sistema Multiempresas intermediário para sincronização de atendimentos, exames, laudos e DE-PARA entre Autolac e Softlab Apoio.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-teal-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
