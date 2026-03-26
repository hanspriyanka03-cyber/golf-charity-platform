import { Link } from 'react-router-dom'
import { Trophy, Heart, Twitter, Instagram, Mail } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center">
                <Trophy size={16} className="text-accent" />
              </div>
              <span className="font-bold text-lg">
                <span className="text-text-primary">Golf</span>
                <span className="gradient-text">Give</span>
              </span>
            </Link>
            <p className="text-sm text-text-muted leading-relaxed">
              Where your passion for golf funds life-changing charities and wins real prizes.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a href="#" className="p-2 rounded-lg bg-surface border border-border text-text-muted hover:text-text-primary hover:border-accent/50 transition-all">
                <Twitter size={15} />
              </a>
              <a href="#" className="p-2 rounded-lg bg-surface border border-border text-text-muted hover:text-text-primary hover:border-accent/50 transition-all">
                <Instagram size={15} />
              </a>
              <a href="#" className="p-2 rounded-lg bg-surface border border-border text-text-muted hover:text-text-primary hover:border-accent/50 transition-all">
                <Mail size={15} />
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-3">Platform</h4>
            <ul className="space-y-2">
              {[
                { to: '/how-it-works', label: 'How It Works' },
                { to: '/charities', label: 'Our Charities' },
                { to: '/signup', label: 'Get Started' },
                { to: '/login', label: 'Sign In' },
              ].map(item => (
                <li key={item.to}>
                  <Link to={item.to} className="text-sm text-text-muted hover:text-accent transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-3">Legal</h4>
            <ul className="space-y-2">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Responsible Gaming'].map(item => (
                <li key={item}>
                  <a href="#" className="text-sm text-text-muted hover:text-accent transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Impact */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-3">Our Impact</h4>
            <div className="space-y-3">
              <div className="bg-surface border border-border rounded-xl p-3">
                <p className="text-2xl font-bold gradient-text">£124,500</p>
                <p className="text-xs text-text-muted mt-0.5">Donated to charities</p>
              </div>
              <div className="bg-surface border border-border rounded-xl p-3">
                <p className="text-2xl font-bold gradient-text-green">2,847</p>
                <p className="text-xs text-text-muted mt-0.5">Active members</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-text-muted">
            © 2025 GolfGive. Made with <Heart size={12} className="inline text-error" /> for golf and charity.
          </p>
          <p className="text-xs text-text-muted">
            Registered in England & Wales. Not a lottery. 18+ only.
          </p>
        </div>
      </div>
    </footer>
  )
}
