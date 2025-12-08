// src/components/screens/AiAssistant.tsx

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { runTravelAssistantPrompt } from "../../lib/aiClient";

type Role = "user" | "assistant";

type Message = {
  id: string;
  role: Role;
  content: string;
  timestamp: string;
  type?: "proactive";
  error?: boolean;
};

type TripSummary = {
  title?: string;
  destination?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  budget?: number;
  spent?: number;
} | null;

type AiAssistantProps = {
  user: {
    full_name?: string | null;
    email: string;
    points?: number;
  };
  currentTrip?: {
    title?: string;
    destination?: string;
    start_date?: string;
    end_date?: string;
    status?: string;
    budget?: number;
    spent?: number;
  } | null;
};

export default function AiAssistant({
  user,
  currentTrip = null,
}: AiAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const flatListRef = useRef<FlatList<Message> | null>(null);

  useEffect(() => {
    if (messages.length === 0) {
      initializeChat();
    }
  }, []);

  useEffect(() => {
    if (currentTrip) {
      generateProactiveTips(currentTrip);
    }
  }, [currentTrip]);

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const initializeChat = () => {
    const firstName =
      user?.full_name?.trim()?.split(" ")?.[0] || "there";

    const welcome: Message = {
      id: String(Date.now()),
      role: "assistant",
      content:
        `Hi ${firstName}! I'm your SaFara AI travel assistant.\n\n` +
        `I can help with:\n` +
        `• Travel tips & recommendations\n` +
        `• Safety info & alerts\n` +
        `• Itinerary planning & destination info\n` +
        `• Using SOS and other app features\n\n` +
        `What would you like help with?`,
      timestamp: new Date().toISOString(),
    };

    setMessages([welcome]);

    const initialSuggestions = currentTrip
      ? [
          "What are safety tips for my destination?",
          "Suggest activities for today",
          "How is the weather at my destination?",
          "What are must-visit places nearby?",
        ]
      : [
          "Help me plan a new trip",
          "What are safe destinations in India?",
          "Explain how SaFara SOS works",
          "Give general travel safety tips",
        ];
    setSuggestions(initialSuggestions);
  };

  const generateProactiveTips = async (_trip: TripSummary) => {
    // Keep it lightweight, avoid spamming
    if (!_trip || messages.length > 5) return;

    try {
      const dest = _trip.destination || "my trip";
      const prompt =
        `Generate exactly 3 short proactive travel tips for a traveler going to ${dest}. ` +
        `Focus on safety, local customs, and must-know information. ` +
        `Return plain text tips separated by newline characters; each tip under 30 words.`;

      const text = await runTravelAssistantPrompt(prompt);
      const rawTips = text
        .split("\n")
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
        .slice(0, 3);

      if (rawTips.length === 0) return;

      const content =
        `Proactive tips for ${dest}:\n\n` +
        rawTips.map((t, i) => `${i + 1}. ${t}`).join("\n\n");

      const msg: Message = {
        id: String(Date.now() + 1),
        role: "assistant",
        content,
        timestamp: new Date().toISOString(),
        type: "proactive",
      };

      setTimeout(() => {
        setMessages((prev) => [...prev, msg]);
        scrollToBottom();
      }, 2000);
    } catch (e) {
      // silently ignore proactive errors
    }
  };

  const buildUserContext = (): string => {
    const minimalTrip = currentTrip
      ? {
          title: currentTrip.title,
          destination: currentTrip.destination,
          start_date: currentTrip.start_date,
          end_date: currentTrip.end_date,
          status: currentTrip.status,
          budget: currentTrip.budget,
          spent: currentTrip.spent,
        }
      : null;

    const context = {
      user: {
        name: user.full_name,
        email: user.email,
        points: user.points || 0,
      },
      current_trip: minimalTrip,
    };

    return JSON.stringify(context, null, 2);
  };

  const handleSend = async (maybeText?: string) => {
    const text = (maybeText ?? input).trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: String(Date.now()),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setSuggestions([]);
    scrollToBottom();

    try {
      const contextJson = buildUserContext();
      const lower = text.toLowerCase();
      const needsInternet =
        lower.includes("weather") ||
        lower.includes("today") ||
        lower.includes("current");

      const prompt =
        `You are a concise, friendly AI travel assistant for the SaFara tourist safety app.\n\n` +
        `User context:\n${contextJson}\n\n` +
        `User question:\n${text}\n\n` +
        `Guidelines:\n` +
        `- Focus on practical travel and safety help for India and tourists.\n` +
        `- Mention app features (trip planner, SOS, alerts) only when relevant.\n` +
        `- Keep answer under 200 words, clear and actionable.\n` +
        `- If you are not sure or need real-time data (like weather), say so briefly and suggest what user can check.\n` +
        `- Do NOT mention that you used any external tools or the Gemini API.\n`;

      const answer = await runTravelAssistantPrompt(prompt);

      const assistantMsg: Message = {
        id: String(Date.now() + 1),
        role: "assistant",
        content: answer,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      scrollToBottom();

      // Simple follow-up suggestions (local, to avoid extra calls)
      const followUps: string[] = [];
      if (lower.includes("safety")) {
        followUps.push("Show more local safety tips");
        followUps.push("How do I add emergency contacts?");
      } else if (lower.includes("plan") || lower.includes("trip")) {
        followUps.push("Help me refine my itinerary");
        followUps.push("Estimate daily budget for this trip");
      } else if (currentTrip) {
        followUps.push("Suggest activities for tomorrow");
        followUps.push("What should I pack for this place?");
      }
      if (followUps.length > 0) setSuggestions(followUps.slice(0, 3));
    }      catch (e) {
      console.log("[AiAssistant] Gemini error", e);
      const errMsg: Message = {
        id: String(Date.now() + 2),
        role: "assistant",
        content:
          "Sorry, something went wrong while generating a response. Please try again in a moment.",
        timestamp: new Date().toISOString(),
        error: true,
      };
      setMessages((prev) => [...prev, errMsg]);
      scrollToBottom();
    } finally {

      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";
    const isProactive = item.type === "proactive";

    return (
      <View
        style={[
          styles.messageRow,
          { justifyContent: isUser ? "flex-end" : "flex-start" },
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isUser
              ? styles.userBubble
              : isProactive
              ? styles.proactiveBubble
              : item.error
              ? styles.errorBubble
              : styles.assistantBubble,
          ]}
        >
          <Text style={[styles.messageText, isUser && { color: "#ffffff" }]}>
            {item.content}
          </Text>
          <Text style={styles.timestampText}>
            {new Date(item.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={80}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <Ionicons name="sparkles" size={20} color="#ffffff" />
          </View>
          <View>
            <Text style={styles.headerTitle}>AI Travel Assistant</Text>
            <Text style={styles.headerSubtitle}>
              Ask anything about your trip & safety
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.messagesContainer}>
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={40}
              color="#a855f7"
            />
            <Text style={styles.emptyTitle}>Start a conversation</Text>
            <Text style={styles.emptySubtitle}>
              Ask for tips, safety info, or help planning your journey.
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            onContentSizeChange={scrollToBottom}
          />
        )}
      </View>

      {suggestions.length > 0 && !isLoading && (
        <View style={styles.suggestionsRow}>
          {suggestions.map((s) => (
            <TouchableOpacity
              key={s}
              style={styles.suggestionChip}
              onPress={() => handleSend(s)}
            >
              <Text style={styles.suggestionText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Ask me anything..."
          placeholderTextColor="#9ca3af"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => handleSend()}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!input.trim() || isLoading) && { opacity: 0.5 },
          ]}
          disabled={!input.trim() || isLoading}
          onPress={() => handleSend()}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Ionicons name="send" size={18} color="#ffffff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#7c3aed",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  messageRow: {
    flexDirection: "row",
    marginVertical: 4,
  },
  messageBubble: {
    maxWidth: "85%",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  userBubble: {
    backgroundColor: "#0f766e",
  },
  assistantBubble: {
    backgroundColor: "#e5e7eb",
  },
  proactiveBubble: {
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#facc15",
  },
  errorBubble: {
    backgroundColor: "#fee2e2",
    borderWidth: 1,
    borderColor: "#f87171",
  },
  messageText: {
    fontSize: 14,
    color: "#111827",
  },
  timestampText: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 4,
    textAlign: "right",
  },
  suggestionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#f3f4f6",
  },
  suggestionChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#c4b5fd",
    backgroundColor: "#ede9fe",
    marginRight: 8,
    marginBottom: 6,
  },
  suggestionText: {
    fontSize: 12,
    color: "#4c1d95",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: "#111827",
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#7c3aed",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 4,
  },
});