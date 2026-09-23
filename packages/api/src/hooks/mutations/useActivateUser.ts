import { useMutation } from "@tanstack/react-query";

import type { ApiError } from "../../api";
import { activateUser } from "../../queries/user-activations.queries";
import type { ActivateUserInput } from "../../types/user-activation";

interface ActivateUserVariables extends ActivateUserInput {
  code: string;
}

export const useActivateUser = () =>
  useMutation<void, ApiError, ActivateUserVariables>({
    mutationFn: ({ code, password }) => activateUser(code, { password }),
  });
