import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  authResponseSchema,
  passwordActionResponseSchema,
  type AuthResponse,
  type ForgotPasswordInput,
  type LoginInput,
  type PasswordActionResponse,
  type RegisterInput,
  type ResetPasswordInput,
} from "@trackr/shared";
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

async function postPasswordAction(
  path: string,
  body: unknown,
): Promise<PasswordActionResponse> {
  try {
    const { data } = await apiClient.post(path, body);
    return passwordActionResponseSchema.parse(data);
  } catch (error) {
    throw toApiError(error);
  }
}

/**
 * The session is cached so navigating between routes does not re-hit
 * /auth/me. A 401 first runs the refresh flow (see api.ts): only when the
 * refresh token is dead too does the error reach the dashboard guard, which
 * sends the visitor back to /login.
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

// register and login the users
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

export function useForgotPassword() {
  return useMutation({
    mutationFn: (input: ForgotPasswordInput) =>
      postPasswordAction("/auth/forgot-password", input),
  });
}

/**
 * The server ends every session for the user as part of the reset, so the
 * cached user is dropped too. Otherwise someone resetting a password from a
 * shared browser would keep seeing a signed-in dashboard until a refetch.
 */
export function useResetPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ResetPasswordInput) =>
      postPasswordAction("/auth/reset-password", input),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: authKeys.currentUser });
    },
  });
}
