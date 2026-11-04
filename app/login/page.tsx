'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Leaf } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nome, setNome] = useState('')
  const [role, setRole] = useState<'estabelecimento' | 'orfanato'>('estabelecimento')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { nome: nome, role: role } },
        })
        if (signUpError) throw signUpError
        alert('Cadastro realizado! Verifique seu e-mail e faça o login.')
        setIsSignUp(false)
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-950">
      
      {/* LADO ESQUERDO (Imagem e Branding) */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-purple-800 to-purple-950 relative items-center justify-center p-12">
        <img 
          src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=1000" 
          alt="Crianças sendo ajudadas" 
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="relative z-10 text-white max-w-md">
          <h1 className="text-5xl font-bold mb-4 tracking-tight flex items-center gap-3">
            <Leaf className="w-12 h-12 text-purple-400" />
            Alimetamais
          </h1>
          <p className="text-xl font-light leading-relaxed text-purple-100">
            Conectando o excedente de quem tem à necessidade de quem precisa. 
            <br/><br/>
            <span className="font-semibold text-purple-300">Junte-se à rede contra o desperdício.</span>
          </p>
        </div>
      </div>

      {/* LADO DIREITO (Formulário) */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-gray-950">
        <div className="w-full max-w-md">
          
          {/* Logo Mobile */}
          <div className="md:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-purple-400 flex items-center justify-center gap-2">
              <Leaf className="w-8 h-8" />
              Alimetamais
            </h1>
            <p className="text-gray-500 text-sm mt-1">Rede contra o desperdício</p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">
              {isSignUp ? 'Crie sua conta' : 'Bem-vindo de volta!'}
            </h2>
            <p className="text-gray-400 mt-2">
              {isSignUp 
                ? 'Preencha os dados para fazer parte da rede.' 
                : 'Acesse sua conta para continuar.'}
            </p>
          </div>

          {error && (
            <div className="bg-red-950 border-l-4 border-red-500 text-red-400 p-3 rounded mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Nome da Organização</label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full rounded-lg border-gray-700 bg-gray-900 border p-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-900 transition outline-none placeholder-gray-500"
                    placeholder="Ex: Giraffas Asa Sul"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Tipo de Conta</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('estabelecimento')}
                      className={`p-3 rounded-lg border text-sm font-semibold transition flex items-center justify-center gap-2 ${
                        role === 'estabelecimento' 
                          ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-900/50' 
                          : 'bg-gray-900 text-gray-400 border-gray-700 hover:bg-gray-800'
                      }`}
                    >
                      🏪 Estabelecimento
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('orfanato')}
                      className={`p-3 rounded-lg border text-sm font-semibold transition flex items-center justify-center gap-2 ${
                        role === 'orfanato' 
                          ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-900/50' 
                          : 'bg-gray-900 text-gray-400 border-gray-700 hover:bg-gray-800'
                      }`}
                    >
                      🏠 Orfanato
                    </button>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border-gray-700 bg-gray-900 border p-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-900 transition outline-none placeholder-gray-500"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Senha</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border-gray-700 bg-gray-900 border p-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-900 transition outline-none placeholder-gray-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-4 rounded-lg hover:from-purple-700 hover:to-purple-800 transition disabled:opacity-50 font-bold text-lg shadow-lg hover:shadow-purple-900/50 transform hover:-translate-y-0.5"
            >
              {loading ? 'Processando...' : isSignUp ? 'Criar Conta' : 'Entrar'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              {isSignUp ? 'Já tem uma conta?' : 'Ainda não faz parte da rede?'}
              <button
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setError('') }}
                className="ml-1 text-purple-400 font-bold hover:text-purple-300 hover:underline transition"
              >
                {isSignUp ? 'Faça login' : 'Cadastre-se'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}