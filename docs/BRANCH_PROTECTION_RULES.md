# Branch Protection Rules Recommendations

This document outlines recommended branch protection rules for the Luneo Platform repository to ensure code quality and maintainability.

## Overview

Branch protection rules enforce quality gates before code can be merged into protected branches. These rules help maintain code quality, prevent broken builds, and ensure security standards.

## Protected Branches

### `main` Branch
- **Purpose**: Production-ready code
- **Protection Level**: Maximum
- **Merge Strategy**: Require pull request reviews

### `develop` Branch
- **Purpose**: Integration branch for features
- **Protection Level**: High
- **Merge Strategy**: Require pull request reviews

## Recommended Branch Protection Settings

### 1. Require Pull Request Reviews

**Settings:**
- ✅ Require a pull request before merging
- ✅ Require approvals: **1** (minimum)
- ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Require review from Code Owners (if CODEOWNERS file exists)

**Rationale:** Ensures code is reviewed by at least one team member before merging.

### 2. Require Status Checks to Pass

**Required Status Checks:**
- `lint_typecheck` - Lint & Type Check
- `unit_tests` - Unit & Integration Tests
- `build` - Build Monorepo
- `frontend_playwright_smoke` - Frontend Playwright Smoke Tests
- `security_scan` - Dependency & Container Scan
- `terraform_validate` - Terraform Validate (if applicable)
- `gitops_validate` - GitOps Manifests Validate (if applicable)

**Optional Status Checks (for main branch):**
- `zap_baseline` - OWASP ZAP Baseline Security Scan

**Settings:**
- ✅ Require branches to be up to date before merging
- ✅ Require status checks to pass before merging
- ✅ Require conversation resolution before merging

**Rationale:** Ensures all CI checks pass before code can be merged.

### 3. Require Linear History

**Settings:**
- ✅ Require linear history

**Rationale:** Keeps git history clean and easier to follow.

### 4. Include Administrators

**Settings:**
- ⚠️ **Consider**: Do not include administrators (recommended for strict enforcement)
- ✅ Include administrators (if you want admins to bypass rules)

**Rationale:** Ensures even administrators follow the same quality gates.

### 5. Restrict Pushes

**Settings:**
- ✅ Do not allow bypassing the above settings
- ✅ Restrict who can push to matching branches: **None** (only via PRs)

**Rationale:** Prevents direct pushes to protected branches, enforcing PR workflow.

### 6. Allow Force Pushes

**Settings:**
- ❌ Do not allow force pushes

**Rationale:** Prevents history rewriting on protected branches.

### 7. Allow Deletions

**Settings:**
- ❌ Do not allow deletions

**Rationale:** Prevents accidental deletion of protected branches.

## GitHub Actions Workflow Integration

### CI Pipeline Requirements

The following jobs must pass before merging:

1. **Lint & Type Check** (`lint_typecheck`)
   - Runs ESLint and TypeScript type checking
   - Fast feedback (< 2 minutes)

2. **Unit & Integration Tests** (`unit_tests`)
   - Runs all unit tests across packages
   - Ensures no regressions

3. **Build** (`build`)
   - Builds all packages and applications
   - Validates compilation

4. **Frontend Playwright Smoke** (`frontend_playwright_smoke`)
   - Critical E2E smoke tests
   - Validates core user flows

5. **Security Scan** (`security_scan`)
   - Dependency vulnerability scanning
   - Container security scanning

6. **Terraform Validate** (`terraform_validate`)
   - Infrastructure as Code validation
   - Ensures Terraform syntax is correct

7. **GitOps Validate** (`gitops_validate`)
   - Kubernetes manifest validation
   - Ensures K8s configs are valid

### Optional Checks (Main Branch Only)

8. **OWASP ZAP Baseline** (`zap_baseline`)
   - Security vulnerability scanning
   - Only runs on main/develop pushes (not PRs)

## Implementation Steps

### Via GitHub Web UI

1. Navigate to: **Settings** → **Branches**
2. Click **Add rule** or edit existing rule
3. Configure branch name pattern: `main` or `develop`
4. Apply all recommended settings above
5. Save changes

### Via GitHub API

```bash
# Example: Protect main branch
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["lint_typecheck","unit_tests","build","frontend_playwright_smoke","security_scan"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
  --field restrictions=null
```

### Via Terraform (GitHub Provider)

```hcl
resource "github_branch_protection" "main" {
  repository_id = github_repository.luneo_platform.node_id
  
  pattern                         = "main"
  enforce_admins                  = true
  require_signed_commits          = false
  require_conversation_resolution = true
  
  required_status_checks {
    strict   = true
    contexts = [
      "lint_typecheck",
      "unit_tests",
      "build",
      "frontend_playwright_smoke",
      "security_scan"
    ]
  }
  
  required_pull_request_reviews {
    required_approving_review_count = 1
    dismiss_stale_reviews           = true
    require_code_owner_reviews      = true
  }
  
  restrictions {
    users = []
    teams = []
  }
}
```

## CODEOWNERS File

Create `.github/CODEOWNERS` to automatically request reviews from code owners:

```
# Global owners
* @luneo-team

# Frontend
/apps/frontend/ @luneo-frontend-team

# Backend
/apps/backend/ @luneo-backend-team

# Infrastructure
/infrastructure/ @luneo-devops-team

# Security
/docs/security/ @luneo-security-team
/scripts/security/ @luneo-security-team
```

## Best Practices

1. **Start Strict**: Begin with strict rules and relax if needed
2. **Monitor CI Times**: Keep CI pipeline under 15 minutes for fast feedback
3. **Use Branch Policies**: Different rules for different branch types
4. **Regular Reviews**: Update rules quarterly based on team feedback
5. **Document Exceptions**: Document any bypass scenarios

## Troubleshooting

### CI Checks Not Showing Up

- Ensure workflow files are in `.github/workflows/`
- Check that jobs have proper `name` fields
- Verify workflow syntax is valid YAML

### Status Checks Taking Too Long

- Split tests into fast smoke vs full pipelines
- Use PR checks for fast feedback
- Run full scans on main/develop only

### Merge Conflicts

- Require branches to be up to date
- Use "Update branch" button in PRs
- Consider rebase merge strategy

## References

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub Actions Status Checks](https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/about-workflow-runs)
- [CODEOWNERS File](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
