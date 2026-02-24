import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '../lib/utils';
import { useRouter } from '@tanstack/react-router';

interface ParsedRequest {
  category: string;
  requestType: string;
  priority: string;
  quantity: number;
  reason: string;
  riskLevel: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  parsedRequest?: ParsedRequest;
}

const EXAMPLE_PROMPTS = [
  "I need access to CRM for a marketing campaign",
  "Need laptop urgently for new joiner tomorrow",
  "Request admin access to ERP system",
  "Need a monitor for my workstation",
];

function parseNaturalLanguage(input: string): ParsedRequest {
  const lower = input.toLowerCase();

  // Determine request type
  let requestType = 'Equipment';
  let category = 'General';
  if (lower.includes('crm') || lower.includes('erp') || lower.includes('email') || lower.includes('system') || lower.includes('access') || lower.includes('admin')) {
    requestType = 'System Access';
    category = lower.includes('crm') ? 'CRM' : lower.includes('erp') ? 'ERP' : lower.includes('email') ? 'Email Groups' : 'System Access';
  } else if (lower.includes('office') || lower.includes('building') || lower.includes('floor') || lower.includes('restricted')) {
    requestType = 'Physical Access';
    category = 'Office Entry';
  } else if (lower.includes('software') || lower.includes('license') || lower.includes('tool') || lower.includes('app')) {
    requestType = 'Software Licenses';
    category = 'Software License';
  } else if (lower.includes('laptop') || lower.includes('monitor') || lower.includes('id card') || lower.includes('equipment') || lower.includes('hardware')) {
    requestType = 'Equipment';
    category = lower.includes('laptop') ? 'Laptop' : lower.includes('monitor') ? 'Monitor' : 'ID Card';
  }

  // Priority
  let priority = 'medium';
  if (lower.includes('urgent') || lower.includes('asap') || lower.includes('immediately') || lower.includes('tomorrow')) {
    priority = 'high';
  } else if (lower.includes('low priority') || lower.includes('whenever')) {
    priority = 'low';
  }

  // Quantity
  let quantity = 1;
  const qMatch = lower.match(/(\d+)\s*(laptop|monitor|device|unit)/);
  if (qMatch) quantity = parseInt(qMatch[1]);

  // Risk level
  let riskLevel = 'low';
  if (lower.includes('admin') || lower.includes('full access') || lower.includes('server')) {
    riskLevel = 'high';
  } else if (lower.includes('write') || lower.includes('edit') || lower.includes('modify')) {
    riskLevel = 'medium';
  }

  // Reason
  let reason = 'Work requirement';
  if (lower.includes('new joiner') || lower.includes('onboarding')) reason = 'New employee onboarding';
  else if (lower.includes('campaign')) reason = 'Marketing campaign';
  else if (lower.includes('project')) reason = 'Project requirement';
  else if (lower.includes('remote') || lower.includes('work from home')) reason = 'Remote work setup';

  return { category, requestType, priority, quantity, reason, riskLevel };
}

export default function ChatbotAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    const parsed = parseNaturalLanguage(input.trim());
    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: `I've analyzed your request. Here's what I understood:`,
      parsedRequest: parsed,
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput('');
  };

  const handleCreateRequest = (parsed: ParsedRequest) => {
    setOpen(false);
    router.navigate({
      to: '/create-request',
      search: {
        type: parsed.requestType,
        category: parsed.category,
        priority: parsed.priority,
        reason: parsed.reason,
        riskLevel: parsed.riskLevel,
      } as any,
    });
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-teal-500 hover:bg-teal-600 text-white shadow-lg flex items-center justify-center transition-all duration-200",
          open && "scale-0 opacity-0"
        )}
        title="AI Assistant"
      >
        <MessageCircle size={20} />
      </button>

      {/* Chat panel */}
      <div className={cn(
        "fixed bottom-6 right-6 z-50 w-80 bg-card border border-border rounded-2xl shadow-xl flex flex-col transition-all duration-300 origin-bottom-right",
        open ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
      )} style={{ height: '480px' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-teal-500 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-white" />
            <span className="text-white font-semibold text-sm">AccessFlow AI</span>
          </div>
          <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.length === 0 ? (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground text-center pt-2">
                Describe your request in plain English and I'll help you create it.
              </p>
              <div className="space-y-2">
                {EXAMPLE_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(prompt)}
                    className="w-full text-left text-xs px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={cn(
                "flex",
                msg.role === 'user' ? "justify-end" : "justify-start"
              )}>
                <div className={cn(
                  "max-w-[85%] rounded-xl px-3 py-2 text-xs",
                  msg.role === 'user'
                    ? "bg-teal-500 text-white rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                )}>
                  <p>{msg.content}</p>
                  {msg.parsedRequest && (
                    <div className="mt-2 space-y-1.5">
                      <div className="bg-background/80 rounded-lg p-2 space-y-1">
                        <p className="font-semibold text-foreground text-[11px]">Parsed Request:</p>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px]">
                          <span className="text-muted-foreground">Type:</span>
                          <span className="font-medium">{msg.parsedRequest.requestType}</span>
                          <span className="text-muted-foreground">Category:</span>
                          <span className="font-medium">{msg.parsedRequest.category}</span>
                          <span className="text-muted-foreground">Priority:</span>
                          <span className={cn("font-medium capitalize",
                            msg.parsedRequest.priority === 'high' && "text-red-600",
                            msg.parsedRequest.priority === 'medium' && "text-yellow-600",
                            msg.parsedRequest.priority === 'low' && "text-green-600",
                          )}>{msg.parsedRequest.priority}</span>
                          <span className="text-muted-foreground">Qty:</span>
                          <span className="font-medium">{msg.parsedRequest.quantity}</span>
                          <span className="text-muted-foreground">Reason:</span>
                          <span className="font-medium">{msg.parsedRequest.reason}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="w-full h-7 text-[11px] bg-teal-500 hover:bg-teal-600 text-white gap-1"
                        onClick={() => handleCreateRequest(msg.parsedRequest!)}
                      >
                        Create This Request <ArrowRight size={11} />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t flex gap-2">
          <Input
            placeholder="Describe your request..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="text-xs h-8"
          />
          <Button size="icon" className="h-8 w-8 bg-teal-500 hover:bg-teal-600 flex-shrink-0" onClick={handleSend}>
            <Send size={13} />
          </Button>
        </div>
      </div>
    </>
  );
}
