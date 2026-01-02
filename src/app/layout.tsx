import type { Metadata } from "next";
import "./globals.css";
import { BackgroundMusic } from "@/components/BackgroundMusic";

export const metadata: Metadata = {
    title: "Xián - 闲",
    description: "Reveal your true self through data strings.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body className="antialiased bg-black text-white selection:bg-white/20">
                <BackgroundMusic />
                {children}
            </body>
        </html>
    );
}
