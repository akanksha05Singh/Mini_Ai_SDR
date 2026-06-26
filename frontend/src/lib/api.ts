const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

/**
 * Custom fetch client wrapper that handles:
 * 1. Base URL prepending.
 * 2. Authorization Bearer header injection from localStorage.
 * 3. Default JSON content headers.
 * 4. Error response mapping and automatic redirects on 401 Unauthorized status.
 */
export async function apiRequest<T>(
  path: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body: Record<string, unknown> | FormData | null = null,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE}${path}`;
  
  const headers = new Headers(options.headers || {});
  
  // Set default JSON Content-Type if a body is present and it is not FormData
  if (body && !(body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  
  // Inject JWT Token from localStorage if running client-side
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }
  
  const fetchOptions: RequestInit = {
    ...options,
    method,
    headers,
  };
  
  if (body) {
    fetchOptions.body = body instanceof FormData ? body : JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, fetchOptions);
    const status = response.status;
    
    // Handle 204 No Content response
    if (status === 204) {
      return { data: null, error: null, status };
    }
    
    let responseData: unknown = null;
    const text = await response.text();
    if (text) {
      try {
        responseData = JSON.parse(text);
      } catch {
        responseData = text; // Fallback to raw text if not valid JSON
      }
    }
    
    if (!response.ok) {
      // Auto redirect to login on 401 Unauthorized (unless we are already attempting to authenticate)
      if (status === 401 && typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      
      let errorMsg = `HTTP Request failed with status ${status}`;
      if (responseData && typeof responseData === "object") {
        const obj = responseData as Record<string, unknown>;
        if (typeof obj.detail === "string") {
          errorMsg = obj.detail;
        } else if (typeof obj.message === "string") {
          errorMsg = obj.message;
        }
      } else if (typeof responseData === "string") {
        errorMsg = responseData;
      }
      
      return { data: null, error: errorMsg, status };
    }
    
    return { data: responseData as T, error: null, status };
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "A network connection error occurred.";
    return {
      data: null,
      error: errorMsg,
      status: 0
    };
  }
}
