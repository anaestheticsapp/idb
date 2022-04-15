export interface WrappedPromise<T> extends Promise<T> {
  resolve?(value?: T): void;
  reject?(err: Error): void;
}
/**
 * Create a promise that can be resolved.
 * Useful if several async functions are waiting for the same service.
 * These will all resolve once the service has completed.
 */
export function createPromise(): WrappedPromise<unknown> {
  let resolver: (value: unknown) => void;
  let rejector: (value: unknown) => void;

  const promise: WrappedPromise<unknown> = new Promise((res, rej) => {
    resolver = res;
    rejector = rej;
  })
  promise.resolve = (value) => resolver((value));
  promise.reject = rejector;
  return promise;
}
