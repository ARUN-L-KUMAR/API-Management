export interface ApiKey {
  id: string
  keyName: string
  providerCode: string
  apiKey?: string
  plainApiKey?: string
  description?: string
  folderId?: string
  tagIds?: string[]
  tags: { id: string; name: string; color: string }[]
  status: string
  isMonitoringEnabled: boolean
  monitoringFrequency: number
  createdAt: string
}

export interface Folder {
  id: string
  name: string
  createdAt?: string
}

export interface Tag {
  id: string
  name: string
  color: string
}

export interface KeyModel {
  id: string
  modelName: string
  displayName: string
  verificationStatus: string
  latencyMs: number
}

export interface ActivityLog {
  id: string
  keyName: string
  providerCode: string
  eventType: string
  status: string
  message: string
  durationMs: number
  createdAt: string
}

export interface PlaygroundResult {
  status: string
  response?: string
  errorMessage?: string
  latencyMs?: number
}

interface CreateKeyPayload {
  keyName: string
  providerCode: string
  apiKey: string
  description?: string
  folderId?: string
  tagIds?: string[]
  isMonitoringEnabled: boolean
  monitoringFrequency: number
}

interface UpdateKeyPayload {
  keyName?: string
  description?: string
  folderId?: string | null
  isMonitoringEnabled?: boolean
  monitoringFrequency?: number
  tagIds?: string[]
}

export interface AuthResponse {
  token: string
  user: { id: string; email: string; name: string }
  organization: { id: string; name: string; slug: string }
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

function getOrgId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('x-organization-id')
}

function getUserId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('x-user-id')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const orgId = getOrgId()
  if (orgId) {
    headers['x-organization-id'] = orgId
  }

  const userId = getUserId()
  if (userId) {
    headers['x-user-id'] = userId
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errText = await response.text()
    let message = 'An error occurred'
    try {
      const parsed = JSON.parse(errText)
      message = Array.isArray(parsed.message) ? parsed.message.join(', ') : parsed.message || message
    } catch {}
    throw new Error(message)
  }

  return response.json()
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (email: string, password: string, name?: string) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) }),
  getMe: () => request<{ user: { id: string; email: string; name: string }; organization: { id: string; name: string; slug: string } }>('/auth/me'),

  getKeys: (folderId?: string, provider?: string, status?: string) => {
    const params = new URLSearchParams()
    if (folderId) params.append('folderId', folderId)
    if (provider) params.append('provider', provider)
    if (status) params.append('status', status)
    return request<ApiKey[]>(`/api-keys?${params.toString()}`)
  },
  getKey: (id: string) => request<ApiKey>(`/api-keys/${id}`),
  createKey: (data: CreateKeyPayload) =>
    request<ApiKey>('/api-keys', { method: 'POST', body: JSON.stringify(data) }),
  updateKey: (id: string, data: UpdateKeyPayload) =>
    request<ApiKey>(`/api-keys/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteKey: (id: string) => request<void>(`/api-keys/${id}`, { method: 'DELETE' }),
  validateKey: (id: string) => request<{ status: string }>(`/api-keys/${id}/validate`, { method: 'POST' }),
  getKeyModels: (id: string, showFailed?: boolean, showAll?: boolean) => {
    const params = new URLSearchParams()
    if (showFailed) params.append('showFailed', 'true')
    if (showAll) params.append('showAll', 'true')
    return request<KeyModel[]>(`/api-keys/${id}/models?${params.toString()}`)
  },

  bulkDeleteKeys: (ids: string[]) =>
    request<void>('/api-keys/bulk-delete', { method: 'POST', body: JSON.stringify({ ids }) }),
  bulkValidateKeys: (ids: string[]) =>
    request<{ status: string }[]>('/api-keys/bulk-validate', { method: 'POST', body: JSON.stringify({ ids }) }),

  getFolders: () => request<Folder[]>('/folders'),
  createFolder: (name: string) => request<Folder>('/folders', { method: 'POST', body: JSON.stringify({ name }) }),
  updateFolder: (id: string, name: string) => request<Folder>(`/folders/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) }),
  deleteFolder: (id: string) => request<void>(`/folders/${id}`, { method: 'DELETE' }),

  getTags: () => request<Tag[]>('/tags'),
  createTag: (name: string, color: string) =>
    request<Tag>('/tags', { method: 'POST', body: JSON.stringify({ name, color }) }),
  deleteTag: (id: string) => request<void>(`/tags/${id}`, { method: 'DELETE' }),

  getLogs: (apiKeyId?: string) => {
    const params = new URLSearchParams()
    if (apiKeyId) params.append('apiKeyId', apiKeyId)
    return request<ActivityLog[]>(`/activity-logs?${params.toString()}`)
  },

  runPlayground: (apiKeyId: string, modelId: string, prompt: string) =>
    request<PlaygroundResult>('/playground/run', {
      method: 'POST',
      body: JSON.stringify({ apiKeyId, modelId, prompt }),
    }),
  getPlaygroundSessions: () => request<PlaygroundResult[]>('/playground/sessions'),
}
