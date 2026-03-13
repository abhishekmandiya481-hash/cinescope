const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const api = {
  get: async (endpoint, token = null) => {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["x-auth-token"] = token;
    const res = await fetch(`${BASE_URL}${endpoint}`, { headers });
    if (!res.ok) throw new Error("API Get Error");
    return res.json();
  },
  post: async (endpoint, data, token = null) => {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["x-auth-token"] = token;
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("API Post Error");
    return res.json();
  }
};
