import { status } from "../actions/action";
import { useQuery } from "@tanstack/react-query";

export const useStatus=()=>{
return useQuery({
    queryKey:["status"],
    queryFn:()=>status()
})
}