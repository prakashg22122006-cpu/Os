import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Habit } from '../../types';

const CardHeader: React.FC<{ title: string, subtitle?: string }> = ({ title, subtitle }) => (
  <h3 className="m-0 mb-2 text-sm font-bold text-[#cfe8ff]">
    {title} {subtitle && <small className="text-[#9fb3cf] font-normal ml-1">{subtitle}</small>}
  </h3>
);

const HabitsManager: React.FC = () => {
    const { habits, setHabits } = useAppContext();
    const [newHabitName, setNewHabitName] = useState('');

    const addHabit = () => {
        if (!newHabitName.trim()) return;
        const newHabit: Habit = {
            id: Date.now(),
            name: newHabitName,
            completedDates: [],
        };
        setHabits(prev => [newHabit, ...prev]);
        setNewHabitName('');
    };

    const deleteHabit = (id: number) => {
        if (window.confirm('Are you sure you want to delete this habit? All its history will be lost.')) {
            setHabits(prev => prev.filter(h => h.id !== id));
        }
    };

    return (
        <>
            <CardHeader title="Habits Manager" subtitle="Create and manage your daily habits" />
            <div className="flex gap-2 mb-4">
                <Input
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    placeholder="Enter a new habit (e.g., Read for 30 mins)"
                    onKeyDown={(e) => e.key === 'Enter' && addHabit()}
                />
                <Button onClick={addHabit}>Add Habit</Button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {habits.length === 0 ? (
                    <p className="text-[#9fb3cf]">No habits created yet.</p>
                ) : (
                    habits.map(habit => (
                        <div key={habit.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                            <p className="font-semibold">{habit.name}</p>
                            <Button 
                                variant="outline" 
                                className="text-xs !px-2 !py-1" 
                                onClick={() => deleteHabit(habit.id)}
                            >
                                Delete
                            </Button>
                        </div>
                    ))
                )}
            </div>
        </>
    );
};

export default HabitsManager;
