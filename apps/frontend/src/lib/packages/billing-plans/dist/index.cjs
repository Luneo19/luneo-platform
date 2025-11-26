"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  PLAN_CATALOG: () => PLAN_CATALOG,
  PLAN_DEFINITIONS: () => PLAN_DEFINITIONS,
  getPlanDefinition: () => getPlanDefinition,
  listPlans: () => listPlans
});
module.exports = __toCommonJS(index_exports);

// src/plans.ts
var BASE_THRESHOLDS = [50, 75, 90];
var quota = (definition) => ({
  notificationThresholds: definition.notificationThresholds ?? BASE_THRESHOLDS,
  ...definition
});
var PLAN_DEFINITIONS = {
  starter: {
    id: "starter",
    name: "Starter",
    headline: "Id\xE9al pour les \xE9quipes qui d\xE9marrent",
    basePriceCents: 2900,
    quotas: [
      quota({
        metric: "designs_created",
        label: "Designs g\xE9n\xE9r\xE9s",
        description: "Nombre de designs g\xE9n\xE9r\xE9s via IA ou pipeline interne",
        limit: 50,
        period: "month",
        overage: "charge",
        overageRate: 50,
        unit: "design"
      }),
      quota({
        metric: "renders_2d",
        label: "Rendus 2D",
        description: "Rendus 2D haute r\xE9solution",
        limit: 100,
        period: "month",
        overage: "charge",
        overageRate: 20,
        unit: "render",
        creditCost: 1,
        // 1 credit per 2D render
        baseCostCents: 20
        // Base cost: 20 cents per render
      }),
      quota({
        metric: "renders_3d",
        label: "Rendus 3D",
        description: "Rendus 3D/GLTF haute pr\xE9cision",
        limit: 10,
        period: "month",
        overage: "charge",
        overageRate: 100,
        unit: "render",
        creditCost: 5,
        // 5 credits per 3D render
        baseCostCents: 100
        // Base cost: 100 cents per render
      }),
      quota({
        metric: "ai_generations",
        label: "G\xE9n\xE9rations IA",
        description: "G\xE9n\xE9rations IA via mod\xE8les internes et externes",
        limit: 20,
        period: "month",
        overage: "charge",
        overageRate: 75,
        unit: "generation"
      }),
      quota({
        metric: "storage_gb",
        label: "Stockage",
        description: "Stockage cloud pour assets (GB)",
        limit: 5,
        period: "month",
        overage: "charge",
        overageRate: 50,
        unit: "gb"
      }),
      quota({
        metric: "api_calls",
        label: "Requ\xEAtes API",
        description: "Appels API authentifi\xE9s",
        limit: 1e4,
        period: "month",
        overage: "charge",
        overageRate: 1,
        unit: "call"
      }),
      quota({
        metric: "team_members",
        label: "Membres d\u2019\xE9quipe",
        description: "Collaborateurs actifs sur le workspace",
        limit: 3,
        period: "month",
        overage: "block",
        unit: "seat"
      })
    ],
    features: [
      {
        id: "support.standard",
        label: "Support standard",
        enabled: true
      },
      {
        id: "analytics.basic",
        label: "Analytics de base",
        enabled: true
      },
      {
        id: "branding.custom",
        label: "Branding personnalis\xE9",
        enabled: false
      },
      {
        id: "api.access",
        label: "Acc\xE8s API",
        enabled: false
      }
    ],
    limits: {
      designsPerMonth: 50,
      storageGb: 5,
      teamMembers: 3
    }
  },
  professional: {
    id: "professional",
    name: "Professional",
    headline: "Pour les \xE9quipes qui acc\xE9l\xE8rent",
    basePriceCents: 9900,
    quotas: [
      quota({
        metric: "designs_created",
        label: "Designs g\xE9n\xE9r\xE9s",
        description: "Nombre de designs g\xE9n\xE9r\xE9s via IA ou pipeline interne",
        limit: 250,
        period: "month",
        overage: "charge",
        overageRate: 30,
        unit: "design"
      }),
      quota({
        metric: "renders_2d",
        label: "Rendus 2D",
        description: "Rendus 2D haute r\xE9solution",
        limit: 500,
        period: "month",
        overage: "charge",
        overageRate: 15,
        unit: "render",
        creditCost: 1,
        baseCostCents: 15
      }),
      quota({
        metric: "renders_3d",
        label: "Rendus 3D",
        description: "Rendus 3D haute pr\xE9cision",
        limit: 50,
        period: "month",
        overage: "charge",
        overageRate: 80,
        unit: "render",
        creditCost: 5,
        baseCostCents: 80
      }),
      quota({
        metric: "ai_generations",
        label: "G\xE9n\xE9rations IA",
        description: "G\xE9n\xE9rations IA via mod\xE8les internes et externes",
        limit: 150,
        period: "month",
        overage: "charge",
        overageRate: 50,
        unit: "generation"
      }),
      quota({
        metric: "storage_gb",
        label: "Stockage",
        description: "Stockage cloud pour assets (GB)",
        limit: 50,
        period: "month",
        overage: "charge",
        overageRate: 30,
        unit: "gb"
      }),
      quota({
        metric: "api_calls",
        label: "Requ\xEAtes API",
        description: "Appels API authentifi\xE9s",
        limit: 1e5,
        period: "month",
        overage: "charge",
        overageRate: 1,
        unit: "call"
      }),
      quota({
        metric: "team_members",
        label: "Membres d\u2019\xE9quipe",
        description: "Collaborateurs actifs sur le workspace",
        limit: 10,
        period: "month",
        overage: "block",
        unit: "seat"
      })
    ],
    features: [
      {
        id: "support.priority",
        label: "Support prioritaire",
        enabled: true
      },
      {
        id: "analytics.advanced",
        label: "Analytics avanc\xE9s",
        enabled: true
      },
      {
        id: "branding.custom",
        label: "Branding personnalis\xE9",
        enabled: true
      },
      {
        id: "api.access",
        label: "Acc\xE8s API",
        enabled: true
      },
      {
        id: "webhooks",
        label: "Webhooks temps r\xE9el",
        enabled: true
      }
    ],
    limits: {
      designsPerMonth: 250,
      storageGb: 50,
      teamMembers: 10
    }
  },
  business: {
    id: "business",
    name: "Business",
    headline: "Scale-up et \xE9quipes internationales",
    basePriceCents: 29900,
    quotas: [
      quota({
        metric: "designs_created",
        label: "Designs g\xE9n\xE9r\xE9s",
        description: "Nombre de designs g\xE9n\xE9r\xE9s via IA ou pipeline interne",
        limit: 1e3,
        period: "month",
        overage: "charge",
        overageRate: 30,
        unit: "design"
      }),
      quota({
        metric: "renders_2d",
        label: "Rendus 2D",
        description: "Rendus 2D haute r\xE9solution",
        limit: 2e3,
        period: "month",
        overage: "charge",
        overageRate: 10,
        unit: "render",
        creditCost: 1,
        baseCostCents: 10
      }),
      quota({
        metric: "renders_3d",
        label: "Rendus 3D",
        description: "Rendus 3D/GLTF haute pr\xE9cision",
        limit: 200,
        period: "month",
        overage: "charge",
        overageRate: 60,
        unit: "render",
        creditCost: 5,
        baseCostCents: 60
      }),
      quota({
        metric: "ai_generations",
        label: "G\xE9n\xE9rations IA",
        description: "G\xE9n\xE9rations IA via mod\xE8les internes et externes",
        limit: 500,
        period: "month",
        overage: "charge",
        overageRate: 40,
        unit: "generation"
      }),
      quota({
        metric: "storage_gb",
        label: "Stockage",
        description: "Stockage cloud pour assets (GB)",
        limit: 100,
        period: "month",
        overage: "charge",
        overageRate: 20,
        unit: "gb"
      }),
      quota({
        metric: "api_calls",
        label: "Requ\xEAtes API",
        description: "Appels API authentifi\xE9s",
        limit: 2e5,
        period: "month",
        overage: "charge",
        overageRate: 1,
        unit: "call"
      }),
      quota({
        metric: "team_members",
        label: "Membres d\u2019\xE9quipe",
        description: "Collaborateurs actifs sur le workspace",
        limit: 50,
        period: "month",
        overage: "block",
        unit: "seat"
      })
    ],
    features: [
      {
        id: "support.dedicated",
        label: "Support d\xE9di\xE9",
        enabled: true
      },
      {
        id: "analytics.advanced",
        label: "Analytics avanc\xE9s",
        enabled: true
      },
      {
        id: "branding.full",
        label: "Branding complet et white-label",
        enabled: true
      },
      {
        id: "api.access",
        label: "Acc\xE8s API & SDKs",
        enabled: true
      },
      {
        id: "compliance.sla",
        label: "SLA 99.5% & conformit\xE9 renforc\xE9e",
        enabled: true
      }
    ],
    addons: [
      {
        id: "addon.custom_domains",
        label: "Domaines personnalis\xE9s suppl\xE9mentaires",
        description: "Domaines additionnels pour portails clients",
        priceCents: 2e3,
        meteredMetric: "custom_domains"
      },
      {
        id: "addon.additional_members",
        label: "Membres \xE9quipe suppl\xE9mentaires",
        description: "Pack de 10 si\xE8ges suppl\xE9mentaires",
        priceCents: 4500,
        meteredMetric: "team_members"
      }
    ],
    limits: {
      designsPerMonth: 1e3,
      storageGb: 100,
      teamMembers: 50
    }
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    headline: "Programmes sur-mesure & multi-division",
    basePriceCents: 99900,
    quotas: [
      quota({
        metric: "designs_created",
        label: "Designs g\xE9n\xE9r\xE9s",
        description: "Illimit\xE9 avec politiques personnalis\xE9es",
        limit: 99999,
        period: "month",
        overage: "charge",
        overageRate: 20,
        unit: "design"
      }),
      quota({
        metric: "renders_2d",
        label: "Rendus 2D",
        description: "Rendus 2D haute r\xE9solution",
        limit: 99999,
        period: "month",
        overage: "charge",
        overageRate: 5,
        unit: "render",
        creditCost: 1,
        baseCostCents: 5
      }),
      quota({
        metric: "renders_3d",
        label: "Rendus 3D",
        description: "Rendus 3D/GLTF haute pr\xE9cision",
        limit: 99999,
        period: "month",
        overage: "charge",
        overageRate: 40,
        unit: "render",
        creditCost: 5,
        baseCostCents: 40
      }),
      quota({
        metric: "ai_generations",
        label: "G\xE9n\xE9rations IA",
        description: "G\xE9n\xE9rations IA via mod\xE8les internes et externes",
        limit: 99999,
        period: "month",
        overage: "charge",
        overageRate: 40,
        unit: "generation"
      }),
      quota({
        metric: "storage_gb",
        label: "Stockage",
        description: "Stockage cloud pour assets (GB)",
        limit: 500,
        period: "month",
        overage: "charge",
        overageRate: 20,
        unit: "gb"
      }),
      quota({
        metric: "api_calls",
        label: "Requ\xEAtes API",
        description: "Appels API authentifi\xE9s",
        limit: 9999999,
        period: "month",
        overage: "charge",
        overageRate: 1,
        unit: "call"
      }),
      quota({
        metric: "team_members",
        label: "Membres d\u2019\xE9quipe",
        description: "Collaborateurs actifs sur le workspace",
        limit: 999,
        period: "month",
        overage: "block",
        unit: "seat"
      })
    ],
    features: [
      {
        id: "support.white_glove",
        label: "Support white-glove 24/7",
        enabled: true
      },
      {
        id: "analytics.custom",
        label: "Analytics personnalis\xE9s & BI",
        enabled: true
      },
      {
        id: "infrastructure.dedicated",
        label: "Infrastructure d\xE9di\xE9e multi-r\xE9gions",
        enabled: true
      },
      {
        id: "compliance.enterprise",
        label: "Compliance avanc\xE9e & audits",
        enabled: true
      },
      {
        id: "training.enablement",
        label: "Programmes d\u2019onboarding & formation",
        enabled: true
      }
    ],
    addons: [
      {
        id: "addon.sla",
        label: "SLA 99.9% contractuel",
        description: "Engagement contractuel SLA, support multi-canal",
        priceCents: 7500
      },
      {
        id: "addon.regional_clusters",
        label: "Clusters r\xE9gionaux suppl\xE9mentaires",
        description: "D\xE9ploiements suppl\xE9mentaires en multi-r\xE9gions"
      }
    ],
    limits: {
      designsPerMonth: 99999,
      storageGb: 500,
      teamMembers: 999
    }
  }
};
var PLAN_CATALOG = {
  plans: PLAN_DEFINITIONS,
  defaultPlan: "starter",
  availableTiers: ["starter", "professional", "business", "enterprise"]
};
function getPlanDefinition(plan) {
  return PLAN_DEFINITIONS[plan];
}
function listPlans() {
  return Object.values(PLAN_DEFINITIONS);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PLAN_CATALOG,
  PLAN_DEFINITIONS,
  getPlanDefinition,
  listPlans
});
