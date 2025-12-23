import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-toml';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';

import { SupportedLanguage } from '@/types';

const languageMap: Record<SupportedLanguage, string> = {
    javascript: 'javascript',
    typescript: 'typescript',
    jsx: 'jsx',
    tsx: 'tsx',
    python: 'python',
    rust: 'rust',
    go: 'go',
    css: 'css',
    html: 'markup',
    json: 'json',
    markdown: 'markdown',
    yaml: 'yaml',
    toml: 'toml',
    sql: 'sql',
    shell: 'bash',
    plaintext: 'plaintext',
};

export function highlightCode(code: string, language: SupportedLanguage): string {
    const prismLanguage = languageMap[language] || 'plaintext';

    if (prismLanguage === 'plaintext' || !Prism.languages[prismLanguage]) {
        return escapeHtml(code);
    }

    try {
        return Prism.highlight(code, Prism.languages[prismLanguage], prismLanguage);
    } catch {
        return escapeHtml(code);
    }
}

function escapeHtml(text: string): string {
    const htmlEntities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    };
    return text.replace(/[&<>"']/g, (char) => htmlEntities[char]);
}

export { Prism };
