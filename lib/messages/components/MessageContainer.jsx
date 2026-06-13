import React from 'react'
import { useGetMessages, prefetchMessage } from '../hooks/messages'
// 🚨 CHANGE 1: useState import kiya
import { useEffect, useRef, useState } from 'react' 
import { MessageRole } from '@/lib/generated/prisma/enums'
import { useQueryClient } from '@tanstack/react-query'
import { Spinner } from '@/components/ui/spinner'
import MessageCard from './MessageCard'
import MessageForm from './MessageForm.jsx'
import MessageLoader from './MessageLoader'

function MessageContainer({ projectId, activeFragment, setactiveFragment }) {
    const queryClient = useQueryClient()
    const bottomref = useRef(null)
    const lastassistantmessageIdref = useRef(null)
    
    // 🚨 CHANGE 2: Nayi state banayi active job ID track karne ke liye
    const [activeJobId, setActiveJobId] = useState(null)

    const { data: messages, isPending, error, isError } = useGetMessages(projectId)
    
    useEffect(() => {
        if (projectId) {
            prefetchMessage(queryClient, projectId)
        }
    }, [projectId, queryClient])
    
    useEffect(() => {
        bottomref.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages?.length])
    
    useEffect(() => {
        const lastAssistantMessage = messages?.findLast(
            (message) => message.role === MessageRole.ASSISTANT
        );
        if (lastAssistantMessage?.fragments && lastAssistantMessage.id !==
            lastassistantmessageIdref.current) {
            setactiveFragment(lastAssistantMessage?.fragments)
            lastassistantmessageIdref.current = lastAssistantMessage.id
        }
    }, [messages, setactiveFragment])
    
    if (isPending) {
        return (
            <div className="flex items-center justify-center h-full">
                <Spinner className={"text-emerald-400"} />
            </div>
        );
    }
    
    if (isError) {
        return (
            <div className="flex items-center justify-center h-full text-red-500">
                Error: {error?.message || "Failed to load messages"}
            </div>
        );
    }
    
    if (!messages || messages.length === 0) {
        return (
            <div className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    No Messages yet. Start a conversation!
                </div>
                <div className="relative p-3 pt-1">
                    <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-b from-transparent to-background pointer-events-none" />
                    {/* 🚨 CHANGE 3: Empty state me form fix kiya aur prop pass kiya */}
                    <MessageForm 
                        projectId={projectId} 
                        onJobStart={(id) => setActiveJobId(id)} 
                    />
                </div>
            </div>
        );
    }
    
    const lastMessage = messages[messages.length - 1];
    const isLastMessageUser = lastMessage.role === MessageRole.USER;
    
    return (
        <div className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 min-h-0 overflow-y-auto">
                {messages.map((message) => (
                    <MessageCard
                        key={message.id}
                        content={message.content}
                        role={message.role}
                        fragment={message.fragments}
                        createdAt={message.createdAt}
                        isActiveFragment={activeFragment?.id === message.fragments?.id}
                        onFragmentClick={() => setactiveFragment(message.fragments)}
                        type={message.type}
                    />
                ))}
                
                {/* 🚨 CHANGE 4: MessageLoader me projectId aur jobId pass kiya */}
                {isLastMessageUser && (
                    <MessageLoader projectId={projectId} jobId={activeJobId} />
                )}
                <div ref={bottomref} />
            </div>
            <div className="relative p-2 pt-1">
                <div className="absolute -top-6 left-0 right-0 h-6 bg-linear-to-b from-transparent to-background pointer-events-none" />
                
                {/* 🚨 CHANGE 5: MessageForm ko onJobStart pass kiya */}
                <MessageForm 
                    projectId={projectId} 
                    onJobStart={(id) => setActiveJobId(id)} 
                />
            </div>
        </div>
    )
}

export default MessageContainer