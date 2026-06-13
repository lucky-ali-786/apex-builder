import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { getprojectbyid, getallprojects, createProject, wakeUpSandbox,deleteProject } from "../actions/action";

export const useGetAllPros = () => {
    return useQuery({
        queryKey: ["projects"],
        queryFn: () => getallprojects()
    });
};

export const useCreatePro = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (value) => createProject(value),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] }),
            queryClient.invalidateQueries({queryKey:["status"]})
        }
    });
};

export const useGetProById = (proid) => {
     return useQuery({
        queryKey: ["projects", proid],
        queryFn: () => getprojectbyid(proid)
    });
};

export const useWakeUpSandbox = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, currentCode }) => wakeUpSandbox(projectId, currentCode),
        onSuccess: (url, variables) => {
            queryClient.invalidateQueries({ queryKey: ["projects", variables.projectId] });
        }
    });
};

export const useProjectDelete = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (proid) => deleteProject(proid),
        onSuccess: () => {
            // Delete hone ke baad saare projects ki list ko refresh kar do
            queryClient.invalidateQueries({ queryKey: ["projects"] });
        }
    });
};