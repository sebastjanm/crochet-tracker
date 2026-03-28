/**
 * Async Result Types
 *
 * Consistent error-first pattern for all async operations.
 * Every async hook should return { data, error, status }.
 *
 * @example
 * ```tsx
 * // In a hook
 * const [result, setResult] = useState<AsyncResult<User[]>>({ status: 'idle' });
 *
 * const fetchUsers = async () => {
 *   setResult({ status: 'loading' });
 *   try {
 *     const users = await api.getUsers();
 *     setResult({ status: 'success', data: users });
 *   } catch (error) {
 *     setResult({ status: 'error', error: error as Error });
 *   }
 * };
 *
 * // In a component
 * const { data, error, status } = result;
 * if (status === 'loading') return <Skeleton />;
 * if (status === 'error') return <ErrorView error={error} />;
 * if (status === 'success') return <UserList users={data} />;
 * ```
 */

/**
 * Status of an async operation
 */
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Result of an async operation with discriminated union for type safety.
 * Use this for stateful async data (hooks that maintain state).
 */
export type AsyncResult<T> =
  | { status: 'idle'; data?: undefined; error?: undefined }
  | { status: 'loading'; data?: undefined; error?: undefined }
  | { status: 'success'; data: T; error?: undefined }
  | { status: 'error'; data?: undefined; error: Error };

/**
 * Result of a single async function call.
 * Use this for one-shot async operations (like fetch functions).
 *
 * @example
 * ```tsx
 * async function saveProject(project: Project): Promise<ActionResult<Project>> {
 *   try {
 *     const saved = await api.save(project);
 *     return { success: true, data: saved };
 *   } catch (error) {
 *     return { success: false, error: error as Error };
 *   }
 * }
 *
 * // Usage
 * const result = await saveProject(project);
 * if (result.success) {
 *   showToast('Saved!', 'success');
 *   navigate(result.data.id);
 * } else {
 *   showToast(result.error.message, 'error');
 * }
 * ```
 */
export type ActionResult<T = void> =
  | { success: true; data: T; error?: undefined }
  | { success: false; data?: undefined; error: Error };

/**
 * Helper to create a success result
 */
export function success<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

/**
 * Helper to create an error result
 */
export function failure(error: unknown): ActionResult<never> {
  return {
    success: false,
    error: error instanceof Error ? error : new Error(String(error)),
  };
}

/**
 * Helper to wrap an async function with error handling
 *
 * @example
 * ```tsx
 * const result = await wrapAsync(() => api.saveProject(project));
 * if (result.success) {
 *   // result.data is typed
 * } else {
 *   // result.error is Error
 * }
 * ```
 */
export async function wrapAsync<T>(
  fn: () => Promise<T>
): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return success(data);
  } catch (error) {
    return failure(error);
  }
}

/**
 * Initial state for AsyncResult
 */
export function idle<T>(): AsyncResult<T> {
  return { status: 'idle' };
}

/**
 * Loading state for AsyncResult
 */
export function loading<T>(): AsyncResult<T> {
  return { status: 'loading' };
}

/**
 * Success state for AsyncResult
 */
export function successState<T>(data: T): AsyncResult<T> {
  return { status: 'success', data };
}

/**
 * Error state for AsyncResult
 */
export function errorState<T>(error: unknown): AsyncResult<T> {
  return {
    status: 'error',
    error: error instanceof Error ? error : new Error(String(error)),
  };
}
