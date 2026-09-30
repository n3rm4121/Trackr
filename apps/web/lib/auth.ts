import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  authResponseSchema,
  type AuthResponse,
  type LoginInput,
  type RegisterInput,
} from "@job-kanban/shared";
import { apiClient, toApiError } from "./api";

export const authKeys = {
  currentUser: ["auth", "currentUser"] as const,
};

async function postAuth(path: string, body?: unknown): Promise<AuthResponse> {
  try {
    const { data } = await apiClient.post(path, body);
    return authResponseSchema.parse(data);
  } catch (error) {
    throw toApiError(error);
  }
}

/**
 * The session is cached so navigating between routes does not re-hit
 * /auth/me. A 401 is not retried: the dashboard guard reads the error to send
 * the visitor back to /login.
 */
export const currentUserQuery = () =>
  queryOptions({
    queryKey: authKeys.currentUser,
    queryFn: async () => {
      try {
        const { data } = await apiClient.get("/auth/me");
        return authResponseSchema.parse(data);
      } catch (error) {
        throw toApiError(error);
      }
    },
    retry: false,
    staleTime: 60_000,
  });

export function useCurrentUser() {
  return useQuery(currentUserQuery());
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) => postAuth("/auth/login", input),
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.currentUser, data);
    },
  });
}

/**
 * /auth/register creates the account but opens no session, so signup is
 * followed by a login to land the user on the dashboard already signed in.
 */
export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RegisterInput) => {
      await postAuth("/auth/register", input);
      return postAuth("/auth/login", {
        email: input.email,
        password: input.password,
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.currentUser, data);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        await apiClient.post("/auth/logout");
      } finally {
        queryClient.removeQueries({ queryKey: authKeys.currentUser });
      }
    },
  });
}
