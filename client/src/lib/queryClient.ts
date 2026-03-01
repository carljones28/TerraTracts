import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    const headers: Record<string, string> = {};
    
    // Always include content type for consistency if there's data
    if (data) {
      headers["Content-Type"] = "application/json";
    }
    
    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include", // Always include credentials for auth cookies
    });

    // Handle errors
    await throwIfResNotOk(res);
    
    return res;
  } catch (error) {
    console.error(`API Request Error (${method} ${url}):`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      // Get the URL from the queryKey
      const url = queryKey[0] as string;
      
      // Make the request with credentials included for auth cookies
      const res = await fetch(url, {
        credentials: "include",
      });

      // Special handling for 401 unauthorized based on options
      if (res.status === 401) {
        console.log(`Authentication required for ${url}`);
        
        if (unauthorizedBehavior === "returnNull") {
          // Return null for queries that can handle an unauthenticated state
          return null;
        }
        // Otherwise default behavior will throw
      }

      // Throw if response not ok
      await throwIfResNotOk(res);
      
      // Parse and return the response data
      return await res.json();
    } catch (error) {
      console.error(`Query error (${queryKey[0]}):`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
