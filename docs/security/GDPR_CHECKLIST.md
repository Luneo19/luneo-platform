# GDPR Baseline Checklist

## Data Inventory
- [ ] Register all categories of personal data (customers, brands, employees).
- [ ] Map data flows between services (frontend, backend, AI workers, third-parties).
- [ ] Define retention periods per data category.

## Data Subject Rights
- [ ] Implement endpoints/workflows for: access, rectification, deletion, portability.
- [ ] Log and track each request resolution (ticketing/Jira).
- [ ] Anonymise archives/logs when deletion is requested.

## Consent & Legal Basis
- [ ] Collect explicit consent for marketing emails & analytics cookies.
- [ ] Maintain proof of consent (timestamp, scope).
- [ ] Provide opt-out links (email footers, dashboard settings).

## Processors & Sub-processors
- [ ] Review DPA for each provider (Stripe, Upstash, Cloudinary, SendGrid, etc.).
- [ ] Maintain a list of sub-processors on the public website.
- [ ] Ensure data transfers outside EU have SCCs in place.

## Security & Privacy by Design
- [ ] Enforce encryption in transit (TLS 1.2+) and at rest (cloud provider managed keys).
- [ ] Minimise data used by AI models; filter PII from training data.
- [ ] Run DPIA when introducing high-risk features (biometric, AR face scan).

## Incident Response
- [ ] Maintain incident runbook with notification steps (CNIL, affected users).
- [ ] Detect anomalous access (Sentry alerts, SIEM).
- [ ] Test incident response annually (tabletop exercise).

## Documentation
- [ ] Publish Privacy Policy & Terms on website (multi-language).
- [ ] Review contracts and policies yearly.
- [ ] Assign a Data Protection Officer (DPO) or representative.

## Continuous Compliance
- [ ] Schedule quarterly audits.
- [ ] Integrate compliance checks into CI (e.g., terraform compliance, policy-as-code).
- [ ] Track compliance status in governance dashboard.

