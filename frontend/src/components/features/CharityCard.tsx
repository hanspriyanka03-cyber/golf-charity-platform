import { motion } from 'framer-motion'
import { ExternalLink, Calendar, Heart, CheckCircle } from 'lucide-react'
import type { Charity } from '../../types'
import Badge from '../ui/Badge'
import Button from '../ui/Button'

interface CharityCardProps {
  charity: Charity
  isSelected?: boolean
  onSelect?: (charity: Charity) => void
  showSelectButton?: boolean
  compact?: boolean
}

export default function CharityCard({
  charity,
  isSelected,
  onSelect,
  showSelectButton = false,
  compact = false,
}: CharityCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={`glass-card overflow-hidden transition-all duration-300 ${
        isSelected ? 'border-accent/40 shadow-glow-gold' : 'hover:border-border/80 hover:shadow-card-hover'
      }`}
    >
      {/* Image */}
      <div className="relative h-40 overflow-hidden bg-primary/10">
        {charity.image_url ? (
          <img
            src={charity.image_url}
            alt={charity.name}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(charity.name)}&background=1a472a&color=c9a84c&size=400`
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-primary-600">
            <Heart size={40} className="text-accent/60" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
        {charity.is_featured && (
          <div className="absolute top-3 left-3">
            <Badge variant="gold">Featured</Badge>
          </div>
        )}
        {isSelected && (
          <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-accent flex items-center justify-center">
            <CheckCircle size={16} className="text-background" />
          </div>
        )}
      </div>

      <div className={compact ? 'p-4' : 'p-5'}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className={`font-semibold text-text-primary ${compact ? 'text-sm' : 'text-base'}`}>
            {charity.name}
          </h3>
          {charity.website && (
            <a
              href={charity.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-accent transition-colors shrink-0"
            >
              <ExternalLink size={14} />
            </a>
          )}
        </div>

        {charity.description && !compact && (
          <p className="text-sm text-text-secondary mb-3 leading-relaxed line-clamp-2">
            {charity.description}
          </p>
        )}

        {/* Upcoming Events */}
        {!compact && charity.events && charity.events.length > 0 && (
          <div className="mb-3 space-y-1.5">
            <p className="text-xs text-text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={11} />
              Upcoming Events
            </p>
            {charity.events.slice(0, 2).map((event, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-text-secondary bg-surface-2 rounded-lg px-2.5 py-1.5">
                <span className="text-accent">●</span>
                <span className="font-medium">{event.title}</span>
                {event.date && <span className="text-text-muted ml-auto">{event.date}</span>}
              </div>
            ))}
          </div>
        )}

        {showSelectButton && onSelect && (
          <Button
            variant={isSelected ? 'outline' : 'primary'}
            size="sm"
            onClick={() => onSelect(charity)}
            className="w-full mt-1"
          >
            {isSelected ? (
              <>
                <CheckCircle size={14} />
                Selected
              </>
            ) : (
              <>
                <Heart size={14} />
                Support This Charity
              </>
            )}
          </Button>
        )}
      </div>
    </motion.div>
  )
}
