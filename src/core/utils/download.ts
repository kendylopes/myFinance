/**
 * Executa o download de um arquivo gerado em memória no navegador.
 */
export const downloadBlob = (
  content: string,
  filename: string,
  mimeType = 'text/csv;charset=utf-8;',
): void => {
  if (typeof window === 'undefined' || !window.document) return

  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/**
 * Abre uma janela dedicada com o extrato formatado e aciona o diálogo nativo de impressão/PDF.
 */
export const openPrintWindow = (htmlContent: string): void => {
  if (typeof window === 'undefined') return

  const printWindow = window.open('', '_blank', 'width=850,height=900')
  if (!printWindow) {
    // Fallback: caso popups estejam bloqueados
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow?.document
    if (doc) {
      doc.open()
      doc.write(htmlContent)
      doc.close()
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    }
    setTimeout(() => {
      document.body.removeChild(iframe)
    }, 2000)
    return
  }

  printWindow.document.open()
  printWindow.document.write(htmlContent)
  printWindow.document.close()

  // Aguarda carregamento de estilos e dispara a impressão
  setTimeout(() => {
    printWindow.focus()
    printWindow.print()
  }, 300)
}
