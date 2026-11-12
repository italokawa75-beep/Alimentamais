'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Toast from '@/components/Toast'
import SkeletonCard from '@/components/SkeletonCard'
import { Menu, Bell, Leaf, LogOut, AlertCircle, Clock, Utensils, CupSoda, Cake, Apple, Info, Shield, Code, X, HelpCircle, BookOpen, AlertTriangle, MessageCircle, CheckCircle2, Search, BarChart3, Package, Sun, Moon, Users, Weight } from 'lucide-react'

export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [loading, setLoading] = useState(true)
  
  const [currentView, setCurrentView] = useState('home')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showExpiredModal, setShowExpiredModal] = useState(false)
  const [doacaoToConfirm, setDoacaoToConfirm] = useState<any>(null)
  const [doacaoToNotify, setDoacaoToNotify] = useState<any>(null)
  
  const [fontSize, setFontSize] = useState<'P' | 'M' | 'G'>('M')
  const [language, setLanguage] = useState<'pt' | 'en' | 'es'>('pt')
  const [categoria, setCategoria] = useState<string>('comida')
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  
  const [loadingDonations, setLoadingDonations] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('todos')
  
  const [donations, setDonations] = useState<any[]>([])
  const [myReservations, setMyReservations] = useState<any[]>([])
  const [expiredReservations, setExpiredReservations] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [activityData, setActivityData] = useState<any[]>([])
  const [completedDonations, setCompletedDonations] = useState<any[]>([])
  
  const [titulo, setTitulo] = useState('')
  const [quantidade, setQuantidade] = useState('')
  const [validade, setValidade] = useState('')
  const [descricao, setDescricao] = useState('')

  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null)
  const router = useRouter()

  const isDark = theme === 'dark'

  const t = {
    pt: { appName: 'Alimetamais', welcome: 'O que sobrou hoje?', feedTitle: 'Feed de Doações', settingsTitle: 'Configurações', fontSize: 'Tamanho da Fonte', languageLabel: 'Idioma', themeLabel: 'Tema do Sistema', pushNotif: 'Notificações Push', logout: 'Sair da Conta', about: 'Sobre o Alimetamais', help: 'Central de Ajuda' },
    en: { appName: 'Alimetamais', welcome: 'What is left today?', feedTitle: 'Donation Feed', settingsTitle: 'Settings', fontSize: 'Font Size', languageLabel: 'Language', themeLabel: 'System Theme', pushNotif: 'Push Notifications', logout: 'Log Out', about: 'About Alimetamais', help: 'Help Center' },
    es: { appName: 'Alimetamais', welcome: '¿Qué sobró hoy?', feedTitle: 'Feed de Donaciones', settingsTitle: 'Ajustes', fontSize: 'Tamaño de Fuente', languageLabel: 'Idioma', themeLabel: 'Tema del Sistema', pushNotif: 'Notificaciones Push', logout: 'Cerrar Sesión', about: 'Acerca de Alimetamais', help: 'Centro de Ayuda' }
  }

  const categoryImages = {
    comida: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
    bebida: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=400&q=80',
    sobremesa: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=400&q=80',
    hortifruti: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&q=80'
  }

  function getCategoryImage(categoria: string): string {
    return categoryImages[categoria as keyof typeof categoryImages] || categoryImages.comida
  }

  function getUrgencyInfo(validade: string) {
    const agora = new Date()
    const dataValidade = new Date(validade)
    const diffHoras = (dataValidade.getTime() - agora.getTime()) / (1000 * 60 * 60)

    if (diffHoras <= 6) return { label: language === 'pt' ? 'Vence em breve!' : language === 'en' ? 'Expires soon!' : '¡Vence pronto!', borderColor: 'border-red-500', badgeBg: 'bg-red-600', textColor: 'text-red-400' }
    if (diffHoras <= 24) return { label: language === 'pt' ? 'Vence amanhã' : language === 'en' ? 'Expires tomorrow' : 'Vence mañana', borderColor: 'border-yellow-500', badgeBg: 'bg-yellow-600', textColor: 'text-yellow-400' }
    return { label: language === 'pt' ? 'Disponível' : language === 'en' ? 'Available' : 'Disponible', borderColor: 'border-green-500', badgeBg: 'bg-green-600', textColor: 'text-green-400' }
  }

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => { setToast({ message, type }) }

  useEffect(() => {
    const savedTheme = localStorage.getItem('alimetamais-theme') as 'light' | 'dark'
    if (savedTheme) setTheme(savedTheme)
  }, [])

  useEffect(() => { checkUser() }, [])
  
  useEffect(() => {
    if (role) {
      if (currentView === 'home' || currentView === 'history' || currentView === 'expired') {
        if (role === 'orfanato') { 
          fetchDonations()
          fetchMyReservations()
          fetchExpiredReservations()
        }
        else { fetchMyDonations() }
      }
      if (currentView === 'report' && role === 'estabelecimento') {
        fetchActivityData()
      }
      fetchNotifications()
    }
  }, [role, currentView])

  // 🚀 SUPABASE REALTIME: Atualização instantânea do Feed
  useEffect(() => {
    if (role === 'orfanato' && currentView === 'home') {
      const channel = supabase
        .channel('doacoes-realtime')
        .on(
          'postgres_changes',
          {
            event: '*', // Escuta INSERT, UPDATE e DELETE em qualquer doação
            schema: 'public',
            table: 'doacoes'
          },
          () => {
            // Recarrega as doações automaticamente quando houver qualquer mudança no banco
            fetchDonations()
          }
        )
        .subscribe()

      // Limpa a conexão quando o usuário sair da tela ou deslogar
      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [role, currentView, supabase])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    
    const { data: profile, error } = await supabase.from('profiles').select('role, nome').eq('id', user.id).single()
    if (error || !profile) { router.push('/login'); return }
    
    setRole(profile.role)
    setUserName(profile.nome || 'Usuário')
    setUserEmail(user.email || '')
    setCurrentView('home')
    setLoading(false)
  }

  async function fetchDonations() {
    setLoadingDonations(true)
    try {
      const { data } = await supabase
        .from('doacoes')
        .select('*')
        .eq('status', 'disponivel')
        .order('created_at', { ascending: false })
      if (data) setDonations(data)
    } finally {
      setLoadingDonations(false)
    }
  }
  
  async function fetchMyReservations() { 
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('doacoes')
      .select('*')
      .eq('orfanato_id', user?.id)
      .eq('status', 'reservado')
      .order('created_at', { ascending: false })
    
    if (data) {
      const agora = new Date()
      const validas = data.filter(item => new Date(item.validade) > agora)
      setMyReservations(validas)
    }
  }

  async function fetchExpiredReservations() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('doacoes')
      .select('*')
      .eq('orfanato_id', user?.id)
      .eq('status', 'reservado')
      .order('validade', { ascending: true })
    
    if (data) {
      const agora = new Date()
      const expiradas = data.filter(item => new Date(item.validade) <= agora)
      setExpiredReservations(expiradas)
    }
  }

  async function fetchMyDonations() { 
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('doacoes').select('*').eq('estabelecimento_id', user?.id).order('created_at', { ascending: false })
    if (data) setDonations(data) 
  }
  
  async function fetchNotifications() { 
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('notificacoes').select('*').eq('user_id', user?.id).eq('lida', false).order('created_at', { ascending: false })
    if (data) setNotifications(data) 
  }

  async function fetchActivityData() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: allDonations } = await supabase
      .from('doacoes')
      .select('*')
      .eq('estabelecimento_id', user?.id)
      .order('created_at', { ascending: false })
    
    if (allDonations) {
      setActivityData(allDonations)
      const completed = allDonations.filter((d: any) => d.status === 'retirado')
      setCompletedDonations(completed.slice(0, 5))
    }
  }

  async function handleLogout() { await supabase.auth.signOut(); router.push('/login') }

  async function handleCreateDonation(e: React.FormEvent) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('doacoes').insert({ estabelecimento_id: user?.id, titulo, quantidade, validade, descricao, categoria, status: 'disponivel' })
    if (!error) {
      showToast(language === 'pt' ? 'Doação cadastrada com sucesso!' : 'Donation registered successfully!', 'success')
      setTitulo(''); setQuantidade(''); setValidade(''); setDescricao(''); setCategoria('comida')
      fetchMyDonations()
    } else { showToast('Erro ao cadastrar: ' + error.message, 'error') }
  }

  async function handleReserveDonation(doacaoId: number) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('doacoes').update({ status: 'reservado', orfanato_id: user?.id }).eq('id', doacaoId).select()
    if (error) { console.error("❌ ERRO AO RESERVAR:", error); showToast('Erro ao reservar: ' + error.message, 'error') } 
    else { 
      showToast(language === 'pt' ? 'Doação reservada!' : 'Donation reserved!', 'success')
      fetchDonations()
      fetchMyReservations()
      fetchExpiredReservations()
    }
  }

  async function handleCancelReservation(doacaoId: number, tituloDoacao: string) {
    const { data: doacaoData, error: fetchError } = await supabase.from('doacoes').select('estabelecimento_id').eq('id', doacaoId).single()
    if (fetchError || !doacaoData) { showToast('Erro ao identificar o estabelecimento.', 'error'); return }
    const estabelecimentoId = doacaoData.estabelecimento_id
    const { error: updateError } = await supabase.from('doacoes').update({ status: 'disponivel', orfanato_id: null }).eq('id', doacaoId)
    if (updateError) { showToast('Erro ao cancelar reserva.', 'error'); return }
    await supabase.from('notificacoes').insert({ user_id: estabelecimentoId, mensagem: `⚠️ ${language === 'pt' ? 'O orfanato cancelou a reserva de' : language === 'en' ? 'The orphanage canceled the reservation of' : 'El orfanato canceló la reserva de'}: "${tituloDoacao}".` })
    showToast(language === 'pt' ? 'Reserva cancelada e estabelecimento notificado.' : 'Reservation canceled.', 'info')
    fetchMyReservations(); fetchDonations(); fetchExpiredReservations()
  }

  async function confirmRetirada() {
    if (!doacaoToConfirm) return
    const { error: updateError } = await supabase.from('doacoes').update({ status: 'retirado' }).eq('id', doacaoToConfirm.id)
    if (updateError) {
      showToast('Erro ao confirmar retirada.', 'error')
      setShowConfirmModal(false)
      setDoacaoToConfirm(null)
      return
    }
    await supabase.from('notificacoes').insert({
      user_id: doacaoToConfirm.estabelecimento_id,
      mensagem: `✅ ${language === 'pt' ? 'O orfanato confirmou a retirada de' : language === 'en' ? 'The orphanage confirmed the pickup of' : 'El orfanato confirmó la retirada de'}: "${doacaoToConfirm.titulo}".`
    })
    showToast(language === 'pt' ? 'Retirada confirmada com sucesso!' : 'Pickup confirmed successfully!', 'success')
    setShowConfirmModal(false)
    setDoacaoToConfirm(null)
    fetchMyReservations()
  }

  async function notifyExpiredEstablishment() {
    if (!doacaoToNotify) return
    const { error: updateError } = await supabase.from('doacoes').update({ status: 'disponivel', orfanato_id: null }).eq('id', doacaoToNotify.id)
    if (updateError) {
      showToast('Erro ao processar doação expirada.', 'error')
      setShowExpiredModal(false)
      setDoacaoToNotify(null)
      return
    }
    await supabase.from('notificacoes').insert({
      user_id: doacaoToNotify.estabelecimento_id,
      mensagem: `⏰ ${language === 'pt' ? 'A reserva de' : language === 'en' ? 'The reservation of' : 'La reserva de'} "${doacaoToNotify.titulo}" ${language === 'pt' ? 'expirou e voltou a estar disponível.' : language === 'en' ? 'expired and is available again.' : 'expiró y está disponible nuevamente.'}`
    })
    showToast(language === 'pt' ? 'Estabelecimento notificado e doação voltou ao feed!' : 'Establishment notified and donation returned to feed!', 'success')
    setShowExpiredModal(false)
    setDoacaoToNotify(null)
    fetchExpiredReservations()
    fetchDonations()
  }

  async function markNotificationsAsRead() {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('notificacoes').update({ lida: true }).eq('user_id', user?.id).eq('lida', false)
    if (error) { showToast('Erro ao atualizar notificações.', 'error') } 
    else { setNotifications([]); setShowNotifications(false) }
  }

  if (loading) return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <div className={`px-4 py-4 flex justify-between items-center border-b animate-pulse ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className={`w-8 h-8 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
        <div className={`h-6 w-40 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
        <div className={`w-9 h-9 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
      </div>
      <main className="max-w-4xl mx-auto p-4 space-y-6">
        <div className={`h-28 rounded-2xl animate-pulse ${isDark ? 'bg-gray-900' : 'bg-gray-200'}`} />
        <div className={`h-12 rounded-xl animate-pulse ${isDark ? 'bg-gray-900' : 'bg-gray-200'}`} />
        <SkeletonCard isDark={isDark} count={3} />
      </main>
    </div>
  )

  const unreadCount = notifications.length
  const categories = [
    { id: 'comida', label: 'Refeição/Prato', icon: Utensils },
    { id: 'bebida', label: 'Bebida', icon: CupSoda },
    { id: 'sobremesa', label: 'Sobremesa', icon: Cake },
    { id: 'hortifruti', label: 'Hortifruti', icon: Apple }
  ]

  const filteredDonations = donations.filter((doacao) => {
    const matchesSearch = doacao.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (doacao.descricao && doacao.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === 'todos' || doacao.categoria === selectedCategory
    return matchesSearch && matchesCategory
  })

  // 🌟 LÓGICA DA CALCULADORA DE IMPACTO AUTOMÁTICO
  const completedForImpact = activityData.filter((d: any) => d.status === 'retirado')
  const uniqueOrphanages = new Set(completedForImpact.map((d: any) => d.orfanato_id).filter(Boolean))
  
  let totalUnits = 0
  completedForImpact.forEach((d: any) => {
    const match = d.quantidade?.toString().match(/\d+/)
    totalUnits += match ? parseInt(match[0], 10) : 1
  })
  
  const kgSaved = (totalUnits * 0.5).toFixed(1)

  return (
    <div className={`${theme === 'dark' ? 'dark' : ''}`}>
      <div className={`min-h-screen relative transition-all duration-300 ${isDark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'} ${fontSize === 'P' ? 'text-[14px]' : fontSize === 'M' ? 'text-[16px]' : 'text-[18px]'}`}>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userName={userName} role={role} currentView={currentView} onNavigate={setCurrentView} onLogout={handleLogout} theme={theme} />

        <header className={`shadow-sm sticky top-0 z-30 px-4 py-3 flex justify-between items-center border-b transition-colors ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <button onClick={() => setSidebarOpen(true)} className={`transition p-2 rounded-lg ${isDark ? 'text-gray-300 hover:text-purple-400 hover:bg-gray-800' : 'text-gray-600 hover:text-purple-600 hover:bg-gray-100'}`}>
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-2">
            <Leaf className={`w-7 h-7 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
            <h1 className={`text-xl font-bold tracking-tight ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>{t[language].appName}</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <button onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }} className={`transition relative p-2 rounded-full ${isDark ? 'text-gray-300 hover:text-purple-400 hover:bg-gray-800' : 'text-gray-600 hover:text-purple-600 hover:bg-gray-100'}`}>
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full animate-pulse shadow-md">{unreadCount}</span>
                )}
              </button>

              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className={`absolute right-0 mt-2 w-80 rounded-xl shadow-2xl border z-50 overflow-hidden animate-slide-down ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                    <div className="bg-gradient-to-r from-purple-700 to-purple-900 p-4 text-white">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-lg">Notificações</h4>
                        <span className="bg-white bg-opacity-20 text-xs px-2 py-1 rounded-full">{unreadCount} nova{unreadCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className={`text-center py-8 px-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          <Bell className={`w-12 h-12 mx-auto mb-2 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                          <p className="text-sm">Nenhuma notificação nova</p>
                        </div>
                      ) : (
                        <div className={`divide-y ${isDark ? 'divide-gray-800' : 'divide-gray-100'}`}>
                          {notifications.map((notif) => (
                            <div key={notif.id} className={`p-4 transition-colors border-l-4 border-purple-500 ${isDark ? 'hover:bg-gray-800 bg-gray-900' : 'hover:bg-gray-50 bg-white'}`}>
                              <div className="flex items-start gap-3">
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-purple-950' : 'bg-purple-100'}`}>
                                  <AlertCircle className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                                </div>
                                <div className="flex-1">
                                  <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{notif.mensagem}</p>
                                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{new Date(notif.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className={`p-3 text-center border-t ${isDark ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                      <button onClick={() => { markNotificationsAsRead(); setShowNotifications(false); }} className={`text-xs font-semibold transition ${isDark ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'}`}>Marcar todas como lidas</button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <button 
                onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }} 
                className={`w-9 h-9 rounded-full overflow-hidden border-2 shadow-sm flex items-center justify-center transition ${isDark ? 'border-purple-600 bg-gray-800 hover:border-purple-400' : 'border-purple-200 bg-purple-50 hover:border-purple-400'}`}
              >
                <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${userName}&backgroundColor=${isDark ? '581c87' : 'f3e8ff'}&textColor=${isDark ? 'e9d5ff' : '581c87'}`} alt="Avatar" className="w-full h-full object-cover" />
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <div className={`absolute right-0 mt-2 w-72 rounded-xl shadow-2xl border z-50 overflow-hidden animate-slide-down p-5 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className={`w-20 h-20 rounded-full overflow-hidden border-2 shadow-lg flex items-center justify-center ${isDark ? 'border-purple-500 bg-gray-800' : 'border-purple-200 bg-purple-50'}`}>
                        <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${userName}&backgroundColor=${isDark ? '581c87' : 'f3e8ff'}&textColor=${isDark ? 'e9d5ff' : '581c87'}&size=128`} alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                      <div className="w-full space-y-1">
                        <h3 className={`font-bold text-lg truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{userName}</h3>
                        <p className={`text-xs truncate px-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{userEmail}</p>
                      </div>
                      <span className={`text-xs font-semibold px-4 py-1.5 rounded-full border shadow-sm ${isDark ? 'bg-purple-950 text-purple-300 border-purple-800' : 'bg-purple-100 text-purple-700 border-purple-200'}`}>
                        {role === 'estabelecimento' ? '🏪 Estabelecimento Doador' : '🏠 Orfanato Receptor'}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto p-4 pb-20">
          {currentView === 'home' && (
            <div className="space-y-6 animate-fade-in">
              {role === 'estabelecimento' ? (
                <>
                  <div className={`p-6 rounded-2xl shadow-lg border transition-colors ${isDark ? 'bg-purple-900 text-white border-purple-800' : 'bg-purple-600 text-white border-purple-500'}`}>
                    <h2 className="text-2xl font-bold mb-2">{t[language].welcome}</h2>
                    <p className={`${isDark ? 'text-purple-200' : 'text-purple-100'} mb-4`}>Cadastre o excedente em segundos e ajude quem precisa.</p>
                  </div>
                  
                  <div className={`rounded-2xl shadow-md p-6 border transition-colors ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`p-2 rounded-lg ${isDark ? 'bg-purple-950' : 'bg-purple-100'}`}>
                        <Leaf className={`w-6 h-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                      </div>
                      <div>
                        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Cadastrar Novo Excedente</h3>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Preencha os detalhes para disponibilizar</p>
                      </div>
                    </div>

                    <form onSubmit={handleCreateDonation} className="space-y-5">
                      <div>
                        <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Categoria do Item</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {categories.map((cat) => {
                            const IconComponent = cat.icon
                            return (
                              <button key={cat.id} type="button" onClick={() => setCategoria(cat.id)} className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all duration-200 ${categoria === cat.id ? (isDark ? 'border-purple-500 bg-purple-950 text-purple-300 shadow-sm scale-[1.02]' : 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm scale-[1.02]') : (isDark ? 'border-gray-700 bg-gray-800 text-gray-400 hover:border-purple-700 hover:bg-gray-750' : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-purple-300 hover:bg-purple-50/50')}`}>
                                <IconComponent className="w-7 h-7" />
                                <span className="text-xs font-bold">{cat.label}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div>
                        <label className={`block text-sm font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>O que é? (Título)</label>
                        <input type="text" required value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: 15 Marmitas de Frango ou 20 Sucos" className={`w-full p-3 pl-4 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition ${isDark ? 'border border-gray-700 bg-gray-800 text-white placeholder-gray-500' : 'border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400'}`} />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={`block text-sm font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Quantidade</label>
                          <input type="text" required value={quantidade} onChange={(e) => setQuantidade(e.target.value)} placeholder="Ex: 15 unidades" className={`w-full p-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition ${isDark ? 'border border-gray-700 bg-gray-800 text-white placeholder-gray-500' : 'border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400'}`} />
                        </div>
                        <div>
                          <label className={`block text-sm font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Validade (Data e Hora)</label>
                          <input type="datetime-local" required value={validade} onChange={(e) => setValidade(e.target.value)} className={`w-full p-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition ${isDark ? 'border border-gray-700 bg-gray-800 text-white [color-scheme:dark]' : 'border border-gray-300 bg-gray-50 text-gray-900'}`} />
                        </div>
                      </div>

                      <div>
                        <label className={`block text-sm font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Observações Importantes</label>
                        <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Contém glúten. Manter refrigerado." className={`w-full p-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition resize-none ${isDark ? 'border border-gray-700 bg-gray-800 text-white placeholder-gray-500' : 'border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400'}`} rows={3}></textarea>
                      </div>

                      <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-purple-900/50 transform hover:-translate-y-0.5 flex items-center justify-center gap-2">
                        <Leaf className="w-5 h-5" />
                        Disponibilizar Doação
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-gradient-to-r from-purple-700 to-purple-900 text-white p-6 rounded-2xl shadow-lg border border-purple-800">
                    <h2 className="text-2xl font-bold">{t[language].feedTitle}</h2>
                    <p className="text-purple-200 mt-1">Alimentos disponíveis perto de você</p>
                  </div>

                  <div className="space-y-4">
                    <div className="relative">
                      <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                      <input 
                        type="text" 
                        placeholder="O que você procura? (ex: Marmita, Suco...)" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition ${isDark ? 'bg-gray-900 border border-gray-700 text-white placeholder-gray-500' : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400'}`}
                      />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      <button 
                        onClick={() => setSelectedCategory('todos')}
                        className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all border ${
                          selectedCategory === 'todos' 
                            ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-900/50' 
                            : (isDark ? 'bg-gray-900 text-gray-400 border-gray-700 hover:bg-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50')
                        }`}
                      >
                        🍽️ Todos
                      </button>
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all border flex items-center gap-2 ${
                            selectedCategory === cat.id 
                              ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-900/50' 
                              : (isDark ? 'bg-gray-900 text-gray-400 border-gray-700 hover:bg-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50')
                          }`}
                        >
                          <cat.icon className="w-4 h-4" />
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {loadingDonations ? (
                    <SkeletonCard isDark={isDark} count={3} />
                  ) : filteredDonations.length === 0 ? (
                    <div className={`text-center py-12 rounded-2xl shadow border transition-colors ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                      <div className="text-5xl mb-3">🔍</div>
                      <p className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Nenhuma doação encontrada.</p>
                      <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Tente ajustar sua busca ou filtros.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredDonations.map((doacao) => {
                        const urgency = getUrgencyInfo(doacao.validade)
                        const categoryImage = getCategoryImage(doacao.categoria)
                        return (
                          <div key={doacao.id} className={`rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition border-l-4 border ${urgency.borderColor} ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                            <div className={`h-32 relative ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                              <img src={categoryImage} alt={doacao.categoria || 'Comida'} className="w-full h-full object-cover opacity-80" />
                              <span className={`absolute top-2 right-2 ${urgency.badgeBg} text-white text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1`}>
                                {urgency.label === (language === 'pt' ? 'Vence em breve!' : language === 'en' ? 'Expires soon!' : '¡Vence pronto!') && <Clock className="w-3 h-3" />}
                                {urgency.label}
                              </span>
                            </div>
                            <div className="p-4">
                              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{doacao.titulo}</h3>
                              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Qtd: {doacao.quantidade} • Vence: {new Date(doacao.validade).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                              {doacao.descricao && <p className={`text-xs mt-2 italic ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{doacao.descricao}</p>}
                              <button onClick={() => handleReserveDonation(doacao.id)} className={`w-full mt-4 ${urgency.textColor} bg-opacity-10 py-2 rounded-lg font-semibold hover:bg-opacity-20 transition border ${urgency.borderColor}`}>
                                {language === 'pt' ? 'Reservar Agora' : language === 'en' ? 'Reserve Now' : 'Reservar Ahora'}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {currentView === 'history' && (
            <div className="space-y-4 animate-fade-in">
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {role === 'estabelecimento' ? (language === 'pt' ? 'Minhas Doações' : language === 'en' ? 'My Donations' : 'Mis Donaciones') : (language === 'pt' ? 'Minhas Reservas' : language === 'en' ? 'My Reservations' : 'Mis Reservas')}
              </h2>
              {(role === 'estabelecimento' ? donations : myReservations).length === 0 ? (
                <div className={`text-center py-12 rounded-2xl shadow border transition-colors ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                  <div className="text-5xl mb-3">📭</div>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>{language === 'pt' ? 'Nenhum registro encontrado.' : language === 'en' ? 'No records found.' : 'No se encontraron registros.'}</p>
                </div>
              ) : (
                (role === 'estabelecimento' ? donations : myReservations).map((item: any) => (
                  <div key={item.id} className={`rounded-xl shadow p-4 border-l-4 border transition-colors ${
                    item.status === 'disponivel' ? 'border-green-500' : 
                    item.status === 'reservado' ? 'border-yellow-500' : 
                    'border-gray-600 opacity-60'
                  } ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.titulo}</h3>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{item.quantidade} • {new Date(item.validade).toLocaleString('pt-BR')}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        item.status === 'disponivel' ? (isDark ? 'bg-green-950 text-green-400' : 'bg-green-100 text-green-700') : 
                        item.status === 'reservado' ? (isDark ? 'bg-yellow-950 text-yellow-400' : 'bg-yellow-100 text-yellow-700') : 
                        (isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600')
                      }`}>
                        {item.status === 'retirado' ? (language === 'pt' ? 'RETIRADO' : language === 'en' ? 'PICKED UP' : 'RETIRADO') : item.status.toUpperCase()}
                      </span>
                    </div>
                    
                    {role === 'orfanato' && item.status === 'reservado' && (
                      <div className="mt-4 flex gap-2">
                        <button onClick={() => handleCancelReservation(item.id, item.titulo)} className="flex-1 bg-red-950 text-red-400 py-2 rounded-lg font-semibold hover:bg-red-900 transition text-sm border border-red-900">
                           {language === 'pt' ? 'Cancelar Reserva' : language === 'en' ? 'Cancel Reservation' : 'Cancelar Reserva'}
                        </button>
                        <button 
                          onClick={() => { setDoacaoToConfirm(item); setShowConfirmModal(true); }}
                          className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition text-sm flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {language === 'pt' ? 'Confirmar Retirada' : language === 'en' ? 'Confirm Pickup' : 'Confirmar Retiro'}
                        </button>
                      </div>
                    )}

                    {role === 'orfanato' && item.status === 'retirado' && (
                      <div className={`mt-4 flex items-center gap-2 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-semibold">{language === 'pt' ? 'Retirada Confirmada' : language === 'en' ? 'Pickup Confirmed' : 'Retirada Confirmada'}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {currentView === 'report' && role === 'estabelecimento' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className={`w-8 h-8 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                <div>
                  <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Relatório de Atividade</h2>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Acompanhe o impacto real das suas doações</p>
                </div>
              </div>

              <div className={`p-5 rounded-2xl border-2 ${isDark ? 'bg-gradient-to-br from-purple-950/50 to-gray-900 border-purple-800' : 'bg-gradient-to-br from-purple-50 to-white border-purple-200'}`}>
                <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                  <Leaf className="w-5 h-5" />
                  Seu Impacto Social Gerado
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`p-4 rounded-xl flex items-center gap-4 ${isDark ? 'bg-gray-800/50' : 'bg-white shadow-sm'}`}>
                    <div className={`p-3 rounded-full ${isDark ? 'bg-purple-900' : 'bg-purple-100'}`}>
                      <Utensils className={`w-6 h-6 ${isDark ? 'text-purple-300' : 'text-purple-600'}`} />
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{totalUnits}</p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Refeições Servidas</p>
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl flex items-center gap-4 ${isDark ? 'bg-gray-800/50' : 'bg-white shadow-sm'}`}>
                    <div className={`p-3 rounded-full ${isDark ? 'bg-green-900' : 'bg-green-100'}`}>
                      <Weight className={`w-6 h-6 ${isDark ? 'text-green-300' : 'text-green-600'}`} />
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{kgSaved} kg</p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Alimentos Salvos do Lixo</p>
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl flex items-center gap-4 ${isDark ? 'bg-gray-800/50' : 'bg-white shadow-sm'}`}>
                    <div className={`p-3 rounded-full ${isDark ? 'bg-blue-900' : 'bg-blue-100'}`}>
                      <Users className={`w-6 h-6 ${isDark ? 'text-blue-300' : 'text-blue-600'}`} />
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{uniqueOrphanages.size}</p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Orfanatos Impactados</p>
                    </div>
                  </div>
                </div>
                <p className={`text-xs mt-3 text-center italic ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  * Estimativa baseada em uma média de 0,5kg por unidade doada.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`rounded-xl shadow p-5 border transition-colors ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total de Doações</span>
                    <Package className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                  </div>
                  <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{activityData.length}</p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Desde o cadastro</p>
                </div>

                <div className={`rounded-xl shadow p-5 border transition-colors ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Retiradas com Sucesso</span>
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  </div>
                  <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{completedForImpact.length}</p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Alimentos entregues</p>
                </div>

                <div className={`rounded-xl shadow p-5 border transition-colors ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Taxa de Sucesso</span>
                    <AlertCircle className="w-5 h-5 text-yellow-400" />
                  </div>
                  <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {activityData.length > 0 ? Math.round((completedForImpact.length / activityData.length) * 100) : 0}%
                  </p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Eficiência das doações</p>
                </div>
              </div>

              <div className={`rounded-xl shadow p-5 border transition-colors ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Doações dos Últimos 7 Dias</h3>
                <div className="flex items-end justify-between gap-2 h-40">
                  {Array.from({ length: 7 }).map((_, i) => {
                    const date = new Date()
                    date.setDate(date.getDate() - (6 - i))
                    const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
                    const dayDonations = activityData.filter((d: any) => {
                      const donationDate = new Date(d.created_at)
                      return donationDate.toDateString() === date.toDateString()
                    }).length
                    const maxDonations = Math.max(...Array.from({ length: 7 }).map((_, j) => {
                      const d = new Date()
                      d.setDate(d.getDate() - (6 - j))
                      return activityData.filter((don: any) => new Date(don.created_at).toDateString() === d.toDateString()).length
                    }), 1)
                    const height = (dayDonations / maxDonations) * 100

                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full flex items-end justify-center h-32">
                          <div 
                            className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg transition-all hover:from-purple-500 hover:to-purple-300"
                            style={{ height: `${Math.max(height, 5)}%` }}
                            title={`${dayDonations} doação(ões)`}
                          >
                            {dayDonations > 0 && (
                              <span className="text-xs text-white font-bold flex items-center justify-center h-full">
                                {dayDonations}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`text-xs capitalize ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{dayName}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className={`rounded-xl shadow p-5 border transition-colors ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Últimas Retiradas Confirmadas</h3>
                {completedDonations.length === 0 ? (
                  <p className={`text-sm text-center py-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Nenhuma retirada confirmada ainda.</p>
                ) : (
                  <div className="space-y-2">
                    {completedDonations.map((item: any) => (
                      <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-green-950' : 'bg-green-100'}`}>
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                          </div>
                          <div>
                            <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.titulo}</p>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Retirado em {new Date(item.created_at).toLocaleDateString('pt-BR')}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${isDark ? 'bg-green-950 text-green-400' : 'bg-green-100 text-green-700'}`}>
                          ✅ ENTREGUE
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentView === 'expired' && role === 'orfanato' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-8 h-8 text-red-400" />
                <div>
                  <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{language === 'pt' ? 'Histórico de Expirados' : language === 'en' ? 'Expired History' : 'Historial de Expirados'}</h2>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{language === 'pt' ? 'Reservas que não foram retiradas a tempo' : language === 'en' ? 'Reservations not picked up on time' : 'Reservas no retiradas a tiempo'}</p>
                </div>
              </div>

              {expiredReservations.length === 0 ? (
                <div className={`text-center py-12 rounded-2xl shadow border transition-colors ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                  <div className="text-5xl mb-3">⏰</div>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>{language === 'pt' ? 'Nenhuma reserva expirada.' : language === 'en' ? 'No expired reservations.' : 'No hay reservas expiradas.'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expiredReservations.map((item: any) => (
                    <div key={item.id} className={`rounded-xl shadow p-4 border-l-4 border-red-600 border opacity-75 transition-colors ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.titulo}</h3>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{item.quantidade} • {language === 'pt' ? 'Expirou em:' : language === 'en' ? 'Expired on:' : 'Expiró en:'} {new Date(item.validade).toLocaleString('pt-BR')}</p>
                        </div>
                        <span className="text-xs font-bold px-2 py-1 rounded bg-red-950 text-red-400 border border-red-800">
                          {language === 'pt' ? 'EXPIRADO' : language === 'en' ? 'EXPIRED' : 'EXPIRADO'}
                        </span>
                      </div>
                      
                      <div className="mt-4 bg-red-950/30 border border-red-900 rounded-lg p-3">
                        <p className="text-xs text-red-300">
                          ⚠️ {language === 'pt' 
                            ? 'Esta reserva expirou. Notifique o estabelecimento para que a doação volte ao feed.' 
                            : language === 'en' 
                            ? 'This reservation expired. Notify the establishment to return the donation to the feed.' 
                            : 'Esta reserva expiró. Notifica al establecimiento para que la donación vuelva al feed.'}
                        </p>
                      </div>

                      <button 
                        onClick={() => { setDoacaoToNotify(item); setShowExpiredModal(true); }}
                        className="w-full mt-3 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition text-sm flex items-center justify-center gap-2"
                      >
                        <AlertCircle className="w-4 h-4" />
                        {language === 'pt' ? 'Notificar Estabelecimento' : language === 'en' ? 'Notify Establishment' : 'Notificar Establecimiento'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentView === 'settings' && (
            <div className="space-y-4 animate-fade-in">
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t[language].settingsTitle}</h2>
              <div className={`rounded-2xl shadow p-6 space-y-4 border transition-colors ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                <div className={`flex items-center gap-4 pb-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                  <div className={`w-16 h-16 rounded-full overflow-hidden border-2 shadow-sm flex items-center justify-center ${isDark ? 'border-purple-900 bg-gray-800' : 'border-purple-200 bg-purple-50'}`}>
                    <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${userName}&backgroundColor=${isDark ? '581c87' : 'f3e8ff'}&textColor=${isDark ? 'e9d5ff' : '581c87'}&size=128`} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{userName}</h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{role === 'estabelecimento' ? 'Estabelecimento Doador' : 'Orfanato Receptor'}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Preferências do App</h4>
                  
                  <div className={`flex justify-between items-center p-3 rounded-lg transition-colors ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{t[language].fontSize}</span>
                    <div className="flex gap-2">
                      {['P', 'M', 'G'].map((size) => (
                        <button key={size} onClick={() => setFontSize(size as 'P' | 'M' | 'G')} className={`w-10 h-10 rounded-lg text-sm font-bold transition-all shadow-sm ${fontSize === size ? 'bg-purple-600 text-white ring-2 ring-purple-500 scale-105' : (isDark ? 'bg-gray-900 border border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100')}`}>
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={`flex justify-between items-center p-3 rounded-lg transition-colors ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{t[language].languageLabel}</span>
                    <select value={language} onChange={(e) => setLanguage(e.target.value as 'pt' | 'en' | 'es')} className={`text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2 outline-none cursor-pointer ${isDark ? 'bg-gray-900 border border-gray-700 text-white' : 'bg-white border border-gray-300 text-gray-900'}`}>
                      <option value="pt">🇧🇷 Português</option>
                      <option value="en">🇺🇸 English</option>
                      <option value="es">🇪🇸 Español</option>
                    </select>
                  </div>

                  <div className={`flex justify-between items-center p-3 rounded-lg transition-colors ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{t[language].themeLabel}</span>
                    <div className={`flex rounded-lg p-1 border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-200 border-gray-300'}`}>
                      <button 
                        onClick={() => { setTheme('light'); localStorage.setItem('alimetamais-theme', 'light'); }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${theme === 'light' ? (isDark ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-gray-900 shadow-sm') : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900')}`}
                      >
                        <Sun className="w-4 h-4" /> Claro
                      </button>
                      <button 
                        onClick={() => { setTheme('dark'); localStorage.setItem('alimetamais-theme', 'dark'); }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${theme === 'dark' ? 'bg-purple-600 text-white shadow-sm' : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900')}`}
                      >
                        <Moon className="w-4 h-4" /> Escuro
                      </button>
                    </div>
                  </div>

                  <div className={`flex justify-between items-center p-3 rounded-lg transition-colors opacity-60 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <div className="flex flex-col">
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{t[language].pushNotif}</span>
                      <span className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Em breve</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${isDark ? 'bg-purple-900 text-purple-300 border-purple-700' : 'bg-purple-100 text-purple-700 border-purple-200'}`}>🚧 Em desenvolvimento</span>
                      <div className="w-10 h-6 bg-gray-700 rounded-full relative cursor-not-allowed">
                        <div className="absolute left-1 top-1 w-4 h-4 bg-gray-500 rounded-full"></div>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => setShowHelp(true)}
                    className={`w-full flex justify-between items-center p-3 rounded-lg transition text-left ${isDark ? 'bg-gray-800 hover:bg-gray-750' : 'bg-gray-50 hover:bg-gray-100'}`}
                  >
                    <div className="flex items-center gap-3">
                      <HelpCircle className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{t[language].help}</span>
                    </div>
                    <span className={isDark ? 'text-gray-500 text-sm' : 'text-gray-400 text-sm'}>→</span>
                  </button>

                  <button 
                    onClick={() => setShowAbout(true)}
                    className={`w-full flex justify-between items-center p-3 rounded-lg transition text-left ${isDark ? 'bg-gray-800 hover:bg-gray-750' : 'bg-gray-50 hover:bg-gray-100'}`}
                  >
                    <div className="flex items-center gap-3">
                      <Info className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{t[language].about}</span>
                    </div>
                    <span className={isDark ? 'text-gray-500 text-sm' : 'text-gray-400 text-sm'}>→</span>
                  </button>
                </div>
                
                <div className={`pt-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                  <button onClick={handleLogout} className="w-full bg-red-950 text-red-400 font-semibold py-3 rounded-lg hover:bg-red-900 transition flex items-center justify-center gap-2 border border-red-900">
                    <LogOut className="w-5 h-5" />
                    {t[language].logout}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* MODAL SOBRE - COMPLETO E SEM CORTES */}
        {showAbout && (
          <>
            <div className="fixed inset-0 bg-black bg-opacity-70 z-50" onClick={() => setShowAbout(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <div className={`rounded-2xl shadow-2xl border max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto animate-slide-down ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                <div className="bg-gradient-to-r from-purple-700 to-purple-900 p-6 rounded-t-2xl relative">
                  <button onClick={() => setShowAbout(false)} className="absolute top-4 right-4 text-white hover:text-purple-200 transition p-1 rounded-lg hover:bg-white/10">
                    <X className="w-6 h-6" />
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/10 rounded-xl">
                      <Leaf className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Alimetamais</h2>
                      <p className="text-purple-200 text-sm">Versão 1.0.0</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Info className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                      <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Informações Institucionais</h3>
                    </div>
                    <div className={`rounded-lg p-4 space-y-2 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        O <strong className={isDark ? 'text-purple-400' : 'text-purple-600'}>Alimetamais</strong> é uma plataforma digital desenvolvida para combater o desperdício de alimentos e promover a segurança alimentar. O sistema conecta estabelecimentos comerciais que possuem excedentes de alimentos a orfanatos e instituições que necessitam de doações, criando uma rede solidária e sustentável.
                      </p>
                      <div className={`pt-2 border-t space-y-1 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}><strong className={isDark ? 'text-gray-300' : 'text-gray-700'}>Desenvolvido por:</strong> Milord</p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}><strong className={isDark ? 'text-gray-300' : 'text-gray-700'}>Orientador:</strong> Professor Gabriel</p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}><strong className={isDark ? 'text-gray-300' : 'text-gray-700'}>Instituição:</strong> UDF - Centro Universitário do Distrito Federal</p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}><strong className={isDark ? 'text-gray-300' : 'text-gray-700'}>Ano:</strong> 2026</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Shield className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                      <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Informações Legais</h3>
                    </div>
                    <div className={`rounded-lg p-4 space-y-3 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <div>
                        <h4 className={`text-sm font-semibold mb-1 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>Direitos Autorais</h4>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>© 2026 Alimetamais. Todos os direitos reservados. Este software é protegido por leis de direitos autorais e tratados internacionais.</p>
                      </div>
                      <div>
                        <h4 className={`text-sm font-semibold mb-1 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>Licença de Uso</h4>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Este software foi desenvolvido para fins acadêmicos e educacionais. O uso comercial requer autorização prévia do desenvolvedor.</p>
                      </div>
                      <div>
                        <h4 className={`text-sm font-semibold mb-1 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>Política de Privacidade</h4>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Os dados dos usuários são armazenados de forma segura e criptografada. Não compartilhamos informações pessoais com terceiros. Os usuários podem solicitar a exclusão de seus dados a qualquer momento.</p>
                      </div>
                      <div>
                        <h4 className={`text-sm font-semibold mb-1 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>Termos de Uso</h4>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Ao utilizar o Alimetamais, o usuário concorda em fornecer informações precisas sobre as doações e respeitar os prazos de retirada estabelecidos. O sistema não se responsabiliza pela qualidade dos alimentos doados.</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Code className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                      <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Informações Técnicas</h3>
                    </div>
                    <div className={`rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className={`text-xs mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Frontend</p>
                          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Next.js 14</p>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>React + TypeScript</p>
                        </div>
                        <div>
                          <p className={`text-xs mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Estilização</p>
                          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Tailwind CSS</p>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Design Responsivo</p>
                        </div>
                        <div>
                          <p className={`text-xs mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Backend & Banco</p>
                          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Supabase</p>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>PostgreSQL + Auth</p>
                        </div>
                        <div>
                          <p className={`text-xs mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Ícones</p>
                          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Lucide React</p>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>SVG Modernos</p>
                        </div>
                        <div>
                          <p className={`text-xs mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Avatares</p>
                          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>DiceBear API</p>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Geração Dinâmica</p>
                        </div>
                        <div>
                          <p className={`text-xs mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Deploy</p>
                          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Vercel</p>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>CDN Global</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`pt-4 border-t text-center ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Feito com 💜 por Milord • 2026</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* MODAL AJUDA - COMPLETO E SEM CORTES */}
        {showHelp && (
          <>
            <div className="fixed inset-0 bg-black bg-opacity-70 z-50" onClick={() => setShowHelp(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <div className={`rounded-2xl shadow-2xl border max-w-3xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto animate-slide-down ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                <div className="bg-gradient-to-r from-purple-700 to-purple-900 p-6 rounded-t-2xl relative">
                  <button onClick={() => setShowHelp(false)} className="absolute top-4 right-4 text-white hover:text-purple-200 transition p-1 rounded-lg hover:bg-white/10">
                    <X className="w-6 h-6" />
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/10 rounded-xl">
                      <HelpCircle className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{t[language].help}</h2>
                      <p className="text-purple-200 text-sm">Tire suas dúvidas e resolva problemas</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <MessageCircle className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                      <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Perguntas Frequentes (FAQ)</h3>
                    </div>
                    <div className={`rounded-lg p-4 space-y-4 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <div className={`border-b pb-3 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        <h4 className={`text-sm font-semibold mb-1 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>Como cadastro uma nova doação?</h4>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Como Estabelecimento, vá para a tela "Início" e preencha o formulário "Cadastrar Novo Excedente". Selecione a categoria, informe o título, quantidade, validade e observações. Clique em "Disponibilizar Doação".</p>
                      </div>
                      <div className={`border-b pb-3 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        <h4 className={`text-sm font-semibold mb-1 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>Como reservo uma doação disponível?</h4>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Como Orfanato, acesse o "Feed de Doações", visualize os itens disponíveis e clique em "Reservar Agora". A doação aparecerá em "Minhas Reservas" com o status "Reservado".</p>
                      </div>
                      <div className={`border-b pb-3 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        <h4 className={`text-sm font-semibold mb-1 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>Posso cancelar uma reserva?</h4>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Sim! Em "Minhas Reservas", clique em "Cancelar Reserva". O estabelecimento será notificado automaticamente e o item voltará a ficar disponível no feed.</p>
                      </div>
                      <div className={`border-b pb-3 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        <h4 className={`text-sm font-semibold mb-1 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>O que significa cada cor de urgência?</h4>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>🔴 <strong>Vermelho:</strong> Vence em menos de 6 horas (urgente). 🟡 <strong>Amarelo:</strong> Vence entre 6 e 24 horas. 🟢 <strong>Verde:</strong> Vence em mais de 24 horas.</p>
                      </div>
                      <div>
                        <h4 className={`text-sm font-semibold mb-1 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>Como altero meu idioma ou tamanho da fonte?</h4>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Acesse "Configurações" no menu lateral. Lá você encontrará opções para ajustar o tamanho da fonte (P, M, G) e o idioma do aplicativo (Português, Inglês ou Espanhol).</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                      <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Guia de Navegação</h3>
                    </div>
                    <div className={`rounded-lg p-4 space-y-3 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-purple-950' : 'bg-purple-100'}`}>
                          <Menu className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                        </div>
                        <div>
                          <h4 className={`text-sm font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Menu Lateral (☰)</h4>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Clique no ícone de menu no canto superior esquerdo para acessar: Início, Histórico (Minhas Doações/Reservas), Histórico de Expirados (Orfanato), Relatório (Estabelecimento) e Configurações.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-purple-950' : 'bg-purple-100'}`}>
                          <Bell className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                        </div>
                        <div>
                          <h4 className={`text-sm font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Notificações (🔔)</h4>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>O ícone de sino mostra alertas importantes (ex: cancelamento de reserva). O número vermelho indica notificações não lidas. Clique para visualizar.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-purple-950' : 'bg-purple-100'}`}>
                          <Leaf className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                        </div>
                        <div>
                          <h4 className={`text-sm font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Avatar do Usuário</h4>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Clique no seu avatar no canto superior direito para ver seu cartão de identidade (nome, e-mail e tipo de conta).</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-purple-950' : 'bg-purple-100'}`}>
                          <AlertCircle className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                        </div>
                        <div>
                          <h4 className={`text-sm font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Status das Doações</h4>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>🟢 <strong>Disponível:</strong> Aguardando reserva. 🟡 <strong>Reservado:</strong> Alguém irá retirar. ⚫ <strong>Retirado:</strong> Entrega concluída. 🔴 <strong>Expirado:</strong> Não retirado a tempo.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                      <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Problemas Técnicos</h3>
                    </div>
                    <div className={`rounded-lg p-4 space-y-4 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <div>
                        <h4 className={`text-sm font-semibold mb-1 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>Não consigo fazer login</h4>
                        <ul className={`text-xs space-y-1 list-disc list-inside ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          <li>Verifique se o e-mail e senha estão corretos.</li>
                          <li>Certifique-se de que sua conta foi criada com sucesso.</li>
                          <li>Tente limpar o cache do navegador (Ctrl + Shift + R).</li>
                          <li>Se o problema persistir, entre em contato com o suporte.</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className={`text-sm font-semibold mb-1 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>As doações não aparecem no feed</h4>
                        <ul className={`text-xs space-y-1 list-disc list-inside ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          <li>Verifique sua conexão com a internet.</li>
                          <li>Atualize a página (F5).</li>
                          <li>Confira se há doações com status "disponível" no sistema.</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className={`text-sm font-semibold mb-1 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>Erro ao reservar ou cancelar</h4>
                        <ul className={`text-xs space-y-1 list-disc list-inside ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          <li>Verifique se você está logado com a conta correta (Orfanato para reservar).</li>
                          <li>Aguarde alguns segundos e tente novamente.</li>
                          <li>Se o erro persistir, recarregue a página e tente novamente.</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className={`text-sm font-semibold mb-1 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>O app está lento ou travando</h4>
                        <ul className={`text-xs space-y-1 list-disc list-inside ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          <li>Feche outras abas do navegador.</li>
                          <li>Limpe o cache do navegador.</li>
                          <li>Verifique sua conexão com a internet.</li>
                          <li>Tente acessar em outro navegador (Chrome, Firefox, Edge).</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className={`pt-4 border-t text-center space-y-2 ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Ainda com dúvidas?</p>
                    <button 
                      onClick={() => { setShowHelp(false); showToast('Suporte contactado! Retornaremos em breve.', 'info'); }}
                      className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition text-sm"
                    >
                      Entrar em contato com o suporte
                    </button>
                    <p className={`text-xs mt-3 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      Alimetamais v1.0.0 • Suporte: suporte@alimetamais.com
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Modal de Confirmação de Retirada */}
        {showConfirmModal && doacaoToConfirm && (
          <>
            <div className="fixed inset-0 bg-black bg-opacity-70 z-50" onClick={() => { setShowConfirmModal(false); setDoacaoToConfirm(null); }} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <div className={`rounded-2xl shadow-2xl border max-w-md w-full pointer-events-auto animate-slide-down ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                <div className="bg-gradient-to-r from-purple-700 to-purple-900 p-6 rounded-t-2xl relative">
                  <button onClick={() => { setShowConfirmModal(false); setDoacaoToConfirm(null); }} className="absolute top-4 right-4 text-white hover:text-purple-200 transition p-1 rounded-lg hover:bg-white/10">
                    <X className="w-6 h-6" />
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/10 rounded-xl">
                      <CheckCircle2 className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{language === 'pt' ? 'Confirmar Retirada' : language === 'en' ? 'Confirm Pickup' : 'Confirmar Retiro'}</h2>
                      <p className="text-purple-200 text-sm">{language === 'pt' ? 'Ação irreversível' : language === 'en' ? 'Irreversible action' : 'Acción irreversible'}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className={`rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <p className={`text-sm mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {language === 'pt' 
                        ? 'Você está prestes a confirmar que retirou a seguinte doação:' 
                        : language === 'en' 
                        ? 'You are about to confirm that you picked up the following donation:' 
                        : 'Estás a punto de confirmar que retiraste la siguiente donación:'}
                    </p>
                    <div className="border-l-4 border-purple-500 pl-3">
                      <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{doacaoToConfirm.titulo}</h3>
                      <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{doacaoToConfirm.quantidade} • {new Date(doacaoToConfirm.validade).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>

                  <div className="bg-yellow-950 border border-yellow-800 rounded-lg p-3">
                    <p className="text-xs text-yellow-300">
                      ⚠️ {language === 'pt' 
                        ? 'Após confirmar, o estabelecimento será notificado e o status mudará para "Retirado".' 
                        : language === 'en' 
                        ? 'After confirming, the establishment will be notified and the status will change to "Picked Up".' 
                        : 'Después de confirmar, el establecimiento será notificado y el estado cambiará a "Retirado".'}
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => { setShowConfirmModal(false); setDoacaoToConfirm(null); }}
                      className={`flex-1 py-3 rounded-lg font-semibold transition border ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300'}`}
                    >
                      {language === 'pt' ? 'Cancelar' : language === 'en' ? 'Cancel' : 'Cancelar'}
                    </button>
                    <button 
                      onClick={confirmRetirada}
                      className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      {language === 'pt' ? 'Confirmar Retirada' : language === 'en' ? 'Confirm Pickup' : 'Confirmar Retiro'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Modal de Notificação de Expirado */}
        {showExpiredModal && doacaoToNotify && (
          <>
            <div className="fixed inset-0 bg-black bg-opacity-70 z-50" onClick={() => { setShowExpiredModal(false); setDoacaoToNotify(null); }} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <div className={`rounded-2xl shadow-2xl border max-w-md w-full pointer-events-auto animate-slide-down ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                <div className="bg-gradient-to-r from-red-700 to-red-900 p-6 rounded-t-2xl relative">
                  <button onClick={() => { setShowExpiredModal(false); setDoacaoToNotify(null); }} className="absolute top-4 right-4 text-white hover:text-red-200 transition p-1 rounded-lg hover:bg-white/10">
                    <X className="w-6 h-6" />
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/10 rounded-xl">
                      <AlertCircle className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{language === 'pt' ? 'Notificar Expiração' : language === 'en' ? 'Notify Expiration' : 'Notificar Expiración'}</h2>
                      <p className="text-red-200 text-sm">{language === 'pt' ? 'Doação voltará ao feed' : language === 'en' ? 'Donation will return to feed' : 'La donación volverá al feed'}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className={`rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <p className={`text-sm mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {language === 'pt' 
                        ? 'Você está prestes a notificar o estabelecimento que esta reserva expirou:' 
                        : language === 'en' 
                        ? 'You are about to notify the establishment that this reservation expired:' 
                        : 'Estás a punto de notificar al establecimiento que esta reserva expiró:'}
                    </p>
                    <div className="border-l-4 border-red-500 pl-3">
                      <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{doacaoToNotify.titulo}</h3>
                      <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{doacaoToNotify.quantidade} • {language === 'pt' ? 'Expirou em:' : language === 'en' ? 'Expired on:' : 'Expiró en:'} {new Date(doacaoToNotify.validade).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>

                  <div className="bg-red-950 border border-red-800 rounded-lg p-3">
                    <p className="text-xs text-red-300">
                      ⚠️ {language === 'pt' 
                        ? 'Após notificar, a doação voltará ao feed como disponível e o estabelecimento será avisado.' 
                        : language === 'en' 
                        ? 'After notifying, the donation will return to the feed as available and the establishment will be notified.' 
                        : 'Después de notificar, la donación volverá al feed como disponible y el establecimiento será avisado.'}
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => { setShowExpiredModal(false); setDoacaoToNotify(null); }}
                      className={`flex-1 py-3 rounded-lg font-semibold transition border ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300'}`}
                    >
                      {language === 'pt' ? 'Cancelar' : language === 'en' ? 'Cancel' : 'Cancelar'}
                    </button>
                    <button 
                      onClick={notifyExpiredEstablishment}
                      className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition flex items-center justify-center gap-2"
                    >
                      <AlertCircle className="w-5 h-5" />
                      {language === 'pt' ? 'Notificar Estabelecimento' : language === 'en' ? 'Notify Establishment' : 'Notificar Establecimiento'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}s
      </div>
    </div>
  )
}