import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  Search,
  ShieldAlert,
  Sparkles,
  Upload,
  X,
} from 'lucide-react'
import { useId, useMemo, useRef, useState } from 'react'
import { formatCurrency } from '../../../core/formatters/currency'
import { formatDate } from '../../../core/formatters/date'
import { soundFX } from '../../../core/sound/soundEffects'
import { useToast } from '../../../core/toast/toastContext'
import type { ParsedStatementItem, StatementParseResult } from '../../../domain/models/statement'
import type { CreateTransactionDTO, Transaction } from '../../../domain/models/transaction'
import { parseStatementFile } from '../../../domain/services/statementParser'

export interface ImportStatementModalProps {
  isOpen: boolean
  onClose: () => void
  existingTransactions: Transaction[]
  availableCategories: string[]
  onImport: (transactions: CreateTransactionDTO[]) => Promise<boolean>
}

type FilterView = 'all' | 'selected' | 'duplicates'

export function ImportStatementModal({
  isOpen,
  onClose,
  existingTransactions,
  availableCategories,
  onImport,
}: ImportStatementModalProps) {
  const toast = useToast()
  const titleId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isDragging, setIsDragging] = useState(false)
  const [parseResult, setParseResult] = useState<StatementParseResult | null>(null)
  const [items, setItems] = useState<ParsedStatementItem[]>([])
  const [filterView, setFilterView] = useState<FilterView>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Métricas de conferência memorizadas (definidas antes de qualquer retorno)
  const selectedItems = useMemo(() => items.filter((i) => i.selected), [items])
  const totalIncomeSelected = useMemo(
    () =>
      selectedItems.filter((i) => i.type === 'income').reduce((acc, curr) => acc + curr.amount, 0),
    [selectedItems],
  )
  const totalExpenseSelected = useMemo(
    () =>
      selectedItems.filter((i) => i.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0),
    [selectedItems],
  )
  const duplicateCount = useMemo(() => items.filter((i) => i.isDuplicate).length, [items])

  // Filtragem da lista na visualização por abas e busca textual
  const displayedItems = useMemo(() => {
    return items.filter((item) => {
      // Filtro de aba
      if (filterView === 'selected' && !item.selected) return false
      if (filterView === 'duplicates' && !item.isDuplicate) return false

      // Busca textual
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim()
        const matchTitle = item.title.toLowerCase().includes(query)
        const matchCategory = item.category.toLowerCase().includes(query)
        const matchDate = item.date.includes(query)
        if (!matchTitle && !matchCategory && !matchDate) return false
      }

      return true
    })
  }, [items, filterView, searchQuery])

  if (!isOpen) return null

  const handleFileProcess = (file: File) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const content = (e.target?.result as string) || ''
        const result = parseStatementFile(content, file.name, existingTransactions)

        if (result.items.length === 0) {
          soundFX.playClick()
          toast.warning(
            'Nenhuma transação encontrada',
            'O arquivo não possui lançamentos válidos ou o formato não foi reconhecido.',
          )
          return
        }

        soundFX.playSuccess()
        setParseResult(result)
        setItems(result.items)
        toast.success(
          'Extrato carregado com sucesso!',
          `${result.items.length} movimentações identificadas no arquivo.`,
        )
      } catch (err) {
        console.error('[ImportStatementModal] Erro ao ler extrato:', err)
        toast.error('Erro de leitura', 'Não foi possível processar o arquivo de extrato.')
      }
    }

    reader.onerror = () => {
      toast.error('Erro no arquivo', 'Falha ao ler o arquivo selecionado.')
    }

    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileProcess(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileProcess(file)
    }
  }

  // Carregar exemplo de extrato para demonstração e testes rápidos
  const handleLoadDemo = () => {
    soundFX.playClick()
    const demoOfx = `
      <OFX>
        <BANKTRANLIST>
          <STMTTRN>
            <TRNTYPE>DEBIT
            <DTPOSTED>20261001120000
            <TRNAMT>-125.80
            <MEMO>SUPERMERCADO CARREFOUR
          </STMTTRN>
          <STMTTRN>
            <TRNTYPE>DEBIT
            <DTPOSTED>20261002120000
            <TRNAMT>-68.00
            <MEMO>POSTO IPIRANGA COMBUSTIVEL
          </STMTTRN>
          <STMTTRN>
            <TRNTYPE>DEBIT
            <DTPOSTED>20261003120000
            <TRNAMT>-39.90
            <MEMO>FARMACIA DROGASIL
          </STMTTRN>
          <STMTTRN>
            <TRNTYPE>CREDIT
            <DTPOSTED>20261004120000
            <TRNAMT>4200.00
            <NAME>TRANSFERENCIA PIX SALARIO
          </STMTTRN>
        </BANKTRANLIST>
      </OFX>
    `
    const result = parseStatementFile(demoOfx, 'extrato_exemplo_nubank.ofx', existingTransactions)
    setParseResult(result)
    setItems(result.items)
    toast.info('Extrato de Demonstração', '4 lançamentos de exemplo carregados para teste.')
  }

  // Toggle de seleção de um item
  const handleToggleItem = (id: string) => {
    soundFX.playClick()
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item)),
    )
  }

  // Selecionar ou desmarcar todos
  const handleToggleSelectAll = () => {
    soundFX.playClick()
    const areAllSelected = items.every((i) => i.selected)
    setItems((prev) => prev.map((item) => ({ ...item, selected: !areAllSelected })))
  }

  // Desmarcar todas as duplicatas detectadas por segurança
  const handleDeselectDuplicates = () => {
    soundFX.playClick()
    setItems((prev) => prev.map((item) => (item.isDuplicate ? { ...item, selected: false } : item)))
    toast.info('Duplicatas Desmarcadas', 'Todos os lançamentos duplicados foram desmarcados.')
  }

  // Alterar categoria de um item
  const handleCategoryChange = (id: string, newCategory: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, category: newCategory } : item)),
    )
  }

  // Alterar título de um item
  const handleTitleChange = (id: string, newTitle: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, title: newTitle } : item)))
  }

  // Alternar tipo de receita / despesa
  const handleToggleType = (id: string) => {
    soundFX.playClick()
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, type: item.type === 'income' ? 'expense' : 'income' } : item,
      ),
    )
  }

  // Finalizar importação
  const handleConfirmImport = async () => {
    if (selectedItems.length === 0) {
      toast.warning('Nenhum item selecionado', 'Selecione ao menos uma transação para importar.')
      return
    }

    try {
      setIsSubmitting(true)
      const dtos: CreateTransactionDTO[] = selectedItems.map((item) => ({
        title: item.title,
        amount: item.amount,
        type: item.type,
        category: item.category,
        date: item.date,
        status: item.status,
      }))

      const success = await onImport(dtos)
      if (success) {
        soundFX.playSuccess()
        toast.success(
          'Importação concluída!',
          `${dtos.length} transações foram adicionadas ao seu myFinance.`,
        )
        onClose()
      }
    } catch (err) {
      console.error('[ImportStatementModal] Falha ao importar:', err)
      toast.error('Erro na importação', 'Não foi possível salvar as transações importadas.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setParseResult(null)
    setItems([])
    setFilterView('all')
    setSearchQuery('')
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-zinc-950/80 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-4xl max-h-[94vh] flex flex-col bg-zinc-900/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden glass-modal">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-white/10 bg-white/3">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id={titleId} className="text-base sm:text-lg font-bold text-white">
                Importar Extrato Bancário
              </h2>
              <p className="text-xs text-zinc-400 hidden sm:block">
                Suporte automático para arquivos OFX e CSV de qualquer banco brasileiro
              </p>
              <p className="text-[11px] text-zinc-400 sm:hidden">
                Compatível com OFX e CSV bancários
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Conteúdo Dinâmico */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 custom-scrollbar">
          {!parseResult ? (
            /* Estado 1: Upload / Drag & Drop */
            <div className="flex flex-col items-center justify-center py-6 sm:py-8">
              <button
                type="button"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full max-w-2xl p-6 sm:p-12 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-emerald-400 bg-emerald-500/10 scale-[1.01]'
                    : 'border-white/15 bg-white/2 hover:border-emerald-500/40 hover:bg-white/4'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".ofx,.csv,.txt"
                  onChange={handleFileInputChange}
                  className="hidden"
                  data-testid="statement-file-input"
                />

                <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8" aria-hidden="true" />
                </div>

                <h3 className="text-base sm:text-lg font-semibold text-white mb-1">
                  Arraste e solte o arquivo de extrato aqui
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 max-w-md mb-4">
                  Compatível com extratos baixados do Nubank, Banco Inter, Itaú, Bradesco,
                  Santander, C6 Bank, Caixa e outros.
                </p>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    .OFX (Recomendado)
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/10 text-zinc-300 border border-white/10">
                    .CSV
                  </span>
                </div>
              </button>

              {/* Botão de Exemplo */}
              <div className="mt-6 flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center">
                <span className="text-xs text-zinc-500">Não tem um arquivo no momento?</span>
                <button
                  type="button"
                  onClick={handleLoadDemo}
                  data-testid="load-demo-statement-btn"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Testar com Extrato de Exemplo</span>
                </button>
              </div>
            </div>
          ) : (
            /* Estado 2: Conferência e Curadoria Prévia com Detecção de Duplicatas e Mobile Adaptativo */
            <div className="space-y-4">
              {/* Barra de Resumo */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                <div className="p-3 rounded-2xl bg-white/3 border border-white/10 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-zinc-400 font-medium">Lançamentos</p>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/10 text-zinc-300">
                      {parseResult.fileType}
                    </span>
                  </div>
                  <p className="text-base sm:text-lg font-bold text-white mt-1">
                    {selectedItems.length}{' '}
                    <span className="text-xs font-normal text-zinc-500">de {items.length}</span>
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col justify-between">
                  <p className="text-[11px] text-emerald-400 font-medium truncate">
                    Entradas Selecionadas
                  </p>
                  <p className="text-base sm:text-lg font-bold text-emerald-400 mt-1">
                    + {formatCurrency(totalIncomeSelected)}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-rose-500/5 border border-rose-500/20 flex flex-col justify-between">
                  <p className="text-[11px] text-rose-400 font-medium truncate">
                    Saídas Selecionadas
                  </p>
                  <p className="text-base sm:text-lg font-bold text-rose-400 mt-1">
                    - {formatCurrency(totalExpenseSelected)}
                  </p>
                </div>
                <div
                  className={`p-3 rounded-2xl border flex flex-col justify-between ${
                    duplicateCount > 0
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : 'bg-white/3 border-white/10 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-medium truncate">Duplicatas Detectadas</p>
                    {duplicateCount > 0 && <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                  <p className="text-base sm:text-lg font-bold mt-1">
                    {duplicateCount}{' '}
                    <span className="text-xs font-normal opacity-70">
                      {duplicateCount === 1 ? 'item' : 'itens'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Barra de Filtros, Busca e Ações de Lote */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 pt-2 border-t border-white/5">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Abas de filtro */}
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 text-xs">
                    <button
                      type="button"
                      onClick={() => setFilterView('all')}
                      className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                        filterView === 'all'
                          ? 'bg-emerald-500 text-zinc-950 font-bold'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Todas ({items.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterView('selected')}
                      className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                        filterView === 'selected'
                          ? 'bg-emerald-500 text-zinc-950 font-bold'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Selecionadas ({selectedItems.length})
                    </button>
                    {duplicateCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setFilterView('duplicates')}
                        className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                          filterView === 'duplicates'
                            ? 'bg-amber-500 text-zinc-950 font-bold'
                            : 'text-amber-400/90 hover:text-amber-300'
                        }`}
                      >
                        Duplicatas ({duplicateCount})
                      </button>
                    )}
                  </div>

                  {/* Campo de Busca Rápida */}
                  <div className="relative flex-1 sm:w-48">
                    <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar lançamento..."
                      className="w-full bg-zinc-800/80 border border-white/10 rounded-xl pl-8 pr-3 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/40"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 text-xs">
                  {duplicateCount > 0 && (
                    <button
                      type="button"
                      onClick={handleDeselectDuplicates}
                      className="text-amber-400 hover:text-amber-300 transition cursor-pointer"
                    >
                      Desmarcar Duplicatas
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="text-zinc-400 hover:text-emerald-400 transition cursor-pointer"
                  >
                    {items.every((i) => i.selected) ? 'Desmarcar Todas' : 'Marcar Todas'}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-zinc-400 hover:text-rose-400 transition cursor-pointer"
                  >
                    Trocar Arquivo
                  </button>
                </div>
              </div>

              {/* Tabela de Transações com Comportamento Adaptativo Mobile & Desktop (Árvore DOM Única) */}
              <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/2">
                <div className="max-h-[48vh] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse text-xs block md:table">
                    <thead className="hidden md:table-header-group sticky top-0 bg-zinc-900 border-b border-white/10 z-10 text-[11px] uppercase tracking-wider text-zinc-400">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={items.length > 0 && items.every((i) => i.selected)}
                            onChange={handleToggleSelectAll}
                            aria-label="Selecionar todas as transações"
                            className="w-3.5 h-3.5 rounded border border-white/20 bg-white/5 text-emerald-500 focus:ring-0 accent-emerald-500 cursor-pointer"
                          />
                        </th>
                        <th className="py-2.5 px-3 w-24">Data</th>
                        <th className="py-2.5 px-3">Descrição / Lançamento</th>
                        <th className="py-2.5 px-3 w-36">Categoria</th>
                        <th className="py-2.5 px-3 w-32 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="block md:table-row-group p-2.5 md:p-0 space-y-3 md:space-y-0 md:divide-y md:divide-white/5">
                      {displayedItems.length === 0 ? (
                        <tr className="block md:table-row">
                          <td
                            colSpan={5}
                            className="block md:table-cell py-8 text-center text-zinc-500"
                          >
                            Nenhuma movimentação corresponde aos filtros atuais.
                          </td>
                        </tr>
                      ) : (
                        displayedItems.map((item) => {
                          const isIncome = item.type === 'income'

                          return (
                            <tr
                              key={item.id}
                              className={`flex flex-col md:table-row rounded-2xl md:rounded-none border md:border-0 p-3.5 md:p-0 transition-colors ${
                                item.selected
                                  ? 'border-emerald-500/25 bg-white/4 md:bg-white/4 hover:bg-white/6'
                                  : 'border-white/5 bg-zinc-900/60 md:bg-transparent opacity-65 hover:opacity-90'
                              } ${item.isDuplicate ? 'ring-1 ring-amber-500/30' : ''}`}
                            >
                              {/* 1. Seleção / Checkbox */}
                              <td className="flex items-center justify-between md:table-cell py-1.5 md:py-2.5 px-0 md:px-3 text-center border-b border-white/5 md:border-0 pb-2 md:pb-2.5">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={item.selected}
                                    onChange={() => handleToggleItem(item.id)}
                                    aria-label={`Selecionar ${item.title}`}
                                    className="w-4 h-4 md:w-3.5 md:h-3.5 rounded border border-white/20 bg-white/5 text-emerald-500 focus:ring-0 accent-emerald-500 cursor-pointer"
                                  />
                                  <span className="text-xs font-semibold text-zinc-300 md:hidden">
                                    {item.selected ? 'Selecionado' : 'Ignorar'}
                                  </span>
                                </label>

                                {/* No mobile: mostra a data ao lado do toggle no topo do card */}
                                <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 md:hidden">
                                  <Calendar className="w-3 h-3 text-zinc-500" />
                                  <span>{formatDate(item.date)}</span>
                                </div>
                              </td>

                              {/* 2. Data (Desktop) */}
                              <td className="hidden md:table-cell py-2.5 px-3 text-zinc-300 font-mono text-[11px]">
                                {formatDate(item.date)}
                              </td>

                              {/* 3. Descrição / Input de Título e Detalhes Anti-Duplicidade */}
                              <td className="block md:table-cell py-2 md:py-2.5 px-0 md:px-3 w-full">
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={item.title}
                                      onChange={(e) => handleTitleChange(item.id, e.target.value)}
                                      className="w-full bg-zinc-800/60 hover:bg-zinc-800 focus:bg-zinc-800 text-white font-medium rounded-lg px-2.5 py-1.5 md:py-0.5 border border-white/10 md:border-transparent focus:border-emerald-500/40 outline-none transition text-xs"
                                    />
                                    {item.isDuplicate && (
                                      <span
                                        title={
                                          item.duplicateReason ||
                                          'Identificamos uma transação existente com a mesma data e valor'
                                        }
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0"
                                      >
                                        <AlertTriangle className="w-3 h-3" />
                                        <span>Duplicata</span>
                                      </span>
                                    )}
                                  </div>

                                  {/* Caixa Explicativa da Duplicidade Encontrada */}
                                  {item.isDuplicate && (
                                    <div className="text-[11px] bg-amber-500/10 border border-amber-500/20 rounded-xl px-2.5 py-1.5 text-amber-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5">
                                      <div className="flex items-center gap-1.5">
                                        <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                        <span>
                                          Já cadastrado:{' '}
                                          <strong className="text-white">
                                            {item.matchedExistingTitle || item.title}
                                          </strong>{' '}
                                          ({formatDate(item.matchedExistingDate || item.date)})
                                        </span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleToggleItem(item.id)}
                                        className="text-[10px] font-bold text-amber-400 hover:text-white underline cursor-pointer"
                                      >
                                        {item.selected ? 'Desmarcar' : 'Incluir mesmo assim'}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* 4. Categoria */}
                              <td className="block md:table-cell py-1.5 md:py-2.5 px-0 md:px-3 w-full md:w-36">
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] text-zinc-500 font-medium md:hidden shrink-0">
                                    Categoria:
                                  </span>
                                  <select
                                    value={item.category}
                                    onChange={(e) => handleCategoryChange(item.id, e.target.value)}
                                    className="w-full bg-zinc-800 border border-white/10 rounded-lg px-2 py-1.5 md:py-1 text-zinc-200 text-xs focus:border-emerald-500 focus:outline-none cursor-pointer"
                                  >
                                    {availableCategories.map((cat) => (
                                      <option key={cat} value={cat}>
                                        {cat}
                                      </option>
                                    ))}
                                    {!availableCategories.includes(item.category) && (
                                      <option value={item.category}>{item.category}</option>
                                    )}
                                  </select>
                                </div>
                              </td>

                              {/* 5. Valor com Alternância de Tipo (Receita/Despesa) */}
                              <td className="flex items-center justify-between md:table-cell py-2 md:py-2.5 px-0 md:px-3 text-right font-bold font-mono text-xs border-t border-white/5 md:border-0 pt-2.5 md:pt-2.5">
                                <button
                                  type="button"
                                  onClick={() => handleToggleType(item.id)}
                                  title="Clique para alternar entre Entrada e Saída"
                                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border cursor-pointer transition ${
                                    isIncome
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20'
                                      : 'bg-rose-500/10 text-rose-400 border-rose-500/25 hover:bg-rose-500/20'
                                  }`}
                                >
                                  {isIncome ? 'Entrada (+)' : 'Saída (-)'}
                                </button>
                                <span
                                  className={`ml-2 text-sm md:text-xs ${
                                    isIncome ? 'text-emerald-400' : 'text-rose-400'
                                  }`}
                                >
                                  {isIncome ? '+' : '-'} {formatCurrency(item.amount)}
                                </span>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé de Ações */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-t border-white/10 bg-white/3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition cursor-pointer"
          >
            Cancelar
          </button>

          {parseResult && (
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={isSubmitting || selectedItems.length === 0}
              data-testid="confirm-import-btn"
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-500 text-zinc-950 hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span>Importando...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  <span>Importar {selectedItems.length} Transações</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
