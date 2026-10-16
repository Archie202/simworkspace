import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Virtual Workplace Internship Platform",
  description: "Simulated remote workplace for digital-skills trainees.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
