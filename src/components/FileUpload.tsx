'use client';

import { useCallback, useState, useRef } from 'react';
import { FolderUp, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseUploadedFiles } from '@/lib/fileParser';
import { useAppStore } from '@/store/useAppStore';

export function FileUpload() {
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const { setFiles, setProjectName } = useAppStore();

    const handleFiles = useCallback(async (fileList: FileList) => {
        setIsLoading(true);
        try {
            const { files, projectName } = await parseUploadedFiles(fileList);
            setFiles(files);
            setProjectName(projectName);
        } catch (error) {
            console.error('Error parsing files:', error);
        } finally {
            setIsLoading(false);
        }
    }, [setFiles, setProjectName]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const items = e.dataTransfer.items;
        if (items && items.length > 0) {
            const fileList = e.dataTransfer.files;
            if (fileList.length > 0) {
                await handleFiles(fileList);
            }
        }
    }, [handleFiles]);

    const handleInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            await handleFiles(files);
        }
    }, [handleFiles]);

    const handleClick = useCallback(() => {
        inputRef.current?.click();
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                    RepoTyper
                </h1>
                <p className="text-muted-foreground text-lg">
                    Practice touch typing with your own code
                </p>
            </div>

            <div
                onClick={handleClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                    'relative w-full max-w-xl h-64 border-2 border-dashed rounded-lg',
                    'flex flex-col items-center justify-center gap-4 cursor-pointer',
                    'transition-all duration-200 ease-in-out',
                    isDragging
                        ? 'border-accent bg-accent/10 scale-105'
                        : 'border-border hover:border-accent/50 hover:bg-muted/30',
                    isLoading && 'pointer-events-none opacity-50'
                )}
            >
                <input
                    ref={inputRef}
                    type="file"
                    onChange={handleInputChange}
                    className="hidden"
                    {...({ webkitdirectory: '', directory: '', mozdirectory: '' } as any)}
                    multiple
                />

                {isLoading ? (
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                        <p className="text-muted-foreground">Processing files...</p>
                    </div>
                ) : (
                    <>
                        <div className="p-4 rounded-full bg-muted">
                            {isDragging ? (
                                <Upload className="w-10 h-10 text-accent" />
                            ) : (
                                <FolderUp className="w-10 h-10 text-muted-foreground" />
                            )}
                        </div>
                        <div className="text-center">
                            <p className="text-foreground font-medium mb-1">
                                Drop a folder here or click to browse
                            </p>
                            <p className="text-muted-foreground text-sm">
                                Supports .js, .ts, .py, .rs, .go, .css, .html and more
                            </p>
                        </div>
                    </>
                )}
            </div>

            <div className="mt-8 text-center text-muted-foreground text-sm max-w-md">
                <p className="mb-2">
                    Select a project folder to start practicing
                </p>
                <p>
                    All processing happens locally in your browser. No files are uploaded to any server.
                </p>
            </div>
        </div>
    );
}
