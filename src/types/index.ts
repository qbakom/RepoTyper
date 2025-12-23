export interface FileNode {
    id: string;
    name: string;
    path: string;
    type: 'file' | 'folder';
    content?: string;
    originalContent?: string;
    language?: string;
    children?: FileNode[];
    isCompleted?: boolean;
    chunks?: CodeChunk[];
    completedChunks?: Set<string>;
}

export interface CodeChunk {
    id: string;
    content: string;
    startLine: number;
    endLine: number;
    title: string;
    description: string;
}

export interface TypingState {
    currentIndex: number;
    errors: number;
    correctChars: number;
    startTime: number | null;
    endTime: number | null;
    isActive: boolean;
    errorIndices: Set<number>;
}

export interface Statistics {
    wpm: number;
    accuracy: number;
    progress: number;
    totalChars: number;
    typedChars: number;
    errors: number;
    elapsedTime: number;
}

export interface GameSettings {
    stopOnError: boolean;
    showLineNumbers: boolean;
    tabSize: number;
}

export type SupportedLanguage =
    | 'javascript'
    | 'typescript'
    | 'python'
    | 'rust'
    | 'go'
    | 'css'
    | 'html'
    | 'json'
    | 'markdown'
    | 'jsx'
    | 'tsx'
    | 'yaml'
    | 'toml'
    | 'sql'
    | 'shell'
    | 'plaintext';
