'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Gauge, Target, Timer, Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StatisticsHUD() {
    const { selectedFile, typingState, getStatistics, settings, updateSettings } = useAppStore();
    const [stats, setStats] = useState(getStatistics());

    useEffect(() => {
        if (!typingState.isActive && !typingState.startTime) {
            setStats(getStatistics());
            return;
        }

        const interval = setInterval(() => {
            setStats(getStatistics());
        }, 100);

        return () => clearInterval(interval);
    }, [typingState.isActive, typingState.startTime, getStatistics]);

    if (!selectedFile) {
        return null;
    }

    return (
        <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border">
            <div className="flex items-center gap-6">
                <StatItem
                    icon={<Gauge className="w-4 h-4" />}
                    label="WPM"
                    value={stats.wpm.toString()}
                    highlight
                />
                <StatItem
                    icon={<Target className="w-4 h-4" />}
                    label="Accuracy"
                    value={`${stats.accuracy}%`}
                    variant={stats.accuracy >= 95 ? 'success' : stats.accuracy >= 80 ? 'warning' : 'error'}
                />
                <StatItem
                    icon={<Timer className="w-4 h-4" />}
                    label="Time"
                    value={formatTime(stats.elapsedTime)}
                />
                <StatItem
                    icon={<Keyboard className="w-4 h-4" />}
                    label="Progress"
                    value={`${stats.typedChars}/${stats.totalChars}`}
                />
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-4 text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.stopOnError}
                            onChange={(e) => updateSettings({ stopOnError: e.target.checked })}
                            className="w-4 h-4 rounded border-border bg-muted accent-accent"
                        />
                        <span className="text-muted-foreground">Stop on error</span>
                    </label>
                </div>

                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-accent transition-all duration-100"
                        style={{ width: `${stats.progress}%` }}
                    />
                </div>
                <span className="text-xs text-muted-foreground w-10">{stats.progress}%</span>
            </div>
        </div>
    );
}

interface StatItemProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    highlight?: boolean;
    variant?: 'default' | 'success' | 'warning' | 'error';
}

function StatItem({ icon, label, value, highlight, variant = 'default' }: StatItemProps) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{icon}</span>
            <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span
                    className={cn(
                        'text-sm font-mono font-bold',
                        highlight && 'text-accent',
                        variant === 'success' && 'text-green-500',
                        variant === 'warning' && 'text-yellow-500',
                        variant === 'error' && 'text-red-500'
                    )}
                >
                    {value}
                </span>
            </div>
        </div>
    );
}

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
