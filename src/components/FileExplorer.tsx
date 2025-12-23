'use client';

import { useState, useCallback } from 'react';
import { ChevronRight, ChevronDown, File, Folder, Check, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FileNode } from '@/types';
import { useAppStore } from '@/store/useAppStore';

interface FileTreeItemProps {
    node: FileNode;
    depth: number;
}

function FileTreeItem({ node, depth }: FileTreeItemProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const { selectedFile, setSelectedFile, resetTyping } = useAppStore();

    const isSelected = selectedFile?.id === node.id;
    const isFolder = node.type === 'folder';

    const handleClick = useCallback(() => {
        if (isFolder) {
            setIsExpanded(!isExpanded);
        } else {
            setSelectedFile(node);
            resetTyping();
        }
    }, [isFolder, isExpanded, node, setSelectedFile, resetTyping]);

    const getFileIcon = () => {
        if (isFolder) {
            return isExpanded ? (
                <FolderOpen className="w-4 h-4 text-amber-400" />
            ) : (
                <Folder className="w-4 h-4 text-amber-400" />
            );
        }
        return <File className="w-4 h-4 text-muted-foreground" />;
    };

    return (
        <div>
            <div
                onClick={handleClick}
                className={cn(
                    'flex items-center gap-1 py-1.5 px-2 cursor-pointer rounded-sm',
                    'hover:bg-muted/50 transition-colors',
                    isSelected && 'bg-accent/20 text-accent'
                )}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
                {isFolder ? (
                    <span className="w-4 h-4 flex items-center justify-center">
                        {isExpanded ? (
                            <ChevronDown className="w-3 h-3 text-muted-foreground" />
                        ) : (
                            <ChevronRight className="w-3 h-3 text-muted-foreground" />
                        )}
                    </span>
                ) : (
                    <span className="w-4" />
                )}

                {getFileIcon()}

                <span className="flex-1 truncate text-sm ml-1">{node.name}</span>

                {!isFolder && node.isCompleted && (
                    <Check className="w-4 h-4 text-accent flex-shrink-0" />
                )}
            </div>

            {isFolder && isExpanded && node.children && (
                <div>
                    {node.children.map((child) => (
                        <FileTreeItem key={child.id} node={child} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}

export function FileExplorer() {
    const { files, projectName, clearProject } = useAppStore();

    if (files.length === 0) {
        return null;
    }

    const totalFiles = countFiles(files);
    const completedFiles = countCompletedFiles(files);

    return (
        <div className="h-full flex flex-col bg-card border-r border-border">
            <div className="p-3 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="font-semibold text-sm truncate">{projectName}</h2>
                    <button
                        onClick={clearProject}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Close
                    </button>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{completedFiles}/{totalFiles} files completed</span>
                </div>
                <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-accent transition-all duration-300"
                        style={{ width: `${(completedFiles / totalFiles) * 100}%` }}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
                {files.map((node) => (
                    <FileTreeItem key={node.id} node={node} depth={0} />
                ))}
            </div>
        </div>
    );
}

function countFiles(nodes: FileNode[]): number {
    let count = 0;
    for (const node of nodes) {
        if (node.type === 'file') {
            count++;
        } else if (node.children) {
            count += countFiles(node.children);
        }
    }
    return count;
}

function countCompletedFiles(nodes: FileNode[]): number {
    let count = 0;
    for (const node of nodes) {
        if (node.type === 'file' && node.isCompleted) {
            count++;
        } else if (node.children) {
            count += countCompletedFiles(node.children);
        }
    }
    return count;
}
