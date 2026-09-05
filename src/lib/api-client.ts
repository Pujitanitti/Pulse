export interface ApiErrorShape {
  error: { message: string; fieldErrors?: Record<string, string[]> };
}

export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await res.json();

  if (!res.ok) {
    const err = json as ApiErrorShape;
    const message = err.error?.message ?? "Something went wrong. Please try again.";
    const error = new Error(message) as Error & { fieldErrors?: Record<string, string[]> };
    error.fieldErrors = err.error?.fieldErrors;
    throw error;
  }

  return (json as { data: T }).data;
}
