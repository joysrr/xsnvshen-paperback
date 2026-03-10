import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { z } from "zod";

/**
 * Hook to fetch the API health status.
 * Uses the exact schema and path defined in the shared API contract.
 */
export function useHealth() {
  return useQuery({
    queryKey: [api.health.check.path],
    queryFn: async () => {
      try {
        const res = await fetch(api.health.check.path, { 
          method: api.health.check.method,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!res.ok) {
          throw new Error(`API returned status ${res.status}`);
        }
        
        const data = await res.json();
        
        // Validate against the shared schema
        const result = api.health.check.responses[200].safeParse(data);
        if (!result.success) {
          console.error("[Zod] Health check validation failed:", result.error.format());
          throw new Error("Invalid response format");
        }
        
        return result.data;
      } catch (error) {
        console.error("Health check failed:", error);
        throw error;
      }
    },
    // Refetch periodically to keep status updated in a dashboard scenario
    refetchInterval: 10000, 
    retry: 2,
  });
}
