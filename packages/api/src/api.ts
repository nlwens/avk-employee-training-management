import axios, {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import type { ErrorCode } from "./types/error-codes";

interface RequestProps {
  endpoint: string;
  method: "get" | "post" | "put" | "patch" | "delete";
  body?: object | FormData;
  responseType?: "blob" | "json";
}

export interface DownloadResponse {
  data: Blob;
  contentDisposition?: string;
}

interface ErrorInterceptor {
  statusCode: number;
  code: ErrorCode;
  message: string | string[];
  error: string;
}

export interface ApiError {
  statusCode: number;
  code: ErrorCode;
  messages: string[];
  error: string;
}

export function getApiErrorStatusCode(error: unknown): number | undefined {
  if (typeof error === "object" && error !== null && "statusCode" in error) {
    return (error as ApiError).statusCode;
  }

  return undefined;
}

/** Returns a typed ApiError when the value has a known API error shape. */
export function toApiError(error: unknown): ApiError | undefined {
  const statusCode = getApiErrorStatusCode(error);
  if (statusCode === undefined) {
    return undefined;
  }

  return error as ApiError;
}

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

const applyBearerTokenIfExists = (config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
};

const normalizeResponseData = (response: AxiosResponse) => {
  if (response.config.responseType === "blob") {
    return {
      data: response.data as Blob,
      contentDisposition: response.headers["content-disposition"] as
        | string
        | undefined,
    } satisfies DownloadResponse;
  }

  return response.data;
};

const normalizeResponseError = async (
  error: AxiosError<ErrorInterceptor | Blob>,
) => {
  if (!error.response) {
    return Promise.reject("Error response was not provided by the server");
  }

  let errorBody = error.response.data;

  if (errorBody instanceof Blob) {
    try {
      errorBody = JSON.parse(await errorBody.text()) as ErrorInterceptor;
    } catch {
      const apiError: ApiError = {
        messages: [error.response.statusText],
        statusCode: error.response.status,
        code: 0 as ErrorCode,
        error: error.response.statusText,
      };

      return Promise.reject(apiError);
    }
  }

  const errorMessageOutput = errorBody.message;

  // cast error response message to an array of string messages, regardless of a type
  const messages = Array.isArray(errorMessageOutput)
    ? errorMessageOutput
    : [errorMessageOutput];

  const apiError: ApiError = {
    messages,
    statusCode: error.response?.status,
    code: errorBody.code,
    error: errorBody.error,
  };

  return Promise.reject(apiError);
};

axiosInstance.interceptors.request.use(applyBearerTokenIfExists);
axiosInstance.interceptors.response.use(
  normalizeResponseData,
  normalizeResponseError,
);

/**
 * A `request` function acts as a reusable handler for fetching the data based on the provided parameters: endpoint and body.
 * The function sets up the Axios object which uses a HTTP method (like GET or POST), headers to allow HTTP requests via JSON object and JWT token, and a body that will
 * be sent to the server (if request does not contain any body data, then the body will be assigned to undefined).
 * Finally, the fetch request is invoked and either response data or error is returned.
 * @returns data from the API in JSON format.
 */
const request = async <T>({
  endpoint,
  method,
  body,
  responseType,
}: RequestProps): Promise<T> => {
  const response: T = await axiosInstance({
    method,
    url: endpoint,
    data: body,
    responseType,
  });

  return response;
};

/**
 *
 * Usage:
 * ```
 * // example on how to use API in combination with TanStack Query
 * const { data, error, isError } = useQuery({
 *    queryKey: ["groups"],
 *    queryFn: () => API.get<GroupType[]>("/groups")
 * });
 * ```
 */
export class API {
  static get = <T>(endpoint: string) =>
    request<T>({
      endpoint,
      method: "get",
    });

  static post = <T>(endpoint: string, body: object | FormData) =>
    request<T>({
      endpoint,
      method: "post",
      body,
    });

  static put = <T>(endpoint: string, body: object | FormData) =>
    request<T>({
      endpoint,
      method: "put",
      body,
    });

  static patch = <T>(endpoint: string, body: object | FormData) =>
    request<T>({
      endpoint,
      method: "patch",
      body,
    });

  static delete = <T>(endpoint: string) =>
    request<T>({
      endpoint,
      method: "delete",
    });

  static download = (endpoint: string) =>
    request<DownloadResponse>({
      endpoint,
      method: "get",
      responseType: "blob",
    });
}
