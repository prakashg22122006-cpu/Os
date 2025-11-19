import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Habit } from '../../types';

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
                    <p className="text-gray-400">No habits created yet.</p>
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