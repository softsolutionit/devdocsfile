export function debouncePromise(fn, delay) {
  let timer;
  let resolvers = [];

  return (...args) => {
    clearTimeout(timer);

    return new Promise((resolve) => {
      resolvers.push(resolve);

      timer = setTimeout(async () => {
        const result = await fn(...args);
        resolvers.forEach((r) => r(result));
        resolvers = [];
      }, delay);
    });
  };
}
  