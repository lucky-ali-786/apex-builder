"use client"; // 🚨 CRITICAL: Required for Next.js App Router interactive components

import React, { useState, useMemo, useCallback, Fragment, useEffect } from "react";
import { CopyCheckIcon, CopyIcon } from "lucide-react";
import { Hint } from "./hint/Hint";
import { Button } from "@/components/ui/button";
import { CodeView } from "./CodeView";
import { TreeView } from "./TreeView";
import { convertFilesToTreeItems } from "@/lib/utils";
import {
  ResizablePanel,
  ResizableHandle,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "@/components/ui/breadcrumb";

// --- UTILS ---
function getLanguageFromExtension(filename) {
  const extension = filename.split(".").pop()?.toLowerCase();
  const languageMap = {
    js: "javascript",
    jsx: "jsx",
    ts: "typescript",
    tsx: "tsx",
    py: "python",
    html: "html",
    css: "css",
    json: "json",
    md: "markdown",
  };
  return languageMap[extension] || "text";
}

// --- SUB-COMPONENTS ---
const FileBreadCrumb = ({ filePath }) => {
  const pathSegments = filePath.split("/");
  const maxSegments = 4;

  const renderBreadCrumbItems = () => {
    if (pathSegments.length <= maxSegments) {
      return pathSegments.map((segment, index) => {
        const isLast = index === pathSegments.length - 1;
        return (
          <Fragment key={index}>
            <BreadcrumbItem>
              {isLast ? (
                <BreadcrumbPage>{segment}</BreadcrumbPage>
              ) : (
                // 🚨 FIX: Removed the typo '+' from text-muted-foreground
                <span className="text-muted-foreground">{segment}</span>
              )}
            </BreadcrumbItem>
            {!isLast && <BreadcrumbSeparator />}
          </Fragment>
        );
      });
    } else {
      const firstSegment = pathSegments[0];
      const lastSegment = pathSegments[pathSegments.length - 1];

      return (
        <>
          <BreadcrumbItem>
            <span className="text-muted-foreground">{firstSegment}</span>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbEllipsis />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem className="font-medium">
            {lastSegment}
          </BreadcrumbItem>
        </>
      );
    }
  };

  return (
    <Breadcrumb>
      <BreadcrumbList>{renderBreadCrumbItems()}</BreadcrumbList>
    </Breadcrumb>
  );
};

// --- MAIN COMPONENT ---
// 🚨 FIX: Default files to empty object {} to prevent crashes
function FileExplorer({ files = {} }) {
  const [copied, setCopied] = useState(false);
  const [selectedFile, setSelectedFile] = useState(() => {
    const fileKeys = Object.keys(files);
    return fileKeys.length > 0 ? fileKeys[0] : null;
  });

  // 🚨 FIX: Sync selected file when 'files' prop changes
  useEffect(() => {
    const fileKeys = Object.keys(files);
    // If the currently selected file no longer exists in the new files object, pick the first one
    if (fileKeys.length > 0 && (!selectedFile || !files[selectedFile])) {
      setSelectedFile(fileKeys[0]);
    } else if (fileKeys.length === 0) {
      setSelectedFile(null);
    }
  }, [files, selectedFile]);

  const treeData = useMemo(() => {
    return convertFilesToTreeItems(files);
  }, [files]);

  const handleFileSelect = useCallback(
    (filePath) => {
      if (files[filePath]) {
        setSelectedFile(filePath);
      }
    },
    [files]
  );

  const handleCopy = useCallback(() => {
    if (selectedFile && files[selectedFile]) {
      navigator.clipboard
        .writeText(files[selectedFile])
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch((error) => {
          console.error("Failed to copy:", error);
        });
    }
  }, [selectedFile, files]);

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      <ResizablePanel
        defaultSize={200}
        minSize={20}
        maxSize={250}
        className="bg-sidebar"
      >
        <div className="h-full overflow-auto">
          <TreeView
            data={treeData}
            value={selectedFile}
            onSelect={handleFileSelect}
          />
        </div>
      </ResizablePanel>
      <ResizableHandle className="w-1.5 hover:bg-primary/20 transition-colors" />
      <ResizablePanel defaultSize={80} minSize={40}>
        {selectedFile && files[selectedFile] ? (
          <div className="h-full w-full flex flex-col">
            <div className="border-b bg-sidebar/50 px-4 py-2 flex justify-between items-center gap-x-2">
              <FileBreadCrumb filePath={selectedFile} />
              <Hint text="Copy to Clipboard" side="bottom">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopy}
                  className="h-8 w-8 hover:bg-background/80"
                >
                  {copied ? (
                    <CopyCheckIcon className="size-4 text-green-500" />
                  ) : (
                    <CopyIcon className="size-4" />
                  )}
                </Button>
              </Hint>
            </div>
            <div className="flex-1 overflow-auto relative">
              <CodeView
                code={files[selectedFile]}
                lang={getLanguageFromExtension(selectedFile)}
              />
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <p className="text-sm">Select a file to view its content</p>
          </div>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

export default FileExplorer;