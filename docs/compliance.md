# GDPR Compliance & Data Controls

This document outlines Luneo Platform's GDPR compliance measures, data retention policies, and data lifecycle management.

## Table of Contents

1. [Overview](#overview)
2. [Data Retention Policies](#data-retention-policies)
3. [Data Lifecycle](#data-lifecycle)
4. [User Rights Implementation](#user-rights-implementation)
5. [Data Export](#data-export)
6. [Data Deletion](#data-deletion)
7. [Log Scrubbing & PII Protection](#log-scrubbing--pii-protection)
8. [Backup Management](#backup-management)
9. [Runbook for Partial Deletes](#runbook-for-partial-deletes)

---

## Overview

Luneo Platform is committed to GDPR compliance and protecting user privacy. We implement the following key principles:

- **Right to Access (Article 15)**: Users can request and receive all their personal data
- **Right to Erasure (Article 17)**: Users can request deletion of their personal data
- **Data Minimization**: We only collect and retain data necessary for service provision
- **Purpose Limitation**: Data is used only for stated purposes
- **Storage Limitation**: Data is retained only as long as necessary

---

## Data Retention Policies

### User Accounts

| Data Type | Retention Period | Rationale |
|-----------|-----------------|-----------|
| Active user accounts | Indefinite (while active) | Required for service provision |
| Inactive user accounts | 3 years after last login | Business continuity, legal requirements |
| Deleted user accounts | 30 days (soft delete) | Recovery period, then permanent deletion |
| User authentication data | While account is active | Required for access control |

### User-Generated Content

| Data Type | Retention Period | Rationale |
|-----------|-----------------|-----------|
| Designs | 2 years after last modification | User may return to edit |
| Completed orders | 7 years | Legal/accounting requirements |
| Draft designs | 90 days after last access | Storage optimization |
| Failed designs | 30 days | Debugging and improvement |

### System & Operational Data

| Data Type | Retention Period | Rationale |
|-----------|-----------------|-----------|
| Application logs | 30 days | Debugging, security monitoring |
| Audit logs | 1 year | Security, compliance, investigation |
| Usage metrics | 2 years | Analytics, billing, optimization |
| Error logs | 90 days | Debugging and improvement |
| API request logs | 30 days | Rate limiting, debugging |

### Billing & Financial Data

| Data Type | Retention Period | Rationale |
|-----------|-----------------|-----------|
| Payment records | 7 years | Legal/accounting requirements |
| Invoices | 7 years | Legal/accounting requirements |
| Subscription history | 7 years | Legal/accounting requirements |
| Refund records | 7 years | Legal/accounting requirements |

### Marketing & Communication

| Data Type | Retention Period | Rationale |
|-----------|-----------------|-----------|
| Email communications | 2 years | Customer support, legal |
| Marketing consent | Until withdrawn | GDPR consent management |
| Newsletter subscriptions | Until unsubscribed | Marketing preferences |

---

## Data Lifecycle

### 1. Data Collection

- **When**: During user registration, service usage, and interactions
- **What**: Email, name, payment info, designs, orders, usage data
- **Legal Basis**: Contract performance, legitimate interest, consent

### 2. Data Processing

- **Purpose**: Service delivery, billing, analytics, support
- **Location**: EU-based servers (primary), backups may be in multiple regions
- **Security**: Encrypted at rest and in transit

### 3. Data Storage

- **Primary Database**: PostgreSQL (Supabase)
- **File Storage**: Cloudinary (images, designs)
- **Backups**: Daily automated backups, retained for 30 days
- **Archives**: Long-term archives for legal compliance (7 years for financial data)

### 4. Data Retention

- Automatic cleanup based on retention policies
- Scheduled jobs run daily to identify expired data
- Soft delete period before permanent deletion

### 5. Data Deletion

- **User-initiated**: Via GDPR deletion endpoint
- **Automatic**: Based on retention policies
- **Process**: Soft delete → 30-day grace period → Permanent deletion

### 6. Data Export

- **Format**: JSON (structured, machine-readable)
- **Content**: All user data including designs, orders, audit logs
- **Delivery**: Immediate download via API endpoint

---

## User Rights Implementation

### Right to Access (Article 15)

**Endpoint**: `POST /api/data/export?userId={userId}`

**What is exported**:
- User profile information (email, name, preferences)
- All designs created by the user
- All orders placed by the user
- Audit logs of user activity
- Usage metrics and analytics
- Consent history

**Format**: JSON structure with all data types clearly labeled

**Access Control**: Users can only export their own data unless they have admin permissions.

### Right to Erasure (Article 17)

**Endpoint**: `DELETE /api/data/erase?userId={userId}`

**What is deleted**:
- User account and profile
- All user-created designs
- User orders (anonymized, not deleted, for legal/accounting)
- User authentication tokens
- OAuth account links
- User consent records

**What is retained** (for legal/compliance reasons):
- Order records (anonymized, no personal data)
- Financial transaction records (7 years)
- Audit logs of deletion action (for compliance)

**Access Control**: Users can only delete their own data unless they have admin permissions.

### Right to Rectification (Article 16)

Users can update their profile information through:
- User settings page
- `PUT /api/users/:id` endpoint

### Right to Data Portability (Article 20)

Data export endpoint provides machine-readable JSON format suitable for data portability.

### Right to Object (Article 21)

Users can:
- Opt out of marketing communications
- Withdraw consent for data processing
- Request restriction of processing

---

## Data Export

### API Endpoint

```http
POST /api/data/export?userId={userId}
Authorization: Bearer {jwt_token}
```

### Response Format

```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "createdAt": "2024-01-01T00:00:00Z",
    "brand": { ... }
  },
  "designs": [
    {
      "id": "design_id",
      "name": "Design Name",
      "status": "COMPLETED",
      "createdAt": "2024-01-01T00:00:00Z",
      ...
    }
  ],
  "orders": [
    {
      "id": "order_id",
      "status": "DELIVERED",
      "total": 99.99,
      "createdAt": "2024-01-01T00:00:00Z",
      ...
    }
  ],
  "auditLogs": [
    {
      "eventType": "USER_LOGIN",
      "timestamp": "2024-01-01T00:00:00Z",
      ...
    }
  ],
  "usageMetrics": [
    {
      "metricType": "DESIGN_CREATED",
      "value": 10,
      "timestamp": "2024-01-01T00:00:00Z",
      ...
    }
  ],
  "exportedAt": "2024-01-15T12:00:00Z"
}
```

### Usage Example

```bash
curl -X POST "https://api.luneo.app/api/data/export?userId=user123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Data Deletion

### API Endpoint

```http
DELETE /api/data/erase?userId={userId}
Authorization: Bearer {jwt_token}
```

### Response Format

```json
{
  "deleted": true,
  "itemsDeleted": {
    "user": 1,
    "designs": 15,
    "orders": 3
  }
}
```

### Deletion Process

1. **Validation**: Verify user identity and permissions
2. **Count**: Count items to be deleted for reporting
3. **Transaction**: Execute deletion in database transaction
4. **Anonymization**: Anonymize orders (retain for legal compliance)
5. **Audit**: Log deletion action for compliance
6. **Confirmation**: Return deletion summary

### Important Notes

- **Irreversible**: Deletion cannot be undone
- **Grace Period**: 30-day soft delete period for account recovery
- **Legal Retention**: Some data (orders, financial records) may be anonymized rather than deleted
- **Backups**: See [Backup Management](#backup-management) for backup deletion procedures

---

## Log Scrubbing & PII Protection

### Overview

All logs are automatically scrubbed to remove PII before being written to log files or sent to log aggregation services.

### Scrubbed Data Types

- **Email addresses**: Replaced with `[REDACTED]`
- **Phone numbers**: Replaced with `[REDACTED]`
- **Credit card numbers**: Replaced with `[REDACTED]`
- **Passwords/Tokens**: Replaced with `[REDACTED]`
- **API keys**: Replaced with `[REDACTED]`
- **Names**: Optional (configurable, default: not scrubbed)

### Implementation

The log scrubbing utility (`log-scrubber.util.ts`) automatically processes:
- Log messages
- Log data objects
- Error stack traces (when containing PII)

### Configuration

Log scrubbing can be configured via `ScrubOptions`:

```typescript
import { scrubLogData } from '@/common/utils/log-scrubber.util';

const scrubbed = scrubLogData(data, {
  scrubEmails: true,
  scrubPhones: true,
  scrubCreditCards: true,
  scrubSecrets: true,
  scrubIPs: false, // IPs often needed for security logs
  scrubNames: false, // Names often needed for debugging
  replacement: '[REDACTED]',
});
```

### Manual Scrubbing

When logging user data manually, use the scrubbing utility:

```typescript
import { scrubPIIKeys } from '@/common/utils/log-scrubber.util';

logger.log('User action', 'Context', scrubPIIKeys(userData));
```

---

## Backup Management

### Backup Schedule

- **Frequency**: Daily automated backups
- **Retention**: 30 days
- **Location**: Multiple regions for redundancy
- **Format**: Full database dumps + incremental backups

### Backup Deletion Process

When a user requests data deletion:

1. **Primary Database**: Immediate deletion (or soft delete)
2. **Backups**: Marked for deletion, removed during next backup rotation
3. **Archives**: Long-term archives may retain anonymized data for legal compliance

### Partial Deletes Across Backups

**Challenge**: User data may exist in multiple backup files across different dates.

**Solution**: 
- Track deletion requests in a separate audit table
- During backup restoration, check deletion audit table
- Skip restoration of deleted user data
- Automated cleanup script runs during backup rotation

---

## Runbook for Partial Deletes

### Scenario: User Data Exists in Multiple Backups

When a user requests deletion, their data may exist in:
- Current database
- Daily backups (last 30 days)
- Long-term archives (for legal compliance)

### Procedure

#### Step 1: Immediate Deletion (Primary Database)

```sql
-- Mark user for deletion
UPDATE "User" SET "isActive" = false, "deletedAt" = NOW() WHERE id = 'user_id';

-- Anonymize orders (retain for legal compliance)
UPDATE "Order" SET "userId" = NULL, "userEmail" = 'deleted@user.anonymized' WHERE "userId" = 'user_id';

-- Delete user data
DELETE FROM "Design" WHERE "userId" = 'user_id';
DELETE FROM "RefreshToken" WHERE "userId" = 'user_id';
DELETE FROM "OAuthAccount" WHERE "userId" = 'user_id';
DELETE FROM "UserConsent" WHERE "userId" = 'user_id';
DELETE FROM "User" WHERE id = 'user_id';
```

#### Step 2: Record Deletion Request

```sql
INSERT INTO "DataDeletionAudit" (
  "userId",
  "deletedAt",
  "deletedBy",
  "reason",
  "itemsDeleted"
) VALUES (
  'user_id',
  NOW(),
  'user_id', -- self-deletion
  'GDPR Right to Erasure',
  '{"designs": 15, "orders": 3}'
);
```

#### Step 3: Backup Cleanup (Automated)

A scheduled job runs daily to:

1. **Check Deletion Audit**: Query `DataDeletionAudit` for users deleted in last 30 days
2. **Backup Rotation**: When rotating backups older than 30 days:
   - Check if backup contains deleted users
   - If yes, restore backup to temporary database
   - Remove deleted user data
   - Create new backup without deleted data
   - Delete old backup
3. **Archive Handling**: Long-term archives retain anonymized order data for legal compliance

#### Step 4: Manual Cleanup (If Needed)

If immediate cleanup is required:

```bash
# 1. List backups containing user
./scripts/backup-check-user.sh user_id

# 2. Restore and clean specific backup
./scripts/backup-clean-user.sh backup_file.sql user_id

# 3. Verify cleanup
./scripts/backup-verify-cleanup.sh user_id
```

### Verification

After deletion, verify:

1. **Primary Database**: User data removed
2. **Recent Backups**: Check deletion audit table
3. **Logs**: Verify no PII in logs
4. **External Services**: Clean up Cloudinary assets, Stripe customer data (if applicable)

### Emergency Recovery

If deletion was accidental:

1. **Within 30 days**: Restore from most recent backup before deletion
2. **After 30 days**: Data may be permanently lost
3. **Legal Hold**: Some data may be retained under legal hold orders

---

## Compliance Checklist

- [x] Data export endpoint implemented
- [x] Data deletion endpoint implemented
- [x] Log scrubbing utility implemented
- [x] Retention policies documented
- [x] Data lifecycle documented
- [x] Backup deletion procedures documented
- [x] Runbook for partial deletes created
- [ ] Regular compliance audits scheduled
- [ ] Staff training on GDPR procedures
- [ ] Privacy policy updated with data retention info
- [ ] User consent management implemented

---

## Contact

For GDPR-related inquiries:
- **Email**: privacy@luneo.app
- **Data Protection Officer**: dpo@luneo.app

---

**Last Updated**: 2025-01-15  
**Version**: 1.0  
**Review Frequency**: Quarterly
