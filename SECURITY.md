# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| main    | ✅ Full support    |
| others  | ⚠️ Security fixes are backported on a best-effort basis |

## Reporting a Vulnerability

1. **Do not** create a public GitHub issue for security concerns.
2. Email the security team at **security@luneo.app** with the following:
   - Description of the vulnerability
   - Product or API endpoints affected
   - Steps to reproduce (POC if possible)
   - Impact assessment (data exposure, privilege escalation, etc.)
3. You will receive an acknowledgement within 2 business days.
4. We strive to provide a remediation plan within 10 business days.

## Coordinated Disclosure

We request that you give us a reasonable amount of time to fix the issue before any public disclosure (minimum 30 days, extendable by mutual agreement).

## Security Hardening Checklist

- ✅ Node.js 20+, pnpm strict lockfile
- ✅ Helmet, rate limiting, validation pipes enabled by default
- ✅ Background job health metrics + Sentry alerting
- 🔄 CI/CD scanning (Dependabot, CodeQL) — enabled via GitHub workflows
- 🔄 Secrets should be stored in a managed vault (AWS Secrets Manager, GCP Secret Manager, or Doppler)
- 🔄 Regular dependency & OS patching

## Responsible Use of AI

When reporting issues related to AI prompts or content, specify how the model could be exploited (prompt injection, sensitive data leakage, unsafe outputs). Provide sample prompts/output and describe the potential harm.

Thank you for helping keep Luneo secure. 🛡️

