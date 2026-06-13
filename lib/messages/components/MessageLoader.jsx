import Image from "next/image";
import React from "react";
import { useState, useEffect } from "react";
// 🚨 CHANGE 1: Apne hook ka path yahan zaroor check kar lena
import { useCancelMessage } from "../hooks/messages"; 

const ShimmerMessages = () => {
  const messages = [
    "Thinking...",
    "loading...",
    "Generating...",
    "Processing...",
    "Analyzing your prompt....",
    "Generating response....",
    "Adding final touches to response....",
    "Almost there....",
  ];

  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <span className="text-base text-muted-foreground animate-pulse">
        {messages[currentMessageIndex]}
      </span>
    </div>
  );
};

// 🚨 CHANGE 2: Props me projectId aur jobId receive kiya
const MessageLoading = ({ projectId, jobId }) => {
  
  // 🚨 CHANGE 3: Cancel hook ko call kiya
  const cancelMutation = useCancelMessage(projectId);

  const handleCancel = () => {
    if (!jobId) return;
    cancelMutation.mutate(jobId);
  };

  return (
    <div className="flex flex-col group px-2 pb-4">
      <div className="flex items-center gap-2 pl-2 mb-2">
        <Image
          src={"/logo.svg"}
          alt="Vibe"
          width={28}
          height={28}
          className="shrink-0 invert dark:invert-0"
        />
      </div>

      <div className="pl-8.5 flex flex-col gap-y-4">
        {/* 🚨 CHANGE 4: Shimmer aur Cancel button ko ek line me flex kiya */}
        <div className="flex items-center gap-4">
          <ShimmerMessages />
          
          {/* Agar jobId hai, tabhi button render hoga */}
          {jobId && (
            <button
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
              className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md border border-input bg-background text-muted-foreground shadow-xs hover:bg-accent hover:text-destructive transition-all duration-200 disabled:opacity-50 cursor-pointer"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
              {cancelMutation.isPending ? "Stopping..." : "Cancel"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageLoading;