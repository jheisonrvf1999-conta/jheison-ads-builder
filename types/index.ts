export interface User {
  id: string
  email: string
  name: string | null
  two_fa_enabled: boolean
  google_ads_connected: boolean
  created_at: string
  updated_at: string
}

export interface PageAnalysisResult {
  url: string
  salesPageUrl?: string
  title: string
  metaDescription: string
  h1: string[]
  h2: string[]
  h3: string[]
  benefits: string[]
  features: string[]
  ctas: string[]
  price: string | null
  offers: string[]
  trustElements: string[]
  productName: string
  analyzedAt: string
}

export interface ScoredKeyword {
  keyword: string
  score: number
  matchType: 'Exact' | 'Phrase' | 'Broad'
  selected: boolean
  isNegative: boolean
  monthlySearches?: number
  cpcAvg?: number
  competition?: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface RSAHeadline {
  text: string
  pinPosition?: 1 | 2 | 3
}

export interface RSADescription {
  text: string
  pinPosition?: 1 | 2
}

export interface RSAAd {
  id: string
  headlines: RSAHeadline[]
  descriptions: RSADescription[]
  finalUrl: string
  trackingTemplate: string
  path1?: string
  path2?: string
}

export interface AdGroup {
  id: string
  name: string
  keywords: ScoredKeyword[]
  ads: RSAAd[]
  status: 'active' | 'paused'
  biddingStrategy?: 'MAXIMIZE_CONVERSIONS' | 'TARGET_ROAS' | 'MAXIMIZE_CLICKS'
  targetRoas?: number
  targetCpa?: number
}

export interface Sitelink {
  title: string
  description1: string
  description2?: string
  finalUrl: string
}

export interface Callout {
  text: string
}

export interface StructuredSnippet {
  header: string
  values: string[]
}

export interface CampaignExtensions {
  sitelinks: Sitelink[]
  callouts: Callout[]
  structuredSnippets: StructuredSnippet[]
}

export interface Campaign {
  id: string
  userId: string
  name: string
  productName: string
  category: string
  objective: string
  benefits: string[]
  differentials: string[]
  offer: string
  affiliateUrl: string
  adGroups: AdGroup[]
  extensions: CampaignExtensions
  negativeKeywords: string[]
  status: 'draft' | 'active' | 'exported' | 'synced'
  googleAdsCampaignId?: string
  estimatedCpc?: number
  realCpc?: number
  cpcDeviation?: number
  syncStatus?: 'synced' | 'diverged' | 'pending'
  lastSyncAt?: string
  createdAt: string
  updatedAt: string
  exportedAt?: string
}

export interface CampaignInput {
  productName: string
  category: string
  objective: string
  benefits: string[]
  differentials: string[]
  offer: string
  affiliateUrl: string
  keywords: ScoredKeyword[]
}

export interface CampaignSummary {
  id: string
  name: string
  productName: string
  category: string
  status: 'draft' | 'active' | 'exported' | 'synced'
  adGroupCount: number
  keywordCount: number
  googleAdsCampaignId?: string
  syncStatus?: string
  estimatedCpc?: number
  realCpc?: number
  createdAt: string
  updatedAt: string
}

export interface ComplianceIssue {
  field: string
  type: 'banned_word' | 'char_limit' | 'excessive_promise' | 'policy_violation'
  message: string
  severity: 'error' | 'warning'
  suggestion?: string
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface DashboardStats {
  totalCampaigns: number
  draftCampaigns: number
  activeCampaigns: number
  exportedCampaigns: number
  syncedCampaigns: number
  monthlySpend: number
  planName: string
  campaignsUsed: number
  campaignsLimit: number
}

export interface Subscription {
  id: string
  userId: string
  plan: 'free' | 'pro' | 'enterprise'
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  currentPeriodEnd?: string
  canceledAt?: string
  createdAt: string
  updatedAt: string
}

export interface CampaignPerformance {
  id: string
  campaignId: string
  keyword: string
  estimatedCpc: number
  realCpc?: number
  impressions?: number
  clicks?: number
  recordedAt: string
}

export interface AuditLog {
  id: string
  userId: string
  action: string
  status: 'success' | 'failure'
  errorMessage?: string
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiError {
  error: string
  details?: unknown
}

export interface ApiSuccess<T> {
  data: T
  message?: string
}

export type CampaignCategory =
  | 'suplemento'
  | 'software'
  | 'curso'
  | 'ecommerce'
  | 'servico'
  | 'ebook'
  | 'consultoria'
  | 'outro'

export type CampaignObjective =
  | 'conversao'
  | 'leads'
  | 'trafego'
  | 'awareness'

export interface CampaignTemplate {
  id: string
  name: string
  category: CampaignCategory
  description: string
  defaultBenefits: string[]
  defaultDifferentials: string[]
  defaultNegativeKeywords: string[]
  sampleKeywords: string[]
  icon: string
}

export interface ExportOptions {
  format: 'csv' | 'xml'
  includeNegatives: boolean
  includeExtensions: boolean
  campaignId: string
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
}

export interface PlanFeatures {
  name: string
  price: number
  campaigns: number
  googleAdsApi: boolean
  performanceTracking: boolean
  webhooks: boolean
  aiInsights: boolean
  prioritySupport: boolean
  stripePriceId?: string
}

export const PLANS: Record<string, PlanFeatures> = {
  free: {
    name: 'Free',
    price: 0,
    campaigns: 5,
    googleAdsApi: false,
    performanceTracking: false,
    webhooks: false,
    aiInsights: false,
    prioritySupport: false,
  },
  pro: {
    name: 'Pro',
    price: 97,
    campaigns: 50,
    googleAdsApi: true,
    performanceTracking: true,
    webhooks: false,
    aiInsights: false,
    prioritySupport: false,
  },
  enterprise: {
    name: 'Enterprise',
    price: 297,
    campaigns: -1,
    googleAdsApi: true,
    performanceTracking: true,
    webhooks: true,
    aiInsights: true,
    prioritySupport: true,
  },
}
