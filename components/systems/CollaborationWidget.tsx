
import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { ChatMessage } from '../../types';
import { useMobile } from '../../hooks/useMobile';

const CollaborationWidget: React.FC = () => {
    const { chatMessages, setChatMessages } = useAppContext();
    const [activeChannel, setActiveChannel] = useState('#general');
    const [messageInput, setMessageInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);
    const isMobile = useMobile();
    const [showSidebar, setShowSidebar] = useState(true);

    const channels = ['#general', '#notes', '#ideas', '#todos'];

    const filteredMessages = chatMessages.filter(m => m.channel === activeChannel);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [filteredMessages]);

    const sendMessage = () => {
        if (!messageInput.trim()) return;
        
        // Local-only message storage
        const newMessage: ChatMessage = {
            id: Date.now(),
            sender: 'Me',
            content: messageInput,
            timestamp: Date.now(),
            channel: activeChannel,
            isMe: true,
        };
        setChatMessages(prev => [...prev, newMessage]);
        setMessageInput('');
    };

    return (
        <div className="flex h-full gap-4 relative">
             {isMobile && (
                <div className="absolute top-0 right-0 z-10 p-2">
                    <Button variant="glass" className="text-xs" onClick={() => setShowSidebar(!showSidebar)}>{showSidebar ? 'View Chat' : 'View Channels'}</Button>
                </div>
            )}

            {/* Sidebar */}
            <div className={`${showSidebar ? 'flex' : 'hidden'} w-full md:w-48 flex-shrink-0 flex-col border-r border-white/10 pr-2 md:flex`}>
                <h4 className="font-bold text-gray-400 mb-4 px-2">CHANNELS</h4>
                <div className="space-y-1">
                    {channels.map(channel => (
                        <button
                            key={channel}
                            onClick={() => { setActiveChannel(channel); if(isMobile) setShowSidebar(false); }}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${activeChannel === channel ? 'bg-[var(--grad-1)] text-white' : 'text-gray-400 hover:bg-white/5'}`}
                        >
                            {channel}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`${!showSidebar || !isMobile ? 'flex' : 'hidden'} md:flex flex-grow flex-col min-w-0 bg-black/20 rounded-xl overflow-hidden`}>
                <div className="p-3 border-b border-white/10 font-bold text-gray-200">
                    {activeChannel} <span className="text-xs text-gray-500 font-normal">(Local Log)</span>
                </div>
                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                    {filteredMessages.length === 0 && <div className="text-center text-gray-500 text-sm mt-10">No entries in this channel. Start typing to log ideas.</div>}
                    {filteredMessages.map(msg => (
                        <div key={msg.id} className="flex justify-end">
                            <div className="max-w-[85%] md:max-w-[80%] p-3 rounded-xl bg-[var(--grad-1)]/20 text-white rounded-tr-none border border-[var(--grad-1)]/30">
                                <p className="text-sm">{msg.content}</p>
                                <div className="text-[10px] opacity-50 text-right mt-1">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                            </div>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>
                <div className="p-3 border-t border-white/10 flex gap-2 bg-black/40">
                     <Input 
                        value={messageInput} 
                        onChange={e => setMessageInput(e.target.value)} 
                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                        placeholder={`Log entry for ${activeChannel}...`} 
                    />
                     <Button onClick={sendMessage}>Save</Button>
                </div>
            </div>
        </div>
    );
};

export default CollaborationWidget;
