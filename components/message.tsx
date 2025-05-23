"use client";

import type { Message } from "ai";
import { motion } from "framer-motion";
import { SparklesIcon } from "./icons";
import { cn } from "@/lib/utils";
import { RestaurantResults } from "./RestaurantResults";

export const PreviewMessage = ({
  message,
}: {
  chatId: string;
  message: Message;
  isLoading: boolean;
}) => {
  // Parse restaurants only if the role is assistant
  const restaurants =
    message.role === "assistant" && message.content
      ? message.content
          .trim()
          .split("\n")
          .map((line) => line.replace(/^- /, ""))
      : [];

  // Determine if the current message content should be treated as restaurant results
  const isRestaurantResult = message.role === "assistant" && restaurants.length > 0;

  return (
    <motion.div
      className="w-full mx-auto max-w-3xl px-4 group/message"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      data-role={message.role}
    >
      <div
        className={cn(
          "group-data-[role=user]/message:bg-primary group-data-[role=user]/message:text-primary-foreground flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl",
        )}
      >
        {message.role === "assistant" && (
          <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
            <SparklesIcon size={14} />
          </div>
        )}

        <div className="flex flex-col gap-2 w-full">
          {/* Conditionally render based on role and content type */}
          {isRestaurantResult ? (
            <div className="flex flex-col gap-4">
              <RestaurantResults restaurants={restaurants} />
            </div>
          ) : (
            // Render plain text for user messages or non-restaurant assistant messages
            message.content && (
              <div className="flex flex-col gap-4">
                <p>{message.content}</p>
              </div>
            )
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const ThinkingMessage = () => {
  const role = "assistant";

  return (
    <motion.div
      className="w-full mx-auto max-w-3xl px-4 group/message "
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
    >
      <div
        className={cn(
          "flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl",
          {
            "group-data-[role=user]/message:bg-muted": true,
          },
        )}
      >
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
          <SparklesIcon size={14} />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-col gap-4 text-muted-foreground">
            Thinking...
          </div>
        </div>
      </div>
    </motion.div>
  );
};
