export type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
  error: undefined;
  timestamp: string;
};

export type ApiFailure = {
  success: false;
  message: string;
  data: undefined;
  error: unknown;
  timestamp: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type AuthUser = {
  id: string;
  email: string;
};
