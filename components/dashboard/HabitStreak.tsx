import React from 'react';
import { useAppContext } from '../../context/AppContext';

const getTodayString = () => new Date().toISOString().split('T')[0];

const calculateStreakInfo = (completedDates: string[]): { streak: number; isBroken: boolean } => {
    if (completedDates.length === 0) return { streak: 0, isBroken: false };
    
    const dates = new Set(completedDates);
    const sortedDates = [...dates].sort().reverse();
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    let streak = 0;
    let currentDate = new Date(sortedDates[0]);

    // Check if streak is active today or yesterday
    if (dates.has(today.toISOString().split('T')[0])) {
        currentDate = today;
    } else if (dates.has(yesterday.toISOString().split('T')[0])) {
        currentDate = yesterday;
    } else {
        // Streak is broken if the last completion was before yesterday
        return { streak: 0, isBroken: true };
    }
    
    // Calculate current streak
    while (dates.has(currentDate.toISOString().split('T')[0])) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
    }
    
    return { streak, isBroken: false };
};

const HabitOrb: React.FC<{ streak: number; isBroken: boolean }> = ({ streak, isBroken }) => (
    <div className="relative w-[60px] h-[60px] flex items-center justify-center" style={{ perspective: '300px' }}>
        <div className={`habit-orb ${isBroken ? 'cracked' : ''}`}>
            <div className="habit-orb-shadow"></div>
            <div className="habit-orb-glow"></div>
            <div className="habit-orb-text">
                <span className="text-xl font-bold text-black/70 drop-shadow-sm">{streak}</span>
            </div>
        </div>
    </div>
);


const HabitStreak: React.FC = () => {
    const { habits, setHabits } = useAppContext();
    const todayStr = getTodayString();

    const handleToggleHabit = (habitId: number, completed: boolean) => {
        setHabits(prevHabits => 
            prevHabits.map(h => {
                if (h.id === habitId) {
                    const dates = new Set(h.completedDates);
                    if (completed) {
                        dates.add(todayStr);
                    } else {
                        dates.delete(todayStr);
                    }
                    return { ...h, completedDates: Array.from(dates) };
                }
                return h;
            })
        );
    };

    return (
        <div className="p-4">
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {habits.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">No habits yet. Add some in the Systems tab!</p>
                ) : (
                    habits.map(habit => {
                        const isCompletedToday = habit.completedDates.includes(todayStr);
                        const { streak, isBroken } = calculateStreakInfo(habit.completedDates);

                        return (
                            <div key={habit.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={isCompletedToday}
                                        onChange={(e) => handleToggleHabit(habit.id, e.target.checked)}
                                        className="form-checkbox h-5 w-5 rounded bg-transparent border-gray-600 text-[var(--grad-1)] focus:ring-0 cursor-pointer"
                                    />
                                    <span className={`transition-colors ${isCompletedToday ? 'text-white' : 'text-gray-400'}`}>{habit.name}</span>
                                </label>
                               <HabitOrb streak={streak} isBroken={isBroken && streak === 0} />
                            </div>
                        );
                    })
                )}
            </div>
        </>
    );
};

export default HabitStreak;