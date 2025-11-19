
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Deck, Flashcard, MemoryPalace, MemoryLocus } from '../../types';
import CardHeader from '../ui/Card'; // Assuming CardHeader can be imported or redefined
import FlashcardManager from './FlashcardManager'; // Reuse existing manager UI for deck listing if possible, or reimplement

const MemoryCenter: React.FC = () => {
    const { memoryPalaces, setMemoryPalaces, decks } = useAppContext();
    const [activeTab, setActiveTab] = useState<'decks' | 'palace' | 'errors'>('decks');
    const [selectedPalace, setSelectedPalace] = useState<MemoryPalace | null>(null);

    // --- Memory Palace Logic ---
    const handleAddPalace = () => {
        const name = prompt("Palace Name (e.g., My Bedroom):");
        if (name) {
            setMemoryPalaces(prev => [...prev, { id: Date.now(), name, loci: [] }]);
        }
    };

    const handleAddLocus = (palaceId: number) => {
        const name = prompt("Locus Name (e.g., Front Door):");
        if (name) {
            setMemoryPalaces(prev => prev.map(p => p.id === palaceId ? {
                ...p,
                loci: [...p.loci, { id: Date.now(), name, x: 50, y: 50 }]
            } : p));
        }
    };

    const updateLocusPos = (palaceId: number, locusId: number, x: number, y: number) => {
        setMemoryPalaces(prev => prev.map(p => p.id === palaceId ? {
            ...p,
            loci: p.loci.map(l => l.id === locusId ? { ...l, x, y } : l)
        } : p));
    };

    const linkCardToLocus = (palaceId: number, locusId: number) => {
        // In a real app, open a modal to select a card. For now, simple prompt ID
        const cardIdStr = prompt("Enter Card ID to link:"); // Simplified
        if (cardIdStr) {
             setMemoryPalaces(prev => prev.map(p => p.id === palaceId ? {
                ...p,
                loci: p.loci.map(l => l.id === locusId ? { ...l, linkedCardId: parseInt(cardIdStr) } : l)
            } : p));
        }
    };

    // --- Error Log Logic ---
    const failedCards = useMemo(() => {
        const all: { deck: string, card: Flashcard }[] = [];
        decks.forEach(d => {
            d.cards.forEach(c => {
                if (c.status === 'failed' || c.easeFactor < 1.5) {
                    all.push({ deck: d.name, card: c });
                }
            });
        });
        return all;
    }, [decks]);


    const renderPalaceView = () => {
        if (!selectedPalace) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-black/20 p-4 rounded-lg flex items-center justify-center cursor-pointer border border-dashed border-white/20" onClick={handleAddPalace}>
                        + New Memory Palace
                    </div>
                    {memoryPalaces.map(p => (
                        <div key={p.id} className="bg-black/20 p-4 rounded-lg cursor-pointer hover:bg-white/5" onClick={() => setSelectedPalace(p)}>
                            <h4 className="font-bold">{p.name}</h4>
                            <p className="text-xs text-gray-400">{p.loci.length} loci</p>
                        </div>
                    ))}
                </div>
            );
        }

        return (
            <div className="h-full flex flex-col">
                <div className="flex justify-between items-center mb-2">
                    <Button variant="outline" onClick={() => setSelectedPalace(null)}>Back</Button>
                    <h4 className="font-bold">{selectedPalace.name}</h4>
                    <Button onClick={() => handleAddLocus(selectedPalace.id)}>+ Add Locus</Button>
                </div>
                <div className="flex-grow relative bg-slate-800 rounded-lg overflow-hidden border border-white/10">
                    <div className="absolute inset-0 flex items-center justify-center text-white/5 pointer-events-none text-4xl font-bold">
                        (Background Image Placeholder)
                    </div>
                    {selectedPalace.loci.map(locus => (
                         <div
                            key={locus.id}
                            className="absolute w-24 h-24 bg-black/50 border border-white/30 rounded flex flex-col items-center justify-center cursor-move hover:border-accent"
                            style={{ left: `${locus.x}%`, top: `${locus.y}%`, transform: 'translate(-50%, -50%)' }}
                            draggable
                            onDragEnd={(e) => {
                                const parent = e.currentTarget.parentElement?.getBoundingClientRect();
                                if (parent) {
                                    const x = ((e.clientX - parent.left) / parent.width) * 100;
                                    const y = ((e.clientY - parent.top) / parent.height) * 100;
                                    updateLocusPos(selectedPalace.id, locus.id, x, y);
                                }
                            }}
                            onClick={() => linkCardToLocus(selectedPalace.id, locus.id)}
                         >
                            <span className="text-xs font-bold">{locus.name}</span>
                            {locus.linkedCardId && <span className="text-[10px] text-green-400">Linked</span>}
                         </div>
                    ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">Drag loci to position them. Click to link a flashcard.</p>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex border-b border-white/10 mb-4">
                <button onClick={() => setActiveTab('decks')} className={`px-4 py-2 ${activeTab === 'decks' ? 'text-accent border-b-2 border-accent' : 'text-gray-400'}`}>Flashcards (SRS)</button>
                <button onClick={() => setActiveTab('palace')} className={`px-4 py-2 ${activeTab === 'palace' ? 'text-accent border-b-2 border-accent' : 'text-gray-400'}`}>Memory Palace</button>
                <button onClick={() => setActiveTab('errors')} className={`px-4 py-2 ${activeTab === 'errors' ? 'text-accent border-b-2 border-accent' : 'text-gray-400'}`}>Error Log</button>
            </div>
            
            <div className="flex-grow overflow-y-auto">
                {activeTab === 'decks' && <FlashcardManager />}
                {activeTab === 'palace' && renderPalaceView()}
                {activeTab === 'errors' && (
                    <div>
                        <h4 className="font-bold mb-4">Difficult Concepts (Auto-Generated)</h4>
                        {failedCards.length === 0 ? <p className="text-gray-500">No major errors logged yet.</p> : (
                            <div className="space-y-2">
                                {failedCards.map((item, i) => (
                                    <div key={i} className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                                        <p className="text-xs text-red-300 mb-1">{item.deck}</p>
                                        <div className="text-sm" dangerouslySetInnerHTML={{ __html: item.card.q }} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MemoryCenter;
