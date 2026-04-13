export const DEFAULT_API_ERROR_MESSAGE = "Something went wrong. Please try again.";

export const normalizeApiError = (error) => {
  if (error?.message && error?.status) {
    return error;
  }

  const status = error?.response?.status ?? null;
  const data = error?.response?.data ?? null;
  const message =
    data?.message ||
    data?.error ||
    error?.message ||
    DEFAULT_API_ERROR_MESSAGE;

  return {
    status,
    data,
    message,
    cause: error,
  };
};

export const logApiError = (error) => {
  const normalizedError = normalizeApiError(error);
  const statusLabel = normalizedError.status ? ` (${normalizedError.status})` : "";
  console.error(
    `[api]${statusLabel} ${normalizedError.message}`,
    normalizedError.data ?? normalizedError.cause ?? normalizedError
  );

  return normalizedError;
};

export const getApiErrorMessage = (
  error,
  fallbackMessage = DEFAULT_API_ERROR_MESSAGE
) => normalizeApiError(error)?.message || fallbackMessage;

export const isNotFoundError = (error) => normalizeApiError(error)?.status === 404;

