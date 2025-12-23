'use client';

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { RotateCcw, Play, FileCode, ChevronLeft, ChevronRight, Lightbulb, Check } from 'lucide-react';

interface CharacterProps {
    char: string;
    index: number;
    currentIndex: number;
    errorIndices: Set<number>;
    isActive: boolean;
}

function Character({ char, index, currentIndex, errorIndices, isActive }: CharacterProps) {
    const isTyped = index < currentIndex;
    const isCurrent = index === currentIndex && isActive;
    const isError = errorIndices.has(index);

    const getCharDisplay = () => {
        if (char === '\n') return '↵\n';
        if (char === '\t') return '  ';
        if (char === ' ') return ' ';
        return char;
    };

    return (
        <span
            className={cn(
                'relative whitespace-pre',
                !isTyped && !isCurrent && 'text-ghost',
                isTyped && !isError && 'text-correct',
                isTyped && isError && 'text-error',
                isCurrent && 'bg-accent/30'
            )}
        >
            {isCurrent && (
                <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-accent cursor-blink" />
            )}
            {getCharDisplay()}
        </span>
    );
}

function LineNumber({ number, isActive }: { number: number; isActive: boolean }) {
    return (
        <span
            className={cn(
                'inline-block w-12 text-right pr-4 select-none',
                isActive ? 'text-accent' : 'text-muted-foreground/50'
            )}
        >
            {number}
        </span>
    );
}

function ChunkSelector() {
    const { selectedFile, currentChunkIndex, selectChunk, nextChunk, prevChunk } = useAppStore();

    if (!selectedFile?.chunks || selectedFile.chunks.length <= 1) {
        return null;
    }

    const chunks = selectedFile.chunks;
    const completedChunks = selectedFile.completedChunks || new Set();

    return (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card/50">
            <button
                onClick={prevChunk}
                disabled={currentChunkIndex === 0}
                className="p-1 hover:bg-muted rounded disabled:opacity-30 disabled:cursor-not-allowed"
            >
                <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1 flex-1 overflow-x-auto py-1">
                {chunks.map((chunk, idx) => (
                    <button
                        key={chunk.id}
                        onClick={() => selectChunk(idx)}
                        className={cn(
                            'flex items-center gap-1 px-2 py-1 text-xs rounded whitespace-nowrap transition-colors',
                            idx === currentChunkIndex
                                ? 'bg-accent text-background'
                                : completedChunks.has(chunk.id)
                                    ? 'bg-accent/20 text-accent'
                                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                        )}
                    >
                        {completedChunks.has(chunk.id) && <Check className="w-3 h-3" />}
                        <span>{chunk.title}</span>
                    </button>
                ))}
            </div>

            <button
                onClick={nextChunk}
                disabled={currentChunkIndex === chunks.length - 1}
                className="p-1 hover:bg-muted rounded disabled:opacity-30 disabled:cursor-not-allowed"
            >
                <ChevronRight className="w-4 h-4" />
            </button>

            <span className="text-xs text-muted-foreground ml-2">
                {currentChunkIndex + 1} / {chunks.length}
            </span>
        </div>
    );
}

function CodeInsightPanel() {
    const { currentChunk } = useAppStore();

    if (!currentChunk) return null;

    return (
        <div className="px-4 py-3 border-b border-border bg-gradient-to-r from-purple-500/10 to-blue-500/10">
            <div className="flex items-start gap-3">
                <div className="p-1.5 bg-purple-500/20 rounded">
                    <Lightbulb className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium text-purple-300">{currentChunk.title}</h4>
                        <span className="text-xs text-muted-foreground">
                            Lines {currentChunk.startLine}-{currentChunk.endLine}
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{currentChunk.description}</p>
                </div>
            </div>
        </div>
    );
}

export function TypingArena() {
    const containerRef = useRef<HTMLDivElement>(null);
    const activeLineRef = useRef<HTMLDivElement>(null);

    const {
        selectedFile,
        currentChunk,
        currentChunkIndex,
        typingState,
        settings,
        initTyping,
        handleKeyPress,
        resetTyping,
        getStatistics,
        nextChunk,
    } = useAppStore();

    const content = currentChunk?.content || '';
    const { currentIndex, errorIndices, isActive, endTime, startTime } = typingState;

    const lines = useMemo(() => {
        if (!content) return [];

        const result: { chars: string[]; startIndex: number; lineNumber: number }[] = [];
        let currentLine: string[] = [];
        let startIndex = 0;
        const baseLineNumber = currentChunk?.startLine || 1;

        for (let i = 0; i < content.length; i++) {
            const char = content[i];
            currentLine.push(char);

            if (char === '\n') {
                result.push({
                    chars: currentLine,
                    startIndex,
                    lineNumber: baseLineNumber + result.length
                });
                startIndex = i + 1;
                currentLine = [];
            }
        }

        if (currentLine.length > 0) {
            result.push({
                chars: currentLine,
                startIndex,
                lineNumber: baseLineNumber + result.length
            });
        }

        return result;
    }, [content, currentChunk?.startLine]);

    const currentLineIndex = useMemo(() => {
        let charCount = 0;
        for (let i = 0; i < lines.length; i++) {
            charCount += lines[i].chars.length;
            if (currentIndex < charCount) {
                return i;
            }
        }
        return lines.length - 1;
    }, [lines, currentIndex]);

    useEffect(() => {
        if (activeLineRef.current && containerRef.current) {
            const container = containerRef.current;
            const activeLine = activeLineRef.current;

            const containerHeight = container.clientHeight;
            const lineTop = activeLine.offsetTop;
            const lineHeight = activeLine.clientHeight;

            const scrollTarget = lineTop - containerHeight / 2 + lineHeight / 2;

            container.scrollTo({
                top: Math.max(0, scrollTarget),
                behavior: 'smooth',
            });
        }
    }, [currentLineIndex]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isActive && !startTime) {
            if (e.key.length === 1 || e.key === 'Tab' || e.key === 'Enter') {
                initTyping();
            }
        }

        if (e.key === 'Tab') {
            e.preventDefault();
            handleKeyPress('Tab');
            return;
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            handleKeyPress('Enter');
            return;
        }

        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            handleKeyPress(e.key);
        }
    }, [isActive, startTime, initTyping, handleKeyPress]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    useEffect(() => {
        resetTyping();
    }, [currentChunk, resetTyping]);

    if (!selectedFile) {
        return (
            <div className="flex-1 flex items-center justify-center bg-background">
                <div className="text-center text-muted-foreground">
                    <FileCode className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Select a file to start typing</p>
                    <p className="text-sm mt-2">Choose a file from the sidebar</p>
                </div>
            </div>
        );
    }

    const stats = getStatistics();
    const isComplete = endTime !== null;
    const hasMoreChunks = selectedFile.chunks && currentChunkIndex < selectedFile.chunks.length - 1;

    return (
        <div className="flex-1 flex flex-col bg-background overflow-hidden relative">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{selectedFile.name}</span>
                    <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
                        {selectedFile.language}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {!isActive && !isComplete && (
                        <button
                            onClick={initTyping}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-accent text-background rounded hover:bg-accent/90 transition-colors"
                        >
                            <Play className="w-3 h-3" />
                            Start
                        </button>
                    )}
                    <button
                        onClick={resetTyping}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <RotateCcw className="w-3 h-3" />
                        Reset
                    </button>
                </div>
            </div>

            <ChunkSelector />
            <CodeInsightPanel />

            {isComplete && (
                <div className="px-4 py-6 bg-accent/10 border-b border-accent/30">
                    <div className="text-center">
                        <h3 className="text-2xl font-bold text-accent mb-2">
                            {hasMoreChunks ? 'Section Complete!' : 'File Complete!'}
                        </h3>
                        <div className="flex justify-center gap-8 text-sm mb-4">
                            <div>
                                <span className="text-muted-foreground">WPM:</span>{' '}
                                <span className="font-bold text-lg">{stats.wpm}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Accuracy:</span>{' '}
                                <span className="font-bold text-lg">{stats.accuracy}%</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Time:</span>{' '}
                                <span className="font-bold text-lg">{stats.elapsedTime}s</span>
                            </div>
                        </div>
                        {hasMoreChunks && (
                            <button
                                onClick={nextChunk}
                                className="flex items-center gap-2 mx-auto px-4 py-2 bg-accent text-background rounded hover:bg-accent/90 transition-colors"
                            >
                                Next Section
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div
                ref={containerRef}
                className="flex-1 overflow-y-auto p-4 font-mono text-sm leading-relaxed"
            >
                <div className="max-w-4xl mx-auto">
                    {lines.map((line, lineIndex) => (
                        <div
                            key={lineIndex}
                            ref={lineIndex === currentLineIndex ? activeLineRef : null}
                            className={cn(
                                'flex',
                                lineIndex === currentLineIndex && isActive && 'bg-muted/20 -mx-2 px-2 rounded'
                            )}
                        >
                            {settings.showLineNumbers && (
                                <LineNumber
                                    number={line.lineNumber}
                                    isActive={lineIndex === currentLineIndex && isActive}
                                />
                            )}
                            <div className="flex-1">
                                {line.chars.map((char, charIndex) => {
                                    const globalIndex = line.startIndex + charIndex;
                                    return (
                                        <Character
                                            key={globalIndex}
                                            char={char}
                                            index={globalIndex}
                                            currentIndex={currentIndex}
                                            errorIndices={errorIndices}
                                            isActive={isActive || startTime !== null}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {!startTime && !isComplete && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center text-muted-foreground bg-background/80 px-6 py-4 rounded-lg">
                        <p className="text-lg">Press any key to start typing</p>
                    </div>
                </div>
            )}
        </div>
    );
}
