// NAYI CHEEZ: Added useEffect
import React, { useState, useEffect } from 'react'
// NAYI CHEEZ: Added Loader2
import { ExternalLink, RefreshCcw, Loader2 } from 'lucide-react'
import { Hint } from './hint/Hint.jsx'
import { Button } from '@/components/ui/button.jsx'

// NAYI CHEEZ: Accept previewUrl and isWakingUp from parent
const FragmentWeb = ({ data, previewUrl, isWakingUp }) => {
    const [fragmentKey, setFragmentKey] = useState(0)
    const [copied, setCopied] = useState(false);
    // NAYI CHEEZ: Track iframe loading state
    const [isLoadingIframe, setIsLoadingIframe] = useState(true);

    // NAYI CHEEZ: Force refresh when clicking a different fragment
    useEffect(() => {
        setIsLoadingIframe(true);
        setFragmentKey((prev) => prev + 1);
    }, [data.id]);

    const onRefresh = () => {
        setIsLoadingIframe(true);
        setFragmentKey((prev) => prev + 1)
    }

    const onCopy = () => {
        if (!previewUrl) return;
        navigator.clipboard.writeText(previewUrl) // FIX: Use previewUrl
        setCopied(true)
        setTimeout(() => {
            setCopied(false)
        }, 2000)
    }

    return (
        <div className='flex flex-col w-full h-full relative'>
            <div className='p-2 border-b bg-sidebar flex items-center gap-x-2'>
                <Hint text={"Refresh"} side={"bottom"} align={"start"}>
                    <Button size={"sm"} variant={"outline"} onClick={onRefresh}>
                        <RefreshCcw />
                    </Button>
                </Hint>
                <Button
                    size={"sm"}
                    variant={"outline"}
                    onClick={onCopy}
                    disabled={!previewUrl || copied} // FIX
                    className={"flex-1 justify-start text-start font-normal"}
                >
                    <span className='truncate'>
                        {/* NAYI CHEEZ: Show booting status if server is starting */}
                        {isWakingUp ? "Booting up environment..." : (previewUrl || "Waiting...")}
                    </span>
                </Button>
                <Hint text={"Open in New Tab"} side="bottom" align="start">
                    <Button
                        size={"sm"}
                        variant={"outline"}
                        onClick={() => {
                            if (!previewUrl) return; // FIX
                            window.open(previewUrl, "_blank");
                        }}
                        disabled={!previewUrl} // FIX
                    >
                        <ExternalLink />
                    </Button>
                </Hint>
            </div>

            {/* NAYI CHEEZ: Loading overlay spinner */}
            {(isWakingUp || isLoadingIframe) && (
                <div className="absolute inset-0 top-[50px] flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                    <Loader2 className="size-6 text-muted-foreground animate-spin" />
                </div>
            )}

            {previewUrl && !isWakingUp && (
                <iframe
                    key={fragmentKey}
                    className="h-full w-full bg-white dark:bg-black"
                    // NAYI CHEEZ: allow-forms allow-popups allow-modals added
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                    loading="lazy"
                    src={previewUrl} // FIX: Use previewUrl
                    onLoad={() => setIsLoadingIframe(false)}
                />
            )}
        </div>
    )
}

export default FragmentWeb;