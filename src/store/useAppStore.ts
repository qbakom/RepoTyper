import { create } from 'zustand';
import { FileNode, TypingState, GameSettings, Statistics, CodeChunk } from '@/types';

interface AppStore {
    files: FileNode[];
    selectedFile: FileNode | null;
    currentChunk: CodeChunk | null;
    currentChunkIndex: number;
    typingState: TypingState;
    settings: GameSettings;
    projectName: string | null;

    setFiles: (files: FileNode[]) => void;
    setSelectedFile: (file: FileNode | null) => void;
    setProjectName: (name: string) => void;
    markFileCompleted: (fileId: string) => void;
    markChunkCompleted: (fileId: string, chunkId: string) => void;
    selectChunk: (chunkIndex: number) => void;
    nextChunk: () => void;
    prevChunk: () => void;

    initTyping: () => void;
    handleKeyPress: (key: string) => void;
    resetTyping: () => void;

    updateSettings: (settings: Partial<GameSettings>) => void;

    getStatistics: () => Statistics;

    clearProject: () => void;
}

const initialTypingState: TypingState = {
    currentIndex: 0,
    errors: 0,
    correctChars: 0,
    startTime: null,
    endTime: null,
    isActive: false,
    errorIndices: new Set(),
};

const initialSettings: GameSettings = {
    stopOnError: false,
    showLineNumbers: true,
    tabSize: 2,
};

export const useAppStore = create<AppStore>((set, get) => ({
    files: [],
    selectedFile: null,
    currentChunk: null,
    currentChunkIndex: 0,
    typingState: initialTypingState,
    settings: initialSettings,
    projectName: null,

    setFiles: (files) => set({ files }),

    setSelectedFile: (file) => {
        const chunk = file?.chunks?.[0] || null;
        set({
            selectedFile: file,
            currentChunk: chunk,
            currentChunkIndex: 0,
            typingState: initialTypingState
        });
    },

    setProjectName: (name) => set({ projectName: name }),

    markFileCompleted: (fileId) => {
        const markCompleted = (nodes: FileNode[]): FileNode[] => {
            return nodes.map((node) => {
                if (node.id === fileId) {
                    return { ...node, isCompleted: true };
                }
                if (node.children) {
                    return { ...node, children: markCompleted(node.children) };
                }
                return node;
            });
        };

        set((state) => ({ files: markCompleted(state.files) }));
    },

    markChunkCompleted: (fileId, chunkId) => {
        const markCompleted = (nodes: FileNode[]): FileNode[] => {
            return nodes.map((node) => {
                if (node.id === fileId) {
                    const completedChunks = new Set(node.completedChunks || []);
                    completedChunks.add(chunkId);
                    const allComplete = node.chunks?.every(c => completedChunks.has(c.id)) || false;
                    return {
                        ...node,
                        completedChunks,
                        isCompleted: allComplete
                    };
                }
                if (node.children) {
                    return { ...node, children: markCompleted(node.children) };
                }
                return node;
            });
        };

        set((state) => ({ files: markCompleted(state.files) }));
    },

    selectChunk: (chunkIndex) => {
        const { selectedFile } = get();
        if (!selectedFile?.chunks) return;

        const chunk = selectedFile.chunks[chunkIndex];
        if (chunk) {
            set({
                currentChunk: chunk,
                currentChunkIndex: chunkIndex,
                typingState: initialTypingState,
            });
        }
    },

    nextChunk: () => {
        const { selectedFile, currentChunkIndex, selectChunk } = get();
        if (!selectedFile?.chunks) return;

        if (currentChunkIndex < selectedFile.chunks.length - 1) {
            selectChunk(currentChunkIndex + 1);
        }
    },

    prevChunk: () => {
        const { currentChunkIndex, selectChunk } = get();
        if (currentChunkIndex > 0) {
            selectChunk(currentChunkIndex - 1);
        }
    },

    initTyping: () => {
        set({
            typingState: {
                ...initialTypingState,
                startTime: Date.now(),
                isActive: true,
            },
        });
    },

    handleKeyPress: (key) => {
        const { selectedFile, currentChunk, typingState, settings, markChunkCompleted, nextChunk } = get();

        const content = currentChunk?.content || '';
        if (!content || !typingState.isActive) return;

        const currentChar = content[typingState.currentIndex];

        if (typingState.currentIndex >= content.length) {
            set((state) => ({
                typingState: {
                    ...state.typingState,
                    isActive: false,
                    endTime: Date.now(),
                },
            }));
            if (selectedFile && currentChunk) {
                markChunkCompleted(selectedFile.id, currentChunk.id);
            }
            return;
        }

        let newIndex = typingState.currentIndex;
        let newErrors = typingState.errors;
        let newCorrectChars = typingState.correctChars;
        const newErrorIndices = new Set(typingState.errorIndices);

        if (key === currentChar) {
            newIndex++;
            newCorrectChars++;
        } else if (key === 'Tab' && currentChar === '\t') {
            newIndex++;
            newCorrectChars++;
        } else if (key === 'Enter' && currentChar === '\n') {
            newIndex++;
            newCorrectChars++;

            while (newIndex < content.length) {
                const nextChar = content[newIndex];
                if (nextChar === ' ' || nextChar === '\t') {
                    newIndex++;
                    newCorrectChars++;
                } else {
                    break;
                }
            }
        } else {
            newErrors++;
            newErrorIndices.add(typingState.currentIndex);

            if (!settings.stopOnError) {
                newIndex++;
            }
        }

        const isComplete = newIndex >= content.length;

        set({
            typingState: {
                ...typingState,
                currentIndex: newIndex,
                errors: newErrors,
                correctChars: newCorrectChars,
                errorIndices: newErrorIndices,
                isActive: !isComplete,
                endTime: isComplete ? Date.now() : null,
            },
        });

        if (isComplete && selectedFile && currentChunk) {
            markChunkCompleted(selectedFile.id, currentChunk.id);
        }
    },

    resetTyping: () => {
        set({ typingState: initialTypingState });
    },

    updateSettings: (newSettings) => {
        set((state) => ({
            settings: { ...state.settings, ...newSettings },
        }));
    },

    getStatistics: () => {
        const { currentChunk, typingState } = get();
        const content = currentChunk?.content || '';
        const totalChars = content.length;
        const typedChars = typingState.currentIndex;

        const elapsedTime = typingState.startTime
            ? ((typingState.endTime || Date.now()) - typingState.startTime) / 1000
            : 0;

        const minutes = elapsedTime / 60;
        const words = typingState.correctChars / 5;
        const wpm = minutes > 0 ? Math.round(words / minutes) : 0;

        const totalAttempts = typingState.correctChars + typingState.errors;
        const accuracy = totalAttempts > 0
            ? Math.round((typingState.correctChars / totalAttempts) * 100)
            : 100;

        const progress = totalChars > 0
            ? Math.round((typedChars / totalChars) * 100)
            : 0;

        return {
            wpm,
            accuracy,
            progress,
            totalChars,
            typedChars,
            errors: typingState.errors,
            elapsedTime: Math.round(elapsedTime),
        };
    },

    clearProject: () => {
        set({
            files: [],
            selectedFile: null,
            currentChunk: null,
            currentChunkIndex: 0,
            typingState: initialTypingState,
            projectName: null,
        });
    },
}));
