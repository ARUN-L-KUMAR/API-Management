'use client'

import React, { useState, useMemo } from 'react'
import clsx from 'clsx'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Key, Folder, Plus, Search, RefreshCw, Eye, EyeOff, Clipboard, Trash2, Edit2,
  CheckCircle, Server, Clock, LayoutGrid, LayoutList, ShieldAlert,
  Terminal, Sparkles, Filter, Check, ArrowUpRight, ShieldCheck, Download,
  ChevronRight, XCircle, AlertTriangle, Copy, Cpu, Code2, Database, Cloud, Globe,
  Mail, Phone
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { api } from '@/lib/api'
import { useStore } from '@/store/useStore'
import { toast } from 'sonner'
import { StatusBadge, ProviderBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { TableSkeleton } from '@/components/ui/Skeleton'

export const AI_MODEL_PROVIDERS = [
  'openai', 'anthropic', 'gemini', 'groq', 'deepseek', 'together', 'openrouter', 'opencode', 'doubleworld'
]

export const PLATFORM_CONFIG: Record<string, {
  name: string
  category: string
  icon: string
  capabilities: string[]
  placeholder: string
  hint: string
  codeSnippet: { curl: string; js: string; python: string }
}> = {
  cloudinary: {
    name: 'Cloudinary',
    category: 'Media & CDN Storage',
    icon: '🖼️',
    capabilities: ['Dynamic Image Optimization', 'Video Transcoding & Streaming', 'High-Speed Edge CDN Delivery', 'Signed Asset Management'],
    placeholder: 'cloud_name:api_key:api_secret',
    hint: 'Format: cloud_name:api_key:api_secret (separated by colons)',
    codeSnippet: {
      curl: `curl "https://api.cloudinary.com/v1_1/<cloud_name>/resources/image" \\\n  -u "<api_key>:<api_secret>"`,
      js: `import { v2 as cloudinary } from 'cloudinary';\n\ncloudinary.config({\n  cloud_name: '<cloud_name>',\n  api_key: '<api_key>',\n  api_secret: '<api_secret>',\n  secure: true\n});`,
      python: `import cloudinary\nimport cloudinary.uploader\n\ncloudinary.config(\n  cloud_name = "<cloud_name>",\n  api_key = "<api_key>",\n  api_secret = "<api_secret>",\n  secure = True\n)`
    }
  },
  elevenlabs: {
    name: 'ElevenLabs',
    category: 'Speech & Voice Synthesis',
    icon: '🎙️',
    capabilities: ['Voice Cloning & Design', 'Text-to-Speech Generation', 'Audio Isolation & Dubbing', 'Multi-lingual Voice Models'],
    placeholder: 'xi-... or your ElevenLabs API key',
    hint: 'Format: ElevenLabs API Key (xi-...)',
    codeSnippet: {
      curl: `curl -H "xi-api-key: <KEY>" "https://api.elevenlabs.io/v1/user"`,
      js: `import { ElevenLabsClient } from "elevenlabs";\nconst client = new ElevenLabsClient({ apiKey: "<KEY>" });`,
      python: `from elevenlabs.client import ElevenLabs\nclient = ElevenLabs(api_key="<KEY>")`
    }
  },
  aws: {
    name: 'Amazon Web Services (AWS)',
    category: 'Cloud Infrastructure',
    icon: '☁️',
    capabilities: ['S3 Object Storage', 'AWS Bedrock AI & Titan Models', 'DynamoDB & Cloud Compute', 'IAM Vault Security'],
    placeholder: 'ACCESS_KEY_ID:SECRET_ACCESS_KEY or AKIA...',
    hint: 'Format: ACCESS_KEY_ID:SECRET_ACCESS_KEY or AKIA... Access Key',
    codeSnippet: {
      curl: `aws configure set aws_access_key_id <ACCESS_KEY_ID>\naws configure set aws_secret_access_key <SECRET_KEY>`,
      js: `import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";\n\nconst client = new S3Client({\n  region: "us-east-1",\n  credentials: {\n    accessKeyId: "<ACCESS_KEY_ID>",\n    secretAccessKey: "<SECRET_KEY>"\n  }\n});`,
      python: `import boto3\n\ns3 = boto3.client(\n  's3',\n  aws_access_key_id='<ACCESS_KEY_ID>',\n  aws_secret_access_key='<SECRET_KEY>'\n)`
    }
  },
  redis: {
    name: 'Redis',
    category: 'Databases & In-Memory Cache',
    icon: '⚡',
    capabilities: ['Ultra-Low Latency Key/Value', 'Real-Time Pub/Sub Messaging', 'Session & Rate Limiting Engine', 'In-Memory Data Store'],
    placeholder: 'redis://default:password@host:port or UPSTASH_URL:TOKEN',
    hint: 'Format: redis:// connection URI or Upstash REST URL:TOKEN',
    codeSnippet: {
      curl: `curl -H "Authorization: Bearer <TOKEN>" "https://<endpoint>/ping"`,
      js: `import { createClient } from 'redis';\n\nconst client = createClient({\n  url: 'redis://default:<password>@<host>:<port>'\n});\nawait client.connect();`,
      python: `import redis\n\nr = redis.Redis(host='<host>', port=6379, password='<password>')\nr.ping()`
    }
  },
  upstash: {
    name: 'Upstash Serverless Redis',
    category: 'Databases & In-Memory Cache',
    icon: '⚡',
    capabilities: ['Serverless Redis REST API', 'Global Edge Caching', 'QStash Message Queues', 'Zero-Config Connections'],
    placeholder: 'https://...upstash.io:TOKEN',
    hint: 'Format: Upstash REST URL and Bearer token separated by a colon',
    codeSnippet: {
      curl: `curl -H "Authorization: Bearer <TOKEN>" "https://<endpoint>/get/mykey"`,
      js: `import { Redis } from '@upstash/redis';\n\nconst redis = new Redis({\n  url: 'https://<endpoint>',\n  token: '<token>'\n});`,
      python: `from upstash_redis import Redis\n\nredis = Redis(url="https://<endpoint>", token="<token>")\nredis.set("key", "value")`
    }
  },
  googlecloud: {
    name: 'Google Cloud Platform (GCP)',
    category: 'Cloud Infrastructure',
    icon: '🌐',
    capabilities: ['GCP Cloud Console APIs', 'Resource Manager & IAM', 'Cloud Storage & Functions', 'Integrated Usage Monitoring'],
    placeholder: 'AIzaSy...',
    hint: 'Format: Google Cloud API Key (AIzaSy...)',
    codeSnippet: {
      curl: `curl "https://cloudresourcemanager.googleapis.com/v1/projects?key=<API_KEY>"`,
      js: `// Use with Google Cloud Client Libraries\nconst apiKey = "<API_KEY>";`,
      python: `import requests\n\nres = requests.get(f"https://cloudresourcemanager.googleapis.com/v1/projects?key={<API_KEY>}")`
    }
  },
  googleconsole: {
    name: 'Google Cloud Console',
    category: 'Cloud Infrastructure',
    icon: '🌐',
    capabilities: ['Google Console Services', 'GCP Developer APIs', 'OAuth Client Integration', 'Cloud Project Quotas'],
    placeholder: 'AIzaSy...',
    hint: 'Format: Google Cloud Console API Key (AIzaSy...)',
    codeSnippet: {
      curl: `curl "https://cloudresourcemanager.googleapis.com/v1/projects?key=<API_KEY>"`,
      js: `// Google Console API Key\nconst apiKey = "<API_KEY>";`,
      python: `import requests\nres = requests.get("https://cloudresourcemanager.googleapis.com/v1/projects", params={"key": "<API_KEY>"})`
    }
  },
  telegram: {
    name: 'Telegram Bot',
    category: 'Communication & Bots',
    icon: '🤖',
    capabilities: ['Bot Webhook Delivery', 'Two-Way Chat Messaging', 'Broadcast Channel Notifications', 'Inline Commands'],
    placeholder: '123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ',
    hint: 'Format: Telegram Bot Token from @BotFather',
    codeSnippet: {
      curl: `curl "https://api.telegram.org/bot<TOKEN>/getMe"`,
      js: `import TelegramBot from 'node-telegram-bot-api';\n\nconst bot = new TelegramBot('<TOKEN>', { polling: true });\nbot.on('message', (msg) => bot.sendMessage(msg.chat.id, 'Received'));`,
      python: `import telebot\n\nbot = telebot.TeleBot("<TOKEN>")\n@bot.message_handler(commands=['start'])\ndef send_welcome(message):\n  bot.reply_to(message, "Hello!")`
    }
  },
  github: {
    name: 'GitHub',
    category: 'Developer Platform',
    icon: '🐙',
    capabilities: ['Repository Secrets & Actions', 'REST & GraphQL APIs', 'Deployment Status Webhooks', 'Automated CI/CD'],
    placeholder: 'ghp_... or github_pat_...',
    hint: 'Format: GitHub Personal Access Token',
    codeSnippet: {
      curl: `curl -H "Authorization: token <TOKEN>" "https://api.github.com/user"`,
      js: `import { Octokit } from "@octokit/rest";\nconst octokit = new Octokit({ auth: "<TOKEN>" });`,
      python: `from github import Github\ng = Github("<TOKEN>")\nfor repo in g.get_user().get_repos():\n  print(repo.name)`
    }
  },
  stripe: {
    name: 'Stripe Payments',
    category: 'Payment Infrastructure',
    icon: '💳',
    capabilities: ['Payment Intents & Checkout', 'Customer Subscriptions', 'Webhook Event Signing', 'Balance & Payouts API'],
    placeholder: 'sk_live_... or sk_test_...',
    hint: 'Format: Stripe Secret Key (sk_live_... or sk_test_...)',
    codeSnippet: {
      curl: `curl https://api.stripe.com/v1/charges \\\n  -u <STRIPE_SECRET_KEY>:`,
      js: `import Stripe from 'stripe';\nconst stripe = new Stripe('<STRIPE_SECRET_KEY>');`,
      python: `import stripe\nstripe.api_key = "<STRIPE_SECRET_KEY>"\ncharges = stripe.Charge.list(limit=3)`
    }
  },
  cloudflare: {
    name: 'Cloudflare',
    category: 'Edge & Infrastructure',
    icon: '🛡️',
    capabilities: ['Edge Workers & KV', 'DNS Record Automation', 'DDoS Protection & WAF', 'CDN Cache Purging'],
    placeholder: 'Cloudflare API Token',
    hint: 'Format: Cloudflare Scoped API Token',
    codeSnippet: {
      curl: `curl -H "Authorization: Bearer <TOKEN>" "https://api.cloudflare.com/client/v4/user/tokens/verify"`,
      js: `const res = await fetch("https://api.cloudflare.com/client/v4/user/tokens/verify", {\n  headers: { Authorization: "Bearer <TOKEN>" }\n});`,
      python: `import requests\nres = requests.get("https://api.cloudflare.com/client/v4/user/tokens/verify", headers={"Authorization": "Bearer <TOKEN>"})`
    }
  },
  other: {
    name: 'Custom Platform API',
    category: 'Custom / Other',
    icon: '🔒',
    capabilities: ['AES-256 GCM Encrypted Storage', 'Continuous Health Probes', 'Audit & Access Logging', 'Folder & Tag Categorization'],
    placeholder: 'Paste your secret API key, token, or connection string',
    hint: 'Encrypted at rest with military-grade AES-256',
    codeSnippet: {
      curl: `curl -H "Authorization: Bearer <TOKEN>" "https://api.yourplatform.com/v1/health"`,
      js: `// Use with your custom client\nconst headers = { Authorization: 'Bearer <TOKEN>' };`,
      python: `import requests\nheaders = {'Authorization': 'Bearer <TOKEN>'}`
    }
  }
}

export default function PlatformVaultPage() {
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const {
    activeFolderId, activeTagIds, searchQuery, providerFilter, statusFilter,
    setSearchQuery, setProviderFilter, setStatusFilter, resetFilters,
    setActiveFolderId,
  } = useStore()

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false)
  const [revealedKeyId, setRevealedKeyId] = useState<string | null>(null)
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null)
  const [editingKey, setEditingKey] = useState<any | null>(null)
  const [selectedKeyIds, setSelectedKeyIds] = useState<string[]>([])
  const [inspectingPlatformKey, setInspectingPlatformKey] = useState<any | null>(null)

  const [newKeyName, setNewKeyName] = useState('')
  const [vaultCategory, setVaultCategory] = useState<'ai' | 'platform'>('platform')
  const [newKeyProvider, setNewKeyProvider] = useState('cloudinary')
  const [newKeySecret, setNewKeySecret] = useState('')
  const [showNewSecret, setShowNewSecret] = useState(false)
  const [newKeyDesc, setNewKeyDesc] = useState('')
  const [newKeyAccountEmail, setNewKeyAccountEmail] = useState('')
  const [newKeyAccountPhone, setNewKeyAccountPhone] = useState('')
  const [newKeyFolder, setNewKeyFolder] = useState('')
  const [newKeyTags, setNewKeyTags] = useState<string[]>([])
  const [newKeyMonitor, setNewKeyMonitor] = useState(true)
  const [newKeyFrequency, setNewKeyFrequency] = useState(60)
  const [editSecretValue, setEditSecretValue] = useState('')
  const [showEditSecret, setShowEditSecret] = useState(false)

  // Fetch all keys
  const { data: rawKeys = [], isLoading: isLoadingKeys } = useQuery({
    queryKey: ['keys', activeFolderId],
    queryFn: () => api.getKeys(activeFolderId || undefined),
  })

  const { data: folders = [] } = useQuery({ queryKey: ['folders'], queryFn: api.getFolders })
  const { data: tags = [] } = useQuery({ queryKey: ['tags'], queryFn: api.getTags })

  // Filter keys strictly for Platform, Cloud, and Developer secrets (non-AI)
  const platformKeys = useMemo(() => {
    return rawKeys.filter((k: any) => !AI_MODEL_PROVIDERS.includes(k.providerCode?.toLowerCase()))
  }, [rawKeys])

  const aiKeysCount = useMemo(() => {
    return rawKeys.filter((k: any) => AI_MODEL_PROVIDERS.includes(k.providerCode?.toLowerCase())).length
  }, [rawKeys])

  const createKeyMutation = useMutation({
    mutationFn: api.createKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keys'] })
      setIsKeyModalOpen(false)
      resetKeyForm()
      toast.success('Platform credential vaulted & verified')
    },
    onError: (err: any) => toast.error(err.message),
  })

  const updateKeyMutation = useMutation({
    mutationFn: (data: { id: string; payload: any }) => api.updateKey(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keys'] })
      setEditingKey(null)
      setEditSecretValue('')
      setShowEditSecret(false)
      toast.success('Secret metadata updated')
    },
    onError: (err: any) => toast.error(err.message),
  })

  const deleteKeyMutation = useMutation({
    mutationFn: api.deleteKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keys'] })
      toast.success('Secret removed from vault')
    },
  })

  const validateKeyMutation = useMutation({
    mutationFn: api.validateKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keys'] })
      queryClient.invalidateQueries({ queryKey: ['logs'] })
      toast.success('Validation probe dispatched')
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: api.bulkDeleteKeys,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keys'] })
      setSelectedKeyIds([])
      toast.success('Selected secrets deleted')
    },
  })

  const bulkValidateMutation = useMutation({
    mutationFn: api.bulkValidateKeys,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keys'] })
      setSelectedKeyIds([])
      toast.success('Bulk validation probes dispatched')
    },
  })

  const resetKeyForm = () => {
    setVaultCategory('platform')
    setNewKeyName('')
    setNewKeyProvider('cloudinary')
    setNewKeySecret('')
    setShowNewSecret(false)
    setNewKeyDesc('')
    setNewKeyAccountEmail('')
    setNewKeyAccountPhone('')
    setNewKeyFolder('')
    setNewKeyTags([])
    setNewKeyMonitor(true)
    setNewKeyFrequency(60)
  }

  const pasteFromClipboard = async (setter: (val: string) => void) => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        setter(text.trim())
        toast.success('Pasted from clipboard')
      }
    } catch {
      toast.error('Clipboard access denied. Please paste manually.')
    }
  }

  const filteredKeys = useMemo(() => {
    return platformKeys.filter((key: any) => {
      // 1. Status Filter
      if (statusFilter === 'working' && key.status !== 'Working') return false
      if (statusFilter === 'invalid' && key.status === 'Working') return false
      if (statusFilter && statusFilter !== 'working' && statusFilter !== 'invalid') {
        if (key.status.toLowerCase() !== statusFilter.toLowerCase()) return false
      }

      // 2. Provider Filter
      if (providerFilter && key.providerCode.toLowerCase() !== providerFilter.toLowerCase()) return false

      // 3. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matches =
          key.keyName.toLowerCase().includes(query) ||
          key.providerCode.toLowerCase().includes(query) ||
          (key.description && key.description.toLowerCase().includes(query))
        if (!matches) return false
      }

      // 4. Tags
      if (activeTagIds.length > 0) {
        const matchesTags = activeTagIds.every((tagId) => key.tags?.some((t: any) => t.id === tagId))
        if (!matchesTags) return false
      }

      // 5. Folder
      if (activeFolderId && key.folderId !== activeFolderId) {
        return false
      }

      return true
    })
  }, [platformKeys, statusFilter, providerFilter, searchQuery, activeTagIds, activeFolderId])

  const totalKeys = platformKeys.length
  const workingKeysCount = useMemo(() => platformKeys.filter((k: any) => k.status === 'Working').length, [platformKeys])
  const invalidKeysCount = useMemo(() => platformKeys.filter((k: any) => k.status !== 'Working').length, [platformKeys])
  const healthRate = totalKeys > 0 ? Math.round((workingKeysCount / totalKeys) * 100) : 100
  const uniqueProvidersList = useMemo(() => {
    const set = new Set(platformKeys.map((k: any) => k.providerCode.toLowerCase()))
    return Array.from(set)
  }, [platformKeys])

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKeyName.trim() || !newKeySecret.trim()) {
      toast.error('Identifier Name and Secret are required')
      return
    }
    createKeyMutation.mutate({
      keyName: newKeyName,
      providerCode: newKeyProvider,
      apiKey: newKeySecret,
      description: newKeyDesc || undefined,
      accountEmail: newKeyAccountEmail.trim() || undefined,
      accountPhone: newKeyAccountPhone.trim() || undefined,
      folderId: newKeyFolder || undefined,
      tagIds: newKeyTags.length > 0 ? newKeyTags : undefined,
      isMonitoringEnabled: newKeyMonitor,
      monitoringFrequency: newKeyFrequency,
    })
  }

  const handleUpdateKey = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingKey) return
    updateKeyMutation.mutate({
      id: editingKey.id,
      payload: {
        keyName: editingKey.keyName,
        description: editingKey.description,
        accountEmail: editingKey.accountEmail !== undefined ? editingKey.accountEmail : undefined,
        accountPhone: editingKey.accountPhone !== undefined ? editingKey.accountPhone : undefined,
        folderId: editingKey.folderId || null,
        isMonitoringEnabled: editingKey.isMonitoringEnabled,
        monitoringFrequency: editingKey.monitoringFrequency,
        tagIds: editingKey.tagIds,
        apiKey: editSecretValue.trim() ? editSecretValue.trim() : undefined,
      },
    })
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKeyId(id)
    toast.success('Secret copied to clipboard')
    setTimeout(() => setCopiedKeyId(null), 2000)
  }

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedKeyIds.length} secrets?`)) {
      bulkDeleteMutation.mutate(selectedKeyIds)
    }
  }

  const handleBulkValidate = () => {
    bulkValidateMutation.mutate(selectedKeyIds)
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Category Tab Switcher: AI Models vs Platform Secrets */}
      <div className="px-4 lg:px-6 pt-3 pb-0 bg-zinc-950/70 border-b border-[#1e1e24] flex items-center gap-2 shrink-0">
        <Link
          href="/keys"
          className="flex items-center gap-2 px-4 py-2 border-b-2 border-transparent text-xs font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
          <span>AI Foundation Models</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground">
            {aiKeysCount}
          </span>
        </Link>
        <Link
          href="/vault"
          className="flex items-center gap-2 px-4 py-2 border-b-2 border-sky-500 text-xs font-bold text-sky-300 bg-sky-500/10 rounded-t-lg transition-all cursor-pointer shadow-xs"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
          <span>Platform & Cloud Secrets</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-300">
            {totalKeys}
          </span>
        </Link>
      </div>

      {/* Subheader / Action Bar */}
      <div className="p-4 lg:p-6 border-b border-border bg-card/60 dark:bg-zinc-950/40 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-foreground tracking-tight">Platform Secrets & Cloud Vault</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 border border-sky-500/30 text-sky-700 dark:text-sky-400 font-mono">
              AES-256 GCM
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Vault, probe, and inspect credentials for Cloud Infrastructure (AWS, GCP), Media CDN (Cloudinary), Databases (Redis), and Developer APIs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center p-0.5 rounded-lg border border-border dark:border-zinc-800 bg-muted dark:bg-zinc-900/60">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-card dark:bg-zinc-800 text-foreground dark:text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Table View"
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-card dark:bg-zinc-800 text-foreground dark:text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          <Button onClick={() => setIsKeyModalOpen(true)} variant="primary" size="md" className="shadow-lg shadow-sky-900/25 bg-sky-600 hover:bg-sky-500">
            <Plus className="w-4 h-4" /> Vault Platform Secret
          </Button>
        </div>
      </div>

      {/* Cockpit Metrics */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 p-4 lg:p-6 shrink-0 border-b border-[#1e1e24] bg-zinc-950/20">
        {/* Metric 1 */}
        <div className="glass-panel p-4 rounded-xl flex items-center gap-3.5 relative overflow-hidden group">
          <div className="p-3 bg-sky-600/10 border border-sky-500/20 rounded-xl text-sky-400 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Secrets Vaulted</span>
              <span className="text-[10px] text-sky-400 font-semibold font-mono">Encrypted</span>
            </div>
            <h3 className="text-xl font-black text-white mt-0.5 tracking-tight">{totalKeys}</h3>
          </div>
        </div>

        {/* Metric 2 */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'working' ? null : 'working')}
          className={`glass-panel p-4 rounded-xl flex items-center gap-3.5 relative overflow-hidden group cursor-pointer transition-all ${
            statusFilter === 'working' ? 'border-emerald-500/40 bg-emerald-950/15' : 'hover:border-emerald-500/30'
          }`}
        >
          <div className="p-3 bg-emerald-600/10 border border-emerald-500/20 rounded-xl text-emerald-400 group-hover:scale-105 transition-transform">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Valid & Ready</span>
              <span className="text-[10px] text-emerald-400 font-semibold font-mono">{healthRate}% Health</span>
            </div>
            <h3 className="text-xl font-black text-emerald-400 mt-0.5 tracking-tight">
              {workingKeysCount} <span className="text-xs text-zinc-400 font-normal">Active</span>
            </h3>
          </div>
        </div>

        {/* Metric 3 */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'invalid' ? null : 'invalid')}
          className={`glass-panel p-4 rounded-xl flex items-center gap-3.5 relative overflow-hidden group cursor-pointer transition-all ${
            statusFilter === 'invalid' ? 'border-red-500/40 bg-red-950/15' : 'hover:border-red-500/30'
          }`}
        >
          <div className="p-3 bg-red-600/10 border border-red-500/20 rounded-xl text-red-400 group-hover:scale-105 transition-transform">
            <XCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Attention Needed</span>
              <span className="text-[10px] text-red-400 font-semibold font-mono">{invalidKeysCount} Issues</span>
            </div>
            <h3 className="text-xl font-black text-white mt-0.5 tracking-tight">
              {invalidKeysCount} <span className="text-xs text-zinc-500 font-normal">Expired / Invalid</span>
            </h3>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="glass-panel p-4 rounded-xl flex items-center gap-3.5 relative overflow-hidden group">
          <div className="p-3 bg-indigo-600/10 border border-indigo-500/20 rounded-xl text-indigo-400 group-hover:scale-105 transition-transform">
            <Cloud className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Connected Platforms</span>
              <span className="text-[10px] text-indigo-400 font-semibold font-mono">Multi-Cloud</span>
            </div>
            <h3 className="text-xl font-black text-white mt-0.5 tracking-tight">{uniqueProvidersList.length} Platforms</h3>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <button
              onClick={() => setStatusFilter(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === null ? 'bg-sky-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              All Secrets ({totalKeys})
            </button>
            <button
              onClick={() => setStatusFilter('working')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'working' ? 'bg-emerald-600 text-white shadow-sm' : 'text-zinc-400 hover:text-emerald-400'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Valid ({workingKeysCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter('invalid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'invalid' ? 'bg-red-600 text-white shadow-sm' : 'text-zinc-400 hover:text-red-400'
              }`}
            >
              <XCircle className="w-3.5 h-3.5 text-red-400" />
              <span>Attention Needed ({invalidKeysCount})</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="glass-panel p-3.5 rounded-xl border border-[#1e1e24] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[240px]">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search platform secrets by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-zinc-900/80 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Provider Filter */}
            <select
              value={providerFilter || ''}
              onChange={(e) => setProviderFilter(e.target.value || null)}
              className="bg-zinc-900/80 border border-zinc-800 rounded-lg text-xs text-zinc-300 px-3 py-1.5 focus:outline-none focus:border-sky-500"
            >
              <option value="">All Platform Services ({platformKeys.length})</option>
              <option value="elevenlabs">ElevenLabs (Voice & Audio)</option>
              <option value="cloudinary">Cloudinary</option>
              <option value="aws">AWS (Amazon Web Services)</option>
              <option value="redis">Redis</option>
              <option value="upstash">Upstash</option>
              <option value="googlecloud">Google Cloud</option>
              <option value="googleconsole">Google Console</option>
              <option value="cloudflare">Cloudflare</option>
              <option value="telegram">Telegram</option>
              <option value="github">GitHub</option>
              <option value="stripe">Stripe</option>
              <option value="other">Other / Custom</option>
            </select>

            {/* Folder Select */}
            <select
              value={activeFolderId || ''}
              onChange={(e) => setActiveFolderId(e.target.value || null)}
              className="bg-zinc-900/80 border border-zinc-800 rounded-lg text-xs text-zinc-300 px-3 py-1.5 focus:outline-none focus:border-sky-500"
            >
              <option value="">All Workspaces / Folders</option>
              {folders.map((f: any) => (
                <option key={f.id} value={f.id}>📁 {f.name}</option>
              ))}
            </select>

            {(searchQuery || providerFilter || statusFilter || activeFolderId || activeTagIds.length > 0) && (
              <button
                onClick={resetFilters}
                className="text-xs text-sky-400 hover:text-sky-300 font-semibold px-2 py-1 bg-sky-500/10 rounded-lg cursor-pointer transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Bulk Actions Banner */}
        {selectedKeyIds.length > 0 && (
          <div className="p-3 bg-sky-950/40 border border-sky-500/30 rounded-xl flex items-center justify-between">
            <span className="text-xs text-sky-200 font-semibold">
              {selectedKeyIds.length} secrets selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkValidate}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3 h-3" /> Re-probe Selected
              </button>
              <button
                onClick={handleBulkDelete}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3 h-3" /> Delete Selected
              </button>
              <button
                onClick={() => setSelectedKeyIds([])}
                className="text-xs text-zinc-400 hover:text-white px-2 py-1 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Content Views */}
        {isLoadingKeys ? (
          <TableSkeleton />
        ) : filteredKeys.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck className="w-12 h-12 text-sky-400" />}
            title="No Platform Secrets Vaulted"
            description="Securely store and health-probe credentials for Cloudinary, AWS, Redis, Google Cloud, Stripe, or custom APIs."
            action={{ label: 'Vault Your First Secret', onClick: () => setIsKeyModalOpen(true) }}
          />
        ) : viewMode === 'table' ? (
          <div className="glass-panel rounded-xl overflow-hidden border border-[#1e1e24] overflow-x-auto shadow-xl">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-zinc-950/60 border-b border-[#1e1e24] text-zinc-400 text-[10px] uppercase font-bold tracking-wider">
                  <th className="p-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedKeyIds.length === filteredKeys.length && filteredKeys.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedKeyIds(filteredKeys.map((k: any) => k.id))
                        else setSelectedKeyIds([])
                      }}
                      className="rounded border-zinc-700 bg-zinc-900 text-sky-600 focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="p-4">Platform & Service Name</th>
                  <th className="p-4">Vaulted Secret & Status</th>
                  <th className="p-4">Platform Capabilities & SDK</th>
                  <th className="p-4">Folder & Tags</th>
                  <th className="p-4">Health Probe</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e24]/70 text-xs">
                {filteredKeys.map((key: any) => {
                  const isSecretVisible = revealedKeyId === key.id
                  const isCopied = copiedKeyId === key.id
                  const isValid = key.status === 'Working'
                  const platform = PLATFORM_CONFIG[key.providerCode.toLowerCase()] || PLATFORM_CONFIG.other

                  return (
                    <tr key={key.id} className="hover:bg-zinc-900/40 transition-colors group">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedKeyIds.includes(key.id)}
                          onChange={() =>
                            setSelectedKeyIds((prev) =>
                              prev.includes(key.id) ? prev.filter((i) => i !== key.id) : [...prev, key.id]
                            )
                          }
                          className="rounded border-zinc-700 bg-zinc-900 text-sky-600 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      <td className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            <ProviderBadge provider={key.providerCode} />
                          </div>
                          <div>
                            <span className="font-bold text-white text-sm block leading-tight">{key.keyName}</span>
                            <span className="text-[11px] text-zinc-400 block mt-0.5">
                              {platform.category} {key.description ? `• ${key.description}` : ''}
                            </span>
                            {(key.accountEmail || key.accountPhone) && (
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {key.accountEmail && (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400 font-mono bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                                    <Mail className="w-2.5 h-2.5 text-zinc-500" />
                                    {key.accountEmail}
                                  </span>
                                )}
                                {key.accountPhone && (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400 font-mono bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                                    <Phone className="w-2.5 h-2.5 text-zinc-500" />
                                    {key.accountPhone}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex flex-col gap-1.5">
                          <StatusBadge status={key.status} />
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-400 bg-zinc-950/60 border border-zinc-800/80 px-2 py-1 rounded-md max-w-fit">
                            <span>{isSecretVisible ? key.plainApiKey || 'No secret' : '••••••••••••••••'}</span>
                            <button
                              onClick={() => {
                                if (isSecretVisible) setRevealedKeyId(null)
                                else {
                                  api.getKey(key.id).then((res) => {
                                    key.plainApiKey = res.plainApiKey
                                    setRevealedKeyId(key.id)
                                  })
                                }
                              }}
                              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                              title={isSecretVisible ? 'Hide Secret' : 'Reveal Secret'}
                            >
                              {isSecretVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => {
                                api.getKey(key.id).then((res) => {
                                  if (res.plainApiKey) copyToClipboard(res.plainApiKey, key.id)
                                })
                              }}
                              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-sky-400 transition-colors cursor-pointer"
                              title="Copy Secret"
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Clipboard className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <button
                          onClick={() => setInspectingPlatformKey(key)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 font-semibold text-xs transition-all cursor-pointer shadow-xs group/btn"
                        >
                          <span>{platform.icon}</span>
                          <span>{platform.capabilities[0] || 'Active Service'}</span>
                          <ChevronRight className="w-3 h-3 text-zinc-400 group-hover/btn:translate-x-0.5 transition-transform" />
                        </button>
                      </td>

                      <td className="p-4">
                        <div className="space-y-1.5">
                          {key.folderId ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-medium text-zinc-300">
                              <Folder className="w-3 h-3 text-zinc-400" />
                              {folders.find((f: any) => f.id === key.folderId)?.name || 'Folder'}
                            </span>
                          ) : (
                            <span className="text-[10px] text-zinc-600 font-mono italic">Unassigned</span>
                          )}
                          <div className="flex flex-wrap gap-1">
                            {key.tags && key.tags.map((tag: any) => (
                              <span
                                key={tag.id}
                                className="px-1.5 py-0.5 rounded text-[9px] font-semibold border"
                                style={{
                                  borderColor: `${tag.color}40`,
                                  backgroundColor: `${tag.color}15`,
                                  color: tag.color,
                                }}
                              >
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] text-zinc-400 font-mono flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${isValid ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            {key.isMonitoringEnabled ? `Every ${key.monitoringFrequency}m` : 'Off'}
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            {key.lastValidatedAt ? new Date(key.lastValidatedAt).toLocaleTimeString() : 'Not probed'}
                          </span>
                        </div>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => validateKeyMutation.mutate(key.id)}
                            className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 rounded-lg transition-colors cursor-pointer"
                            title="Run Probe Ping"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingKey({ ...key, tagIds: key.tags ? key.tags.map((t: any) => t.id) : [] })}
                            className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-sky-400 rounded-lg transition-colors cursor-pointer"
                            title="Edit Secret Metadata"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Remove this secret from your vault?')) {
                                deleteKeyMutation.mutate(key.id)
                              }
                            }}
                            className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                            title="Delete Secret"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredKeys.map((key: any) => {
              const isSecretVisible = revealedKeyId === key.id
              const isCopied = copiedKeyId === key.id
              const isValid = key.status === 'Working'
              const platform = PLATFORM_CONFIG[key.providerCode.toLowerCase()] || PLATFORM_CONFIG.other

              return (
                <div key={key.id} className="glass-panel p-4 rounded-xl border border-[#1e1e24] flex flex-col justify-between space-y-4 hover:border-zinc-700 transition-all">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <ProviderBadge provider={key.providerCode} />
                        <h4 className="font-bold text-white text-sm mt-1">{key.keyName}</h4>
                        <p className="text-[11px] text-zinc-400">{platform.category}</p>
                      </div>
                      <StatusBadge status={key.status} />
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800 font-mono text-xs text-zinc-300">
                      <span>{isSecretVisible ? key.plainApiKey || 'No secret' : '••••••••••••••••'}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            if (isSecretVisible) setRevealedKeyId(null)
                            else {
                              api.getKey(key.id).then((res) => {
                                key.plainApiKey = res.plainApiKey
                                setRevealedKeyId(key.id)
                              })
                            }
                          }}
                          className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer"
                        >
                          {isSecretVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => {
                            api.getKey(key.id).then((res) => {
                              if (res.plainApiKey) copyToClipboard(res.plainApiKey, key.id)
                            })
                          }}
                          className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-sky-400 cursor-pointer"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Clipboard className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => setInspectingPlatformKey(key)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 font-semibold text-xs transition-all cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <span>{platform.icon}</span>
                        {platform.capabilities[0]}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-zinc-500 font-mono">
                      Probe: {key.isMonitoringEnabled ? `${key.monitoringFrequency}m` : 'Off'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => validateKeyMutation.mutate(key.id)}
                        className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 rounded-lg cursor-pointer"
                        title="Revalidate"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingKey({ ...key, tagIds: key.tags ? key.tags.map((t: any) => t.id) : [] })}
                        className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-sky-400 rounded-lg cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Delete this secret?')) deleteKeyMutation.mutate(key.id)
                        }}
                        className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 rounded-lg cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Vault New Platform Secret Modal */}
      <Modal
        isOpen={isKeyModalOpen}
        onClose={() => {
          setIsKeyModalOpen(false)
          resetKeyForm()
        }}
        title={vaultCategory === 'platform' ? 'Vault Platform & Cloud Secret' : 'Vault New AI Model Key'}
        subtitle={
          vaultCategory === 'platform'
            ? 'Zero-knowledge AES-256 encrypted credential storage for infrastructure, media & cloud APIs'
            : 'Hardware-grade AES-256-GCM encryption with automated health & model discovery'
        }
        icon={
          vaultCategory === 'platform' ? (
            <ShieldCheck className="w-5 h-5 text-sky-400" />
          ) : (
            <Sparkles className="w-5 h-5 text-purple-400" />
          )
        }
        badge={
          vaultCategory === 'platform' ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Platform & Cloud
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
              AI Foundation Models
            </span>
          )
        }
        maxWidth="xl"
      >
        <form onSubmit={handleCreateKey} className="space-y-4">
          {/* Category Switcher: Platform vs AI */}
          <div className="flex p-1 bg-zinc-950/80 rounded-xl border border-white/10 mb-2">
            <button
              type="button"
              onClick={() => {
                setVaultCategory('platform')
                if (AI_MODEL_PROVIDERS.includes(newKeyProvider.toLowerCase())) {
                  setNewKeyProvider('cloudinary')
                }
              }}
              className={clsx(
                'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                vaultCategory === 'platform'
                  ? 'bg-sky-600/30 text-sky-300 border border-sky-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>Platform & Cloud Secret</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setVaultCategory('ai')
                if (!AI_MODEL_PROVIDERS.includes(newKeyProvider.toLowerCase())) {
                  setNewKeyProvider('openai')
                }
              }}
              className={clsx(
                'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                vaultCategory === 'ai'
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>AI Foundation Model Key</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                {vaultCategory === 'platform' ? 'Secret / Platform Identifier' : 'Key Identifier Name'} <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder={vaultCategory === 'platform' ? 'e.g. Production AWS S3 Key' : 'e.g. Production GPT-4o Enterprise'}
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                required
                className="w-full bg-zinc-900/90 border border-zinc-700/60 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                {vaultCategory === 'platform' ? 'Platform / Service' : 'AI Model Provider'} <span className="text-rose-400">*</span>
              </label>
              {vaultCategory === 'platform' ? (
                <select
                  value={newKeyProvider}
                  onChange={(e) => setNewKeyProvider(e.target.value)}
                  className="w-full bg-zinc-900/90 border border-zinc-700/60 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none transition-all"
                >
                  <optgroup label="🎙️ Media & Audio Services">
                    <option value="elevenlabs">ElevenLabs Speech & Voice</option>
                    <option value="cloudinary">Cloudinary Media & CDN</option>
                  </optgroup>
                  <optgroup label="☁️ Cloud & Infrastructure">
                    <option value="aws">AWS (Amazon Web Services)</option>
                    <option value="googlecloud">Google Cloud Platform (GCP)</option>
                    <option value="googleconsole">Google Cloud Console</option>
                    <option value="cloudflare">Cloudflare API & Edge</option>
                  </optgroup>
                  <optgroup label="⚡ Databases & Caching">
                    <option value="redis">Redis (In-Memory Key/Value)</option>
                    <option value="upstash">Upstash Serverless Redis</option>
                  </optgroup>
                  <optgroup label="🛠️ Developer, Messaging & Payments">
                    <option value="telegram">Telegram Bot Token</option>
                    <option value="github">GitHub Personal Access Token</option>
                    <option value="stripe">Stripe Secret Key</option>
                  </optgroup>
                  <optgroup label="🌐 Custom & Other">
                    <option value="other">Other / Custom Platform API</option>
                  </optgroup>
                </select>
              ) : (
                <select
                  value={newKeyProvider}
                  onChange={(e) => setNewKeyProvider(e.target.value)}
                  className="w-full bg-zinc-900/90 border border-zinc-700/60 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none transition-all"
                >
                  <option value="openai">OpenAI (GPT-4o, o1, o3-mini)</option>
                  <option value="gemini">Google Gemini (1.5 Pro, 2.0 Flash)</option>
                  <option value="anthropic">Anthropic Claude (3.5 Sonnet, Opus)</option>
                  <option value="groq">Groq LPU (Llama 3.3, Mixtral)</option>
                  <option value="deepseek">DeepSeek (V3, R1 Reasoner)</option>
                  <option value="together">Together AI (Open Models)</option>
                  <option value="openrouter">OpenRouter Unified Gateway</option>
                </select>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300">
                Secret Credentials / Key <span className="text-rose-400">*</span>
              </label>
              <span className="text-[11px] font-mono text-sky-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                Zero-Knowledge AES-256
              </span>
            </div>

            <div className="relative flex items-center">
              <input
                type={showNewSecret ? 'text' : 'password'}
                placeholder={PLATFORM_CONFIG[newKeyProvider.toLowerCase()]?.placeholder || 'Paste secret credentials...'}
                value={newKeySecret}
                onChange={(e) => setNewKeySecret(e.target.value)}
                required
                className="w-full bg-zinc-900/90 border border-zinc-700/60 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl pl-3.5 pr-24 py-2.5 text-sm font-mono text-white placeholder-zinc-600 outline-none transition-all"
              />
              <div className="absolute right-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowNewSecret(!showNewSecret)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
                  title={showNewSecret ? 'Hide secret' : 'Show secret'}
                >
                  {showNewSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => pasteFromClipboard(setNewKeySecret)}
                  className="px-2 py-1 rounded-md text-[11px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer border border-zinc-700/50 flex items-center gap-1"
                  title="Paste from clipboard"
                >
                  <Clipboard className="w-3 h-3" />
                  Paste
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1 pt-0.5">
              <span>{PLATFORM_CONFIG[newKeyProvider.toLowerCase()]?.hint || 'Encrypted with AES-256 GCM'}</span>
              <span className="text-zinc-500">Key is never stored in plaintext</span>
            </div>
          </div>

          {/* Account Email & Phone (Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
                <span>Account Email</span>
                <span className="text-[10px] text-zinc-500 font-normal">Optional</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="e.g. dev@company.com"
                  value={newKeyAccountEmail}
                  onChange={(e) => setNewKeyAccountEmail(e.target.value)}
                  className="w-full bg-zinc-900/90 border border-zinc-700/60 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-zinc-600 outline-none transition-all"
                />
                <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
                <span>Phone Number</span>
                <span className="text-[10px] text-zinc-500 font-normal">Optional</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="e.g. +1 555-0199"
                  value={newKeyAccountPhone}
                  onChange={(e) => setNewKeyAccountPhone(e.target.value)}
                  className="w-full bg-zinc-900/90 border border-zinc-700/60 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-zinc-600 outline-none transition-all"
                />
                <Phone className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Usage Context / Description <span className="text-zinc-500 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Production cluster asset storage in eu-central-1..."
              value={newKeyDesc}
              onChange={(e) => setNewKeyDesc(e.target.value)}
              className="w-full bg-zinc-900/90 border border-zinc-700/60 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Assign to Folder
              </label>
              <select
                value={newKeyFolder}
                onChange={(e) => setNewKeyFolder(e.target.value)}
                className="w-full bg-zinc-900/90 border border-zinc-700/60 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none transition-all"
              >
                <option value="">📁 No Folder (Unassigned)</option>
                {folders.map((f: any) => (
                  <option key={f.id} value={f.id}>📁 {f.name}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Custom Tags
                </label>
                {newKeyTags.length > 0 && (
                  <span className="text-[10px] text-sky-400 font-medium">{newKeyTags.length} selected</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 border border-zinc-800 bg-zinc-950/60 p-2.5 rounded-xl min-h-[44px] max-h-24 overflow-y-auto custom-scrollbar">
                {tags.length === 0 ? (
                  <span className="text-xs text-zinc-600">No tags configured yet</span>
                ) : (
                  tags.map((tag: any) => {
                    const isChecked = newKeyTags.includes(tag.id)
                    return (
                      <button
                        type="button"
                        key={tag.id}
                        onClick={() =>
                          setNewKeyTags((prev) =>
                            prev.includes(tag.id) ? prev.filter((t) => t !== tag.id) : [...prev, tag.id]
                          )
                        }
                        className="px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer border select-none transition-all flex items-center gap-1.5"
                        style={{
                          borderColor: isChecked ? tag.color : 'rgba(255, 255, 255, 0.1)',
                          backgroundColor: isChecked ? `${tag.color}25` : 'rgba(255, 255, 255, 0.03)',
                          color: isChecked ? tag.color : '#a1a1aa',
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.color }} />
                        {tag.name}
                        {isChecked && <Check className="w-3 h-3" />}
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/10">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsKeyModalOpen(false)
                resetKeyForm()
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={createKeyMutation.isPending}
              className={clsx(
                'shadow-lg px-5 text-white',
                vaultCategory === 'platform'
                  ? 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 shadow-sky-600/25'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-600/25'
              )}
            >
              <ShieldCheck className="w-4 h-4 mr-2" />
              {vaultCategory === 'platform' ? 'Securely Vault Secret' : 'Securely Vault AI Key'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Secret Modal */}
      <Modal
        isOpen={!!editingKey}
        onClose={() => {
          setEditingKey(null)
          setEditSecretValue('')
          setShowEditSecret(false)
        }}
        title="Edit Platform Secret"
        subtitle="Manage secret identifier, rotate credential keys, or re-organize tags & folders"
        icon={<Edit2 className="w-5 h-5 text-sky-400" />}
        badge={
          editingKey?.status ? (
            <StatusBadge status={editingKey.status} />
          ) : undefined
        }
        maxWidth="xl"
      >
        <form onSubmit={handleUpdateKey} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Secret Identifier Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={editingKey?.keyName || ''}
                onChange={(e) => setEditingKey((prev: any) => prev ? { ...prev, keyName: e.target.value } : null)}
                required
                className="w-full bg-zinc-900/90 border border-zinc-700/60 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Platform / Service
              </label>
              <div className="flex items-center gap-2 h-[42px] px-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                <ProviderBadge provider={editingKey?.providerCode || 'other'} />
                <span className="text-xs text-zinc-400 truncate">
                  {editingKey?.keyMask || 'Encrypted at Rest'}
                </span>
              </div>
            </div>
          </div>

          {/* Rotate Secret Key Card */}
          <div className="p-3.5 rounded-xl border border-sky-500/20 bg-sky-500/5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-sky-300 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
                Rotate Secret Credentials
              </label>
              <span className="text-[11px] text-zinc-400 font-mono">
                Leave blank to keep existing key
              </span>
            </div>

            <div className="relative flex items-center">
              <input
                type={showEditSecret ? 'text' : 'password'}
                placeholder="Enter new secret credentials to rotate (or leave empty)..."
                value={editSecretValue}
                onChange={(e) => setEditSecretValue(e.target.value)}
                className="w-full bg-zinc-900/90 border border-zinc-700/60 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl pl-3.5 pr-24 py-2.5 text-sm font-mono text-white placeholder-zinc-600 outline-none transition-all"
              />
              <div className="absolute right-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowEditSecret(!showEditSecret)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
                  title={showEditSecret ? 'Hide secret' : 'Show secret'}
                >
                  {showEditSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => pasteFromClipboard(setEditSecretValue)}
                  className="px-2 py-1 rounded-md text-[11px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer border border-zinc-700/50 flex items-center gap-1"
                  title="Paste new secret"
                >
                  <Clipboard className="w-3 h-3" />
                  Paste
                </button>
              </div>
            </div>
            <p className="text-[11px] text-zinc-400">
              Rotating credentials securely replaces the ciphertext in the vault with zero-knowledge AES-256 encryption.
            </p>
          </div>

          {/* Account Email & Phone (Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
                <span>Account Email</span>
                <span className="text-[10px] text-zinc-500 font-normal">Optional</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="e.g. dev@company.com"
                  value={editingKey?.accountEmail || ''}
                  onChange={(e) => setEditingKey((prev: any) => prev ? { ...prev, accountEmail: e.target.value } : null)}
                  className="w-full bg-zinc-900/90 border border-zinc-700/60 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-zinc-600 outline-none transition-all"
                />
                <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
                <span>Phone Number</span>
                <span className="text-[10px] text-zinc-500 font-normal">Optional</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="e.g. +1 555-0199"
                  value={editingKey?.accountPhone || ''}
                  onChange={(e) => setEditingKey((prev: any) => prev ? { ...prev, accountPhone: e.target.value } : null)}
                  className="w-full bg-zinc-900/90 border border-zinc-700/60 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-zinc-600 outline-none transition-all"
                />
                <Phone className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Description / Notes
            </label>
            <input
              type="text"
              value={editingKey?.description || ''}
              onChange={(e) => setEditingKey((prev: any) => prev ? { ...prev, description: e.target.value } : null)}
              placeholder="e.g. Production AWS S3 bucket for CDN storage..."
              className="w-full bg-zinc-900/90 border border-zinc-700/60 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Assign to Folder
              </label>
              <select
                value={editingKey?.folderId || ''}
                onChange={(e) => setEditingKey((prev: any) => prev ? { ...prev, folderId: e.target.value || null } : null)}
                className="w-full bg-zinc-900/90 border border-zinc-700/60 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none transition-all"
              >
                <option value="">📁 No Folder (Unassigned)</option>
                {folders.map((f: any) => (
                  <option key={f.id} value={f.id}>📁 {f.name}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Custom Tags
                </label>
                {editingKey?.tagIds?.length > 0 && (
                  <span className="text-[10px] text-sky-400 font-medium">{editingKey.tagIds.length} active</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 border border-zinc-800 bg-zinc-950/60 p-2.5 rounded-xl min-h-[44px] max-h-24 overflow-y-auto custom-scrollbar">
                {tags.length === 0 ? (
                  <span className="text-xs text-zinc-600">No tags configured</span>
                ) : (
                  tags.map((tag: any) => {
                    const isChecked = editingKey?.tagIds?.includes(tag.id)
                    return (
                      <button
                        type="button"
                        key={tag.id}
                        onClick={() => {
                          if (!editingKey) return
                          const currentTagIds = editingKey.tagIds || []
                          const newTags = isChecked ? currentTagIds.filter((t: string) => t !== tag.id) : [...currentTagIds, tag.id]
                          setEditingKey({ ...editingKey, tagIds: newTags })
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer border select-none transition-all flex items-center gap-1.5"
                        style={{
                          borderColor: isChecked ? tag.color : 'rgba(255, 255, 255, 0.1)',
                          backgroundColor: isChecked ? `${tag.color}25` : 'rgba(255, 255, 255, 0.03)',
                          color: isChecked ? tag.color : '#a1a1aa',
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.color }} />
                        {tag.name}
                        {isChecked && <Check className="w-3 h-3" />}
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/10">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setEditingKey(null)
                setEditSecretValue('')
                setShowEditSecret(false)
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={updateKeyMutation.isPending}
              className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 shadow-lg shadow-sky-600/25 px-5"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Platform Integration Cockpit Modal */}
      {inspectingPlatformKey && (
        <PlatformIntegrationModal
          secretKey={inspectingPlatformKey}
          onClose={() => setInspectingPlatformKey(null)}
        />
      )}
    </div>
  )
}

function PlatformIntegrationModal({ secretKey, onClose }: { secretKey: any; onClose: () => void }) {
  const [activeCodeTab, setActiveCodeTab] = useState<'curl' | 'js' | 'python'>('curl')
  const [copiedSnippet, setCopiedSnippet] = useState(false)
  const platform = PLATFORM_CONFIG[secretKey.providerCode.toLowerCase()] || PLATFORM_CONFIG.other

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedSnippet(true)
    toast.success('Integration snippet copied')
    setTimeout(() => setCopiedSnippet(false), 2000)
  }

  return (
    <Modal isOpen={true} onClose={onClose} title={`${platform.name} Platform Integration`} maxWidth="lg">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{platform.icon}</span>
            <div>
              <div className="flex items-center gap-2">
                <ProviderBadge provider={secretKey.providerCode} />
                <span className="font-bold text-white text-sm">{secretKey.keyName}</span>
              </div>
              <span className="text-[11px] text-zinc-400 block mt-0.5">{platform.category}</span>
            </div>
          </div>
          <span className="text-xs text-emerald-400 font-mono font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            ● Active & Vaulted
          </span>
        </div>

        {/* Capabilities */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-2">
            Verified Platform Capabilities
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {platform.capabilities.map((cap, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-200">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{cap}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Integration Code Snippet */}
        <div className="space-y-2 pt-2 border-t border-zinc-800/80">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-sky-400" /> Integration Code Example
            </span>
            <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-[10px]">
              {(['curl', 'js', 'python'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveCodeTab(tab)}
                  className={`px-2 py-0.5 rounded uppercase font-semibold transition-all cursor-pointer ${
                    activeCodeTab === tab ? 'bg-sky-600 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {tab === 'js' ? 'Node.js' : tab}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <pre className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl font-mono text-[11px] text-zinc-300 overflow-x-auto">
              <code>{platform.codeSnippet[activeCodeTab]}</code>
            </pre>
            <button
              onClick={() => copyCode(platform.codeSnippet[activeCodeTab])}
              className="absolute top-2 right-2 p-1.5 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Copy snippet"
            >
              {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Security & Health Note */}
        <div className="p-3 rounded-xl bg-sky-500/5 border border-sky-500/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span className="text-zinc-300 text-[11px]">Vaulted with AES-256 GCM encryption. Secret is protected from unauthorized access.</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold cursor-pointer shrink-0 ml-2"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}
