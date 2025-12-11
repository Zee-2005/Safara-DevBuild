


import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  MessageSquare, Send, Bot, User, FileText, AlertTriangle, BookOpen, Zap, 
  Mic, MicOff, MapPin, Loader 
} from 'lucide-react';

const GEMINI_KEY = (import.meta as any).env?.EXPO_PUBLIC_GEMINI_API_KEY || 'AIzaSyAyWIwhNpwf_NsVHzQOAFYZPSL8lWDJTZs';
//const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyAyWIwhNpwf_NsVHzQOAFYZPSL8lWDJTZs`;


type ChatMessage = {
  id: number;
  type: 'assistant' | 'user';
  content: string;
  timestamp: Date;
};

type Props = {
  language?: string;
  userLocation?: { lat: number; lng: number };
  onLocationRequest?: () => void;
};

const Assistant: React.FC<Props> = ({ language, userLocation, onLocationRequest }) => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: 1,
      type: 'assistant',
      content: "Hello! I'm your SentinelView AI Assistant. I can help with SOPs, incident handling, system guidance, and answer any questions about operations. How can I assist you today?",
      timestamp: new Date(Date.now() - 5000)
    }
  ]);
  const [loading, setLoading] = useState(false);

  // Voice recognition
  const [micReady, setMicReady] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const endRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory.length, loading]);

  useEffect(() => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setMicReady(false); return; }
    const recog: SpeechRecognition = new SR();
    recog.continuous = false;
    recog.interimResults = false;
    recog.lang = (language || 'en').startsWith('hi') ? 'hi-IN' : 'en-IN';
    recog.onresult = (e) => {
      const transcript = e.results?.[e.resultIndex]?.[0]?.transcript || '';
      if (transcript) { setMessage(transcript); setTimeout(() => handleSend(transcript), 100); }
      setMicActive(false);
    };
    recog.onerror = () => setMicActive(false);
    recog.onend = () => setMicActive(false);
    recognitionRef.current = recog;
    setMicReady(true);
    return () => { try { recog.abort(); } catch {} recognitionRef.current = null; };
  }, [language]);

  const startMic = useCallback(() => {
    if (!recognitionRef.current || micActive) return;
    try { recognitionRef.current.start(); setMicActive(true); } catch { setMicActive(false); }
  }, [micActive]);

  const stopMic = useCallback(() => { try { recognitionRef.current?.stop(); } catch {} setMicActive(false); }, []);

  const canSend = useMemo(() => !loading && message.trim().length > 0, [loading, message]);

  const buildPrompt = (input: string) => {
    const localeLine = language ? `User language: ${language}` : 'User language: en';
    const locLine = userLocation ? `User location: lat=${userLocation.lat}, lng=${userLocation.lng}` : 'User location: unknown';
    const system = [
      'Act as SentinelView Authority Assistant: a concise, professional AI for SOPs, incident handling, and operational guidance.',
      'Provide step-by-step guidance when relevant.'
    ].join(' ');
    return `${system}\n${localeLine}\n${locLine}\nUser: ${input}`;
  };

  const askGemini = async (prompt: string) => {
    const res = await fetch(GEMINI_KEY , {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.6, topP: 0.9, topK: 40, maxOutputTokens: 512 }
      })
    });
    if (!res.ok) { 
      let message = `${res.status} ${res.statusText}`; 
      try { const json = await res.json(); message = json?.error?.message || message; } catch {}
      throw new Error(message); 
    }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text)?.filter(Boolean)?.join(' ')?.trim() || 'Sorry, no response available.';
    return text;
  };

  const handleSend = useCallback(async (textOverride?: string) => {
    const userText = (textOverride ?? message).trim();
    if (!userText || loading) return;

    setChatHistory(prev => [...prev, { id: Date.now(), type: 'user', content: userText, timestamp: new Date() }]);
    setMessage('');
    setLoading(true);

    try {
      const aiText = await askGemini(buildPrompt(userText));
      setChatHistory(prev => [...prev, { id: Date.now() + 1, type: 'assistant', content: aiText, timestamp: new Date() }]);
    } catch (err: any) {
      setChatHistory(prev => [...prev, { id: Date.now() + 2, type: 'assistant', content: `Error: ${err?.message || 'Unknown'}`, timestamp: new Date() }]);
    } finally { setLoading(false); }
  }, [message, loading, language, userLocation]);

  // Quick Actions & Knowledge Base (existing)
  const quickActions = [
    { title: "SOS Response Protocol", description: "Step-by-step guide for handling SOS alerts", icon: AlertTriangle, query: "What is the standard SOS response protocol?" },
    { title: "Zone Violation Procedure", description: "How to handle restricted zone violations", icon: FileText, query: "How should I handle a tourist zone violation?" },
    { title: "Emergency Escalation", description: "When and how to escalate incidents", icon: Zap, query: "What are the criteria for emergency escalation?" },
    { title: "E-FIR Generation", description: "Automated FIR creation guidance", icon: BookOpen, query: "How do I generate an E-FIR for this incident?" }
  ];

  const knowledgeBase = [
    { category: "Standard Operating Procedures", items: ["SOS Alert Response Protocol","Zone Violation Handling","Medical Emergency Response","Crowd Control Procedures","Tourist Communication Guidelines"] },
    { category: "System Operations", items: ["Dashboard Navigation","Tourist Profile Management","Incident Assignment Process","Zone Configuration","Report Generation"] },
    { category: "Emergency Protocols", items: ["Multi-Casualty Incident Response","Severe Weather Protocols","Terrorist Threat Response","Mass Evacuation Procedures","Inter-Agency Coordination"] }
  ];

  const aiSuggestions = [
    { id: 1, type: "recommendation", title: "High Crowd Alert", content: "Marina Beach showing 87% capacity. Consider deploying additional crowd control units.", confidence: "High", timestamp: "2 min ago" },
    { id: 2, type: "warning", title: "Weather Advisory", content: "Monsoon alert issued for coastal areas. Review emergency shelter protocols.", confidence: "Medium", timestamp: "15 min ago" },
    { id: 3, type: "insight", title: "Pattern Analysis", content: "Increased SOS alerts near temple areas during evening hours detected.", confidence: "High", timestamp: "1 hour ago" }
  ];

  const handleQuickAction = (query: string) => { setMessage(query); handleSend(query); };
  const getSuggestionBadge = (type: string) => {
    switch(type) {
      case 'recommendation': return <Badge className="bg-info text-info-foreground">Recommendation</Badge>;
      case 'warning': return <Badge className="bg-warning text-warning-foreground">Warning</Badge>;
      case 'insight': return <Badge className="bg-success text-success-foreground">Insight</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Assistant</h1>
          <p className="text-muted-foreground">
            Intelligent support for SOPs, incident handling, and operational guidance
          </p>
        </div>
        <Badge className="bg-success text-success-foreground flex items-center gap-1">
          <Bot className="w-4 h-4" /> AI Online
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-4 flex-1">
        {/* Chat Interface */}
        <div className="lg:col-span-3 flex flex-col">
          <Card className="card-shadow flex-1 flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" /> SentinelView AI Chat
              </CardTitle>
              <CardDescription>
                Ask questions about procedures, get incident guidance, or request system help
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {/* Chat Messages */}
              <div className="flex-1 overflow-auto space-y-4 mb-4">
                {chatHistory.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-3 ${
                      msg.type === 'user' ? 'authority-gradient text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        {msg.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        <span className="text-sm font-medium">{msg.type === 'user' ? 'You' : 'AI Assistant'}</span>
                        <span className="text-xs opacity-70">{msg.timestamp.toLocaleTimeString()}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2">
                      <Loader className="w-4 h-4 animate-spin text-blue-500" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                )}

                <div ref={endRef} />
              </div>

              {/* Input & Actions */}
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant={micActive ? 'secondary' : 'outline'}
                        size="icon"
                        onClick={micActive ? stopMic : startMic}
                        disabled={!micReady || loading}
                      >
                        {micActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs">{micReady ? (micActive ? 'Listening...' : 'Voice input') : 'Mic not supported'}</div>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={onLocationRequest}
                        disabled={loading}
                      >
                        <MapPin className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs">
                        {userLocation ? `lat ${userLocation.lat.toFixed(3)}, lng ${userLocation.lng.toFixed(3)}` : 'Share location'}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Input
                  placeholder="Ask about SOPs, incidents, or system guidance..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && canSend && handleSend()}
                  className="flex-1"
                />
                <Button onClick={() => handleSend()} disabled={!canSend} className="authority-gradient text-white">
                  <Send className="w-4 h-4" /> Send
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Quick Help Topics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <Card key={index} className="card-shadow cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleQuickAction(action.query)}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <action.icon className="w-5 h-5 text-primary mt-1" />
                      <div>
                        <h4 className="font-medium mb-1">{action.title}</h4>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Suggestions */}
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="text-lg">AI Suggestions</CardTitle>
              <CardDescription>Proactive recommendations and insights</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {aiSuggestions.map((suggestion) => (
                <div key={suggestion.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    {getSuggestionBadge(suggestion.type)}
                    <span className="text-xs text-muted-foreground">{suggestion.timestamp}</span>
                  </div>
                  <h4 className="font-medium text-sm mb-1">{suggestion.title}</h4>
                  <p className="text-xs text-muted-foreground mb-2">{suggestion.content}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Confidence: {suggestion.confidence}</span>
                    <Button variant="outline" size="sm">View</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Knowledge Base */}
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><BookOpen className="w-5 h-5" /> Knowledge Base</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {knowledgeBase.map((category, index) => (
                  <div key={index}>
                    <h4 className="font-medium text-sm mb-2">{category.category}</h4>
                    <div className="space-y-1">
                      {category.items.map((item, itemIndex) => (
                        <button
                          key={itemIndex}
                          className="w-full text-left p-2 text-xs bg-muted hover:bg-muted/70 rounded transition-colors"
                          onClick={() => handleQuickAction(`Tell me about ${item}`)}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="text-lg">System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">AI Response Time</span>
                <Badge className="bg-success text-success-foreground">&lt; 1s</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Knowledge Base</span>
                <Badge className="bg-success text-success-foreground">Updated</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">SOP Database</span>
                <Badge className="bg-success text-success-foreground">Current</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Learning Mode</span>
                <Badge className="bg-info text-info-foreground">Active</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Assistant;