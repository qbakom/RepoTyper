import { SupportedLanguage } from '@/types';

interface CommentPattern {
    single: RegExp[];
    multiStart: RegExp;
    multiEnd: RegExp;
}

const COMMENT_PATTERNS: Partial<Record<SupportedLanguage, CommentPattern>> = {
    javascript: {
        single: [/^\s*\/\/.*/],
        multiStart: /\/\*/,
        multiEnd: /\*\//,
    },
    typescript: {
        single: [/^\s*\/\/.*/],
        multiStart: /\/\*/,
        multiEnd: /\*\//,
    },
    jsx: {
        single: [/^\s*\/\/.*/],
        multiStart: /\/\*/,
        multiEnd: /\*\//,
    },
    tsx: {
        single: [/^\s*\/\/.*/],
        multiStart: /\/\*/,
        multiEnd: /\*\//,
    },
    python: {
        single: [/^\s*#.*/],
        multiStart: /'''/,
        multiEnd: /'''/,
    },
    rust: {
        single: [/^\s*\/\/.*/],
        multiStart: /\/\*/,
        multiEnd: /\*\//,
    },
    go: {
        single: [/^\s*\/\/.*/],
        multiStart: /\/\*/,
        multiEnd: /\*\//,
    },
    css: {
        single: [],
        multiStart: /\/\*/,
        multiEnd: /\*\//,
    },
    html: {
        single: [],
        multiStart: /<!--/,
        multiEnd: /-->/,
    },
    yaml: {
        single: [/^\s*#.*/],
        multiStart: /(?!)/,
        multiEnd: /(?!)/,
    },
    shell: {
        single: [/^\s*#.*/],
        multiStart: /(?!)/,
        multiEnd: /(?!)/,
    },
};

export function removeComments(code: string, language: SupportedLanguage): string {
    const patterns = COMMENT_PATTERNS[language];
    if (!patterns) return code;

    const lines = code.split('\n');
    const resultLines: string[] = [];
    let inMultilineComment = false;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        if (inMultilineComment) {
            if (patterns.multiEnd.test(line)) {
                const endMatch = line.match(patterns.multiEnd);
                if (endMatch) {
                    line = line.slice(line.indexOf(endMatch[0]) + endMatch[0].length);
                    inMultilineComment = false;
                }
            } else {
                continue;
            }
        }

        if (!inMultilineComment && patterns.multiStart.test(line)) {
            const startIdx = line.search(patterns.multiStart);
            const beforeComment = line.slice(0, startIdx);
            const afterStart = line.slice(startIdx);

            if (patterns.multiEnd.test(afterStart.slice(2))) {
                const endMatch = afterStart.slice(2).match(patterns.multiEnd);
                if (endMatch) {
                    const endIdx = afterStart.slice(2).indexOf(endMatch[0]) + 2 + endMatch[0].length;
                    line = beforeComment + afterStart.slice(endIdx);
                }
            } else {
                line = beforeComment;
                inMultilineComment = true;
            }
        }

        let isSingleLineComment = false;
        for (const pattern of patterns.single) {
            if (pattern.test(line)) {
                isSingleLineComment = true;
                break;
            }
        }

        if (!isSingleLineComment) {
            for (const pattern of patterns.single) {
                const commentMatch = line.match(/\/\/|#/);
                if (commentMatch && !line.includes('://') && !line.includes('#!')) {
                    const idx = line.indexOf(commentMatch[0]);
                    const beforeQuotes = line.slice(0, idx);
                    const quoteCount = (beforeQuotes.match(/['"]/g) || []).length;
                    if (quoteCount % 2 === 0) {
                        line = line.slice(0, idx);
                    }
                }
            }
        }

        if (!isSingleLineComment && line.trim() !== '') {
            resultLines.push(line);
        } else if (!isSingleLineComment && resultLines.length > 0 && resultLines[resultLines.length - 1].trim() !== '') {
            resultLines.push(line);
        }
    }

    let result = resultLines.join('\n');
    result = result.replace(/\n{3,}/g, '\n\n');
    result = result.trim();

    return result;
}

export interface CodeChunk {
    id: string;
    content: string;
    startLine: number;
    endLine: number;
    title: string;
    description: string;
}

const CHUNK_SIZE = 40;

export function splitIntoChunks(code: string, language: SupportedLanguage): CodeChunk[] {
    const lines = code.split('\n');
    const chunks: CodeChunk[] = [];

    if (lines.length <= CHUNK_SIZE) {
        return [{
            id: 'chunk-0',
            content: code,
            startLine: 1,
            endLine: lines.length,
            title: 'Complete File',
            description: analyzeCodeBlock(code, language),
        }];
    }

    const breakpoints = findLogicalBreakpoints(lines, language);
    let currentChunkStart = 0;

    for (let i = 0; i < breakpoints.length; i++) {
        const breakpoint = breakpoints[i];

        if (breakpoint - currentChunkStart >= CHUNK_SIZE / 2 || i === breakpoints.length - 1) {
            const chunkLines = lines.slice(currentChunkStart, breakpoint + 1);
            const chunkContent = chunkLines.join('\n');

            chunks.push({
                id: `chunk-${chunks.length}`,
                content: chunkContent,
                startLine: currentChunkStart + 1,
                endLine: breakpoint + 1,
                title: generateChunkTitle(chunkLines, chunks.length + 1),
                description: analyzeCodeBlock(chunkContent, language),
            });

            currentChunkStart = breakpoint + 1;
        }
    }

    if (currentChunkStart < lines.length) {
        const chunkLines = lines.slice(currentChunkStart);
        const chunkContent = chunkLines.join('\n');

        chunks.push({
            id: `chunk-${chunks.length}`,
            content: chunkContent,
            startLine: currentChunkStart + 1,
            endLine: lines.length,
            title: generateChunkTitle(chunkLines, chunks.length + 1),
            description: analyzeCodeBlock(chunkContent, language),
        });
    }

    return chunks;
}

function findLogicalBreakpoints(lines: string[], language: SupportedLanguage): number[] {
    const breakpoints: number[] = [];
    let braceDepth = 0;
    let lastBreak = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        braceDepth += (line.match(/\{/g) || []).length;
        braceDepth -= (line.match(/\}/g) || []).length;

        const isFunction = /^(export\s+)?(async\s+)?function\s+\w+/.test(trimmed) ||
            /^(export\s+)?(const|let|var)\s+\w+\s*=\s*(async\s+)?\(/.test(trimmed) ||
            /^(export\s+)?(const|let|var)\s+\w+\s*=\s*(async\s+)?function/.test(trimmed);

        const isClass = /^(export\s+)?class\s+\w+/.test(trimmed);
        const isInterface = /^(export\s+)?interface\s+\w+/.test(trimmed);
        const isType = /^(export\s+)?type\s+\w+/.test(trimmed);

        const isPythonDef = /^(async\s+)?def\s+\w+/.test(trimmed);
        const isPythonClass = /^class\s+\w+/.test(trimmed);

        const isRustFn = /^(pub\s+)?(async\s+)?fn\s+\w+/.test(trimmed);
        const isRustImpl = /^impl\s+/.test(trimmed);
        const isRustStruct = /^(pub\s+)?struct\s+\w+/.test(trimmed);

        const isGoFunc = /^func\s+/.test(trimmed);
        const isGoType = /^type\s+\w+/.test(trimmed);

        const isSignificant = isFunction || isClass || isInterface || isType ||
            isPythonDef || isPythonClass ||
            isRustFn || isRustImpl || isRustStruct ||
            isGoFunc || isGoType;

        if (isSignificant && braceDepth <= 1 && i - lastBreak >= CHUNK_SIZE / 3) {
            if (i > 0) {
                breakpoints.push(i - 1);
                lastBreak = i;
            }
        }

        if (i - lastBreak >= CHUNK_SIZE && braceDepth === 0) {
            breakpoints.push(i);
            lastBreak = i;
        }
    }

    if (breakpoints.length === 0 || breakpoints[breakpoints.length - 1] !== lines.length - 1) {
        breakpoints.push(lines.length - 1);
    }

    return breakpoints;
}

function generateChunkTitle(lines: string[], chunkNumber: number): string {
    for (const line of lines.slice(0, 10)) {
        const trimmed = line.trim();

        const funcMatch = trimmed.match(/function\s+(\w+)/);
        if (funcMatch) return `Function: ${funcMatch[1]}`;

        const arrowMatch = trimmed.match(/(const|let|var)\s+(\w+)\s*=\s*(async\s+)?\(/);
        if (arrowMatch) return `Function: ${arrowMatch[2]}`;

        const classMatch = trimmed.match(/class\s+(\w+)/);
        if (classMatch) return `Class: ${classMatch[1]}`;

        const interfaceMatch = trimmed.match(/interface\s+(\w+)/);
        if (interfaceMatch) return `Interface: ${interfaceMatch[1]}`;

        const typeMatch = trimmed.match(/type\s+(\w+)/);
        if (typeMatch) return `Type: ${typeMatch[1]}`;

        const defMatch = trimmed.match(/def\s+(\w+)/);
        if (defMatch) return `Function: ${defMatch[1]}`;

        const rustFnMatch = trimmed.match(/fn\s+(\w+)/);
        if (rustFnMatch) return `Function: ${rustFnMatch[1]}`;

        const implMatch = trimmed.match(/impl\s+(\w+)/);
        if (implMatch) return `Implementation: ${implMatch[1]}`;

        const structMatch = trimmed.match(/struct\s+(\w+)/);
        if (structMatch) return `Struct: ${structMatch[1]}`;

        const goFuncMatch = trimmed.match(/func\s+(\w+)/);
        if (goFuncMatch) return `Function: ${goFuncMatch[1]}`;
    }

    return `Section ${chunkNumber}`;
}

function analyzeCodeBlock(code: string, language: SupportedLanguage): string {
    const lines = code.split('\n');
    const insights: string[] = [];

    const imports = lines.filter(l => /^import\s|^from\s.*import|^require\(/.test(l.trim()));
    if (imports.length > 0) {
        insights.push(`📦 ${imports.length} import${imports.length > 1 ? 's' : ''}`);
    }

    const exports = lines.filter(l => /^export\s/.test(l.trim()));
    if (exports.length > 0) {
        insights.push(`📤 ${exports.length} export${exports.length > 1 ? 's' : ''}`);
    }

    const functions = lines.filter(l => /function\s+\w+|=>\s*{|def\s+\w+|fn\s+\w+|func\s+\w+/.test(l));
    if (functions.length > 0) {
        insights.push(`⚡ ${functions.length} function${functions.length > 1 ? 's' : ''}`);
    }

    const classes = lines.filter(l => /^(export\s+)?class\s+\w+/.test(l.trim()));
    if (classes.length > 0) {
        insights.push(`🏗️ ${classes.length} class${classes.length > 1 ? 'es' : ''}`);
    }

    const interfaces = lines.filter(l => /^(export\s+)?interface\s+\w+/.test(l.trim()));
    if (interfaces.length > 0) {
        insights.push(`📋 ${interfaces.length} interface${interfaces.length > 1 ? 's' : ''}`);
    }

    const hooks = lines.filter(l => /use[A-Z]\w+/.test(l));
    if (hooks.length > 0) {
        const hookNames = new Set<string>();
        hooks.forEach(l => {
            const match = l.match(/use[A-Z]\w+/g);
            if (match) match.forEach(h => hookNames.add(h));
        });
        insights.push(`🪝 React hooks: ${Array.from(hookNames).slice(0, 3).join(', ')}`);
    }

    const asyncCount = (code.match(/async\s+/g) || []).length;
    if (asyncCount > 0) {
        insights.push(`⏳ ${asyncCount} async operation${asyncCount > 1 ? 's' : ''}`);
    }

    if (insights.length === 0) {
        insights.push(`📝 ${lines.length} lines of ${language} code`);
    }

    return insights.join(' • ');
}
