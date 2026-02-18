# AI Agents Module – Security & Provider Configuration Audit Report

**Date:** 2025-02-18  
**Scope:** Security layer, LLM providers, router/resilience, agent controllers  
**Classification:** CRITICAL | WARNING | INFO

---

## Executive Summary

The agents module has a **split security architecture**: a rich `AgentSecurityModule` (prompt injection detector, PII detector, output sanitizer, content filter) exists but **is not used in the LLM request/response path**. Only `PromptSecurityService` is applied in `LLMRouterService`. Non-streaming chat flows (Luna, Aria, Nova) use the router and get input checks and output validation; **streaming** (Luna SSE) uses `LLMStreamService`, which has **no security checks**. Unsafe LLM output is logged but still **returned to the client**. Controllers are consistently protected with auth and rate limiting. Circuit breaker and retry are correctly configured.

---

## 1. Security Layer

### 1.1 `prompt-injection-detector.service.ts`

| Check | Finding |
|-------|--------|
| Patterns | Multi-layer: ignore/override instructions, role reassignment, format tokens (`[INST]`, `<<SYS>>`), jailbreak keywords, base64/HTML/URL/Unicode encoding, role confusion, length. |
| Sanitization | Returns `sanitizedInput` (strip zero-width, format tokens, system markers). |
| Usage | **Not used** in `LLMRouterService` or `LLMStreamService`. Only unit tests reference it. |

**INFO:** Implementation is strong; integration is missing.

---

### 1.2 `pii-detector.service.ts`

| Check | Finding |
|-------|--------|
| Coverage | Email, international/Fr/Ch phone, credit card (Luhn), US SSN, IBAN, AHV (CH), IP, passport-style IDs. |
| Redaction | Replaces with `[TYPE_REDACTED]`; deduplicates overlaps. |
| Usage | **Not used** in router or stream service. Used only by `OutputSanitizerService`, which is itself unused in the LLM path. |

**WARNING:** PII in user messages and LLM responses is not redacted before logging or before returning to the client in the main flow. `PromptSecurityService` does not redact PII.

---

### 1.3 `output-sanitizer.service.ts`

| Check | Finding |
|-------|--------|
| Patterns | System prompt leak, XSS (script, event handlers, `javascript:`), SQL leak, shell commands, credential/API key patterns. |
| PII | Uses `PIIDetectorService` to redact PII in output. |
| Usage | **Not used** in `LLMRouterService` or `LLMStreamService`. |

**CRITICAL:** No output sanitization is applied to LLM responses in the live path. Dangerous content can reach the client.

---

### 1.4 `content-filter.service.ts`

| Check | Finding |
|-------|--------|
| Categories | Violence, illegal activity, self-harm, hate speech, competitor data; severity low/medium/high. |
| Usage | **Not used** in router or stream service. Input is not checked for policy violations before calling the LLM. |

**WARNING:** No content policy filtering before LLM calls; only post-hoc validation in `PromptSecurityService` (and unsafe output is still returned).

---

### 1.5 `prompt-security.service.ts`

| Check | Finding |
|-------|--------|
| Input | `checkInput()`: malicious patterns (ignore/forget/override, script/eval, path traversal, SQL, context manipulation, prompt leak). Length cap 10k, special-char ratio. Returns `sanitized` on threat. |
| Output | `validateOutput()`: XSS, file access, SQL patterns. Returns safe/threats only; **does not sanitize**. |
| Throw on threat | `validateAndSanitize(input, throwOnThreat)` can throw `BadRequestException`. |
| Logging | Logs threat types only (e.g. `threats.join(', ')`), not raw input → no PII leak in logs here. |

**Usage in router:**  
- **Before LLM:** For each user message, `checkInput()` is run; if not safe, content is **replaced** with `sanitizeInput()` (no throw).  
- **After LLM:** `validateOutput()` is run; if not safe, **only a warning is logged**; **response is still returned unchanged**.

**CRITICAL:** Unsafe LLM output (XSS, SQL, etc.) is returned to the client. No use of `OutputSanitizerService` or PII redaction in this path.

**WARNING:** Input threats result in silent sanitization instead of optional reject (e.g. configurable throw). Risk of bypass if sanitization is incomplete.

---

## 2. Security Checks Before Every LLM Call?

| Path | Before-call checks |
|------|--------------------|
| `LLMRouterService.chat()` | Yes: Zod validation + `PromptSecurityService.checkInput()` on each user message; content replaced if unsafe. |
| `LLMStreamService.stream()` | **No.** No injection, PII, or content-filter checks. |

**CRITICAL:** Streaming (e.g. Luna `/agents/luna/chat/stream`) has **no security checks** before calling the LLM.

---

## 3. Output Sanitized After Every LLM Response?

| Path | After-response handling |
|------|-------------------------|
| `LLMRouterService.chat()` | `PromptSecurityService.validateOutput()` only; on threat: **log + return raw content**. No sanitization, no PII redaction. |
| `LLMStreamService` | No validation or sanitization of streamed chunks. |

**CRITICAL:** Output is **not** sanitized after LLM response in either path. `OutputSanitizerService` and PII redaction are unused in the request/response flow.

---

## 4. Auth Guards on Controllers

| Controller | Guards |
|------------|--------|
| `AgentsController` | `@UseGuards(JwtAuthGuard)` |
| `LunaController` | `@UseGuards(JwtAuthGuard, RateLimitGuard)` |
| `AriaController` | `@UseGuards(JwtAuthGuard, RateLimitGuard, BrandOwnershipGuard)` |
| `NovaController` | `@UseGuards(JwtAuthGuard, RateLimitGuard, BrandOwnershipGuard)` |

**INFO:** All agent controllers use JWT auth; Luna/Aria/Nova add rate limit and (where relevant) brand ownership.

---

## 5. Rate Limiting at Controller Level

| Controller | Rate limiting |
|------------|----------------|
| `AgentsController` | `@Throttle({ default: { limit: 10, ttl: 60000 } })` on `POST /agents/chat` (10/min). |
| `LunaController` | `@RateLimit` per route: chat/stream 30/min, chat 30/min, action 20/min, conversations 60/min. |
| `AriaController` | `@RateLimit` per route: chat 20/min, quick-suggest 30/min, improve/recommend-style/translate/spell-check/gift-ideas 20–30/min. |
| `NovaController` | `@RateLimit`: chat 50/min, faq 60/min, ticket 10/min. |

**INFO:** Rate limiting is enforced at controller level (NestJS Throttler and custom RateLimit decorator).

---

## 6. Prompt Injection Bypass Vectors

| Vector | Mitigation | Gap |
|--------|------------|-----|
| Obvious “ignore previous instructions” | Covered by `PromptSecurityService` and `PromptInjectionDetectorService`. | Router uses only `PromptSecurityService`; no use of the stronger detector. |
| Encoded payloads (base64, HTML entities, etc.) | Handled in `PromptInjectionDetectorService`. | Not used in router or stream. |
| Role confusion / system markers in user text | Detected and sanitized in `PromptInjectionDetectorService`. | Not used in router or stream. |
| Streaming path | N/A | **No checks** in `LLMStreamService` → direct bypass of all input checks. |
| Non‑user messages | Router only runs `checkInput()` for `message.role === 'user'`. | System/assistant content is not checked (acceptable if system is server-controlled). |

**CRITICAL:** Streaming is a full bypass of input security.  
**WARNING:** Advanced detection (encoding, role confusion) is implemented but not integrated; regex-only checks in `PromptSecurityService` may be evadable.

---

## 7. PII in Logs and Responses

| Area | Status |
|------|--------|
| `PromptSecurityService` logs | Logs threat types only, not raw input → no PII in those logs. |
| `LLMRouterService` logs | Logs provider, model, tokens, latency; no user content. |
| Agent controller logs | e.g. `user.id`, `brand.id`, `body.productId` (IDs only). |
| LLM response to client | **Not redacted.** If the model returns PII (email, phone, etc.), it is sent as-is. |
| `PIIDetectorService` | Not used in router or stream; no redaction of input or output in the main flow. |

**WARNING:** PII in LLM responses is not redacted. PII in user input is not redacted before logging in other services (if they log body/content elsewhere).

---

## 8. LLM Providers – Error Handling

**Note:** The main agent flow uses `LLMRouterService`, which calls OpenAI/Anthropic/Mistral via **HTTP** (`callOpenAI`, `callAnthropic`, `callMistral`), not the injectable provider classes under `llm/providers/`. The provider classes (e.g. `OpenAIProvider`) are used by `LLMModule` and may be used by other callers.

### 8.1 Router HTTP calls (main agent path)

- Errors from `firstValueFrom(this.httpService.post(...))` propagate.
- Retry (in `callWithResilience`) includes 429, 502, 503, 504 and network/timeout patterns.
- No explicit mapping of 401/403 to “invalid API key” or “forbidden”; generic error is thrown and can be retried (401/403 are not in the retry list; `retryableErrors` default in `RetryService` includes 429). So 401/403 would not be retried but error message might expose provider details.

**WARNING:** 401/403 (invalid/missing API key, forbidden) are not explicitly handled; error text might leak to client if not caught by a global exception filter.

### 8.2 Provider classes (`openai.provider.ts`, `anthropic.provider.ts`, etc.)

| Provider | API key check | On error |
|----------|----------------|----------|
| OpenAI | `isAvailable` = !!key; `complete()` throws "OpenAI client not configured" if no client. | try/catch in healthCheck; stream errors logged and sent as `{ type: 'error', error: message }`. No 401/429-specific handling. |
| Anthropic | Same pattern. | Same. |
| Mistral | Same. | Same. |
| Groq | Same. | Same. |
| Ollama | No API key; `isAvailable` = enabled flag (env). | Throws "Ollama is disabled" when disabled. HTTP errors from Ollama (e.g. connection refused) propagate. |

**INFO:** All providers check “client configured” before use. No provider explicitly maps 401/403/429 to user-friendly messages or metrics.

---

## 9. Circuit Breaker Configuration

| Option | Value | Assessment |
|--------|--------|------------|
| `failureThreshold` | 5 | Reasonable. |
| `successThreshold` | 2 | Sufficient to close from HALF_OPEN. |
| `timeoutMs` | 60_000 (1 min) | Reasonable before trying HALF_OPEN. |
| `resetTimeoutMs` | 300_000 (5 min) | Reasonable full reset. |
| Scope | Per provider (`llm-openai`, `llm-anthropic`, `llm-mistral`) | Correct. |

**INFO:** Circuit breaker is well configured; options are not injectable (hardcoded defaults).

---

## 10. Summary of Findings

### CRITICAL

1. **Unsafe LLM output returned to client**  
   When `PromptSecurityService.validateOutput()` detects threats (XSS, SQL, etc.), the router only logs and still returns the raw response. `OutputSanitizerService` is never used in the LLM path.

2. **No output sanitization in streaming**  
   `LLMStreamService` does not validate or sanitize streamed chunks; dangerous or PII-heavy content can be sent to the client.

3. **No input security on streaming**  
   Luna’s `/agents/luna/chat/stream` uses `LLMStreamService.stream()` with no prompt injection, PII, or content-filter checks.

### WARNING

4. **Advanced security services unused**  
   `PromptInjectionDetectorService`, `PIIDetectorService`, `OutputSanitizerService`, `ContentFilterService` are implemented and exported by `AgentSecurityModule` but not used in `LLMRouterService` or `LLMStreamService`.

5. **PII not redacted in responses**  
   LLM responses are not passed through `PIIDetectorService` or `OutputSanitizerService`; PII in model output is returned as-is.

6. **Content policy not enforced**  
   `ContentFilterService` is not applied to user input before LLM calls; policy violations are not blocked.

7. **Provider auth errors**  
   401/403 from LLM APIs are not explicitly handled; error messages could expose provider or configuration details.

### INFO

8. **Auth and rate limiting**  
   All agent controllers use `JwtAuthGuard`; Luna/Aria/Nova use rate limit and brand guards where appropriate.

9. **Circuit breaker and retry**  
   Thresholds and timeouts are sensible; retry includes 429 and transient errors.

10. **Input checks on non-streaming path**  
    `LLMRouterService.chat()` validates and sanitizes user messages with `PromptSecurityService` before calling the LLM.

---

## 11. Recommendations

1. **Use output sanitization on every LLM response**  
   In `LLMRouterService.chat()`, after `validateOutput()`, if not safe call `OutputSanitizerService.sanitize(response.content)` and return the sanitized content (or reject the response and retry/fallback). Do not return raw content when threats are detected.

2. **Apply security to streaming**  
   In `LLMStreamService`:  
   - Before calling the LLM: run the same input checks as the router (e.g. `PromptSecurityService` + optionally `ContentFilterService` and `PromptInjectionDetectorService`).  
   - On the stream: buffer or process chunks and run `OutputSanitizerService` (and PII redaction) on the full or segment output before sending to the client.

3. **Integrate AgentSecurityModule in the LLM path**  
   In `LLMRouterService` (and stream service):  
   - Use `PromptInjectionDetectorService` (and optionally `ContentFilterService`) before LLM calls; block or sanitize when injection or policy violation is detected.  
   - Use `OutputSanitizerService` (which includes PII redaction) on every LLM response.

4. **Optional reject on input threat**  
   Consider a configurable option to throw (e.g. `BadRequestException`) instead of silently sanitizing when `checkInput()` finds a threat.

5. **Handle 401/403 in router and providers**  
   Map 401/403 from LLM APIs to a generic “LLM configuration error” (or similar) and avoid retrying; do not expose raw provider error messages to the client.

6. **PII in logs**  
   Ensure no other agent code logs raw request/response bodies; if needed, run PII redaction on any logged text that might contain user or model PII.

---

*End of report.*
