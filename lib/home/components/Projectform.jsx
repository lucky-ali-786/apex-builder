"use client"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import TextAreaAutosize from "react-textarea-autosize";
import { ArrowUpIcon, Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import { Form, FormField } from "@/components/ui/form";
import z from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCreatePro } from "@/lib/projects/hooks/project";
import { Spinner } from "@/components/ui/spinner";

const formSchema = z.object({
    content: z.string().min(1, "Description is required").max(1000, "Description must be less than 1000 characters")
})

const PROJECT_TEMPLATES = [
  {
    emoji: "🎬",
    title: "Build a Netflix clone",
    prompt: "Build a Netflix-style homepage with a hero banner (use a nice, dark-mode compatible gradient here), movie sections, responsive cards, and a modal for viewing details using mock data and local state. Use dark mode.",
  },
  {
    emoji: "📝",
    title: "Build a Trello-like Kanban board",
    prompt: "Create a responsive Kanban board with columns for Todo, In Progress, and Done. Implement smooth drag-and-drop functionality for cards, inline editing for card titles, and a clean, minimalist interface using a subtle gray background.",
  },
  {
    emoji: "🎵",
    title: "Build a Spotify-inspired music player dashboard",
    prompt: "Design a sleek sidebar navigation with a main content area showing recently played tracks, featured playlists, and a persistent bottom audio player bar with play, pause, skip controls, and a simulated progress slider. Use deep dark zinc theme colors.",
  },
  {
    emoji: "📊",
    title: "Build an AI analytics dashboard",
    prompt: "Create a premium dashboard featuring a grid of statistics cards (e.g., API usage, cost, response latency) with clean line charts, a recent requests table with status badges, and an elegant side panel for quick configuration. Aim for a high-end, clean design language.",
  },
  {
    emoji: "💬",
    title: "Build a Discord-style chat interface",
    prompt: "Design a multi-column layout showing a vertical server icon list, a channels sidebar panel with collapsible categories, and a main real-time scrollable chat container with message groups, hovering action toolbars, and an absolute positioned bottom message input field.",
  },
  {
    emoji: "🛒",
    title: "Build an e-commerce product grid & cart drawer",
    prompt: "Construct a modern product grid layout with multi-attribute filtering sidebars, a sorting dropdown, hover animations on product cards, and a slide-out right sheet cart drawer displaying selected items, subtotal calculation, and an animated checkout button.",
  },
  {
    emoji: "📅",
    title: "Build a Notion-style calendar scheduler",
    prompt: "Build a highly interactive monthly calendar view grid. Allow users to click on specific date squares to pop open a small modal to schedule and add colorful event blocks that span across a clean white or dark mode workspace layout.",
  },
  {
    emoji: "🎨",
    title: "Build a collaborative digital whiteboard",
    prompt: "Design a full-screen canvas interface for a vector drawing app. Include a floating toolbar widget for selecting tools (pen, rectangle, circle, eraser), a stroke width slider, a color picker palette, and a clear-canvas action button. Optimize for a clean, modern grid-background style.",
  },
];

function Projectform() {
    const [focus, setfocus] = useState(false);
    const { mutateAsync, isPending } = useCreatePro();
    const router = useRouter();
    
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            content: ""
        },
        mode: "onChange"
    });

    const handletemplate = (prompt) => {
        form.setValue("content", prompt, { shouldValidate: true });
    }

    const handlesubmit = async (values) => {
        try {
            const res = await mutateAsync(values.content);
            router.push(`/projects/${res.id}`);
            toast.success("Project created successfully");
            form.reset();
        } catch (error) {
            toast.error("Failed to create project");
        }
    }

    // 🚨 FIXED LOGIC: Disable if pending, OR if content is totally empty
    const contentValue = form.watch("content") || "";
    const isButtonDisabled = isPending || contentValue.trim().length === 0;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {PROJECT_TEMPLATES.map((template, index) => (
                    <button
                        key={index}
                        onClick={() => handletemplate(template.prompt)}
                        className="group relative p-4 rounded-xl border bg-card hover:bg-accent/50 transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md hover:border-primary/30"
                    >
                        <div className="flex flex-col gap-2">
                            <span className="text-3xl" role="img" aria-label={template.title}>
                                {template.emoji}
                            </span>
                            <h3 className="text-sm font-medium group-hover:text-primary transition-colors">
                                {template.title}
                            </h3>
                        </div>
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </button>
                ))}
            </div>
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        Or describe your own idea
                    </span>
                </div>
            </div>
            <Form {...form}>
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
                                className={cn(
                                    "pt-4 resize-none border-none w-full outline-none bg-transparent",
                                    !contentValue && "opacity-50" // Removed unconditional opacity-50
                                )}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                                        e.preventDefault();
                                        // 🚨 FIXED: use 'handlesubmit' not 'onSubmit'
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
        </div>
    )
}

export default Projectform;