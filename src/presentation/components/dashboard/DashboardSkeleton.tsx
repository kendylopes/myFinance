import { Skeleton } from '../common/Skeleton'

export function DashboardSkeleton() {
  return (
    <div data-testid="dashboard-skeleton" className="space-y-6 animate-fade-in" aria-busy="true">
      {/* 1. Skeletons dos SummaryCards (3 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="glass-card p-6 rounded-3xl border border-white/5 space-y-4 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <Skeleton width={110} height={16} />
              <Skeleton variant="circular" width={36} height={36} />
            </div>
            <Skeleton width="65%" height={36} className="rounded-xl" />
            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
              <Skeleton width={80} height={14} />
              <Skeleton width={60} height={14} />
            </div>
          </div>
        ))}
      </div>

      {/* 2. Skeletons dos Insights Inteligentes */}
      <div className="glass-card p-5 rounded-3xl border border-white/5 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" width={28} height={28} />
          <Skeleton width={180} height={20} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <Skeleton height={56} className="w-full" />
          <Skeleton height={56} className="w-full" />
        </div>
      </div>

      {/* 3. Skeleton do Gráfico de Fluxo Semestral */}
      <div className="glass-card p-6 rounded-3xl border border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton width={200} height={22} />
          <div className="flex items-center gap-2">
            <Skeleton width={70} height={16} />
            <Skeleton width={70} height={16} />
          </div>
        </div>
        <Skeleton height={220} className="w-full rounded-2xl" />
      </div>

      {/* 4. Grid Inferior: Categorias e Transações Recentes */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Skeleton Gráfico Categorias */}
        <div className="glass-card p-6 rounded-3xl border border-white/5 space-y-4">
          <Skeleton width={160} height={20} />
          <div className="flex items-center justify-center py-6">
            <Skeleton variant="circular" width={180} height={180} />
          </div>
          <div className="space-y-2 pt-2">
            <Skeleton height={20} className="w-full" />
            <Skeleton height={20} className="w-full" />
          </div>
        </div>

        {/* Skeleton Transações Recentes */}
        <div className="glass-card p-6 rounded-3xl border border-white/5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <Skeleton width={170} height={22} />
            <Skeleton width={80} height={18} />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-white/5"
              >
                <div className="flex items-center gap-3">
                  <Skeleton variant="circular" width={34} height={34} />
                  <div className="space-y-1.5">
                    <Skeleton width={120} height={16} />
                    <Skeleton width={80} height={12} />
                  </div>
                </div>
                <Skeleton width={70} height={18} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
