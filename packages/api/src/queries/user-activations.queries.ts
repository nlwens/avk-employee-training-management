import { queryOptions } from "@tanstack/react-query";

import { API, toApiError } from "../api";
import type {
  ActivateUserInput,
  UserActivation,
} from "../types/user-activation";

const getUserActivation = async (code: string): Promise<UserActivation> => {
  try {
    return await API.get<UserActivation>(`/user-activations/${code}`);
  } catch (error) {
    const apiError = toApiError(error);

    if (apiError?.statusCode === 410) {
      throw {
        ...apiError,
        statusCode: 404,
      };
    }

    throw error;
  }
};

export const userActivationQueryOptions = (code: string) =>
  queryOptions({
    queryKey: ["user-activations", code],
    queryFn: () => getUserActivation(code),
    retry: false,
  });

export const activateUser = async (
  code: string,
  input: ActivateUserInput,
): Promise<void> => {
  try {
    return await API.post<void>(`/user-activations/${code}`, input);
  } catch (error) {
    const apiError = toApiError(error);

    if (apiError?.statusCode === 410) {
      throw {
        ...apiError,
        statusCode: 404,
      };
    }

    throw error;
  }
};
