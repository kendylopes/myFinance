import type { TransactionType } from '../models/transaction'

export interface CategoryPrediction {
  category: string
  suggestedType?: TransactionType
}

// Dicionário de termos normalizados para classificação automática
const PREDICTION_RULES: { keywords: string[]; category: string; type?: TransactionType }[] = [
  // Receitas
  {
    category: 'Salário',
    type: 'income',
    keywords: [
      'salario',
      'salário',
      'adiantamento',
      'folha',
      'holerite',
      'quinzena',
      '13',
      'decimo',
      'décimo',
      'plr',
      'comissao',
      'comissão',
    ],
  },
  {
    category: 'Freelance / Bico',
    type: 'income',
    keywords: [
      'freela',
      'freelance',
      'bico',
      'consultoria',
      'diaria',
      'diária',
      'trampo',
      'informal',
      'projeto',
      'prestacao',
      'prestação',
    ],
  },
  {
    category: 'Investimentos',
    type: 'income',
    keywords: [
      'dividendo',
      'dividendos',
      'rendimento',
      'juros',
      'cdb',
      'fii',
      'cripto',
      'bitcoin',
      'lucro',
    ],
  },
  {
    category: 'Presentes / Extras',
    type: 'income',
    keywords: ['presente', 'reembolso', 'pix recebido', 'doacao', 'doação'],
  },

  // Despesas
  {
    category: 'Transporte',
    type: 'expense',
    keywords: [
      'gasolina',
      'posto',
      'combustivel',
      'combustível',
      'etanol',
      'diesel',
      'uber',
      '99',
      'taxi',
      'táxi',
      'metro',
      'metrô',
      'onibus',
      'ônibus',
      'pedagio',
      'pedágio',
      'estacionamento',
      'oficina',
      'pneu',
      'ipva',
      'abastecer',
    ],
  },
  {
    category: 'Alimentação',
    type: 'expense',
    keywords: [
      'mercado',
      'supermercado',
      'acougue',
      'açougue',
      'feira',
      'almoco',
      'almoço',
      'jantar',
      'janta',
      'restaurante',
      'lanche',
      'ifood',
      'burger',
      'pizza',
      'padaria',
      'cafe',
      'café',
      'pao',
      'pão',
      'marmita',
      'churrasco',
      'comida',
      'snack',
      'doce',
    ],
  },
  {
    category: 'Moradia',
    type: 'expense',
    keywords: [
      'aluguel',
      'condominio',
      'condomínio',
      'luz',
      'energia',
      'enel',
      'cpfl',
      'agua',
      'água',
      'sabesp',
      'gas',
      'gás',
      'internet',
      'wifi',
      'iptu',
      'faxina',
      'reforma',
    ],
  },
  {
    category: 'Saúde',
    type: 'expense',
    keywords: [
      'farmacia',
      'farmácia',
      'remedio',
      'remédio',
      'drogaria',
      'consulta',
      'medico',
      'médico',
      'dentista',
      'exame',
      'hospital',
      'convenio',
      'convênio',
      'psicologo',
      'psicólogo',
      'terapia',
      'academia',
    ],
  },
  {
    category: 'Lazer',
    type: 'expense',
    keywords: [
      'cinema',
      'filme',
      'netflix',
      'spotify',
      'show',
      'viagem',
      'hotel',
      'praia',
      'bar',
      'chopp',
      'cerveja',
      'jogo',
      'game',
      'steam',
      'festa',
      'parque',
      'passeio',
    ],
  },
  {
    category: 'Educação',
    type: 'expense',
    keywords: [
      'curso',
      'faculdade',
      'mensalidade',
      'escola',
      'livro',
      'udemy',
      'alura',
      'pos',
      'pós',
      'matricula',
      'matrícula',
      'material',
    ],
  },
  {
    category: 'Compras',
    type: 'expense',
    keywords: [
      'shopping',
      'roupa',
      'calcado',
      'calçado',
      'tenis',
      'tênis',
      'camisa',
      'magazine',
      'amazon',
      'shopee',
      'mercado livre',
      'shein',
      'perfume',
      'eletronico',
      'eletrônico',
    ],
  },
  {
    category: 'Contas Fixas',
    type: 'expense',
    keywords: [
      'boleto',
      'fatura',
      'cartao',
      'cartão',
      'seguro',
      'tarifa',
      'assinatura',
      'anuidade',
    ],
  },
]

/**
 * Normaliza o texto removendo pontuações e acentos para comparação uniforme
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Analisa a descrição digitada e sugere a categoria e tipo mais prováveis.
 * Retorna null se nenhuma regra fizer match.
 */
export function predictCategoryFromDescription(description: string): CategoryPrediction | null {
  if (!description || description.trim().length < 2) {
    return null
  }

  const normalized = normalizeText(description)
  const words = normalized.split(/\s+/)

  // 1. Prioridade para match de termo exato ou palavra completa
  for (const rule of PREDICTION_RULES) {
    for (const kw of rule.keywords) {
      const normKw = normalizeText(kw)
      // Checa se a palavra inteira confere ou se a frase contém o termo
      if (words.includes(normKw) || normalized.includes(normKw)) {
        return {
          category: rule.category,
          suggestedType: rule.type,
        }
      }
    }
  }

  return null
}
