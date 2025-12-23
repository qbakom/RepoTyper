'use client';

import { useAppStore } from '@/store/useAppStore';
import { FileUpload, FileExplorer, TypingArena, StatisticsHUD } from '@/components';
import { Github, Keyboard } from 'lucide-react';

export default function Home() {
    const { files } = useAppStore();
    const hasProject = files.length > 0;

    return (
        <main className="h-screen flex flex-col overflow-hidden">
            <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
                <div className="flex items-center gap-2">
                    <Keyboard className="w-5 h-5 text-accent" />
                    <span className="font-bold text-lg">RepoTyper</span>
                </div>
                <div className="flex items-center gap-4">
                    <a
                        href="https://github.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Github className="w-5 h-5" />
                    </a>
                </div>
            </header>

            {hasProject ? (
                <>
                    <StatisticsHUD />
                    <div className="flex-1 flex overflow-hidden">
                        <aside className="w-64 flex-shrink-0 overflow-hidden">
                            <FileExplorer />
                        </aside>
                        <TypingArena />
                    </div>
                </>
            ) : (
                <FileUpload />
            )}

            <footer className="px-4 py-2 border-t border-border text-center text-xs text-muted-foreground">
                <p>All processing happens locally. Your code never leaves your browser.</p>
            </footer>
        </main>
    );
}
