import React, { useState, useEffect, useRef } from 'react';
import { Message, Sender, AppView, UserStats, Lesson, ChatContext } from './types';
import { generateConversationResponse, generateGrammarCorrection, generateSpeech, playAudioBuffer } from './services/geminiService';
import AudioVisualizer from './components/AudioVisualizer';
import {
  Mic, Send, Home, User, Zap, Lock, Play, CheckCircle,
  Volume2, Award, Flame, MessageSquare, ChevronRight, X, Globe
} from 'lucide-react';

// --- Initial Data ---

const INITIAL_USER: UserStats = {
  streak: 12,
  xp: 2450,
  level: 4,
  gems: 340
};

const LESSONS: Lesson[] = [
  { id: '1', title: 'Ordering Coffee', description: 'Learn how to order drinks politely.', icon: '☕', color: 'bg-amber-100 text-amber-600', completed: true, locked: false },
  { id: '2', title: 'Introductions', description: 'Meet new people and say hello.', icon: '👋', color: 'bg-blue-100 text-blue-600', completed: true, locked: false },
  { id: '3', title: 'At the Airport', description: 'Navigate terminals and gates.', icon: '✈️', color: 'bg-indigo-100 text-indigo-600', completed: false, locked: false },
  { id: '4', title: 'Restaurant', description: 'Ordering food and asking for the bill.', icon: '🍝', color: 'bg-orange-100 text-orange-600', completed: false, locked: true },
  { id: '5', title: 'Directions', description: 'Ask where the library is.', icon: '🗺️', color: 'bg-green-100 text-green-600', completed: false, locked: true },
];

// --- Components ---

const BottomNav: React.FC<{ current: AppView; onNavigate: (view: AppView) => void }> = ({ current, onNavigate }) => (
  <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center pb-safe z-50">
    <button onClick={() => onNavigate(AppView.HOME)} className={`flex flex-col items-center ${current === AppView.HOME ? 'text-indigo-600' : 'text-gray-400'}`}>
      <Home size={24} strokeWidth={current === AppView.HOME ? 2.5 : 2} />
      <span className="text-xs mt-1 font-medium">Home</span>
    </button>
    <button onClick={() => onNavigate(AppView.CHAT)} className={`flex flex-col items-center ${current === AppView.CHAT ? 'text-indigo-600' : 'text-gray-400'}`}>
      <div className={`p-3 rounded-full -mt-8 border-4 border-gray-50 ${current === AppView.CHAT ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-900 text-white'}`}>
        <MessageSquare size={24} fill="currentColor" />
      </div>
      <span className="text-xs mt-1 font-medium">Practice</span>
    </button>
    <button onClick={() => onNavigate(AppView.PROFILE)} className={`flex flex-col items-center ${current === AppView.PROFILE ? 'text-indigo-600' : 'text-gray-400'}`}>
      <User size={24} strokeWidth={current === AppView.PROFILE ? 2.5 : 2} />
      <span className="text-xs mt-1 font-medium">Profile</span>
    </button>
  </div>
);

const Header: React.FC<{ stats: UserStats; onPremium: () => void }> = ({ stats, onPremium }) => (
  <div className="bg-white sticky top-0 z-40 border-b border-gray-100 px-4 py-3 flex justify-between items-center shadow-sm">
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-full border border-orange-100">
        <Flame size={16} className="text-orange-500 fill-orange-500" />
        <span className="text-orange-600 font-bold text-sm">{stats.streak}</span>
      </div>
      <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
        <Award size={16} className="text-blue-500" />
        <span className="text-blue-600 font-bold text-sm">{stats.gems}</span>
      </div>
    </div>
    <button onClick={onPremium} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-md active:scale-95 transition-transform">
      <Zap size={12} fill="currentColor" />
      <span>PRO</span>
    </button>
  </div>
);

const PremiumModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl transform transition-all slide-in-from-bottom-10">
      <div className="flex justify-between items-center mb-6">
        <div className="bg-yellow-100 p-2 rounded-full">
          <Zap className="text-yellow-600" size={24} fill="currentColor" />
        </div>
        <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
          <X size={20} className="text-gray-600" />
        </button>
      </div>
      
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Unlock LingoFlow Super</h2>
      <p className="text-slate-500 mb-6">Master a language 4x faster with unlimited AI conversations and detailed feedback.</p>
      
      <div className="space-y-3 mb-8">
        <div className="flex items-center gap-3">
          <CheckCircle className="text-green-500" size={20} />
          <span className="font-medium text-slate-700">Unlimited AI Chat</span>
        </div>
        <div className="flex items-center gap-3">
          <CheckCircle className="text-green-500" size={20} />
          <span className="font-medium text-slate-700">Instant Grammar Correction</span>
        </div>
        <div className="flex items-center gap-3">
          <CheckCircle className="text-green-500" size={20} />
          <span className="font-medium text-slate-700">Real-time Voice Mode</span>
        </div>
        <div className="flex items-center gap-3">
          <CheckCircle className="text-green-500" size={20} />
          <span className="font-medium text-slate-700">No Ads</span>
        </div>
      </div>

      <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 mb-3 hover:bg-indigo-700 transition-colors">
        Start 7-Day Free Trial
      </button>
      <p className="text-center text-xs text-slate-400">Then $12.99/month. Cancel anytime.</p>
    </div>
  </div>
);

const LessonCard: React.FC<{ lesson: Lesson; onClick: () => void }> = ({ lesson, onClick }) => (
  <div 
    onClick={() => !lesson.locked && onClick()}
    className={`relative flex items-center gap-4 p-4 rounded-2xl border-b-4 transition-transform active:scale-95 cursor-pointer
      ${lesson.locked 
        ? 'bg-gray-50 border-gray-200 opacity-70' 
        : 'bg-white border-gray-200 hover:border-indigo-200 shadow-sm'}`}
  >
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${lesson.locked ? 'bg-gray-200 grayscale' : lesson.color}`}>
      {lesson.locked ? <Lock size={20} className="text-gray-400" /> : lesson.icon}
    </div>
    <div className="flex-1">
      <h3 className={`font-bold text-lg ${lesson.locked ? 'text-gray-400' : 'text-slate-800'}`}>{lesson.title}</h3>
      <p className="text-xs text-gray-500 line-clamp-1">{lesson.description}</p>
    </div>
    {lesson.completed ? (
      <div className="bg-green-100 p-2 rounded-full">
        <CheckCircle size={20} className="text-green-600" fill="currentColor" />
      </div>
    ) : !lesson.locked ? (
      <div className="bg-indigo-600 p-2 rounded-full text-white shadow-md shadow-indigo-200">
        <Play size={20} fill="currentColor" />
      </div>
    ) : null}
  </div>
);

const ChatMessageBubble: React.FC<{ msg: Message; isLast: boolean }> = ({ msg, isLast }) => {
  const [showCorrection, setShowCorrection] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = async () => {
    if(isPlaying) return;
    setIsPlaying(true);
    try {
      const { buffer, ctx } = await generateSpeech(msg.text);
      const source = playAudioBuffer(buffer, ctx);
      source.onended = () => setIsPlaying(false);
    } catch (e) {
      console.error(e);
      setIsPlaying(false);
    }
  };

  return (
    <div className={`flex flex-col gap-1 mb-6 ${msg.sender === Sender.USER ? 'items-end' : 'items-start'}`}>
      <div className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-sm relative group
        ${msg.sender === Sender.USER 
          ? 'bg-indigo-600 text-white rounded-br-none' 
          : 'bg-white text-slate-800 border border-gray-100 rounded-bl-none'}`}>
        
        <p className="text-[17px] leading-relaxed">{msg.text}</p>

        {/* Actions for AI Messages */}
        {msg.sender === Sender.AI && (
           <button 
             onClick={handlePlay}
             className="absolute -right-10 top-1/2 -translate-y-1/2 p-2 bg-white rounded-full shadow-sm text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
           >
             {isPlaying ? <AudioVisualizer isActive={true} /> : <Volume2 size={18} />}
           </button>
        )}
      </div>

      {/* Grammar correction suggestion (simulated availability) */}
      {msg.sender === Sender.USER && msg.correction && (
        <div className="max-w-[80%] bg-orange-50 border border-orange-100 rounded-xl p-3 mt-1 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-2 cursor-pointer" onClick={() => setShowCorrection(!showCorrection)}>
            <div className="bg-orange-100 p-1 rounded text-orange-600 mt-0.5">
              <Zap size={12} fill="currentColor" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-orange-800 mb-1">Suggestion</p>
              {showCorrection ? (
                 <div className="text-sm text-orange-900">
                   <span className="line-through opacity-50 block text-xs">{msg.text}</span>
                   <span className="font-medium">{JSON.parse(msg.correction).corrected}</span>
                 </div>
              ) : (
                <p className="text-xs text-orange-600">Tap to see how to say this naturally.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Main App Component ---

export default function App() {
  const [view, setView] = useState<AppView>(AppView.HOME);
  const [showPremium, setShowPremium] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>(INITIAL_USER);
  const [context, setContext] = useState<ChatContext>({ language: 'Spanish', level: 'Beginner', topic: 'General' });
  
  // Chat State
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', text: "Hola! Soy tu tutor de español. ¿Cómo estás hoy?", sender: Sender.AI, timestamp: Date.now() }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: Sender.USER,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // 1. Analyze Grammar (Parallel)
    const grammarPromise = generateGrammarCorrection(userMsg.text, context.language);
    
    // 2. Get AI Response
    const history = messages.map(m => ({
      role: m.sender === Sender.USER ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    try {
      const aiText = await generateConversationResponse(history, userMsg.text, context);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: aiText,
        sender: Sender.AI,
        timestamp: Date.now()
      };

      // Update UI with AI Response
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
      
      // Play Audio automatically for immersion (optional, better UX usually requires click)
      // generateSpeech(aiText).then(({buffer, ctx}) => playAudioBuffer(buffer, ctx));

      // Handle Grammar result
      const correctionData = await grammarPromise;
      if (correctionData && correctionData.hasMistake) {
        setMessages(prev => prev.map(m => 
          m.id === userMsg.id ? { ...m, correction: JSON.stringify(correctionData) } : m
        ));
      }

    } catch (error) {
      console.error(error);
      setIsTyping(false);
    }
  };

  // Simulating Voice Recording (Web Speech API not used to keep it purely React/Gemini centered, simplified UI)
  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      // In a real app, we'd start MediaRecorder here
      // For prototype, we simulate listening
      setTimeout(() => {
        setIsRecording(false);
        setInputText("Me gustaría un café con leche por favor"); // Simulated speech-to-text
      }, 2000);
    } else {
      setIsRecording(false);
    }
  };

  const startLesson = (lesson: Lesson) => {
    setContext(prev => ({ ...prev, topic: lesson.title }));
    setMessages([{ id: Date.now().toString(), text: `Vamos a practicar: ${lesson.title}. ${lesson.description} ¿Listo?`, sender: Sender.AI, timestamp: Date.now() }]);
    setView(AppView.CHAT);
  };

  // Render Views
  const renderHome = () => (
    <div className="pb-24 pt-4 px-4 space-y-6 animate-in fade-in duration-300">
      <div className="bg-indigo-600 text-white p-6 rounded-3xl shadow-lg shadow-indigo-200 relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-indigo-200 text-sm font-medium mb-1">Daily Goal</p>
          <h2 className="text-3xl font-bold mb-4">Learn Spanish</h2>
          <div className="flex items-center gap-3">
            <div className="h-2 flex-1 bg-indigo-900/30 rounded-full overflow-hidden">
              <div className="h-full bg-white w-[65%] rounded-full"></div>
            </div>
            <span className="font-bold">65%</span>
          </div>
        </div>
        <Globe className="absolute -right-4 -bottom-4 text-indigo-500 opacity-50" size={140} />
      </div>

      <div>
        <h3 className="font-bold text-xl text-slate-800 mb-4 px-1">Your Path</h3>
        <div className="space-y-4 relative">
          {/* Vertical line connecting nodes */}
          <div className="absolute left-[2.25rem] top-8 bottom-8 w-1 bg-gray-100 -z-10"></div>
          {LESSONS.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} onClick={() => startLesson(lesson)} />
          ))}
        </div>
      </div>
    </div>
  );

  const renderChat = () => (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* Chat Header */}
      <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-lg">🤖</div>
           <div>
             <h3 className="font-bold text-slate-800">AI Tutor</h3>
             <p className="text-xs text-slate-500">{context.topic}</p>
           </div>
        </div>
        <div className="bg-green-100 px-2 py-1 rounded text-green-700 text-xs font-bold">Online</div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 pb-32 no-scrollbar">
        {messages.map((msg, idx) => (
          <ChatMessageBubble key={msg.id} msg={msg} isLast={idx === messages.length - 1} />
        ))}
        {isTyping && (
          <div className="flex items-center gap-2 text-slate-400 text-sm ml-2">
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="absolute bottom-[80px] left-0 right-0 px-4 py-2 bg-transparent pointer-events-none">
        <div className="bg-white p-2 rounded-3xl shadow-xl border border-gray-100 flex items-center gap-2 pointer-events-auto max-w-2xl mx-auto">
           <button 
             onClick={toggleRecording}
             className={`p-3 rounded-full transition-all ${isRecording ? 'bg-red-500 text-white scale-110 animate-pulse' : 'bg-gray-100 text-slate-600'}`}
           >
             <Mic size={24} />
           </button>
           <input 
             type="text" 
             value={inputText}
             onChange={(e) => setInputText(e.target.value)}
             onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
             placeholder={isRecording ? "Listening..." : "Type a message..."}
             className="flex-1 bg-transparent outline-none text-slate-800 placeholder:text-slate-400 px-2"
             disabled={isRecording}
           />
           <button 
             onClick={handleSendMessage}
             disabled={!inputText.trim() || isRecording}
             className={`p-3 rounded-full transition-all ${inputText.trim() ? 'bg-indigo-600 text-white shadow-md scale-100' : 'bg-gray-100 text-gray-300 scale-90'}`}
           >
             <Send size={20} fill="currentColor" />
           </button>
        </div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="p-6 animate-in fade-in duration-300">
      <div className="flex flex-col items-center mb-8">
        <div className="w-24 h-24 bg-indigo-100 rounded-full mb-4 flex items-center justify-center text-4xl border-4 border-white shadow-lg">
          😎
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Student</h2>
        <p className="text-slate-500">Joined September 2023</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center">
          <Flame className="text-orange-500 mb-2" size={32} />
          <span className="text-2xl font-bold text-slate-800">{userStats.streak}</span>
          <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Day Streak</span>
        </div>
         <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center">
          <Award className="text-yellow-500 mb-2" size={32} />
          <span className="text-2xl font-bold text-slate-800">League 3</span>
          <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Current Rank</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex justify-between items-center">
          <span className="font-bold text-slate-700">Settings</span>
        </div>
        <div className="divide-y divide-gray-50">
          <div className="p-4 flex justify-between items-center hover:bg-gray-50 cursor-pointer" onClick={() => setShowPremium(true)}>
            <span className="text-sm font-medium text-indigo-600">Manage Subscription</span>
            <ChevronRight size={16} className="text-gray-400" />
          </div>
          <div className="p-4 flex justify-between items-center hover:bg-gray-50 cursor-pointer">
             <span className="text-sm font-medium text-slate-600">Target Language</span>
             <div className="flex items-center gap-2">
               <span className="text-sm text-slate-400">Spanish</span>
               <ChevronRight size={16} className="text-gray-400" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full w-full bg-slate-50 flex flex-col relative max-w-md mx-auto border-x border-gray-200 shadow-2xl">
      {showPremium && <PremiumModal onClose={() => setShowPremium(false)} />}
      
      {view !== AppView.CHAT && (
        <Header stats={userStats} onPremium={() => setShowPremium(true)} />
      )}
      
      <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar pb-20">
        {view === AppView.HOME && renderHome()}
        {view === AppView.CHAT && renderChat()}
        {view === AppView.PROFILE && renderProfile()}
      </main>

      <BottomNav current={view} onNavigate={setView} />
    </div>
  );
}