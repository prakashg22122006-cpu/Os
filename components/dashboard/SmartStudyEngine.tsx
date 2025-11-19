
import React, { useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Task, Flashcard } from '../../types';

const SmartStudyEngine: React.FC = () => {
    const { decks, tasks, exams, setViewingTask } = useAppContext();

    const recommendations = useMemo(() => {
        const now = Date.now();
        const recs: { type: 'review' | 'task' | 'exam', score: number, title: string, detail: string, action: () => void, meta?: any }[] = [];

        // 1. Flashcards Due (High Priority)
        let dueCardsCount = 0;
        let deckNames = new Set<string>();
        
        decks.forEach(deck => {
            const due = deck.cards.filter(c => c.nextReview <= now && c.status !== 'new');
            const newCards = deck.cards.filter(c => c.status === 'new');
            
            if (due.length > 0) {
                dueCardsCount += due.length;
                deckNames.add(deck.name);
                // Score: higher if overdue + amount
                const daysOverdue = (now - Math.min(...due.map(c => c.nextReview))) / (1000 * 60 * 60 * 24);
                const score = 100 + (daysOverdue * 5) + due.length;
                
                recs.push({
                    type: 'review',
                    score,
                    title: `Review: ${deck.name}`,
                    detail: `${due.length} cards due now.`,
                    action: () => alert('Go to Memory Center to study this deck.'), // In a real app, navigate
                    meta: { deckId: deck.name }
                });
            } else if (newCards.length > 0) {
                 recs.push({
                    type: 'review',
                    score: 40, // Lower priority than due cards
                    title: `Learn New: ${deck.name}`,
                    detail: `${newCards.length} new cards available.`,
                    action: () => alert('Go to Memory Center to learn new cards.'),
                    meta: { deckId: deck.name }
                });
            }
        });

        // 2. High Priority Tasks / Hard-First
        tasks.forEach(task => {
            if (task.status === 'Done') return;
            
            let baseScore = 0;
            if (task.priority === 'Urgent') baseScore = 95;
            else if (task.priority === 'High') baseScore = 80;
            else if (task.priority === 'Medium') baseScore = 50;
            else baseScore = 20;
            
            // Hard-First method: boost score for high difficulty tasks if user has high energy (implied)
            // Or just prioritize them generally for start of day
            if (task.difficulty) {
                baseScore += task.difficulty * 5;
            }

            if (task.dueDate) {
                const daysUntilDue = (new Date(task.dueDate).getTime() - now) / (1000 * 60 * 60 * 24);
                if (daysUntilDue < 0) baseScore += 50; // Overdue
                else if (daysUntilDue < 2) baseScore += 30;
                else if (daysUntilDue < 7) baseScore += 10;
            }

            recs.push({
                type: 'task',
                score: baseScore,
                title: task.title,
                detail: `Priority: ${task.priority}, Diff: ${task.difficulty || '-'}/5`,
                action: () => setViewingTask(task),
            });
        });

        return recs.sort((a, b) => b.score - a.score).slice(0, 5);
    }, [decks, tasks]);

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-2">
                <h3 className="m-0 text-sm font-bold text-[var(--accent-color)]">Smart Study Engine</h3>
                <span className="text-xs text-gray-400">AI-Driven • Offline</span>
            </div>
            
            <div className="flex-grow space-y-2 overflow-y-auto pr-1">
                {recommendations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center text-sm">
                        <p>All caught up!</p>
                        <p>Relax or add new topics.</p>
                    </div>
                ) : (
                    recommendations.map((rec, i) => (
                        <div key={i} className="p-2.5 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] rounded-lg flex items-center justify-between hover:bg-[rgba(255,255,255,0.06)] transition-colors group">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${rec.type === 'review' ? 'bg-green-400' : rec.type === 'exam' ? 'bg-red-400' : 'bg-blue-400'}`}></span>
                                    <span className="font-semibold text-sm text-gray-200">{rec.title}</span>
                                </div>
                                <p className="text-xs text-gray-400 ml-4">{rec.detail}</p>
                            </div>
                            <Button variant="outline" className="text-xs !px-2 !py-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={rec.action}>
                                Start
                            </Button>
                        </div>
                    ))
                )}
            </div>
            
            <div className="mt-2 pt-2 border-t border-white/10 flex justify-between text-xs text-gray-500">
                <span>Focus: Interleaving active</span>
                <span>Recall Strength: 85%</span>
            </div>
        </div>
    );
};

export default SmartStudyEngine;
