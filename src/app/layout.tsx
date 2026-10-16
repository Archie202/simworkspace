import type { Metadata } from "next";

export type LayoutProps<Segment extends string = string> = {
  children: React.ReactNode;
  params: Promise<{ [key in Segment]: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

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
