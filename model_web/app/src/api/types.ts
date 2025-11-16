export type ModelAPIResponse<T> = {
  success: boolean;
  data: T;
  error?: string;
};
