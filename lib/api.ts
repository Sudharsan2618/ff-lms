import axios, { AxiosError } from "axios"

export const api = axios.create({
  baseURL: "https://lms-be-204519078454.asia-south1.run.app/api",
  // baseURL: "http://localhost:5000/api",
  // baseURL: "https://lms-be-sqpa.onrender.com/api",
})

// Add a request interceptor to include auth token if available
api.interceptors.request.use(
  (config) => {
    // You can add auth token here if needed
    return config
  },
  (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error)
  },
)

// Add a response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle errors globally with more detailed logging
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("API Error Response:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
        }
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error("API Error Request:", {
        request: error.request,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
        }
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("API Error:", {
        message: error.message,
        name: error.name,
        stack: error.stack,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
        }
      });
    }

    // Create a more detailed error object
    const enhancedError = {
      ...error,
      _isAxiosError: true,
      message: error.message || 'An unknown error occurred',
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      } : undefined,
      request: error.request ? {
        method: error.config?.method,
        url: error.config?.url,
      } : undefined,
    };

    return Promise.reject(enhancedError);
  },
)
