"use client";
import { useGetAllPros, useProjectDelete } from "@/lib/projects/hooks/project";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { FolderKanban, Calendar, ArrowRight, Trash2, AlertTriangle } from "lucide-react";
import Image from 'next/image';
import React, { useState } from 'react';
import Link from "next/link";

function ProjectList() {
  const { data: projects, isPending } = useGetAllPros();
  const { mutate: deletePro, isPending: isDeleting } = useProjectDelete();
  
  // 🚨 STATE: Popup handle karne ke liye
  const [projectToDelete, setProjectToDelete] = useState(null);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // 1. Popup open karne ka function
  const handleDeleteClick = (e, projectId) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    setProjectToDelete(projectId);
  };

  // 2. Confirm aur delete karne ka function
  const confirmDelete = () => {
    if (projectToDelete) {
      deletePro(projectToDelete);
      setProjectToDelete(null); // Delete trigger hote hi modal close kar do
    }
  };

  if (isPending) {
    return (
      <div className="w-full mt-16">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
          Your Projects
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return null;
  }

  return (
    <div className="w-full mt-16 relative">
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
        Your Projects
      </h2>

      {/* DESKTOP GRID */}
      <div className="hidden lg:grid grid-cols-3 gap-4 max-w-6xl mx-auto">
        {projects.map((project) => (
          <Link href={`/projects/${project.id}`} key={project.id}>
            <Card
              className="group hover:shadow-xl transition-all duration-300 border-zinc-800/50 hover:border-emerald-500/50 cursor-pointer bg-zinc-900/30 backdrop-blur-sm overflow-hidden"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                    <FolderKanban className="w-5 h-5 text-emerald-500" />
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDeleteClick(e, project.id)}
                      disabled={isDeleting}
                      className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all disabled:opacity-50"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
                <CardTitle className="text-lg text-zinc-100 group-hover:text-emerald-400 transition-colors line-clamp-1">
                  {project.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-zinc-400">
                  <Calendar className="w-3.5 h-3.5 mr-2" />
                  <span>{formatDate(project.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* MOBILE CAROUSEL */}
      <div className="lg:hidden max-w-4xl mx-auto px-4">
        <Carousel opts={{ align: "start", loop: true }} className="w-full">
          <CarouselContent className="-ml-4">
            {projects.map((project) => (
              <Link href={`/projects/${project.id}`} key={project.id}>
                <CarouselItem className="pl-4 md:basis-1/2">
                  <Card className="group hover:shadow-xl transition-all duration-300 border-zinc-800/50 hover:border-emerald-500/50 cursor-pointer bg-zinc-900/30 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2.5 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                          <FolderKanban className="w-5 h-5 text-emerald-500" />
                        </div>
                        
                        {/* Action Buttons (Mobile) */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleDeleteClick(e, project.id)}
                            disabled={isDeleting}
                            className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                      <CardTitle className="text-lg text-zinc-100 group-hover:text-emerald-400 transition-colors line-clamp-1">
                        {project.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-sm text-zinc-400">
                        <Calendar className="w-3.5 h-3.5 mr-2" />
                        <span>{formatDate(project.createdAt)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              </Link>
            ))}
          </CarouselContent>
          <CarouselPrevious className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100" />
          <CarouselNext className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100" />
        </Carousel>
      </div>

      {/* 🚨 CUSTOM DELETE CONFIRMATION MODAL */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-zinc-100 mb-2">Delete Project?</h3>
              <p className="text-sm text-zinc-400 mb-6">
                Are you sure you want to delete this project? This action cannot be undone and will permanently destroy the active sandbox and data.
              </p>
              <div className="flex items-center gap-3 w-full">
                <button 
                  onClick={() => setProjectToDelete(null)} 
                  className="flex-1 py-2.5 rounded-lg border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete} 
                  className="flex-1 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors font-medium shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectList;