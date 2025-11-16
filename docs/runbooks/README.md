# 📚 Runbooks

**Last Updated:** November 16, 2025

Operational runbooks for common tasks and procedures in the Luneo Platform.

---

## 📋 Available Runbooks

### 🚀 Deployment

- **[Deploy Worker Service](./DEPLOY_WORKER.md)** - Deploy the Worker-IA service for background job processing
  - Railway deployment
  - Docker deployment
  - Manual server deployment
  - Post-deployment verification
  - Rollback procedures

### 🔄 Operations

- **[Convert AR Model](./CONVERT_AR.md)** - Convert GLB models to AR-ready formats (USDZ)
  - API endpoint usage
  - Manual conversion (macOS)
  - Docker container usage
  - Troubleshooting conversion issues
  - Optimization tips

- **[Rollback Database Migration](./ROLLBACK_DB_MIGRATION.md)** - Rollback Prisma database migrations
  - Prisma migrate reset
  - Manual SQL rollback
  - Supabase dashboard rollback
  - Data backup and restoration
  - Best practices

---

## 🎯 When to Use Runbooks

Runbooks are step-by-step guides for:

- **Deployments** - Deploying services to production
- **Operations** - Common operational tasks
- **Troubleshooting** - Resolving common issues
- **Maintenance** - Scheduled maintenance procedures
- **Incidents** - Emergency response procedures

---

## 📖 How to Use Runbooks

1. **Read the Overview** - Understand what the runbook covers
2. **Check Prerequisites** - Ensure you have required access/tools
3. **Follow Steps Sequentially** - Don't skip steps
4. **Verify Results** - Always verify after completing steps
5. **Document Issues** - Note any deviations or issues encountered

---

## 🔄 Updating Runbooks

When updating runbooks:

1. Update the "Last Updated" date
2. Document any changes made
3. Test the procedure in staging first
4. Get review from team before publishing
5. Update related documentation

---

## 📞 Support

If a runbook is unclear or incomplete:

1. Check related documentation in `/docs`
2. Review architecture diagrams in `/ARCHITECTURE.md`
3. Ask team in Slack #devops channel
4. Create an issue to improve the runbook

---

## 🔗 Related Documentation

- [Architecture Overview](../../ARCHITECTURE.md)
- [Backend README](../../apps/backend/README.md)
- [Worker README](../../apps/worker-ia/README.md)
- [Deployment Guide](../../docs/deployment/DEPLOYMENT.md)

---

**Maintained By:** DevOps Team  
**Last Review:** November 16, 2025  
**Next Review:** December 16, 2025
