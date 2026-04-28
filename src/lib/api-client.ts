/** HTTP helper for Workers or custom backends; extend with base URL / auth headers. */

export async function apiGet<T>(path: string): Promise<T> {
  void path
  throw new Error('api-client: implement fetch to your Workers API base URL.')
}
