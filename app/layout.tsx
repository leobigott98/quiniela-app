import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quiniela Mundialista Aniversario",
  description: "Pronósticos, ranking y resultados para la Quiniela Mundialista Aniversario.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
