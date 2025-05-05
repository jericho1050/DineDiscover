"use client";

import { PreviewMessage, ThinkingMessage } from "@/components/message";
import { MultimodalInput } from "@/components/multimodal-input";
import { Overview } from "@/components/overview";
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom";
import { ToolInvocation } from "ai";
import React, { useCallback, useState } from "react";
import { toast } from "sonner";

import { type CoreMessage } from "ai";


// Define a type for the error response from your API
interface ApiErrorResponse {
  detail?: string; // From FastAPI HTTPException
  message?: string; // Custom error message
}

export function Chat() {

  const [messages, setMessages] = useState<CoreMessage[]>([])
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatId = "001";

  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

    const handleFormSubmit = useCallback(async (event?: React.FormEvent<HTMLFormElement>) => {
      if (event) {
        event.preventDefault();
      }
  
      if (isLoading || !input.trim()) {
        return; // Don't submit if already loading or input is empty
      }
  
      setIsLoading(true);
      const messageContent = input.trim();
      setInput(''); // Clear input immediately
  
      // Add user message to state
      const userMessage: CoreMessage = {
        id: Date.now().toString(), // Simple unique ID
        role: 'user',
        content: messageContent,
      };
      setMessages(currentMessages => [...currentMessages, userMessage]);
  
      try {
        const response = await fetch('/api/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: messageContent }), // Send the single message string
        });
  
        const result = await response.json();
  
        if (!response.ok) {
          // Handle API errors (4xx, 5xx)
          const errorData = result as ApiErrorResponse;
          const errorMessage = errorData.detail || errorData.message || `HTTP error! status: ${response.status}`;
          console.error("API Error:", errorMessage, result);
          toast.error(errorMessage);
          // Optionally add an error message to the chat display
          // const errorResponseMessage: CoreMessage = { id: Date.now().toString() + '-error', role: 'assistant', content: `Error: ${errorMessage}` };
          // setMessages(currentMessages => [...currentMessages, errorResponseMessage]);
        } else {
          // Handle successful response (Foursquare results)
          const apiResponse = result as FoursquareApiResponse;
  
          // Basic formatting example - adjust as needed for PreviewMessage
          const formattedResults = apiResponse.results?.map((r: FoursquareResult) =>
            `- ${r.name} (${r.location?.formatted_address || 'Address N/A'})`
          ).join('\n') || 'No results found.';
  
          const assistantMessage: CoreMessage = {
            id: Date.now().toString() + '-res',
            role: 'assistant',
            content: formattedResults,
            // Store raw results if PreviewMessage needs them for richer display
            // ui: <YourResultDisplayComponent data={apiResponse.results} /> // Or pass data via props
          };
          setMessages(currentMessages => [...currentMessages, assistantMessage]);
        }
      } catch (error) {
        // Handle network errors or unexpected issues
        console.error("Fetch failed:", error);
        toast.error("Failed to fetch results. Please check the console.");
        // Optionally add a network error message to the chat display
        // const fetchErrorResponseMessage: CoreMessage = { id: Date.now().toString() + '-fetch-error', role: 'assistant', content: 'Failed to connect to the server.' };
        // setMessages(currentMessages => [...currentMessages, fetchErrorResponseMessage]);
      } finally {
        setIsLoading(false);
      }
    }, [input, isLoading]); // Dependencies for useCallback
  return (
    <div className="flex flex-col min-w-0 h-[calc(100dvh-52px)] bg-background">
      <div
        ref={messagesContainerRef}
        className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4"
      >
        {messages.length === 0 && <Overview />}

        {messages.map((message, index) => (
          <PreviewMessage
            key={message.id}
            chatId={chatId}
            message={message}
            isLoading={isLoading && messages.length - 1 === index}
          />
        ))}

        {isLoading &&
          messages.length > 0 &&
          messages[messages.length - 1].role === "user" && <ThinkingMessage />}

        <div
          ref={messagesEndRef}
          className="shrink-0 min-w-[24px] min-h-[24px]"
        />
      </div>

      <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
        <MultimodalInput
          chatId={chatId}
          input={input}
          setInput={setInput}
          handleSubmit={handleFormSubmit}
          isLoading={isLoading}
        />
      </form>
    </div>
  );
}
