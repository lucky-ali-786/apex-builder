"use client"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import TextAreaAutosize from "react-textarea-autosize";
import { ArrowUpIcon } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Form, FormField } from "@/components/ui/form";
import z from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCreateMessages } from "../hooks/messages";
import { Spinner } from "@/components/ui/spinner";
import { useStatus } from "@/lib/usage/hooks/usage";
import { Usage } from "@/lib/usage/components/Usage";

const formSchema = z.object({
    content: z.string().min(1, "Message Description is required").max(1000, "Description must be less than 1000 characters")
})

// 🚨 CHANGE 1: Added onJobStart to props
function MessageForm({ projectId, onJobStart }) {
    const [focus, setfocus] = useState(false);
    const { mutateAsync, isPending } = useCreateMessages(projectId);
    const { data: usage } = useStatus()
    const showUsage = !!usage

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            content: ""
        },
        mode: "onChange"
    });

    const handlesubmit = async (values) => {
        try {
            // 🚨 CHANGE 2: Generate unique Job ID
            const jobId = crypto.randomUUID();

            // 🚨 CHANGE 3: Pass Job ID to parent component so MessageLoader can catch it
            if (onJobStart) {
                onJobStart(jobId);
            }

            // 🚨 CHANGE 4: Send both content and jobId to the backend mutation
            const res = await mutateAsync({ 
                content: values.content, 
                jobId: jobId 
            });

            form.reset();
            toast.success("Message sent successfully")
        } catch (error) {
            toast.error("Failed to send Message");
        }
    }

    const contentValue = form.watch("content") || "";
    const isButtonDisabled = isPending || contentValue.trim().length === 0;

    return (
        <Form {...form}>
            {
                showUsage && (<Usage />)
            }
            <form
                onSubmit={form.handleSubmit(handlesubmit)}
                className={cn(
                    "relative border p-4 pt-1 rounded-xl bg-sidebar dark:bg-sidebar transition-all",
                    focus && "shadow-lg ring-2 ring-primary/20"
                )}
            >
                <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                        <TextAreaAutosize
                            {...field}
                            placeholder="Describe what you want to create..."
                            onFocus={() => setfocus(true)}
                            onBlur={() => setfocus(false)}
                            minRows={3}
                            maxRows={8}
                            disabled={isPending}
                            className={cn(
                                "pt-4 resize-none border-none w-full outline-none bg-transparent",
                                !contentValue && "opacity-50"
                            )}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                                    e.preventDefault();
                                    form.handleSubmit(handlesubmit)(e);
                                }
                            }}
                        />
                    )}
                />
                <div className="flex gap-x-2 items-end justify-between pt-2">
                    <div className="text-[10px] text-muted-foreground font-mono">
                        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                            <span>&#8984;</span>Enter
                        </kbd>
                        &nbsp; to submit
                    </div>
                    <Button
                        className={cn("size-8 rounded-full",
                            isButtonDisabled && "bg-muted-foreground border opacity-50 cursor-not-allowed"
                        )}
                        disabled={isButtonDisabled}
                        type="submit"
                    >
                        {isPending ? (<Spinner />) : (<ArrowUpIcon className="size-4" />)}
                    </Button>
                </div>
            </form>
        </Form>
    )
}

export default MessageForm;