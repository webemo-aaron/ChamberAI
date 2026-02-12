export async function waitForApi(request, baseURL = "http://127.0.0.1:4100") {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    try {
      const res = await request.get(`${baseURL}/health`);
      if (res.ok()) return;
    } catch (_) {
      // ignore
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("API did not become ready in time");
}
