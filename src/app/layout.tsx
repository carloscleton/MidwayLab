import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MidwayLab SaaS - Plataforma de Integração Labfacil ↔ Equipamentos",
  description: "Sistema Multiempresas intermediário para sincronização de atendimentos, exames, equipamentos (CB350, YUMIZEN) e DE-PARA com o Labfacil.",
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
