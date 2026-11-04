'use client'

import { Home, Package, Settings, UtensilsCrossed, ShoppingCart, Clock, BarChart3 } from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  userName: string
  role: string | null
  currentView: string
  onNavigate: (view: string) => void
  onLogout: () => void
  theme: 'light' | 'dark'
}

export default function Sidebar({ isOpen, onClose, userName, role, currentView, onNavigate, onLogout, theme }: SidebarProps) {
  const isDark = theme === 'dark'
  
  const menuItems = role === 'estabelecimento' 
    ? [
        { id: 'home', label: 'Início', icon: Home },
        { id: 'history', label: 'Minhas Doações', icon: Package },
        { id: 'report', label: 'Relatório', icon: BarChart3 },
        { id: 'settings', label: 'Configurações', icon: Settings },
      ]
    : [
        { id: 'home', label: 'Feed de Doações', icon: UtensilsCrossed },
        { id: 'history', label: 'Minhas Reservas', icon: ShoppingCart },
        { id: 'expired', label: 'Histórico de Expirados', icon: Clock },
        { id: 'settings', label: 'Configurações', icon: Settings },
      ]

  return (
    <>
      {isOpen && (
        <div 
          className={`fixed inset-0 z-40 transition-opacity ${isDark ? 'bg-black bg-opacity-70' : 'bg-gray-900 bg-opacity-30'}`}
          onClick={onClose}
        />
      )}

      <div className={`fixed top-0 left-0 h-full w-72 shadow-2xl z-50 transform transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        
        {/* Cabeçalho do Menu */}
        <div className={`p-6 ${isDark ? 'bg-gradient-to-br from-purple-800 to-purple-950 text-white' : 'bg-gradient-to-br from-purple-600 to-purple-800 text-white'}`}>
          <div className={`w-16 h-16 rounded-full mb-3 shadow-lg overflow-hidden border-2 flex items-center justify-center ${isDark ? 'bg-gray-800 border-purple-700/50' : 'bg-white border-purple-400'}`}>
             <span className={`text-2xl font-bold ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>
               {userName ? userName.charAt(0).toUpperCase() : 'U'}
             </span>
          </div>
          <h2 className="text-lg font-bold truncate text-white">{userName || 'Usuário'}</h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-purple-300' : 'text-purple-100'}`}>
            {role === 'estabelecimento' ? 'Estabelecimento Doador' : role === 'orfanato' ? 'Orfanato Receptor' : 'Carregando...'}
          </p>
        </div>

        {/* Itens do Menu */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); onClose() }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                  currentView === item.id 
                    ? (isDark 
                        ? 'bg-purple-950 text-purple-300 font-semibold border-l-4 border-purple-500' 
                        : 'bg-purple-50 text-purple-700 font-semibold border-l-4 border-purple-600')
                    : (isDark 
                        ? 'text-gray-400 hover:bg-gray-800 hover:text-purple-300' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-purple-700')
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Rodapé */}
        <div className={`absolute bottom-0 w-full p-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <p className={`text-xs text-center ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Alimetamais v1.0</p>
        </div>
      </div>
    </>
  )
}