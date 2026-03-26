import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Heart } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { charitiesApi } from '../lib/api'
import CharityCard from '../components/features/CharityCard'
import Input from '../components/ui/Input'
import LoadingSpinner from '../components/ui/LoadingSpinner'

export default function CharitiesPage() {
  const [search, setSearch] = useState('')
  const [filterFeatured, setFilterFeatured] = useState(false)

  const { data: charities, isLoading, error } = useQuery({
    queryKey: ['charities', search, filterFeatured],
    queryFn: () => charitiesApi.listCharities(search || undefined, filterFeatured || undefined).then(r => r.data),
    retry: false,
  })

  const featured = charities?.filter(c => c.is_featured) || []
  const regular = charities?.filter(c => !c.is_featured) || []

  return (
    <div className="min-h-screen pt-20">
      {/* Hero */}
      <div className="bg-gradient-to-b from-primary/10 to-transparent py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/15 border border-primary/20 text-primary-300 text-sm font-medium mb-4">
              <Heart size={14} />
              Supporting Life-Changing Causes
            </div>
            <h1 className="text-5xl font-black text-text-primary mb-4">
              Our <span className="gradient-text">Charities</span>
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Every subscription you make, min 10% goes directly to your chosen charity.
              Browse our verified partners and find the cause closest to your heart.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search charities..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              leftIcon={<Search size={16} />}
            />
          </div>
          <button
            onClick={() => setFilterFeatured(!filterFeatured)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
              filterFeatured
                ? 'bg-accent/15 border-accent/30 text-accent'
                : 'bg-surface border-border text-text-secondary hover:border-accent/50'
            }`}
          >
            Featured Only
          </button>
        </div>

        {error ? (
          <div className="text-center py-16">
            <Heart size={40} className="text-red-400 mx-auto mb-4" />
            <p className="text-red-400 font-medium">Failed to load charities</p>
            <p className="text-text-muted text-xs mt-2 font-mono">{String(error)}</p>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {/* Featured */}
            {featured.length > 0 && !filterFeatured && !search && (
              <div className="mb-12">
                <h2 className="text-xl font-bold text-text-primary mb-5 flex items-center gap-2">
                  <span className="gradient-text">Featured</span> This Month
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {featured.map((charity, idx) => (
                    <motion.div
                      key={charity.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <CharityCard charity={charity} />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* All charities */}
            <div>
              <h2 className="text-xl font-bold text-text-primary mb-5">
                {search ? `Results for "${search}"` : 'All Charities'}
                <span className="text-text-muted font-normal text-sm ml-2">
                  ({charities?.length || 0} charities)
                </span>
              </h2>

              {charities?.length === 0 ? (
                <div className="text-center py-16">
                  <Heart size={40} className="text-text-muted mx-auto mb-4" />
                  <p className="text-text-secondary">No charities found</p>
                  <button onClick={() => setSearch('')} className="text-sm text-accent mt-2 hover:underline">
                    Clear search
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(filterFeatured || search ? charities : regular)?.map((charity, idx) => (
                    <motion.div
                      key={charity.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.06 }}
                    >
                      <CharityCard charity={charity} />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
