window.DRIVEX_AI_CONFIG = window.DRIVEX_AI_CONFIG || {
  mode: "llm_first",
  endpoint:
    window.location && window.location.protocol === "file:"
      ? "http://localhost:8080/api/ai/assistant"
      : "/api/ai/assistant",
  timeoutMs: 45000,
  debug: false
};
