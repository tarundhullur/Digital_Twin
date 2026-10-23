/**
 * GeminiCopilotChat.tsx
 * Multi-turn Gemini AI Clinical Endocrine Co-pilot with Voice Audio (gemini-3.8-flash & gemini-3.8-flash-lite-tts).
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  User,
  Bot,
  Loader2,
  HelpCircle,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

interface GeminiCopilotChatProps {
  patientContext?: any;
}

const PRESET_QUESTIONS = [
  'Why is this patient at risk of an adverse glucose spike (>180 mg/dL)?',
  'What is the physiological mechanism of postprandial walking on GLUT-4?',
  'How does the TCF7L2 genetic risk allele impact insulin secretion?',
  'Provide an evidence-based clinical recommendation for this patient.',
];

export const GeminiCopilotChat: React.FC<GeminiCopilotChatProps> = ({ patientContext }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content: `Hello Doctor. I am your **GlucoTwin Endocrine Co-pilot**. I have analyzed this patient's static EHR and live 5-minute wearable telemetry stream. How can I assist with your clinical assessment or intervention planning today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const queryText = (textToSend || input).trim();
    if (!queryText || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          patientContext,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: data.reply || 'Analysis complete.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: `Error generating clinical copilot response: ${err.message}. Please verify Gemini API connectivity.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Play Speech Audio via gemini-3.8-flash-lite-tts
  const handlePlayVoice = async (textToSpeak: string) => {
    if (isPlayingAudio && audioRef.current) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
      return;
    }

    try {
      setIsPlayingAudio(true);
      const res = await fetch('/api/gemini/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSpeak.replace(/[*#_`]/g, '').slice(0, 300),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audio) {
          const audio = new Audio(data.audio);
          audioRef.current = audio;
          audio.onended = () => setIsPlayingAudio(false);
          audio.onerror = () => setIsPlayingAudio(false);
          await audio.play();
          return;
        }
      }

      // Browser synthesis fallback
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const cleanText = textToSpeak.replace(/[*#_`]/g, '').slice(0, 250);
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.0;
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
      } else {
        setIsPlayingAudio(false);
      }
    } catch {
      if ('speechSynthesis' in window) {
        const cleanText = textToSpeak.replace(/[*#_`]/g, '').slice(0, 250);
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.0;
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
      } else {
        setIsPlayingAudio(false);
      }
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col h-[560px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Gemini Clinical Endocrine Co-pilot</h3>
            <p className="text-[10px] text-slate-400 font-mono">gemini-3.8-flash • Multi-Turn Dialogue</p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
          Digital Twin Grounded
        </span>
      </div>

      {/* Preset Question Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2">
        {PRESET_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={loading}
            className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] text-slate-400 hover:text-cyan-300 transition shrink-0"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Scrollable Message Thread */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div key={m.id} className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  isUser ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-cyan-400 border border-slate-700'
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`max-w-[82%] rounded-2xl p-3.5 space-y-1.5 shadow-sm leading-relaxed ${
                  isUser
                    ? 'bg-cyan-600 text-white rounded-tr-none'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                <div className="flex items-center justify-between gap-4 text-[10px] opacity-70 font-mono">
                  <span>{isUser ? 'You (Clinician)' : 'GlucoTwin Co-pilot'}</span>
                  <span>{m.timestamp}</span>
                </div>

                <div className="whitespace-pre-wrap">{m.content}</div>

                {/* Voice Audio Briefing button for model responses */}
                {!isUser && (
                  <div className="pt-2 border-t border-slate-800/80 flex justify-end">
                    <button
                      onClick={() => handlePlayVoice(m.content)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-[10px] text-cyan-400 font-mono transition"
                    >
                      {isPlayingAudio ? <VolumeX className="w-3 h-3 text-rose-400" /> : <Volume2 className="w-3 h-3" />}
                      <span>{isPlayingAudio ? 'Stop Audio' : 'Voice Briefing (TTS)'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs italic p-2">
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            <span>Consulting clinical endocrine knowledge base...</span>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a clinical question about this digital twin..."
          disabled={loading}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl transition shadow-md shadow-cyan-950"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default GeminiCopilotChat;
