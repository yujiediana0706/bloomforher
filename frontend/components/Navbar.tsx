import React from 'react';
import { 
  Sparkles, 
  Compass, 
  Briefcase, 
  FlaskConical, 
  Calendar, 
  Users, 
  Bot, 
  ShieldCheck, 
  Award,
  Layers,
  HelpCircle,
  Menu,
  X
} from 'lucide-react';
import { UserProfile } from '../types';

interface Props {
  currentTab: string;
  onTabChange: (tab: string) => void;
  currentUser: UserProfile;
  onSwitchUser: (type: 'returner' | 'explorer') => void;
  evidenceCount: number;
  onOpenCoach: () => void;
  onOpenReadme: () => void;
}

export const Navbar: React.FC<Props> = ({
  currentTab,
  onTabChange,
  currentUser,
  onSwitchUser,
  evidenceCount,
  onOpenCoach,
  onOpenReadme
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { key: 'dashboard', label: 'Home' },
    { key: 'skills', label: 'Skills Discovery' },
    { key: 'opportunities', label: 'AI Opportunities' },
    { key: 'tasks', label: 'Hands-on Tasks' },
    { key: 'plan', label: 'Return Plan' },
    { key: 'community', label: 'Community' },
    { key: 'evidence', label: 'Evidence Bank' },
    { key: 'sessions', label: 'My Sessions' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-silver-300 shadow-sm">
      {/* Top metallic bar */}
      <div className="h-1 bg-gradient-to-r from-silver-400 via-coral-500 to-softpink-300" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button 
              type="button" 
              onClick={() => onTabChange('dashboard')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-coral-500 to-softpink-300 flex items-center justify-center text-white shadow-md shadow-coral-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-slateblue-900 block leading-tight">
                  Bloom AI <span className="font-light text-coral-500">· Her Path</span>
                </span>
                <span className="text-[10px] text-slateblue-700 font-medium block">
                  Your experience. A brighter future in the AI era.
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const active = currentTab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onTabChange(item.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150 relative ${
                    active 
                      ? 'text-coral-500 bg-softpink-100' 
                      : 'text-slateblue-900 hover:text-coral-500 hover:bg-silver-100'
                  }`}
                >
                  {item.label}
                  {item.key === 'evidence' && evidenceCount > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.2 bg-coral-500 text-white rounded-full text-[10px] font-bold">
                      {evidenceCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Quick Demo Switcher */}
            <div className="flex items-center bg-silver-100 rounded-lg p-0.5 border border-silver-300 text-[11px]">
              <button
                type="button"
                onClick={() => onSwitchUser('returner')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  currentUser.roleType === 'Setter' 
                    ? 'bg-white text-slateblue-900 shadow-sm' 
                    : 'text-silver-600 hover:text-slateblue-900'
                }`}
                title="Setter (32, Postpartum Return, step 5, rich evidence)"
              >
                Demo Returner
              </button>
              <button
                type="button"
                onClick={() => onSwitchUser('explorer')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  currentUser.roleType === 'Explorer' 
                    ? 'bg-white text-slateblue-900 shadow-sm' 
                    : 'text-silver-600 hover:text-slateblue-900'
                }`}
                title="Explorer (22, college student, fresh onboarding)"
              >
                Demo Explorer
              </button>
            </div>

            {/* AI Coach floating button */}
            <button
              type="button"
              onClick={onOpenCoach}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-coral-500 to-coral-600 hover:from-coral-600 hover:to-coral-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-coral-500/25 transition-all"
            >
              <Bot className="w-4 h-4" />
              <span>AI Coach</span>
            </button>

            {/* Readme & Architecture specs modal */}
            <button
              type="button"
              onClick={onOpenReadme}
              className="p-2 text-slateblue-700 hover:text-slateblue-900 rounded-lg hover:bg-silver-100 border border-silver-300 transition-colors"
              title="View Architecture Specs & Demo Voiceover"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              type="button"
              onClick={onOpenCoach}
              className="p-1.5 bg-coral-500 text-white rounded-lg"
            >
              <Bot className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slateblue-900 rounded-lg hover:bg-silver-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-silver-300 bg-white px-4 pt-3 pb-6 space-y-2">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              type="button"
              onClick={() => { onSwitchUser('returner'); setMobileMenuOpen(false); }}
              className={`p-2 rounded-lg text-xs font-semibold text-center ${
                currentUser.roleType === 'Setter' ? 'bg-coral-500 text-white' : 'bg-silver-100'
              }`}
            >
              Demo: Elena (Returner)
            </button>
            <button
              type="button"
              onClick={() => { onSwitchUser('explorer'); setMobileMenuOpen(false); }}
              className={`p-2 rounded-lg text-xs font-semibold text-center ${
                currentUser.roleType === 'Explorer' ? 'bg-coral-500 text-white' : 'bg-silver-100'
              }`}
            >
              Demo: Maya (Explorer)
            </button>
          </div>
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => { onTabChange(item.key); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold ${
                currentTab === item.key ? 'bg-softpink-100 text-coral-500' : 'text-slateblue-900'
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => { onOpenReadme(); setMobileMenuOpen(false); }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-silver-600 flex items-center gap-2"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Architecture Specs & Voiceover</span>
          </button>
        </div>
      )}
    </header>
  );
};
