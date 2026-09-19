import { Wallet } from 'lucide-react'

interface HeaderProps {
  transactionCount: number
}

export const Header = ({ transactionCount }: HeaderProps) => {
  return (
    <header className="flex items-center justify-between border-b border-slate-800/80 pb-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
          <Wallet className="w-8 h-8 text-emerald-400" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">myFinance</h1>
          <p className="text-xs text-slate-400">Controle financeiro pessoal e escalável</p>
        </div>
      </div>

      <div className="text-right hidden sm:block">
        <span className="text-xs font-medium text-slate-400">Total de Registros</span>
        <div className="text-sm font-semibold text-white">
          {transactionCount} {transactionCount === 1 ? 'movimentação' : 'movimentações'}
        </div>
      </div>
    </header>
  )
}
