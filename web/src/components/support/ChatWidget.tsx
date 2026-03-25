'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

export const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [socket, setSocket] = useState<Socket | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && !socket) {
            const s = io('http://localhost:5000', {
                auth: { token: localStorage.getItem('token') }
            });

            s.on('connect', () => {
                s.emit('joinSupport', { userId: 'guest' }); // In real app, get from auth context
            });

            s.on('newSupportMessage', (msg) => {
                setMessages(prev => [...prev, msg]);
            });

            setSocket(s);
        }

        return () => {
            if (socket) socket.disconnect();
        };
    }, [isOpen]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = () => {
        if (!input.trim() || !socket) return;

        const newMessage = {
            content: input,
            isAdmin: false,
            createdAt: new Date()
        };

        socket.emit('sendSupportMessage', { content: input });
        setMessages(prev => [...prev, newMessage]);
        setInput('');
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {isOpen ? (
                <div className="bg-white rounded-2xl shadow-2xl w-80 sm:w-96 flex flex-col overflow-hidden border">
                    <div className="bg-[#415e34] p-4 text-white flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                <User size={18} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">GroceNest Support</h3>
                                <p className="text-[10px] opacity-80 uppercase tracking-tighter">Live Chat</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded">
                            <X size={20} />
                        </button>
                    </div>

                    <div ref={scrollRef} className="flex-1 h-96 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {messages.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-sm text-gray-400">👋 How can we help you today?</p>
                            </div>
                        )}
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.isAdmin ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                                    m.isAdmin ? 'bg-white border text-gray-800 rounded-tl-none' : 'bg-[#f97316] text-white rounded-tr-none'
                                }`}>
                                    {m.content}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 border-t bg-white flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Type a message..."
                            className="flex-1 text-sm bg-gray-100 rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#415e34]"
                        />
                        <button 
                            onClick={handleSend}
                            className="bg-[#415e34] text-white p-2 rounded-full hover:bg-[#344d2a] transition-colors"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-[#415e34] text-white p-4 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center justify-center"
                >
                    <MessageCircle size={24} />
                </button>
            )}
        </div>
    );
};
