"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, EyeIcon } from "lucide-react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import FileExplorer from "./FileExplorer.jsx";
// NAYI CHEEZ: Added useEffect
import { useState, useEffect } from "react"; 
import FragmentWeb from "./FragmentWeb.jsx";
import { Button } from "@/components/ui/button.jsx";
import Link from "next/link.js";
import { CrownIcon } from "lucide-react";
import ProjectHeader from "./Projectheader.jsx";
import MessageContainer from "@/lib/messages/components/MessageContainer.jsx";
// NAYI CHEEZ: Import the hook we just created
import { useWakeUpSandbox } from "../hooks/project.js"; 

function Projectview({ projectId }) {
  const [activeFragment, setactiveFragment] = useState(null)
  const [tabsState, setTabState] = useState("preview")

  // --- NAYI CHEEZ: Wake Up Logic ---
  const { mutateAsync: wakeUp, isPending: isWakingUp } = useWakeUpSandbox();
  const [previewUrl, setPreviewUrl] = useState("");

 useEffect(() => {
    // Whenever a fragment is selected, wake up the sandbox and get the URL
    if (activeFragment && activeFragment.files) {
      // 🚨 FIX: Align with your Vite backend environment
      const currentCode = activeFragment.files["src/App.tsx"] || activeFragment.files["App.tsx"]; 
      
      wakeUp({ projectId, currentCode })
        .then((url) => setPreviewUrl(url))
        .catch((err) => console.error("Sandbox wake error:", err));
    }
  }, [activeFragment, projectId]);
  // ---------------------------------

  return (
    <div className="h-screen">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel
          defaultSize={35}
          minSize={20}
          className="flex flex-col min-h-0"
        >
          <ProjectHeader projectId={projectId} />
          <MessageContainer
            projectId={projectId}
            activeFragment={activeFragment}
            setactiveFragment={setactiveFragment}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={65} minSize={50}>
          <Tabs className={"h-full flex flex-col"}
            defaultValue="preview"
            value={tabsState}
            onValueChange={(value) => (setTabState(value))}
          >
            <div className="w-full flex items-center p-2 border-b gap-x-2">
              <TabsList className={"h-8 p-0 border rounded-md"}>
                <TabsTrigger
                  value="preview"
                  className={"rounded-md px-3 flex items-center gap-x-2"}
                >
                  <EyeIcon className="size-4" />
                  <span>Demo</span>
                </TabsTrigger>
                <TabsTrigger
                  value="code"
                  className={"rounded-md px-3 flex items-center gap-x-2"}
                >
                  <Code className="size-4" />
                  <span>Code</span>
                </TabsTrigger>
              </TabsList>
              <div className="ml-auto flex items-center gap-x-2">
                <Button asChild size={"sm"} >
                  <Link href={"/pricing"}>
                    <CrownIcon className="size-4 mr-2" />
                    Upgrade
                  </Link>
                </Button>
              </div>
            </div>
            <TabsContent
              value="preview"
              className={"flex-1 h-[calc(100%-4rem)] overflow-hidden"}
            >
              {activeFragment ? (
                // NAYI CHEEZ: Pass previewUrl and isWakingUp down
                <FragmentWeb 
                  data={activeFragment} 
                  previewUrl={previewUrl} 
                  isWakingUp={isWakingUp} 
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Select a fragment to preview
                </div>
              )}
            </TabsContent>
            <TabsContent
              value="code"
              className={"flex-1 h-[calc(100%-4rem)] overflow-hidden"}
            >
              {activeFragment?.files ? (
               <FileExplorer files={activeFragment.files}/>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Select a fragment to view code
                </div>
              )}
            </TabsContent>
          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export default Projectview;