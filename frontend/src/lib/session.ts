// Session helper for the JWT/localStorage authentication used by the app.
import { queryClient } from "./queryClient";
import { setAuthToken } from "./api";

export function beginSession(): void {
  queryClient.clear();
}

export async function endSession(redirectTo: string = "/masuk"): Promise<void> {
  setAuthToken(null);
  queryClient.clear();
  window.location.assign(redirectTo);
}
