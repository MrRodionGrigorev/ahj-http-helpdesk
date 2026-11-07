export default async function createRequest({ url, method = 'GET', data }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, {
      method,
      headers: data === undefined ? {} : { 'Content-Type': 'application/json' },
      body: data === undefined ? undefined : JSON.stringify(data),
      signal: controller.signal,
      cache: 'no-store'
    });
    if (response.status === 204) return null;
    const text = await response.text();
    let result;
    try {
      result = text ? JSON.parse(text) : null;
    } catch (_error) {
      throw new Error('Сервер вернул некорректный ответ. Попробуйте ещё раз.');
    }
    if (!response.ok) {
      throw new Error(result?.message || `Не удалось выполнить запрос (HTTP ${response.status})`);
    }
    return result;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('Сервер долго не отвечает. Попробуйте ещё раз.');
    if (error instanceof TypeError) {
      throw new Error('Не удалось связаться с сервером. Проверьте, что API запущен.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
