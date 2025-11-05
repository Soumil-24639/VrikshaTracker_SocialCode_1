import React, { useState, useRef, useEffect } from 'react';
import { getAiChatResponse } from '../services/geminiService';
import { CameraIcon, PaperAirplaneIcon, SparklesIcon, XIcon } from './icons';

interface Message {
    sender: 'user' | 'ai';
    text: string;
    imageUrl?: string;
}

export const AIChatBot: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        { sender: 'ai', text: "Hello! I'm Vriksha, your plant care assistant. How can I help you today? Feel free to upload a photo of your sapling." }
    ]);
    const [userInput, setUserInput] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const trimmedInput = userInput.trim();
        if (!trimmedInput && !imageFile) return;

        setIsLoading(true);
        const userMessage: Message = { sender: 'user', text: trimmedInput };
        if (imagePreview) {
            userMessage.imageUrl = imagePreview;
        }
        setMessages(prev => [...prev, userMessage]);
        
        const response = await getAiChatResponse(trimmedInput, imageFile ?? undefined);
        
        setMessages(prev => [...prev, { sender: 'ai', text: response }]);
        
        setUserInput('');
        removeImage();
        setIsLoading(false);
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 h-full">
            <div className="bg-glass border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-lg flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-end gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${msg.sender === 'ai' ? 'bg-forest-green' : 'bg-gray-500 dark:bg-gray-600'}`}>
                               {msg.sender === 'ai' ? <SparklesIcon className="w-6 h-6 text-white"/> : <span className="font-bold text-white">{msg.sender.charAt(0).toUpperCase()}</span>}
                            </div>
                            <div className={`max-w-md lg:max-w-2xl rounded-xl px-4 py-3 shadow-sm ${msg.sender === 'ai' ? 'bg-white/80 dark:bg-[#4A6572] text-gray-800 dark:text-white' : 'bg-gradient-start text-white'}`}>
                                {msg.imageUrl && <img src={msg.imageUrl} alt="User upload" className="rounded-lg mb-2 max-h-48" />}
                                <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex items-end gap-3">
                            <div className="w-10 h-10 rounded-full bg-forest-green flex-shrink-0 flex items-center justify-center">
                               <SparklesIcon className="w-6 h-6 text-white animate-pulse"/>
                            </div>
                            <div className="max-w-md lg:max-w-2xl rounded-xl px-4 py-3 bg-white/80 dark:bg-[#4A6572] text-gray-800 dark:text-white">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-mint-green rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-mint-green rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-mint-green rounded-full animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-4 border-t border-gray-200/50 dark:border-[#4A6572]/50">
                    <form onSubmit={handleSubmit} className="flex items-center gap-3">
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-[#4A6572]/50 transition-colors">
                            <CameraIcon className="w-6 h-6"/>
                        </button>
                        <div className="flex-1 relative">
                            {imagePreview && (
                                <div className="absolute bottom-14 left-0 bg-black/70 p-1 rounded-lg backdrop-blur-sm">
                                    <img src={imagePreview} alt="Preview" className="h-16 w-16 object-cover rounded"/>
                                    <button type="button" onClick={removeImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5">
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                             <input
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                placeholder="Ask about your sapling..."
                                className="w-full bg-gray-100/50 dark:bg-[#2C3E50]/50 border border-gray-300/50 dark:border-[#4A6572]/50 rounded-full py-3 px-5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-forest-green"
                                disabled={isLoading}
                            />
                        </div>
                        <button type="submit" disabled={isLoading || (!userInput.trim() && !imageFile)} className="p-3 bg-forest-green rounded-full text-white hover:bg-gradient-end disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors">
                            <PaperAirplaneIcon className="w-6 h-6" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
