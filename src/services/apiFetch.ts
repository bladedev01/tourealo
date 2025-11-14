// Simple fetch wrapper for API requests in frontend-next
export default async function apiFetch(input: RequestInfo, init?: RequestInit) {
  // Puedes agregar aquí lógica de baseURL, auth, headers, etc.
  return fetch(input, init);
}
