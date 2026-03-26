import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Users, Trophy, Heart, TrendingUp, DollarSign, CheckSquare } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { adminApi } from '../../lib/api'
import DashboardLayout from '../../components/layout/DashboardLayout'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { formatCurrency } from '../../lib/utils'

const COLORS = ['#c9a84c', '#1a472a', '#2a7340', '#5aac6d', '#37904f']

// Mock chart data — in production fetch from analytics endpoint
const subscriberData = [
  { month: 'Oct', subscribers: 1200 },
  { month: 'Nov', subscribers: 1580 },
  { month: 'Dec', subscribers: 1890 },
  { month: 'Jan', subscribers: 2100 },
  { month: 'Feb', subscribers: 2450 },
  { month: 'Mar', subscribers: 2847 },
]

const prizePoolData = [
  { month: 'Oct', pool: 7200 },
  { month: 'Nov', pool: 9480 },
  { month: 'Dec', pool: 11340 },
  { month: 'Jan', pool: 12600 },
  { month: 'Feb', pool: 14700 },
  { month: 'Mar', pool: 17082 },
]

export default function AdminDashboard() {
  const { data: reports, isLoading } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: () => adminApi.getReports().then(r => r.data),
  })

  if (isLoading) {
    return (
      <DashboardLayout isAdmin>
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      </DashboardLayout>
    )
  }

  const stats = [
    { label: 'Total Users', value: reports?.total_users || 0, icon: <Users size={20} />, color: 'text-accent', bg: 'bg-accent/10 border-accent/20' },
    { label: 'Active Subscribers', value: reports?.active_subscribers || 0, icon: <TrendingUp size={20} />, color: 'text-success', bg: 'bg-success/10 border-success/20' },
    { label: 'Prize Pool', value: formatCurrency(reports?.total_prize_pool || 0), icon: <Trophy size={20} />, color: 'text-accent', bg: 'bg-accent/10 border-accent/20' },
    { label: 'Charity Contributions', value: formatCurrency(reports?.total_charity_contributions || 0), icon: <Heart size={20} />, color: 'text-error', bg: 'bg-error/10 border-error/20' },
    { label: 'Published Draws', value: reports?.published_draws || 0, icon: <CheckSquare size={20} />, color: 'text-primary-400', bg: 'bg-primary/10 border-primary/20' },
    { label: 'Prizes Paid', value: formatCurrency(reports?.total_prizes_paid || 0), icon: <DollarSign size={20} />, color: 'text-success', bg: 'bg-success/10 border-success/20' },
  ]

  const charityData = [
    { name: 'Golf Foundation', value: 35 },
    { name: 'British Heart Foundation', value: 28 },
    { name: 'Cancer Research UK', value: 22 },
    { name: 'Macmillan', value: 15 },
  ]

  return (
    <DashboardLayout isAdmin>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Admin Dashboard</h1>
          <p className="text-text-secondary text-sm mt-0.5">Platform overview and analytics</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`glass-card p-5 border ${stat.bg}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-text-muted uppercase tracking-wider">{stat.label}</span>
                <span className={stat.color}>{stat.icon}</span>
              </div>
              <p className={`text-2xl font-black ${stat.color}`}>
                {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subscriber growth */}
          <div className="glass-card p-5">
            <h2 className="font-semibold text-text-primary mb-4">Subscriber Growth</h2>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={subscriberData}>
                <defs>
                  <linearGradient id="subGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1a472a" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#1a472a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                <XAxis dataKey="month" stroke="#6e7681" fontSize={12} />
                <YAxis stroke="#6e7681" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', color: '#f0f6fc' }}
                />
                <Area type="monotone" dataKey="subscribers" stroke="#1a472a" fill="url(#subGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Prize pool growth */}
          <div className="glass-card p-5">
            <h2 className="font-semibold text-text-primary mb-4">Prize Pool Growth</h2>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={prizePoolData}>
                <defs>
                  <linearGradient id="poolGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c9a84c" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#c9a84c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                <XAxis dataKey="month" stroke="#6e7681" fontSize={12} />
                <YAxis stroke="#6e7681" fontSize={12} tickFormatter={v => `£${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', color: '#f0f6fc' }}
                  formatter={(v: number) => [formatCurrency(v), 'Prize Pool']}
                />
                <Area type="monotone" dataKey="pool" stroke="#c9a84c" fill="url(#poolGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charity distribution */}
        <div className="glass-card p-5">
          <h2 className="font-semibold text-text-primary mb-4">Charity Distribution</h2>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <PieChart width={200} height={200}>
              <Pie
                data={charityData}
                cx={100}
                cy={100}
                innerRadius={55}
                outerRadius={85}
                dataKey="value"
                strokeWidth={0}
              >
                {charityData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
            <div className="flex-1 space-y-2">
              {charityData.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                    <span className="text-sm text-text-secondary">{entry.name}</span>
                  </div>
                  <span className="text-sm font-medium text-text-primary">{entry.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
