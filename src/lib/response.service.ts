export interface ErrorResponse {
  error: string;
}

export class ResponseService {
  static success<T>(c: any, data: T, status: number = 200) {
    return c.json(data, status);
  }

  static error(c: any, message: string, status: number = 400) {
    const response: ErrorResponse = { error: message };
    return c.json(response, status);
  }
}
