# Secret Management Guidelines

## Principles
- **No secrets committed** to git repositories (use `.env.local` only for local dev).
- **Short-lived credentials** (rotate tokens every 90 days or less).
- **Least privilege**: each service account should have minimum required permissions.

## Recommended Providers
| Environment       | Suggested Vault                          |
| ----------------- | ---------------------------------------- |
| Local development | Doppler CLI / Infisical / 1Password CLI  |
| Staging           | AWS Secrets Manager / GCP Secret Manager |
| Production        | AWS Secrets Manager + IAM roles          |

## Setup Checklist
1. Store secrets in the chosen vault with namespaced paths, e.g. `luneo/{env}/{service}`.
2. Grant CI/CD runners read-only access via OIDC or workload identity.
3. Inject secrets at runtime (environment variables) — avoid writing on disk.
4. Enable secret access logging & alerts on anomaly (CloudTrail / Cloud Logging).
5. Rotate keys automatically using provider rotation policies.
6. Document emergency rotation procedures in the runbook.

## Local Development
- Use `.env.local` (ignored by git) + `pnpm run validate` to confirm required vars.
- Do not share `.env` files via Slack/Email; use the vault’s sharing capabilities.

## Auditing
- Review secret access logs monthly.
- Trigger a rotation immediately after incidents or personnel changes.
- Track secrets in a central inventory (spreadsheet or CMDB) with owners & expiry dates.

