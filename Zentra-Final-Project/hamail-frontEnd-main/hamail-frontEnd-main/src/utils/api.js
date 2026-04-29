// API client for backend connection
const API_BASE_URL = "https://api.hellozentra.com/v1"

// Normalise any date value to "YYYY-MM-DD" string expected by the backend.
const toDateStr = (date) => {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().split("T")[0];
};

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get auth token from localStorage
  getToken() {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessToken");
    }
    return null;
  }

  // Set auth tokens
  setTokens(accessToken, refreshToken) {
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
    }
  }

  // Clear auth tokens
  clearTokens() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }
  }

  // Generic fetch wrapper with auth
  async fetch(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "69420",
      ...options.headers,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);

      // Handle 401 - try to refresh token
      if (response.status === 401 && token) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry original request with new token
          headers["Authorization"] = `Bearer ${this.getToken()}`;
          const retryResponse = await fetch(`${this.baseURL}${endpoint}`, {
            ...options,
            headers,
          });
          return this.handleResponse(retryResponse);
        } else {
          // Refresh failed, clear tokens and redirect to login
          this.clearTokens();
          if (typeof window !== "undefined") {
            window.location.href = "/auth/login";
          }
          throw new Error("Authentication failed");
        }
      }

      return this.handleResponse(response);
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  async handleResponse(response) {
    const contentType = response.headers.get("content-type");

    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }

    // Parse JSON response
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();

      if (!response.ok) {
        const error = new Error(
          data.message || `API Error: ${response.status}`
        );
        error.status = response.status;
        throw error;
      }

      return data;
    }

    // Handle non-JSON responses
    if (!response.ok) {
      const error = new Error(`API Error: ${response.status}`);
      error.status = response.status;
      throw error;
    }

    return response.text();
  }

  // Auth endpoints
  async login(email, password) {
    const data = await this.fetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (data.tokens) {
      this.setTokens(data.tokens.access.token, data.tokens.refresh.token);
    }

    return data;
  }

  async register(name, email, password) {
    const data = await this.fetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });

    if (data.tokens) {
      this.setTokens(data.tokens.access.token, data.tokens.refresh.token);
    }

    return data;
  }

  async sendVerificationEmail() {
    const token = this.getToken();
    if (!token) {
      const error = new Error("Authentication required");
      error.status = 401;
      throw error;
    }
    return this.fetch("/auth/send-verification-email", {
      method: "POST",
    });
  }

  async verifyEmail(token) {
    if (!token) {
      throw new Error("Missing verification token");
    }

    return this.fetch(`/auth/verify-email?token=${encodeURIComponent(token)}`, {
      method: "POST",
    });
  }

  async logout() {
    const refreshToken =
      typeof window !== "undefined"
        ? localStorage.getItem("refreshToken")
        : null;

    if (refreshToken) {
      try {
        await this.fetch("/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refreshToken }),
        });
      } catch (error) {
        console.error("Logout error:", error);
      }
    }

    this.clearTokens();
  }

  async refreshToken() {
    const refreshToken =
      typeof window !== "undefined"
        ? localStorage.getItem("refreshToken")
        : null;

    if (!refreshToken) {
      return false;
    }

    try {
      const data = await fetch(`${this.baseURL}/auth/refresh-tokens`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      const result = await data.json();

      if (result.access && result.refresh) {
        this.setTokens(result.access.token, result.refresh.token);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Token refresh error:", error);
      return false;
    }
  }

  async forgotPassword(email) {
    const response = await fetch(`${this.baseURL}/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }

    // Handle errors
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const apiError = new Error(error.message || "Failed to send reset email");
      apiError.status = response.status;
      throw apiError;
    }

    return null;
  }

  async resetPassword(token, password) {
    const response = await fetch(
      `${this.baseURL}/auth/reset-password?token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      }
    );

    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }

    // Handle errors
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const apiError = new Error(
        error.message || "Failed to reset password"
      );
      apiError.status = response.status;
      throw apiError;
    }

    return null;
  }

  // Dashboard endpoints
  async getDashboard(period = "MONTH") {
    return this.fetch(`/dashboard?period=${period}`);
  }

  async getDashboardSummary(period = "MONTH", date = null) {
    const dateParam = date ? `&date=${toDateStr(date)}` : "";
    return this.fetch(`/dashboard/summary?period=${period}${dateParam}`);
  }

  // Analysis endpoints
  async getPsychologicalState() {
    return this.fetch("/analysis/state");
  }

  async getForecast(session) {
    const query = session ? `?session=${session}` : "";
    return this.fetch(`/analysis/forecast${query}`);
  }

  async getInsights(period = "MONTH") {
    return this.fetch(`/analysis/insights?period=${period}`);
  }

  async getHistory(startDate, endDate, limit = 50) {
    let query = `?limit=${limit}`;
    if (startDate) query += `&startDate=${startDate}`;
    if (endDate) query += `&endDate=${endDate}`;
    return this.fetch(`/analysis/history${query}`);
  }

  // Trades endpoints
  async getTrades(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.fetch(`/trades${queryString ? "?" + queryString : ""}`);
  }

  async getTrade(id) {
    return this.fetch(`/trades/${id}`);
  }

  async createTrade(tradeData) {
    return this.fetch("/trades", {
      method: "POST",
      body: JSON.stringify(tradeData),
    });
  }

  async updateTrade(id, tradeData) {
    return this.fetch(`/trades/${id}`, {
      method: "PUT",
      body: JSON.stringify(tradeData),
    });
  }

  async deleteTrade(id) {
    return this.fetch(`/trades/${id}`, {
      method: "DELETE",
    });
  }

  async bulkImportTrades(trades) {
    return this.fetch("/trades/bulk", {
      method: "POST",
      body: JSON.stringify({ trades }),
    });
  }

  // Trading Plan endpoints
  async getTradingPlanStatus() {
    return this.fetch("/trading-plan/status");
  }

  async getTradingPlan() {
    return this.fetch("/trading-plan");
  }

  async createOrUpdateTradingPlan(planData) {
    return this.fetch("/trading-plan", {
      method: "POST",
      body: JSON.stringify(planData),
    });
  }

  async deleteTradingPlan() {
    return this.fetch("/trading-plan", {
      method: "DELETE",
    });
  }

  // MT5 endpoints
  async connectMT5(accountId, server, password) {
    return this.fetch("/mt5/connect", {
      method: "POST",
      body: JSON.stringify({ accountId, server, password }),
    });
  }

  async syncMT5Trades(fromDate) {
    const body = fromDate
      ? {
          fromDate:
            fromDate instanceof Date
              ? fromDate.toISOString()
              : typeof fromDate === "string"
              ? fromDate
              : new Date(fromDate).toISOString(),
        }
      : {};
    return this.fetch("/mt5/sync", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async getMT5Status() {
    return this.fetch("/mt5/status");
  }

  async disconnectMT5() {
    return this.fetch("/mt5/disconnect", {
      method: "DELETE",
    });
  }

  // ─── MT5 Data Expansion API Methods ─────────────────────────────

  async getAccountFull() {
    return this.fetch("/mt5/account/full");
  }

  async getSymbols(group = null) {
    const query = group ? `?group=${encodeURIComponent(group)}` : "";
    return this.fetch(`/mt5/symbols${query}`);
  }

  async getSymbolDetail(symbolName) {
    return this.fetch(`/mt5/symbols/${encodeURIComponent(symbolName)}`);
  }

  async getPendingOrders() {
    return this.fetch("/mt5/orders/pending");
  }

  async getOrderHistory(from = null, to = null) {
    const params = [];
    if (from) params.push(`from=${encodeURIComponent(from)}`);
    if (to) params.push(`to=${encodeURIComponent(to)}`);
    const query = params.length > 0 ? `?${params.join("&")}` : "";
    return this.fetch(`/mt5/orders/history${query}`);
  }

  async getPriceHistory(symbol, timeframe = "H1", count = 500) {
    const params = [`symbol=${encodeURIComponent(symbol)}`, `timeframe=${timeframe}`, `count=${count}`];
    return this.fetch(`/mt5/price-history?${params.join("&")}`);
  }

  async getTickData(symbol, count = 1000) {
    return this.fetch(`/mt5/ticks?symbol=${encodeURIComponent(symbol)}&count=${count}`);
  }

  async getTerminalInfo() {
    return this.fetch("/mt5/terminal");
  }

  async getPerformance(from = null) {
    const query = from ? `?from=${encodeURIComponent(from)}` : "";
    return this.fetch(`/mt5/performance${query}`);
  }

  async fullSyncV2(fromDate = null) {
    const body = fromDate ? { fromDate } : {};
    return this.fetch("/mt5/full-sync-v2", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }


  // User endpoints
  async getUser(userId) {
    return this.fetch(`/users/${userId}`);
  }

  async getCurrentUser() {
    return this.fetch("/users/me");
  }

  // Health check
  async healthCheck() {
    return this.fetch("/health");
  }

  // Zentra V2 endpoints - use v2 base URL (same server as V1, just /v2 path)
  async fetchV2(endpoint, options = {}) {
    const token = this.getToken();
    const v2BaseURL = this.baseURL.replace("/v1", "/v2");
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(`${v2BaseURL}${endpoint}`, config);

      // Handle 401 - try to refresh token
      if (response.status === 401 && token) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry original request with new token
          const retryHeaders = {
            ...headers,
            Authorization: `Bearer ${this.getToken()}`,
          };
          const retryResponse = await fetch(`${v2BaseURL}${endpoint}`, {
            ...options,
            headers: retryHeaders,
          });
          return this.handleResponse(retryResponse);
        } else {
          // Refresh failed, clear tokens and redirect to login
          this.clearTokens();
          if (typeof window !== "undefined") {
            window.location.href = "/auth/login";
          }
          throw new Error("Authentication failed");
        }
      }

      return this.handleResponse(response);
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  // Zentra V2 endpoints
  async getMentalBattery(date = null) {
    const query = date ? `?date=${toDateStr(date)}` : "";
    return this.fetchV2(`/zentra/mental-battery${query}`);
  }

  async getPlanControl(date = null) {
    const query = date ? `?date=${toDateStr(date)}` : "";
    return this.fetchV2(`/zentra/plan-control${query}`);
  }

  async getBehaviorHeatmap(date = null) {
    const query = date ? `?date=${toDateStr(date)}` : "";
    return this.fetchV2(`/zentra/behavior-heatmap${query}`);
  }

  async getPsychologicalRadar(date = null) {
    const query = date ? `?date=${toDateStr(date)}` : "";
    return this.fetchV2(`/zentra/psychological-radar${query}`);
  }

  async getBreathworkSuggestion(date = null) {
    const query = date ? `?date=${toDateStr(date)}` : "";
    return this.fetchV2(`/zentra/breathwork-suggestion${query}`);
  }

  async getPerformanceWindow(date = null) {
    const query = date ? `?date=${toDateStr(date)}` : "";
    return this.fetchV2(`/zentra/performance-window${query}`);
  }

  async getConsistencyTrend(days = "7", date = null) {
    const endDate = date ? new Date(date) : new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - parseInt(days));
    return this.getConsistencyTrendHistory(
      startDate.toISOString(),
      endDate.toISOString()
    );
  }

  async getBehaviorHeatmapHistory(startDate, endDate) {
    const params = [];
    if (startDate) {
      const dateStr = startDate instanceof Date ? startDate.toISOString() : startDate;
      params.push(`startDate=${dateStr.replace(/\.\d{3}Z$/, 'Z')}`);
    }
    if (endDate) {
      const dateStr = endDate instanceof Date ? endDate.toISOString() : endDate;
      params.push(`endDate=${dateStr.replace(/\.\d{3}Z$/, 'Z')}`);
    }
    const query = params.length > 0 ? `?${params.join('&')}` : '';
    return this.fetchV2(`/zentra/behavior-heatmap/history${query}`);
  }

  async getConsistencyTrendHistory(startDate, endDate) {
    const params = [];
    if (startDate) {
      const dateStr = startDate instanceof Date ? startDate.toISOString() : startDate;
      params.push(`startDate=${dateStr.replace(/\.\d{3}Z$/, 'Z')}`);
    }
    if (endDate) {
      const dateStr = endDate instanceof Date ? endDate.toISOString() : endDate;
      params.push(`endDate=${dateStr.replace(/\.\d{3}Z$/, 'Z')}`);
    }
    const query = params.length > 0 ? `?${params.join('&')}` : '';
    return this.fetchV2(`/zentra/consistency-trend/history${query}`);
  }

  async getDailyQuote(date = null) {
    const query = date ? `?date=${toDateStr(date)}` : "";
    return this.fetchV2(`/zentra/daily-quote${query}`);
  }

  // ─── Behavioral Analysis API (Phase 2) ─────────────────────────
  async getRevengeTrading(date = null, startDate = null, endDate = null) {
    const params = [];
    if (date) params.push(`date=${toDateStr(date)}`);
    if (startDate) params.push(`startDate=${toDateStr(startDate)}`);
    if (endDate) params.push(`endDate=${toDateStr(endDate)}`);
    const query = params.length > 0 ? `?${params.join("&")}` : "";
    return this.fetch(`/behavior/revenge-trading${query}`);
  }

  async getEarlyExits(date = null, startDate = null, endDate = null) {
    const params = [];
    if (date) params.push(`date=${toDateStr(date)}`);
    if (startDate) params.push(`startDate=${toDateStr(startDate)}`);
    if (endDate) params.push(`endDate=${toDateStr(endDate)}`);
    const query = params.length > 0 ? `?${params.join("&")}` : "";
    return this.fetch(`/behavior/early-exits${query}`);
  }

  async getOvertrading(date = null, startDate = null, endDate = null) {
    const params = [];
    if (date) params.push(`date=${toDateStr(date)}`);
    if (startDate) params.push(`startDate=${toDateStr(startDate)}`);
    if (endDate) params.push(`endDate=${toDateStr(endDate)}`);
    const query = params.length > 0 ? `?${params.join("&")}` : "";
    return this.fetch(`/behavior/overtrading${query}`);
  }

  async getImpulsiveEntries(date = null, startDate = null, endDate = null) {
    const params = [];
    if (date) params.push(`date=${toDateStr(date)}`);
    if (startDate) params.push(`startDate=${toDateStr(startDate)}`);
    if (endDate) params.push(`endDate=${toDateStr(endDate)}`);
    const query = params.length > 0 ? `?${params.join("&")}` : "";
    return this.fetch(`/behavior/impulsive-entries${query}`);
  }

  async getBehaviorMentalBattery(date = null) {
    const query = date ? `?date=${toDateStr(date)}` : "";
    return this.fetch(`/behavior/mental-battery${query}`);
  }

  async getFullBehaviorAnalysis(date = null, startDate = null, endDate = null) {
    const params = [];
    if (date) params.push(`date=${toDateStr(date)}`);
    if (startDate) params.push(`startDate=${toDateStr(startDate)}`);
    if (endDate) params.push(`endDate=${toDateStr(endDate)}`);
    const query = params.length > 0 ? `?${params.join("&")}` : "";
    return this.fetch(`/behavior/full-analysis${query}`);
  }

  async getCoachAdvice(date = null) {
    const query = date ? `?date=${toDateStr(date)}` : "";
    return this.fetch(`/behavior/coach-advice${query}`);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for testing
export default ApiClient;
