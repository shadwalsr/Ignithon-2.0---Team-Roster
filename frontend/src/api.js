const API_BASE = "http://127.0.0.1:8000/api";

export function getToken() {
  return localStorage.getItem("token") || "";
}

export function setToken(token) {
  localStorage.setItem("token", token);
}

export function clearToken() {
  localStorage.removeItem("token");
  localStorage.removeItem("user_email");
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = { ...options.headers };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // If not FormData, default content-type to application/json
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearToken();
    // Allow caller to handle unauthenticated state
  }

  if (!res.ok) {
    let errMessage = "An error occurred";
    try {
      const errData = await res.json();
      errMessage = errData.detail || JSON.stringify(errData);
    } catch {
      errMessage = res.statusText;
    }
    throw new Error(errMessage);
  }

  return res.json();
}

export const api = {
  // Auth
  register: (email, password) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  getMe: () => request("/auth/me"),

  // Cases
  listCases: () => request("/cases"),
  getCase: (id) => request(`/cases/${id}`),
  createCase: (title, description) =>
    request("/cases", {
      method: "POST",
      body: JSON.stringify({ title, description }),
    }),
  seedCase: () =>
    request("/cases/seed", {
      method: "POST",
    }),

  // Evidence
  getEvidence: (caseId) => request(`/cases/${caseId}/evidence`),
  uploadEvidence: (caseId, formData) =>
    request(`/cases/${caseId}/evidence`, {
      method: "POST",
      body: formData,
    }),
  updateExtraction: (caseId, evidenceId, data) =>
    request(`/cases/${caseId}/evidence/${evidenceId}/extraction`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Timeline & Reconciliation
  buildTimeline: (caseId, threshold = 20) =>
    request(`/cases/${caseId}/timeline/build?gap_threshold=${threshold}`, {
      method: "POST",
    }),

  // Incident Report
  getReport: (caseId, unredacted = false) =>
    request(`/cases/${caseId}/report?unredacted=${unredacted}`),
};
