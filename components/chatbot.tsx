"use client"
import { useState, useEffect, useRef } from "react"
import { MessageCircle, X, Send, Bot, User, Sparkles, ShoppingBag, Mic, Volume2, VolumeX } from "lucide-react"
import { useShop, Product } from "@/contexts/shop-context"
import Link from "next/link"
import { useRouter } from "next/navigation"

type Message = {
    id: string
    role: "user" | "bot"
    content: string
    timestamp: Date
    productRecommendation?: Product
    action?: {
        type: "navigate"
        url: string
        label: string
        category?: string
    }
}

export default function Chatbot() {
    const { products, setCategory } = useShop()
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "bot",
            content: "Hi — I'm your Shop Guide. Ask about products, categories, shipping, returns, or say \"login\" to sign in.",
            timestamp: new Date()
        }
    ])
    const [inputValue, setInputValue] = useState("")
    const [isTyping, setIsTyping] = useState(false)
    const [isListening, setIsListening] = useState(false)
    const [isVoiceMode, setIsVoiceMode] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const recognitionRef = useRef<any>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        if (isOpen) {
            setTimeout(scrollToBottom, 100);
        }
    }, [messages, isTyping, isOpen])

    const startListening = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert("Your browser does not support voice input. Try using Chrome or Edge.")
            return
        }

        // If already listening, stop it.
        if (isListening && recognitionRef.current) {
            recognitionRef.current.stop()
            setIsListening(false)
            return
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        const recognition = new SpeechRecognition()
        recognitionRef.current = recognition
        
        recognition.continuous = false
        recognition.interimResults = true

        recognition.onstart = () => setIsListening(true)
        
        recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results)
                .map((result: any) => result[0])
                .map((result: any) => result.transcript)
                .join('')
            
            setInputValue(transcript)
        }

        recognition.onerror = (event: any) => {
            // Ignore common non-critical errors
            if (event.error === 'aborted' || event.error === 'no-speech') {
                setIsListening(false)
                return
            }
            console.warn("Speech recognition error:", event.error)
            setIsListening(false)
        }

        recognition.onend = () => {
            setIsListening(false)
        }

        try {
            recognition.start()
        } catch (e) {
            console.warn("Recognition already started")
        }
    }

    const generateResponse = (text: string) => {
        const lowerText = text.toLowerCase().trim()
        let response = "I'm not quite sure about that. Try asking for a specific product, a category, or 'login' to access your account."
        let recommendedProduct: Product | undefined = undefined
        let action: Message["action"] = undefined

        // Clean input for better matching
        const stopWords = ["do", "you", "have", "the", "a", "an", "is", "show", "me", "any", "some", "i", "want", "looking", "for", "can", "get", "please"]
        const searchPhrase = lowerText.split(/\s+/).filter(w => !stopWords.includes(w)).join(" ")

        // 1. Prioritize Product Matching First
        const exactProduct = products.find(p => p.name.toLowerCase() === lowerText || p.name.toLowerCase() === searchPhrase)
        
        // Find product where the product name contains the search phrase, OR the search phrase contains the product name
        const partialProduct = products.find(p => {
            const pName = p.name.toLowerCase()
            return (searchPhrase.length > 2 && pName.includes(searchPhrase)) || 
                   (pName.length > 2 && searchPhrase.includes(pName)) ||
                   (pName.length > 2 && lowerText.includes(pName))
        })

        const foundProduct = exactProduct || partialProduct

        if (foundProduct) {
            response = `Yes, we have exactly what you're looking for! Check out the ${foundProduct.name}.`
            recommendedProduct = foundProduct
            return { response, recommendedProduct, action } // Early return to prioritize products
        }

        // 2. Dynamic Category Matching
        const uniqueCategories = Array.from(new Set(products.map(p => p.category)))
        const matchedCategory = uniqueCategories.find(c => lowerText.includes(c.toLowerCase()) || searchPhrase.includes(c.toLowerCase()))

        if (matchedCategory) {
            response = `We have an amazing selection in our ${matchedCategory} collection. Let me take you there!`
            action = { type: "navigate", url: "/", label: `View ${matchedCategory}`, category: matchedCategory }
            return { response, recommendedProduct, action }
        }

        // 3. Navigation & System Intents
        if (lowerText.includes("login") || lowerText.includes("sign in") || lowerText.includes("account") || lowerText.includes("dashboard")) {
            response = "You can access your account and the seller dashboard by logging in."
            action = { type: "navigate", url: "/login", label: "Go to Login" }
        } else if (lowerText.includes("shipping") || lowerText.includes("delivery")) {
            response = "We offer free worldwide shipping on all orders! Delivery usually takes 3-5 business days."
        } else if (lowerText.includes("return") || lowerText.includes("refund")) {
            response = "We have a 30-day hassle-free return policy. If you're not completely satisfied, you can return your item for a full refund."
        } else if (lowerText.includes("product") || lowerText.includes("item") || lowerText.includes("buy")) {
            response = "We have a wide range of premium items. Try checking out our latest arrivals on the home page!"
            action = { type: "navigate", url: "/", label: "Browse Store", category: "All" }
        } else if (lowerText.includes("hello") || lowerText.includes("hi") || lowerText.includes("hey")) {
            response = "Hello! How can I assist you with your shopping today?"
        }

        return { response, recommendedProduct, action }
    }

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault()
        if (!inputValue.trim()) return

        const newUserMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: inputValue,
            timestamp: new Date()
        }

        setMessages(prev => [...prev, newUserMessage])
        setInputValue("")
        setIsTyping(true)

        setTimeout(() => {
            const { response, recommendedProduct, action } = generateResponse(newUserMessage.content)
            
            if (isVoiceMode && 'speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(response)
                window.speechSynthesis.speak(utterance)
            }
            
            const newBotMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "bot",
                content: response,
                timestamp: new Date(),
                productRecommendation: recommendedProduct,
                action: action
            }
            
            setMessages(prev => [...prev, newBotMessage])
            setIsTyping(false)
        }, 1200)
    }

    const handleActionClick = (action: NonNullable<Message["action"]>) => {
        setIsOpen(false)
        if (action.category) {
            setCategory(action.category)
        }
        router.push(action.url)
    }

    const handleProductClick = (productId: number) => {
        setIsOpen(false)
        router.push(`/product/${productId}`)
    }

    return (
        <div className="fixed bottom-6 right-6 z-[100]">
            {isOpen && (
                <div className="absolute bottom-20 right-0 w-[350px] sm:w-[400px] h-[600px] max-h-[80vh] bg-[var(--background)] border border-[var(--border-color)] rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-300">
                    <div className="p-5 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--card)]/50 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[var(--foreground)] text-[var(--background)] flex items-center justify-center">
                                <Sparkles size={18} fill="currentColor" />
                            </div>
                            <div>
                                <h3 className="font-black text-[var(--foreground)] leading-none">Shop Guide</h3>
                                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1 mt-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Online
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button 
                                onClick={() => setIsVoiceMode(!isVoiceMode)}
                                className={`p-2 rounded-full transition-all ${isVoiceMode ? 'text-amber-500 bg-amber-500/10' : 'text-[var(--foreground)] opacity-40 hover:opacity-100 hover:bg-[var(--glass-bg)]'}`}
                                title={isVoiceMode ? "Mute Bot" : "Unmute Bot"}
                            >
                                {isVoiceMode ? <Volume2 size={20} /> : <VolumeX size={20} />}
                            </button>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="p-2 text-[var(--foreground)] opacity-40 hover:opacity-100 hover:bg-[var(--glass-bg)] rounded-full transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                <div className={`flex items-end gap-2 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border border-[var(--border-color)] ${msg.role === "user" ? "bg-[var(--glass-bg)]" : "bg-[var(--foreground)] text-[var(--background)]"}`}>
                                        {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}
                                    </div>
                                    <div className={`p-4 rounded-[24px] text-sm leading-relaxed ${
                                        msg.role === "user" 
                                            ? "bg-[var(--foreground)] text-[var(--background)] rounded-br-sm" 
                                            : "bg-[var(--card)] text-[var(--foreground)] border border-[var(--border-color)] rounded-bl-sm"
                                    }`}>
                                        {msg.content}
                                    </div>
                                </div>
                                {msg.productRecommendation && (
                                    <div className="mt-3 ml-10 max-w-[85%] p-3 bg-[var(--card)] border border-[var(--border-color)] rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-500">
                                        <div className="flex items-center gap-3">
                                            <div className="w-16 h-16 bg-[var(--background)] rounded-xl border border-[var(--border-color)] overflow-hidden flex-shrink-0">
                                                <img src={msg.productRecommendation.image} alt={msg.productRecommendation.name} className="w-full h-full object-contain p-2" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold uppercase tracking-widest text-[var(--foreground)] opacity-50 mb-1">Recommended</div>
                                                <div className="font-bold text-[var(--foreground)] text-sm line-clamp-1">{msg.productRecommendation.name}</div>
                                                <div className="font-black text-[var(--foreground)] mt-0.5">${msg.productRecommendation.price}</div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleProductClick(msg.productRecommendation!.id)} 
                                            className="mt-3 w-full py-2 bg-[var(--foreground)] text-[var(--background)] rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-opacity border border-[var(--border-color)] hover:border-transparent"
                                        >
                                            <ShoppingBag size={14} />
                                            View Product
                                        </button>
                                    </div>
                                )}
                                {msg.action && (
                                    <button 
                                        onClick={() => handleActionClick(msg.action!)}
                                        className="mt-3 ml-10 max-w-[85%] py-2.5 px-4 bg-[var(--glass-bg)] text-[var(--foreground)] border border-[var(--border-color)] rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-all animate-in fade-in slide-in-from-bottom-2 duration-500 shadow-sm"
                                    >
                                        {msg.action.label}
                                    </button>
                                )}
                                <span className="text-[9px] font-bold text-[var(--foreground)] opacity-30 mt-1 uppercase tracking-widest px-11">
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex items-start gap-2">
                                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-[var(--foreground)] text-[var(--background)] border border-[var(--border-color)]">
                                    <Bot size={14} />
                                </div>
                                <div className="p-4 bg-[var(--card)] border border-[var(--border-color)] rounded-[24px] rounded-bl-sm flex gap-1.5 items-center h-[52px]">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--foreground)] opacity-40 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--foreground)] opacity-40 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--foreground)] opacity-40 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-5 border-t border-[var(--border-color)] bg-[var(--card)]/50 backdrop-blur-sm">
                        <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
                            <div className="relative flex-1">
                                <input 
                                    type="text" 
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder={isListening ? "Listening..." : "Ask me anything..."} 
                                    className={`w-full bg-[var(--background)] border border-[var(--border-color)] rounded-2xl pl-5 pr-12 py-4 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--foreground)] placeholder:opacity-30 ${isListening ? 'ring-1 ring-rose-500' : ''}`}
                                />
                                <button 
                                    type="button"
                                    onClick={startListening}
                                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${isListening ? 'text-rose-500 bg-rose-500/10 animate-pulse' : 'text-[var(--foreground)] opacity-50 hover:opacity-100'}`}
                                >
                                    <Mic size={16} />
                                </button>
                            </div>
                            <button 
                                type="submit" 
                                disabled={!inputValue.trim() || isTyping}
                                className="w-12 h-12 flex-shrink-0 bg-[var(--foreground)] text-[var(--background)] rounded-2xl flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send size={16} />
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {!isOpen && (
                <button 
                    type="button"
                    onClick={() => setIsOpen(true)}
                    aria-label="Open shop guide"
                    className="w-16 h-16 bg-[var(--foreground)] text-[var(--background)] rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all animate-in zoom-in duration-300 relative"
                >
                    <MessageCircle size={28} />
                    <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 rounded-full border-2 border-[var(--background)] animate-pulse"></span>
                </button>
            )}
        </div>
    )
}
