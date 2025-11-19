import React from 'react';
import { render } from '../test-utils';
import { describe, it, expect, vi } from 'vitest';
import DashboardView from './DashboardView';
import { useLocalStorage } from '../hooks/useLocalStorage';

// Mock the widgets to avoid rendering complex components
vi.mock('./dashboard/ClockCalendar', () => ({ default: () => <div>ClockCalendar</div> }));
vi.mock('./dashboard/PomodoroTimer', () => ({ default: () => <div>PomodoroTimer</div> }));
vi.mock('./dashboard/TasksWidget', () => ({ default: () => <div>TasksWidget</div> }));
vi.mock('./dashboard/ClassesWidget', () => ({ default: () => <div>ClassesWidget</div> }));
vi.mock('./dashboard/StudyProgress', () => ({ default: () => <div>StudyProgress</div> }));
vi.mock('./dashboard/QuickNote', () => ({ default: () => <div>QuickNote</div> }));
vi.mock('./dashboard/MusicPlayer', () => ({ default: () => <div>MusicPlayer</div> }));
vi.mock('./dashboard/FocusMode', () => ({ default: () => <div>FocusMode</div> }));
vi.mock('./dashboard/HabitStreak', () => ({ default: () => <div>HabitStreak</div> }));
vi.mock('./dashboard/ProgressSummary', () => ({ default: () => <div>ProgressSummary</div> }));
vi.mock('./dashboard/GamificationWidget', () => ({ default: () => <div>GamificationWidget</div> }));

vi.mock('../hooks/useLocalStorage');

const mockSetAppSettings = vi.fn();

describe('DashboardView', () => {
    it('should have deterministic animation delays', () => {
        const mockAppSettings = {
            dashboardWidgets: [
                { id: 'clock', enabled: true, colSpan: 1, name: 'Clock', minimized: false },
                { id: 'pomodoro', enabled: true, colSpan: 1, name: 'Pomodoro', minimized: false },
                { id: 'tasks', enabled: true, colSpan: 1, name: 'Tasks', minimized: false },
            ],
            dashboardColumns: '2',
        };

        (useLocalStorage as vi.Mock).mockImplementation((key, initialValue) => {
            if (key === 'appSettings') {
                return [mockAppSettings, mockSetAppSettings];
            }
            if (key === 'kanban') {
                return [{ backlog: [], progress: [], done: [] }, vi.fn()];
            }
            return [initialValue, vi.fn()];
        });


        const { container, rerender } = render(<DashboardView setIsFocusMode={() => {}} />);

        const getAnimationDelay = (element: HTMLElement | null) => {
            return element ? element.style.animationDelay : null;
        };

        const pomodoroWidgetInitial = container.querySelector('[style*="animation-delay: 140ms"]');
        const initialDelay = getAnimationDelay(pomodoroWidgetInitial as HTMLElement);

        const reorderedAppSettings = {
            ...mockAppSettings,
            dashboardWidgets: [
                mockAppSettings.dashboardWidgets[1],
                mockAppSettings.dashboardWidgets[0],
                mockAppSettings.dashboardWidgets[2],
            ],
        };

        (useLocalStorage as vi.Mock).mockImplementation((key, initialValue) => {
            if (key === 'appSettings') {
                return [reorderedAppSettings, mockSetAppSettings];
            }
            if (key === 'kanban') {
                return [{ backlog: [], progress: [], done: [] }, vi.fn()];
            }
            return [initialValue, vi.fn()];
        });


        rerender(<DashboardView setIsFocusMode={() => {}} />);

        const pomodoroWidgetReordered = container.querySelector('[style*="animation-delay: 140ms"]');
        const reorderedDelay = getAnimationDelay(pomodoroWidgetReordered as HTMLElement);

        expect(initialDelay).toBe(reorderedDelay);
    });
});
