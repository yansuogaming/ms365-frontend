/** Subscription state, as Microsoft 365 admin center shows it. */
export type ProductStatus = 'Active' | 'Warning' | 'Suspended' | 'Disabled' | 'Expired'

/** One licensed product (SKU) the tenant owns. Read-only: purchases happen in the admin center. */
export interface ProductRow {
  skuId: string
  name: string
  /** Licenses given to users or groups. */
  assigned: number
  /** Licenses bought (enabled units). Available = purchased − assigned. */
  purchased: number
  status: ProductStatus
  /** ISO dates, or null when Microsoft does not report one. */
  purchaseDate: string | null
  renewalDate: string | null
  /** e.g. "Commercial direct", "Partner (CSP)" */
  purchaseChannel: string | null
  /** e.g. "License-based" */
  productType: string | null
  /** e.g. "Free", "Paid", "Trial" */
  pricingModel: string | null
  /** e.g. "Free", "Credit card", "Invoice" */
  payment: string | null
}

export interface ProductListQuery {
  page: number
  pageSize: number
  search: string
  /** '' = any */
  status: '' | ProductStatus
}
