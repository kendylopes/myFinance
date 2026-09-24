import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

export type ThemeId = 'emerald' | 'dracula' | 'tokyo-night' | 'catppuccin' | 'one-dark' | 'light'

export interface ThemeConfig {
  id: ThemeId
  name: string
  description: string
  tag: string
  primaryColor: string
  accentColor: string
  bgColor: string
  previewColors: string[]
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  emerald: {
    id: 'emerald',
    name: 'Emerald Matrix',
    description: 'Cyberpunk neon, verde esmeralda e carvão profundo',
    tag: 'Padrão myFinance',
    primaryColor: '#10b981',
    accentColor: '#34d399',
    bgColor: '#0f1013',
    previewColors: ['#0f1013', '#18181b', '#10b981', '#34d399'],
  },
  dracula: {
    id: 'dracula',
    name: 'Dracula Official',
    description: 'O lendário tema de Zeno Rocha com violeta, rosa e verde',
    tag: 'Clássico Dev',
    primaryColor: '#bd93f9',
    accentColor: '#ff79c6',
    bgColor: '#282a36',
    previewColors: ['#282a36', '#44475a', '#bd93f9', '#50fa7b', '#ff79c6'],
  },
  'tokyo-night': {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    description: 'A estética noturna favorita de usuários Neovim e VS Code',
    tag: 'Alta Produtividade',
    primaryColor: '#7aa2f7',
    accentColor: '#bb9af7',
    bgColor: '#1a1b26',
    previewColors: ['#1a1b26', '#24283b', '#7aa2f7', '#7dcfff', '#bb9af7'],
  },
  catppuccin: {
    id: 'catppuccin',
    name: 'Catppuccin Mocha',
    description: 'Tons pastéis aconchegantes com lavanda, menta e mauve',
    tag: 'Comunidade OSS',
    primaryColor: '#cba6f7',
    accentColor: '#f5c2e7',
    bgColor: '#1e1e2e',
    previewColors: ['#1e1e2e', '#313244', '#cba6f7', '#a6e3a1', '#89b4fa'],
  },
  'one-dark': {
    id: 'one-dark',
    name: 'One Dark Pro',
    description: 'O esquema de cores consagrado do Atom com azul cobalto e sálvia',
    tag: 'Atom & JetBrains',
    primaryColor: '#61afef',
    accentColor: '#98c379',
    bgColor: '#21252b',
    previewColors: ['#21252b', '#282c34', '#61afef', '#98c379', '#e5c07b'],
  },
  light: {
    id: 'light',
    name: 'Branco Normal',
    description: 'Modo claro moderno e limpo com alta legibilidade e acabamento refinado',
    tag: 'Modo Claro',
    primaryColor: '#059669',
    accentColor: '#2563eb',
    bgColor: '#f8fafc',
    previewColors: ['#ffffff', '#f1f5f9', '#059669', '#0f172a'],
  },
}

// 5 temas de desenvolvedor originais
export const DEV_THEME_IDS: ThemeId[] = [
  'emerald',
  'dracula',
  'tokyo-night',
  'catppuccin',
  'one-dark',
]

interface ThemeContextType {
  currentTheme: ThemeConfig
  setTheme: (id: ThemeId) => void
  availableThemes: ThemeConfig[]
  allThemes: ThemeConfig[]
  isDarkMode: boolean
  themeMode: 'dark' | 'light'
  setThemeMode: (mode: 'dark' | 'light') => void
}

const STORAGE_KEY = 'myfinance_dev_theme'
const LAST_DARK_THEME_KEY = 'myfinance_last_dark_theme'

const ThemeContext = createContext<ThemeContextType | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemeId | null
      if (stored && THEMES[stored]) {
        return stored
      }
    } catch {
      // Ignora erro em ambientes sem localStorage
    }
    return 'emerald'
  })

  const currentTheme = useMemo(() => THEMES[themeId] || THEMES.emerald, [themeId])
  const isDarkMode = themeId !== 'light'
  const themeMode: 'dark' | 'light' = isDarkMode ? 'dark' : 'light'

  const setTheme = useCallback((id: ThemeId) => {
    if (THEMES[id]) {
      setThemeId(id)
      try {
        localStorage.setItem(STORAGE_KEY, id)
        if (id !== 'light') {
          localStorage.setItem(LAST_DARK_THEME_KEY, id)
        }
      } catch {
        // Ignora erro
      }
    }
  }, [])

  const setThemeMode = useCallback(
    (mode: 'dark' | 'light') => {
      if (mode === 'light') {
        setTheme('light')
      } else {
        try {
          const lastDark = (localStorage.getItem(LAST_DARK_THEME_KEY) as ThemeId) || 'emerald'
          setTheme(THEMES[lastDark] && lastDark !== 'light' ? lastDark : 'emerald')
        } catch {
          setTheme('emerald')
        }
      }
    },
    [setTheme],
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeId)
  }, [themeId])

  const value = useMemo(
    () => ({
      currentTheme,
      setTheme,
      // availableThemes preserva exatamente os 5 temas dev esperados pela suíte de testes
      availableThemes: DEV_THEME_IDS.map((id) => THEMES[id]),
      allThemes: Object.values(THEMES),
      isDarkMode,
      themeMode,
      setThemeMode,
    }),
    [currentTheme, setTheme, isDarkMode, themeMode, setThemeMode],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme deve ser utilizado dentro de um <ThemeProvider />')
  }
  return context
}
