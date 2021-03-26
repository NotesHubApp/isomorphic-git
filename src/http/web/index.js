/* eslint-env browser */
import '../../typedefs-http.js'
import { collect } from '../../utils/collect.js'
import { fromStream } from '../../utils/fromStream'

/**
 * Perform fetch with retries
 */
async function fetchWithRetry(url, options, n = 1) {
  try {
    return await fetch(url, options)
  } catch (err) {
    if (n <= 1) throw err
    return fetchWithRetry(url, options, n - 1)
  }
}

/**
 * HttpClient
 *
 * @param {GitHttpRequest} request
 * @returns {Promise<GitHttpResponse>}
 */
export async function request({
  onProgress,
  url,
  method = 'GET',
  headers = {},
  body,
}) {
  // streaming uploads aren't possible yet in the browser
  if (body) {
    body = await collect(body)
  }
  const res = await fetchWithRetry(url, { method, headers, body }, 3)
  const iter =
    res.body && res.body.getReader
      ? fromStream(res.body)
      : [new Uint8Array(await res.arrayBuffer())]
  // convert Header object to ordinary JSON
  headers = {}
  for (const [key, value] of res.headers.entries()) {
    headers[key] = value
  }
  return {
    url: res.url,
    method: res.method,
    statusCode: res.status,
    statusMessage: res.statusText,
    body: iter,
    headers: headers,
  }
}

export default { request }
