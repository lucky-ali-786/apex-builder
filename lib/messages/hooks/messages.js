import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createMessage, getmessages, cancelAgentJob } from "../actions/action";

export const prefetchMessage = async(queryClient , projectId)=>{
  await queryClient.prefetchQuery({
    queryKey:["messages" , projectId],
    queryFn:()=>getmessages(projectId),
    staleTime:10000
  })
}

export const useGetMessages = (projectId) => {
  return useQuery({
    queryKey: ["messages", projectId],
    queryFn: () => getmessages(projectId),
    staleTime: 10000,
    refetchInterval: (data) => {
      return data?.length ? 5000 : false;
    }
  })
}

export const useCreateMessages = (projectId) => {
  const queryClient = useQueryClient();

  return useMutation({
    // 🚨 CHANGE: Yahan ab hum 'payload' object receive kar rahe hain jisme { content, jobId } hoga
    mutationFn: (payload) => createMessage(payload, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["messages", projectId]
      })
      queryClient.invalidateQueries({
        queryKey: ["status"]
      })
    }
  });
}

// Cancel Hook for TanStack Query
export const useCancelMessage = (projectId) => {
  const queryClient = useQueryClient();

  return useMutation({
    // Isme hum component se jobId paas karenge
    mutationFn: (jobId) => cancelAgentJob(jobId, projectId),
    onSuccess: () => {
      // Background job cancel hote hi chat list ko refetch karo taaki "Cancelled by user" message dikhe
      queryClient.invalidateQueries({
        queryKey: ["messages", projectId]
      })
      // Status ko bhi invalidate karo taaki spinner/loading state ruk jaye
      queryClient.invalidateQueries({
        queryKey: ["status"]
      })
    }
  });
}