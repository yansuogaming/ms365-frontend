export interface SessionUser {
  upn: string
  displayName: string
  role: string
}

export interface SessionTenant {
  id: string
  domain: string
  displayName: string
}

export interface Session {
  user: SessionUser
  tenant: SessionTenant
}

export interface LoginRequest {
  username: string
  password: string
}
