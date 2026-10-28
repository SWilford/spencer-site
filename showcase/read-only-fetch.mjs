/** Restrict the showcase client to anonymous REST reads, even if a session is injected. */
export function readOnlyPublicFetch(origin, key, fetcher = fetch) {
    return (input, init = {}) => {
        const request = input instanceof Request ? input : null;
        const target = new URL(input instanceof URL ? input.href : typeof input === 'string' ? input : input.url);
        const method = (init.method || request?.method || 'GET').toUpperCase();
        if (target.origin !== new URL(origin).origin || !target.pathname.startsWith('/rest/v1/') || !['GET', 'HEAD'].includes(method))
            throw new Error('This portfolio demo permits public reads only.');
        const headers = new Headers(init.headers || request?.headers);
        headers.set('Authorization', `Bearer ${key}`);
        headers.set('apikey', key);
        return fetcher(input, { ...init, headers, credentials: 'omit' });
    };
}
