import { useCallback, useEffect, useRef, useState } from "react";
import { connectSocket } from "../../lib/socket";
import type { BingoChatMessage } from "../../types";

const CHAT_ACK_TIMEOUT_MS = 4000;
const MAX_CHAT_MESSAGES = 100;

export function useBingoChat(roomId: string) {
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<BingoChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSending, setIsSending] = useState(false);

  const isChatOpenRef = useRef(showChat);
  const isMountedRef = useRef(true);
  const sendTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    isChatOpenRef.current = showChat;
  }, [showChat]);

  useEffect(() => {
    const socket = connectSocket();
    const handleMessage = (message: BingoChatMessage) => {
      setMessages((prev) => [...prev.slice(-(MAX_CHAT_MESSAGES - 1)), message]);
      if (!isChatOpenRef.current) {
        setUnreadCount((count) => count + 1);
      }
    };

    socket.on("chat:message", handleMessage);
    return () => {
      socket.off("chat:message", handleMessage);
    };
  }, []);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (sendTimeoutRef.current !== null) {
        window.clearTimeout(sendTimeoutRef.current);
      }
    };
  }, []);

  const toggleChat = useCallback(() => {
    setShowChat((open) => {
      const nextOpen = !open;
      if (nextOpen) {
        setUnreadCount(0);
      }
      return nextOpen;
    });
  }, []);

  const closeChat = useCallback(() => {
    setShowChat(false);
  }, []);

  const sendChat = useCallback(() => {
    const message = input.trim();
    if (!message || isSending) {
      return;
    }

    const socket = connectSocket();
    setIsSending(true);

    sendTimeoutRef.current = window.setTimeout(() => {
      sendTimeoutRef.current = null;
      setIsSending(false);
    }, CHAT_ACK_TIMEOUT_MS);

    socket.emit(
      "chat:send",
      { roomId, message },
      (res?: { success?: boolean; error?: { message?: string } }) => {
        if (!isMountedRef.current) {
          return;
        }

        if (sendTimeoutRef.current !== null) {
          window.clearTimeout(sendTimeoutRef.current);
          sendTimeoutRef.current = null;
        }

        setIsSending(false);

        if (res?.error?.message) {
          return;
        }

        setInput("");
      },
    );
  }, [input, isSending, roomId]);

  return {
    closeChat,
    input,
    isSending,
    messages,
    sendChat,
    setInput,
    showChat,
    toggleChat,
    unreadCount,
  };
}
