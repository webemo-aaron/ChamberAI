export const API_BASE = process.env.E2E_API_BASE ?? process.env.API_BASE ?? "http://127.0.0.1:4001";
export const UI_BASE = process.env.E2E_UI_BASE ?? "http://127.0.0.1:5173";

export async function waitForApi(request, baseURL = API_BASE) {
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
