#!/bin/bash

# Script de vérification de la configuration Cursor AI pour Luneo Platform
# Usage: ./scripts/verify-cursor-setup.sh

set -e

echo "🔍 Vérification de la configuration Cursor AI pour Luneo Platform..."
echo ""

# Couleurs pour l'output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
PASSED=0
FAILED=0
WARNINGS=0

# Fonction pour vérifier un fichier
check_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅${NC} $description: $file"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌${NC} $description: $file (MANQUANT)"
        ((FAILED++))
        return 1
    fi
}

# Fonction pour vérifier un répertoire
check_dir() {
    local dir=$1
    local description=$2
    
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✅${NC} $description: $dir"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌${NC} $description: $dir (MANQUANT)"
        ((FAILED++))
        return 1
    fi
}

# Fonction pour vérifier le contenu d'un fichier
check_file_content() {
    local file=$1
    local search_term=$2
    local description=$3
    
    if [ -f "$file" ] && grep -q "$search_term" "$file" 2>/dev/null; then
        echo -e "${GREEN}✅${NC} $description"
        ((PASSED++))
        return 0
    else
        echo -e "${YELLOW}⚠️${NC}  $description (non vérifié)"
        ((WARNINGS++))
        return 1
    fi
}

echo "📁 Vérification des fichiers de configuration..."
echo ""

# Vérifier les fichiers essentiels
check_file ".cursor/rules.md" "Fichier de règles Cursor"
check_file "GUIDE_CURSOR_AI_SAAS_MONDIAL.md" "Guide complet Cursor AI"
check_file "GUIDE_UTILISATION_CURSOR_LUNEO.md" "Guide d'utilisation Luneo"

# Vérifier la configuration VS Code
check_file ".vscode/settings.json" "Configuration VS Code"

echo ""
echo "📋 Vérification du contenu des fichiers..."
echo ""

# Vérifier le contenu de .cursor/rules.md
if [ -f ".cursor/rules.md" ]; then
    check_file_content ".cursor/rules.md" "Luneo Platform" "Règles spécifiques à Luneo"
    check_file_content ".cursor/rules.md" "TypeScript strictly" "Règles TypeScript"
    check_file_content ".cursor/rules.md" "i18n" "Support internationalisation"
    check_file_content ".cursor/rules.md" "console.log" "Interdiction console.log"
fi

# Vérifier la configuration VS Code
if [ -f ".vscode/settings.json" ]; then
    check_file_content ".vscode/settings.json" "typescript.tsdk" "Configuration TypeScript"
    check_file_content ".vscode/settings.json" "editor.formatOnSave" "Format on save activé"
fi

echo ""
echo "🔧 Vérification des dépendances..."
echo ""

# Vérifier TypeScript
if command -v npx &> /dev/null; then
    if [ -f "apps/frontend/package.json" ] && grep -q "typescript" "apps/frontend/package.json"; then
        echo -e "${GREEN}✅${NC} TypeScript installé dans frontend"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠️${NC}  TypeScript non détecté dans frontend"
        ((WARNINGS++))
    fi
else
    echo -e "${YELLOW}⚠️${NC}  npx non disponible (npm/node non installé?)"
    ((WARNINGS++))
fi

# Vérifier ESLint
if [ -f "apps/frontend/.eslintrc.json" ] || [ -f "apps/frontend/.eslintrc.js" ] || [ -f ".eslintrc.json" ]; then
    echo -e "${GREEN}✅${NC} ESLint configuré"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️${NC}  ESLint non configuré"
    ((WARNINGS++))
fi

# Vérifier Prettier
if [ -f "apps/frontend/.prettierrc" ] || [ -f ".prettierrc" ]; then
    echo -e "${GREEN}✅${NC} Prettier configuré"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️${NC}  Prettier non configuré"
    ((WARNINGS++))
fi

echo ""
echo "📊 Résumé de la vérification..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ chat/rules.md
# Cursor AI Rules - Luneo Platform (Global SaaS)

You are an expert software architect for the Luneo Platform, a global SaaS application. Always prioritize the following principles:

## 🎯 Core Principles

### Scalability
- Use cloud-agnostic patterns (microservices, serverless)
- Design for horizontal scaling
- Implement caching strategies (Redis, CDN)
- Use database sharding for global distribution
- Design for 1M+ concurrent users

### Internationalization (i18n)
- Implement i18n with libraries like i18next (JS/TS) or next-intl
- Support RTL languages (Arabic, Hebrew)
- Handle multi-timezone operations (date-fns-tz, pytz)
- Use locale-aware formatting for dates, numbers, currencies
- Support 20+ languages minimum

### Security
- Follow OWASP Top 10 best practices
- Never hard-code secrets or API keys
- Use environment variables for configuration
- Implement rate limiting for API abuse prevention
- GDPR/CCPA compliance for data handling
- CSRF protection on all forms
- XSS prevention (sanitize inputs)

### Performance
- Optimize for global users (CDN, edge computing)
- Implement lazy loading for assets
- Use code splitting for frontend bundles
- Optimize database queries (indexing, query optimization)
- Monitor and optimize API response times
- Target < 100ms API response (p95)
- Implement request/response caching

### Code Quality
- Write clean, modular, maintainable code
- Include comprehensive tests (Jest, Pytest, etc.)
- Add comments in English for international teams
- Follow language-specific style guides (ESLint, Prettier, Black)
- Use TypeScript strictly (no `any` types, use proper interfaces)
- Remove all `console.log` statements, use proper logging
- No `@ts-ignore` unless absolutely necessary

### Accessibility
- Ensure WCAG 2.1 AA compliance
- Support keyboard navigation
- Provide ARIA labels
- Test with screen readers
- Ensure color contrast ratios meet standards

## 📚 Technology Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **State Management**: Zustand or React Context
- **Data Fetching**: TanStack Query (React Query)
- **Styling**: Tailwind CSS
- **i18n**: next-intl
- **Forms**: React Hook Form with Zod validation

### Backend
- **Framework**: FastAPI (Python) or NestJS (TypeScript)
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Cache**: Redis (Upstash)
- **Queue**: Bull (Redis-based)
- **Email**: SendGrid
- **Payments**: Stripe

### Infrastructure
- **Hosting**: Vercel (Frontend), Vercel/Cloud Run (Backend)
- **Database**: Supabase (PostgreSQL)
- **CDN**: Vercel Edge Network
- **Monitoring**: Sentry, Vercel Analytics
- **CI/CD**: GitHub Actions

## 🔧 Language-Specific Rules

### TypeScript/JavaScript
- Use TypeScript strictly (no `any`, use proper interfaces/DTOs)
- Implement React hooks for state management
- Use functional components with hooks
- Prefer named exports over default exports
- Use async/await over promises
- Implement error boundaries
- Use TypeScript strict mode
- Remove all `console.log`, use logger service
- No `@ts-ignore` comments

### Python
- Follow PEP 8 style guide
- Use type hints (PEP 484)
- Implement async with FastAPI for high concurrency
- Use Pydantic for data validation
- Use SQLAlchemy ORM with connection pooling
- Implement proper logging (structlog)
- Use dependency injection
- Handle multi-timezones (pytz, zoneinfo)

### SQL/Prisma
- Use Prisma for type-safe database access
- Always use transactions for multi-step operations
- Implement proper indexes for performance
- Use migrations for schema changes
- Never use raw SQL unless necessary
- Validate all inputs before database operations

## 🏗️ Architecture Patterns

### API Design
- RESTful APIs with OpenAPI/Swagger documentation
- API versioning (`/api/v1/`, `/api/v2/`)
- Consistent error responses
- Rate limiting on all endpoints
- Request/response validation
- Pagination for list endpoints

### Database
- Use Prisma migrations for schema changes
- Implement soft deletes where appropriate
- Use indexes for frequently queried columns
- Implement database connection pooling
- Use transactions for data consistency
- Optimize queries (avoid N+1 problems)

### Error Handling
- Use structured error responses
- Log errors with context (Sentry)
- Implement error boundaries (frontend)
- Graceful degradation
- User-friendly error messages (i18n)

### Testing
- Unit tests for business logic
- Integration tests for APIs
- E2E tests for critical flows (Playwright)
- Test coverage > 80%
- Mock external services in tests

## 🌍 Global SaaS Requirements

### Multi-Region Support
- Design for multi-region deployment
- Handle data residency requirements
- Implement geo-routing
- Use CDN for static assets
- Consider latency for global users

### Compliance
- GDPR compliance (EU users)
- CCPA compliance (California users)
- Data encryption at rest and in transit
- User consent management
- Right to deletion (GDPR)
- Data export functionality

### Monitoring & Observability
- Structured logging
- Error tracking (Sentry)
- Performance monitoring
- User analytics (privacy-compliant)
- Uptime monitoring
- Alerting for critical issues

## 🚫 Anti-Patterns to Avoid

- ❌ Hard-coded secrets or API keys
- ❌ Using `any` type in TypeScript
- ❌ `console.log` in production code
- ❌ `@ts-ignore` without explanation
- ❌ Synchronous database operations in async contexts
- ❌ N+1 query problems
- ❌ Missing error handling
- ❌ No input validation
- ❌ Hard-coded strings (use i18n)
- ❌ Missing tests for critical paths

## ✅ Code Generation Checklist

When generating code, ensure:
1. ✅ TypeScript strict mode compliance
2. ✅ Proper error handling
3. ✅ Input validation
4. ✅ i18n support (no hard-coded strings)
5. ✅ Accessibility (ARIA labels, keyboard nav)
6. ✅ Performance optimization
7. ✅ Security best practices
8. ✅ Tests included
9. ✅ Documentation/comments
10. ✅ No `console.log` or `@ts-ignore`

## 📝 Documentation Standards

- Write clear, concise comments in English
- Document complex algorithms
- Include JSDoc/TSDoc for public APIs
- Update README files when adding features
- Document environment variables
- Include examples in documentation

## 🔄 Refactoring Guidelines

- Maintain backward compatibility when possible
- Update tests when refactoring
- Use feature flags for major changes
- Document breaking changes
- Provide migration guides

---

**Remember**: Always think about scalability, security, and user experience for a global audience. Generate code that is production-ready, maintainable, and follows these guidelines.























