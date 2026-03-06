export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function errorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof ApiError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof Error && error.message.startsWith("Invalid ")) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json(
    {
      error: fallbackMessage,
      details: error instanceof Error ? error.message : "Unknown error"
    },
    { status: 500 }
  );
}
