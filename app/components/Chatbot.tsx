import { useState, useRef, useEffect } from "react";
import { usePuterStore } from "~/lib/puter";
import { cn } from "~/lib/utils";

interface ChatbotProps {
    feedback: Feedback;
    jobTitle?: string;
    jobDescription?: string;
}

const Chatbot = ({ feedback, jobTitle, jobDescription }: ChatbotProps) => {
    const { ai } = usePuterStore();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen, isLoading]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: "user", content: input };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput("");
        setIsLoading(true);

        try {
            const systemMessage: ChatMessage = {
                role: "system",
                content: `You are a senior career advisor and ATS expert helping a user improve their resume.
                Based on a detailed AI analysis of their resume, here is the context:
                
                Overall Score: ${feedback.overallScore}/100
                ATS Score: ${feedback.ATS.score}/100
                Tone & Style Score: ${feedback.toneAndStyle.score}/100
                Content Score: ${feedback.content.score}/100
                Structure Score: ${feedback.structure.score}/100
                Skills Score: ${feedback.skills.score}/100

                Detailed feedback from the analysis:
                ATS Tips: ${feedback.ATS.tips.map(t => `[${t.type}] ${t.tip}`).join(" | ")}
                Tone & Style Tips: ${feedback.toneAndStyle.tips.map(t => `[${t.type}] ${t.tip}: ${t.explanation}`).join(" | ")}
                Content Tips: ${feedback.content.tips.map(t => `[${t.type}] ${t.tip}: ${t.explanation}`).join(" | ")}
                Structure Tips: ${feedback.structure.tips.map(t => `[${t.type}] ${t.tip}: ${t.explanation}`).join(" | ")}
                Skills Tips: ${feedback.skills.tips.map(t => `[${t.type}] ${t.tip}: ${t.explanation}`).join(" | ")}

                The user is applying for:
                Job Title: ${jobTitle || "Not specified"}
                Job Description: ${jobDescription || "Not specified"}

                GUIDELINES:
                1. NO HALLUCINATION: Only provide advice based on the feedback data and job details above. Do not invent details about the user's resume.
                2. BE SPECIFIC: Reference actual scores, tip text, and job description requirements. Never give vague advice like "improve your resume" — instead say exactly what to change and how.
                3. ACTIONABLE REWRITES: When the user asks how to improve something, provide concrete rewritten bullet points, skill descriptions, or section suggestions they can copy-paste.
                4. CONCISENESS: Keep answers focused. Use bullet points for multiple suggestions. Avoid unnecessary filler.
                5. KEYWORD GUIDANCE: If asked about skills or ATS, reference specific keywords from the job description that are missing or present.`
            };

            // Only send the last few messages to keep it efficient, but always include system message
            const messagesToSend = [systemMessage, ...newMessages.slice(-10)];

            const response = await ai.chat(messagesToSend, { model: 'gpt-4o' });

            if (response && response.message) {
                const assistantMessage: ChatMessage = {
                    role: "assistant",
                    content: typeof response.message.content === 'string'
                        ? response.message.content
                        : Array.isArray(response.message.content)
                            ? (response.message.content[0]?.text || JSON.stringify(response.message.content))
                            : JSON.stringify(response.message.content)
                };
                setMessages(prev => [...prev, assistantMessage]);
            }
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        setInput(suggestion);
        // Auto-send the suggestion after setting it
        const userMessage: ChatMessage = { role: "user", content: suggestion };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        (async () => {
            try {
                const systemMessage: ChatMessage = {
                    role: "system",
                    content: `You are a senior career advisor and ATS expert helping a user improve their resume.
                    Based on a detailed AI analysis of their resume, here is the context:
                    
                    Overall Score: ${feedback.overallScore}/100
                    ATS Score: ${feedback.ATS.score}/100
                    Tone & Style Score: ${feedback.toneAndStyle.score}/100
                    Content Score: ${feedback.content.score}/100
                    Structure Score: ${feedback.structure.score}/100
                    Skills Score: ${feedback.skills.score}/100

                    Detailed feedback from the analysis:
                    ATS Tips: ${feedback.ATS.tips.map(t => `[${t.type}] ${t.tip}`).join(" | ")}
                    Tone & Style Tips: ${feedback.toneAndStyle.tips.map(t => `[${t.type}] ${t.tip}: ${t.explanation}`).join(" | ")}
                    Content Tips: ${feedback.content.tips.map(t => `[${t.type}] ${t.tip}: ${t.explanation}`).join(" | ")}
                    Structure Tips: ${feedback.structure.tips.map(t => `[${t.type}] ${t.tip}: ${t.explanation}`).join(" | ")}
                    Skills Tips: ${feedback.skills.tips.map(t => `[${t.type}] ${t.tip}: ${t.explanation}`).join(" | ")}

                    The user is applying for:
                    Job Title: ${jobTitle || "Not specified"}
                    Job Description: ${jobDescription || "Not specified"}

                    GUIDELINES:
                    1. NO HALLUCINATION: Only provide advice based on the feedback data and job details above. Do not invent details about the user's resume.
                    2. BE SPECIFIC: Reference actual scores, tip text, and job description requirements.
                    3. ACTIONABLE REWRITES: When the user asks how to improve something, provide concrete rewritten bullet points or section suggestions.
                    4. CONCISENESS: Keep answers focused. Use bullet points for multiple suggestions.
                    5. KEYWORD GUIDANCE: If asked about skills or ATS, reference specific keywords from the job description.`
                };

                const messagesToSend = [systemMessage, userMessage];
                const response = await ai.chat(messagesToSend, { model: 'gpt-4o' });

                if (response && response.message) {
                    const assistantMessage: ChatMessage = {
                        role: "assistant",
                        content: typeof response.message.content === 'string'
                            ? response.message.content
                            : Array.isArray(response.message.content)
                                ? (response.message.content[0]?.text || JSON.stringify(response.message.content))
                                : JSON.stringify(response.message.content)
                    };
                    setMessages(prev => [...prev, assistantMessage]);
                }
            } catch (error) {
                console.error("Chat error:", error);
                setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
            } finally {
                setIsLoading(false);
                setInput("");
            }
        })();
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {isOpen && (
                <div className="bg-white rounded-2xl shadow-2xl w-[90vw] sm:w-96 h-[500px] flex flex-col mb-4 overflow-hidden border border-gray-100 animate-in slide-in-from-bottom-5 duration-300" role="dialog" aria-label="Resume Assistant Chat">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex justify-between items-center shadow-md">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            <h3 className="text-white font-bold text-sm">Resume Assistant</h3>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
                            aria-label="Close chat"
                        >
                            <img src="/icons/cross.svg" alt="Close" className="w-4 h-4 invert" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
                                <div className="bg-blue-100 p-3 rounded-full">
                                    <img src="/icons/info.svg" alt="Info" className="w-8 h-8 opacity-50" />
                                </div>
                                <div>
                                    <p className="text-gray-800 font-semibold text-sm">How can I help you today?</p>
                                    <p className="text-gray-500 text-xs mt-1">Ask me anything about your ATS score, resume content, or how to better match the job description.</p>
                                </div>
                                <div className="flex flex-wrap justify-center gap-2 mt-2">
                                    {[
                                        "How can I improve my ATS score?",
                                        "Explain Tone & Style feedback",
                                        "What skills am I missing?"
                                    ].map((suggestion) => (
                                        <button
                                            key={suggestion}
                                            onClick={() => handleSuggestionClick(suggestion)}
                                            disabled={isLoading}
                                            className="text-[10px] bg-white border border-gray-200 rounded-full px-3 py-1 hover:border-blue-500 hover:text-blue-500 transition-colors shadow-sm disabled:opacity-50"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <div key={i} className={cn(
                                "max-w-[85%] p-3 rounded-2xl text-sm shadow-sm",
                                msg.role === "user"
                                    ? "bg-blue-600 text-white self-end ml-auto rounded-tr-none"
                                    : "bg-white border border-gray-100 text-gray-800 self-start rounded-tl-none"
                            )}>
                                {typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="bg-white border border-gray-100 text-gray-800 self-start p-3 rounded-2xl rounded-tl-none text-sm shadow-sm flex gap-1">
                                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
                                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2 items-center">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your question..."
                            maxLength={500}
                            aria-label="Chat message input"
                            className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            aria-label="Send message"
                            className="bg-blue-600 text-white rounded-xl p-2.5 disabled:opacity-50 transition-all hover:bg-blue-700 active:scale-95 shadow-lg shadow-blue-500/30"
                        >
                            <img src="/icons/check.svg" alt="Send" className="w-4 h-4 invert" />
                        </button>
                    </form>
                </div>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-xl transition-all hover:scale-110 active:scale-95 flex items-center justify-center relative",
                    isOpen && "bg-gray-800 hover:bg-gray-900 shadow-none"
                )}
            >
                {isOpen ? (
                    <img src="/icons/cross.svg" alt="Close" className="w-6 h-6 invert" />
                ) : (
                    <>
                        <img src="/icons/info.svg" alt="Help" className="w-6 h-6 invert" />
                        <span className="absolute -top-1 -right-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 border-2 border-white"></span>
                        </span>
                    </>
                )}
            </button>
        </div>
    );
};

export default Chatbot;
