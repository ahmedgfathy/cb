import { useState } from 'react'
import { useI18n } from '../i18n'

export default function Pagination({ 
  total, 
  page, 
  perPage, 
  onPageChange, 
  onPerPageChange,
  perPageOptions = [10, 25, 50, 100]
}) {
  const { t } = useI18n()
  const [jumpTo, setJumpTo] = useState('')
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = total === 0 ? 0 : (safePage - 1) * perPage + 1
  const end = Math.min(safePage * perPage, total)

  function handleJump() {
    const p = parseInt(jumpTo, 10)
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      onPageChange(p)
      setJumpTo('')
    }
  }

  // Generate page numbers to display
  function getPageNumbers() {
    const pages = []
    const maxVisible = 7 // max page buttons to show

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
      return pages
    }

    // Always show first page
    pages.push(1)

    if (safePage > 3) {
      pages.push('...')
    }

    // Show pages around current
    const startPage = Math.max(2, safePage - 1)
    const endPage = Math.min(totalPages - 1, safePage + 1)
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    if (safePage < totalPages - 2) {
      pages.push('...')
    }

    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages)
    }

    return pages
  }

  if (total === 0) return null

  return (
    <div className="pagination-wrap">
      <div className="pagination-info">
        <span>{t('showingXtoYofZ', { start, end, total })}</span>
      </div>
      
      <div className="pagination-controls">
        {/* Per page selector */}
        <div className="pagination-perpage">
          <label>{t('showing')}</label>
          <select 
            value={perPage} 
            onChange={(e) => onPerPageChange(parseInt(e.target.value, 10))}
            className="pagination-select"
          >
            {perPageOptions.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <label>{t('perPage')}</label>
        </div>

        {/* Page buttons */}
        <div className="pagination-buttons">
          <button 
            className="pagination-btn" 
            onClick={() => onPageChange(1)} 
            disabled={safePage === 1}
            title="First page"
          >
            <span className="material-icons" style={{ fontSize: '18px' }}>first_page</span>
          </button>
          <button 
            className="pagination-btn" 
            onClick={() => onPageChange(safePage - 1)} 
            disabled={safePage === 1}
            title="Previous page"
          >
            <span className="material-icons" style={{ fontSize: '18px' }}>chevron_left</span>
          </button>

          {getPageNumbers().map((p, i) => 
            p === '...' ? (
              <span key={`dots-${i}`} className="pagination-dots">...</span>
            ) : (
              <button
                key={p}
                className={`pagination-btn ${p === safePage ? 'active' : ''}`}
                onClick={() => onPageChange(p)}
              >
                {p}
              </button>
            )
          )}

          <button 
            className="pagination-btn" 
            onClick={() => onPageChange(safePage + 1)} 
            disabled={safePage === totalPages}
            title="Next page"
          >
            <span className="material-icons" style={{ fontSize: '18px' }}>chevron_right</span>
          </button>
          <button 
            className="pagination-btn" 
            onClick={() => onPageChange(totalPages)} 
            disabled={safePage === totalPages}
            title="Last page"
          >
            <span className="material-icons" style={{ fontSize: '18px' }}>last_page</span>
          </button>
        </div>

        {/* Jump to page */}
        <div className="pagination-jump">
          <label>{t('goTo')}</label>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={jumpTo}
            onChange={(e) => setJumpTo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJump()}
            placeholder="#"
            className="pagination-jump-input"
          />
          <button className="pagination-btn pagination-jump-btn" onClick={handleJump}>
            <span className="material-icons" style={{ fontSize: '16px' }}>arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  )
}
