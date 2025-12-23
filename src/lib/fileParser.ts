import { FileNode, SupportedLanguage } from '@/types';
import { removeComments, splitIntoChunks } from './codeProcessor';

const IGNORED_DIRS = new Set([
    'node_modules',
    '.git',
    '.next',
    'dist',
    'build',
    '.vscode',
    '.idea',
    '__pycache__',
    '.cache',
    'coverage',
    '.turbo',
    'target',
    'vendor',
]);

const CODE_EXTENSIONS: Record<string, SupportedLanguage> = {
    '.js': 'javascript',
    '.mjs': 'javascript',
    '.cjs': 'javascript',
    '.jsx': 'jsx',
    '.ts': 'typescript',
    '.tsx': 'tsx',
    '.py': 'python',
    '.rs': 'rust',
    '.go': 'go',
    '.css': 'css',
    '.scss': 'css',
    '.less': 'css',
    '.html': 'html',
    '.htm': 'html',
    '.json': 'json',
    '.md': 'markdown',
    '.mdx': 'markdown',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.toml': 'toml',
    '.sql': 'sql',
    '.sh': 'shell',
    '.bash': 'shell',
    '.zsh': 'shell',
    '.txt': 'plaintext',
    '.env': 'plaintext',
    '.gitignore': 'plaintext',
    '.dockerignore': 'plaintext',
    '.editorconfig': 'plaintext',
    '.vue': 'html',
    '.svelte': 'html',
    '.php': 'plaintext',
    '.rb': 'plaintext',
    '.java': 'plaintext',
    '.kt': 'plaintext',
    '.swift': 'plaintext',
    '.c': 'plaintext',
    '.cpp': 'plaintext',
    '.h': 'plaintext',
    '.hpp': 'plaintext',
};

const BINARY_EXTENSIONS = new Set([
    '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.webp', '.bmp',
    '.mp3', '.mp4', '.wav', '.avi', '.mov', '.webm',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.zip', '.tar', '.gz', '.rar', '.7z',
    '.exe', '.dll', '.so', '.dylib',
    '.woff', '.woff2', '.ttf', '.eot', '.otf',
    '.lock', '.min.js', '.min.css',
]);

function getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1) return '';
    return filename.slice(lastDot).toLowerCase();
}

function isCodeFile(filename: string): boolean {
    const ext = getFileExtension(filename);
    if (BINARY_EXTENSIONS.has(ext)) return false;
    if (filename.endsWith('.min.js') || filename.endsWith('.min.css')) return false;
    return ext in CODE_EXTENSIONS || ext === '';
}

function getLanguage(filename: string): SupportedLanguage {
    const ext = getFileExtension(filename);
    return CODE_EXTENSIONS[ext] || 'plaintext';
}

function shouldIgnoreDir(name: string): boolean {
    return IGNORED_DIRS.has(name) || name.startsWith('.');
}

function generateId(): string {
    return Math.random().toString(36).substring(2, 15);
}

interface FileEntry {
    file: File;
    path: string;
}

async function readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
    });
}

export async function parseUploadedFiles(fileList: FileList): Promise<{
    files: FileNode[];
    projectName: string;
}> {
    const fileEntries: FileEntry[] = [];

    for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const path = (file as any).webkitRelativePath || file.name;
        fileEntries.push({ file, path });
    }

    if (fileEntries.length === 0) {
        return { files: [], projectName: 'Unknown Project' };
    }

    const firstPath = fileEntries[0].path;
    const projectName = firstPath.split('/')[0] || 'Project';

    const filteredEntries = fileEntries.filter((entry) => {
        const pathParts = entry.path.split('/');
        const hasIgnoredDir = pathParts.some((part) => shouldIgnoreDir(part));
        if (hasIgnoredDir) return false;
        return isCodeFile(entry.file.name);
    });

    const root: Record<string, FileNode> = {};

    for (const entry of filteredEntries) {
        const pathParts = entry.path.split('/');
        pathParts.shift();

        if (pathParts.length === 0) continue;

        let current = root;
        let currentPath = '';

        for (let i = 0; i < pathParts.length; i++) {
            const part = pathParts[i];
            currentPath += (currentPath ? '/' : '') + part;
            const isFile = i === pathParts.length - 1;

            if (isFile) {
                const rawContent = await readFileContent(entry.file);
                const normalizedContent = rawContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
                const language = getLanguage(part);
                const processedContent = removeComments(normalizedContent, language);
                const chunks = splitIntoChunks(processedContent, language);

                current[part] = {
                    id: generateId(),
                    name: part,
                    path: currentPath,
                    type: 'file',
                    content: processedContent,
                    originalContent: normalizedContent,
                    language,
                    isCompleted: false,
                    chunks,
                    completedChunks: new Set(),
                };
            } else {
                if (!current[part]) {
                    current[part] = {
                        id: generateId(),
                        name: part,
                        path: currentPath,
                        type: 'folder',
                        children: [],
                    };
                }

                const folderNode = current[part];
                if (!folderNode.children) {
                    folderNode.children = [];
                }

                const childMap: Record<string, FileNode> = {};
                for (const child of folderNode.children) {
                    childMap[child.name] = child;
                }
                current = childMap;
                folderNode.children = Object.values(current) as FileNode[];
                current = childMap;
            }
        }
    }

    const buildTree = (nodeMap: Record<string, FileNode>): FileNode[] => {
        return Object.values(nodeMap).sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === 'folder' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        });
    };

    const processNode = (node: FileNode): FileNode => {
        if (node.type === 'folder' && node.children) {
            const childMap: Record<string, FileNode> = {};
            for (const child of node.children) {
                childMap[child.name] = processNode(child);
            }
            return {
                ...node,
                children: buildTree(childMap),
            };
        }
        return node;
    };

    const files = buildTree(root).map(processNode);

    return { files, projectName };
}

export function flattenFiles(nodes: FileNode[]): FileNode[] {
    const result: FileNode[] = [];

    const traverse = (nodeList: FileNode[]) => {
        for (const node of nodeList) {
            if (node.type === 'file') {
                result.push(node);
            } else if (node.children) {
                traverse(node.children);
            }
        }
    };

    traverse(nodes);
    return result;
}
