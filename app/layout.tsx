import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Demo Bluehook App",
    description: "Nothing much interesting here.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>
                {children}
            </body>
        </html>
    );
}
