import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clay Row Limit Workspace Audit",
  description: "Audit your Clay workspace row usage across all folders, workbooks, and tables.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
