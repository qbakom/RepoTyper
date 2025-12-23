import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'RepoTyper - Practice Typing with Your Code',
    description: 'A typing practice application that lets you practice touch typing using your own code repositories.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <body className="font-mono antialiased bg-background text-foreground">
                {children}
            </body>
        </html>
    );
}
