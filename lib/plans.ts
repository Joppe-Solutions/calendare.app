export const PLAN_LIMITS = {
  free: {
    maxServices: 1,
    maxAppointmentsPerMonth: 20,
    features: {
      customBranding: false,
      advancedReports: false,
      emailNotifications: false,
      multipleUsers: false,
      paymentIntegration: false,
    },
  },
  pro: {
    maxServices: Infinity,
    maxAppointmentsPerMonth: Infinity,
    features: {
      customBranding: true,
      advancedReports: true,
      emailNotifications: false,
      multipleUsers: false,
      paymentIntegration: false,
    },
  },
  business: {
    maxServices: Infinity,
    maxAppointmentsPerMonth: Infinity,
    features: {
      customBranding: true,
      advancedReports: true,
      emailNotifications: true,
      multipleUsers: true,
      paymentIntegration: true,
    },
  },
} as const

export type PlanId = keyof typeof PLAN_LIMITS

export function getPlanLimits(planId: string | null | undefined) {
  const plan = (planId as PlanId) || "free"
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free
}

export function isFeatureAllowed(planId: string | null | undefined, feature: keyof typeof PLAN_LIMITS.free.features) {
  const limits = getPlanLimits(planId)
  return limits.features[feature]
}