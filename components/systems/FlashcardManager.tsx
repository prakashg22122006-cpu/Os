
import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Deck, Flashcard } from '../../types';
import RichTextEditor from '../ui/RichTextEditor';
import { addFile, getFile } from '../../utils/db';

// --- HELPER COMPONENTS ---

const ImagePreview: React.FC<{ fileId: number, onRemove?: () => void }> = ({ fileId, onRemove }) => {
    const [url, setUrl] = useState<string | null>(null);
    useEffect(() => {
        let objectUrl: string | null = null;
        getFile(fileId).then(fileData => {
            if (fileData) {
                objectUrl = URL.createObjectURL(fileData.data);
                setUrl(objectUrl);
            }
        });
        return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
    }, [fileId]);

    if (!url) return <div className="text-xs">Loading image...</div>;
    return (
        <div className="relative group w-24 h-16 bg-black/20 rounded-md">
            <img src={url} alt="Flashcard attachment" className="w-full h-full object-contain" />
            {onRemove && <button onClick={onRemove} className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-4 h-4 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">X</button>}
        </div>
    );
};

const CardEditorModal: React.FC<{
    deckName: string;
    card?: Flashcard;
    onSave: (cardData: Omit<Flashcard, 'id' | 'lastReviewed' | 'nextReview' | 'interval' | 'easeFactor' | 'status'> & { id?: number }) => void;
    onClose: () => void;
}> = ({ deckName, card, onSave, onClose }) => {
    const [data, setData] = useState({ q: card?.q || '', a: card?.a || '', q_image_id: card?.q_image_id, a_image_id: card?.a_image_id });
    const qImgRef = useRef<HTMLInputElement>(null);
    const aImgRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (side: 'q' | 'a', e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const fileId = await addFile(file);
            setData(prev => ({ ...prev, [side === 'q' ? 'q_image_id' : 'a_image_id']: fileId }));
        } catch (error) { alert("Failed to save image."); }
    };

    const handleSave = () => {
        if (!data.q.trim() || !data.a.trim()) return alert("Question and Answer cannot be empty.");
        onSave({ id: card?.id, ...data });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gradient-to-b from-[#0e1a32] to-[#0a1524] border border-[#5aa1ff]/20 rounded-xl shadow-2xl w-full max-w-2xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-3 border-b border-white/10">
                    <h4 className="font-semibold text-lg">{card ? 'Edit Card' : 'New Card'} in {deckName}</h4>
                </header>
                <main className="p-4 space-y-4 overflow-y-auto flex-grow flex flex-col">
                    <div className="flex-1 flex flex-col">
                        <label className="font-semibold text-sm mb-1 text-gray-300">Question</label>
                        <RichTextEditor value={data.q} onChange={content => setData(p => ({ ...p, q: content }))} />
                        <div className="flex items-center gap-2 mt-2">
                            <Button variant="outline" className="text-xs" onClick={() => qImgRef.current?.click()}>Add Image</Button>
                            {data.q_image_id && <ImagePreview fileId={data.q_image_id} onRemove={() => setData(p => ({ ...p, q_image_id: undefined }))} />}
                            <input type="file" ref={qImgRef} onChange={e => handleFileChange('q', e)} accept="image/*" className="hidden" />
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col">
                        <label className="font-semibold text-sm mb-1 text-gray-300">Answer</label>
                        <RichTextEditor value={data.a} onChange={content => setData(p => ({ ...p, a: content }))} />
                         <div className="flex items-center gap-2 mt-2">
                            <Button variant="outline" className="text-xs" onClick={() => aImgRef.current?.click()}>Add Image</Button>
                            {data.a_image_id && <ImagePreview fileId={data.a_image_id} onRemove={() => setData(p => ({ ...p, a_image_id: undefined }))} />}
                            <input type="file" ref={aImgRef} onChange={e => handleFileChange('a', e)} accept="image/*" className="hidden" />
                        </div>
                    </div>
                </main>
                <footer className="p-3 flex gap-2 justify-end border-t border-white/10 flex-shrink-0">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save Card</Button>
                </footer>
            </div>
        </div>
    );
};

const StudySessionView: React.FC<{ deck: Deck, onEnd: (updatedCards: Flashcard[]) => void }> = ({ deck, onEnd }) => {
    const [studyQueue, setStudyQueue] = useState<Flashcard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [sessionLog, setSessionLog] = useState<Flashcard[]>([]);

    useEffect(() => {
        const dueCards = deck.cards.filter(c => c.nextReview <= Date.now()).sort(() => Math.random() - 0.5);
        // If no cards are strictly due, maybe add some 'learning' or 'new' ones
        if (dueCards.length === 0) {
            const newCards = deck.cards.filter(c => c.status === 'new').slice(0, 10);
            setStudyQueue(newCards);
        } else {
            setStudyQueue(dueCards);
        }
    }, [deck]);

    const updateCardSRS = (card: Flashcard, rating: 1 | 2 | 3 | 4): Flashcard => {
        let newEaseFactor = card.easeFactor;
        let newInterval = card.interval;
        let newStatus = card.status;

        if (rating < 3) { // Failed or Hard
            newInterval = 1;
            newEaseFactor = Math.max(1.3, card.easeFactor - 0.2);
            newStatus = 'failed';
        } else {
            if (card.status === 'new' || card.status === 'learning' || card.status === 'failed') {
                newInterval = rating === 3 ? 1 : 4;
                newStatus = 'learning';
            } else {
                newInterval = Math.ceil(card.interval * card.easeFactor);
                newStatus = 'review';
            }
            newEaseFactor = card.easeFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
            if (newEaseFactor < 1.3) newEaseFactor = 1.3;
        }

        return {
            ...card,
            status: newStatus,
            interval: newInterval,
            easeFactor: newEaseFactor,
            lastReviewed: Date.now(),
            nextReview: Date.now() + newInterval * 24 * 60 * 60 * 1000,
        };
    };

    const handleAnswer = (rating: 1 | 2 | 3 | 4) => {
        const currentCard = studyQueue[currentIndex];
        const updatedCard = updateCardSRS(currentCard, rating);
        setSessionLog(prev => [...prev, updatedCard]);
        setIsFlipped(false);
        if (currentIndex < studyQueue.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            // End of queue
            onEnd(sessionLog.concat(updatedCard));
        }
    };
    
    const handleExit = () => onEnd(sessionLog);

    if (studyQueue.length === 0) {
        return (
            <div className="fixed inset-0 bg-[#071023] z-50 flex flex-col items-center justify-center p-4 text-center">
                <h2 className="text-2xl font-bold mb-4">All done!</h2>
                <p className="mb-6">There are no cards due for review in this deck right now.</p>
                <Button onClick={() => onEnd([])}>Back to Decks</Button>
            </div>
        );
    }
    
    const card = studyQueue[currentIndex];
    
    return (
        <div className="fixed inset-0 bg-[#071023] z-50 flex flex-col items-center justify-center p-4">
            <div className="absolute top-4 left-4 text-sm font-semibold">{currentIndex + 1} / {studyQueue.length}</div>
            <Button onClick={handleExit} className="absolute top-4 right-4">End Session</Button>

            <div className="w-full max-w-2xl h-96 perspective-[1000px]">
                <div className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                    {/* Front */}
                    <div className="absolute w-full h-full bg-slate-800 rounded-xl p-6 flex flex-col items-center justify-center backface-hidden">
                        <div className="prose prose-invert text-center" dangerouslySetInnerHTML={{ __html: card.q }} />
                        {card.q_image_id && <div className="mt-4 max-h-40"><ImagePreview fileId={card.q_image_id} /></div>}
                    </div>
                    {/* Back */}
                    <div className="absolute w-full h-full bg-slate-700 rounded-xl p-6 flex flex-col items-center justify-center rotate-y-180 backface-hidden">
                        <div className="prose prose-invert text-center" dangerouslySetInnerHTML={{ __html: card.a }} />
                        {card.a_image_id && <div className="mt-4 max-h-40"><ImagePreview fileId={card.a_image_id} /></div>}
                    </div>
                </div>
            </div>

            <div className="mt-8">
                {isFlipped ? (
                    <div className="grid grid-cols-4 gap-4 w-full max-w-md">
                        <Button onClick={() => handleAnswer(1)} className="bg-red-500/80 hover:bg-red-500">Again (1)</Button>
                        <Button onClick={() => handleAnswer(2)} className="bg-yellow-500/80 hover:bg-yellow-500">Hard (2)</Button>
                        <Button onClick={() => handleAnswer(3)} className="bg-blue-500/80 hover:bg-blue-500">Good (3)</Button>
                        <Button onClick={() => handleAnswer(4)} className="bg-green-500/80 hover:bg-green-500">Easy (4)</Button>
                    </div>
                ) : (
                    <Button onClick={() => setIsFlipped(true)} className="px-12 py-4">Show Answer</Button>
                )}
            </div>
        </div>
    );
};


// --- MAIN COMPONENT ---

const FlashcardManager: React.FC = () => {
    const { decks, setDecks } = useAppContext();
    const [newDeckName, setNewDeckName] = useState('');
    const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
    const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
    const [studyingDeck, setStudyingDeck] = useState<Deck | null>(null);

    const addDeck = () => {
        if (!newDeckName.trim()) return;
        setDecks(prev => [{ name: newDeckName, cards: [] }, ...prev]);
        setNewDeckName('');
    };

    const deleteDeck = (name: string) => {
        if (window.confirm(`Delete deck "${name}"? All cards within will be lost.`)) {
            setDecks(prev => prev.filter(d => d.name !== name));
        }
    };

    const handleSaveCard = (cardData: Omit<Flashcard, 'id' | 'lastReviewed' | 'nextReview' | 'interval' | 'easeFactor' | 'status'> & { id?: number }) => {
        if (!editingDeck) return;

        setDecks(prev => prev.map(deck => {
            if (deck.name === editingDeck.name) {
                let newCards;
                if (cardData.id) { // Update
                    newCards = deck.cards.map(c => c.id === cardData.id ? { ...c, ...cardData } : c);
                } else { // Create
                    const newCard: Flashcard = {
                        ...cardData,
                        id: Date.now(),
                        lastReviewed: undefined,
                        nextReview: Date.now(),
                        interval: 0,
                        easeFactor: 2.5,
                        status: 'new',
                    };
                    newCards = [newCard, ...deck.cards];
                }
                return { ...deck, cards: newCards };
            }
            return deck;
        }));
    };
    
    const handleDeleteCard = (cardId: number) => {
        if (!editingDeck) return;
        setDecks(prev => prev.map(deck => {
             if (deck.name === editingDeck.name) {
                return { ...deck, cards: deck.cards.filter(c => c.id !== cardId) };
             }
             return deck;
        }));
    };
    
    const handleEndStudySession = (updatedCards: Flashcard[]) => {
        if (updatedCards.length > 0 && studyingDeck) {
            const updatedCardMap = new Map(updatedCards.map(c => [c.id, c]));
            setDecks(prev => prev.map(deck => {
                if (deck.name === studyingDeck.name) {
                    return { ...deck, cards: deck.cards.map(c => updatedCardMap.get(c.id) || c) };
                }
                return deck;
            }));
        }
        setStudyingDeck(null);
    };

    const deckStats = (deck: Deck) => {
        const now = Date.now();
        return {
            new: deck.cards.filter(c => c.status === 'new').length,
            learning: deck.cards.filter(c => c.status === 'learning').length,
            review: deck.cards.filter(c => c.status === 'review' && c.nextReview <= now).length,
            failed: deck.cards.filter(c => c.status === 'failed').length,
        };
    };

    if (studyingDeck) {
        return <StudySessionView deck={studyingDeck} onEnd={handleEndStudySession} />;
    }

    return (
        <>
            <div className="flex gap-2 mb-2">
                <Input value={newDeckName} onChange={e => setNewDeckName(e.target.value)} placeholder="New deck name..." />
                <Button onClick={addDeck}>Add Deck</Button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {decks.length === 0 ? <p className="text-[#9fb3cf]">No decks created yet.</p> :
                    decks.map((deck) => {
                        const stats = deckStats(deck);
                        const isEditingThis = editingDeck?.name === deck.name;
                        return (
                            <div key={deck.name} className="bg-black/20 p-3 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h4 className="font-semibold text-lg">{deck.name}</h4>
                                        <div className="flex gap-4 text-xs text-gray-400">
                                            <span>New: {stats.new}</span>
                                            <span>Learn: {stats.learning}</span>
                                            <span>Due: {stats.review}</span>
                                            {stats.failed > 0 && <span className="text-red-400">Failed: {stats.failed}</span>}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button onClick={() => setStudyingDeck(deck)} disabled={deck.cards.length === 0}>Study</Button>
                                        <Button variant="outline" onClick={() => setEditingDeck(isEditingThis ? null : deck)}>{isEditingThis ? 'Close' : 'Manage'}</Button>
                                        <Button variant="outline" className="text-red-400" onClick={() => deleteDeck(deck.name)}>Del</Button>
                                    </div>
                                </div>
                                {isEditingThis && (
                                    <div className="mt-4 border-t border-white/10 pt-4">
                                        <Button onClick={() => setEditingCard({} as Flashcard)} className="mb-2">+ New Card</Button>
                                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                            {deck.cards.map(card => (
                                                <div key={card.id} className="flex justify-between items-center p-2 bg-white/5 rounded-md">
                                                    <div className="truncate text-sm" dangerouslySetInnerHTML={{ __html: card.q }} />
                                                    <div className="flex gap-2">
                                                        <Button variant="outline" className="text-xs !p-1" onClick={() => setEditingCard(card)}>Edit</Button>
                                                        <Button variant="outline" className="text-xs !p-1" onClick={() => handleDeleteCard(card.id)}>Del</Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
            </div>
            {editingDeck && editingCard && <CardEditorModal deckName={editingDeck.name} card={editingCard.id ? editingCard : undefined} onSave={handleSaveCard} onClose={() => setEditingCard(null)} />}
        </>
    );
};

export default FlashcardManager;
