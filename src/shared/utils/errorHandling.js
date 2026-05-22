export function getErrorMessage(error, fallback) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function withFriendlyError(asyncAction, fallbackMessage) {
  return async (...args) => {
    try {
      return await asyncAction(...args);
    } catch (error) {
      throw new Error(getErrorMessage(error, fallbackMessage), { cause: error });
    }
  };
}
