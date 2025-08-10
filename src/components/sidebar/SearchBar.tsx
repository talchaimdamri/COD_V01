/**
 * Search Bar Component (Task 8.5)
 * 
 * Debounced search input with fuzzy search capabilities
 * and advanced search features for sidebar sections.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Search, X, Filter } from 'lucide-react'
import { cn, debounce } from '../../lib/utils'
import { SearchConfig } from '../../../schemas/api/sidebar'

interface SearchBarProps {
  config: SearchConfig
  value?: string
  onChange?: (term: string) => void
  onAdvancedSearch?: (options: any) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
}

export const SearchBar: React.FC<SearchBarProps> = ({
  config,
  value = '',
  onChange,
  onAdvancedSearch,
  placeholder = config.placeholder,
  className,
  autoFocus = false
}) => {
  const [searchTerm, setSearchTerm] = useState(value)
  const [isFocused, setIsFocused] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Load search history from localStorage
  useEffect(() => {
    try {
      const history = localStorage.getItem('sidebar-search-history')
      if (history) {
        setSearchHistory(JSON.parse(history).slice(0, 10)) // Keep last 10 searches
      }
    } catch (error) {
      console.warn('Failed to load search history:', error)
    }
  }, [])
  
  // Save search history to localStorage
  const saveSearchHistory = useCallback((term: string) => {
    if (term.trim() && term.length >= config.minLength) {
      const newHistory = [term, ...searchHistory.filter(h => h !== term)].slice(0, 10)
      setSearchHistory(newHistory)
      
      try {
        localStorage.setItem('sidebar-search-history', JSON.stringify(newHistory))
      } catch (error) {
        console.warn('Failed to save search history:', error)
      }
    }
  }, [searchHistory, config.minLength])
  
  // Debounced search handler
  const debouncedOnChange = useCallback(
    debounce((term: string) => {
      onChange?.(term)
      if (term.trim()) {
        saveSearchHistory(term)
      }
    }, config.debounceMs),
    [onChange, config.debounceMs, saveSearchHistory]
  )
  
  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTerm = e.target.value
    setSearchTerm(newTerm)
    
    if (newTerm.length >= config.minLength || newTerm.length === 0) {
      debouncedOnChange(newTerm)
    }
  }, [debouncedOnChange, config.minLength])
  
  // Handle clear
  const handleClear = useCallback(() => {
    setSearchTerm('')
    onChange?.('')
    inputRef.current?.focus()
  }, [onChange])
  
  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (searchTerm) {
        handleClear()
      } else {
        inputRef.current?.blur()
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (searchTerm.trim()) {
        saveSearchHistory(searchTerm.trim())
        inputRef.current?.blur()
      }
    }
  }, [searchTerm, handleClear, saveSearchHistory])
  
  // Handle history item click
  const handleHistoryClick = useCallback((term: string) => {
    setSearchTerm(term)
    onChange?.(term)
    setIsFocused(false)
  }, [onChange])
  
  // Auto focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])
  
  // Sync external value changes
  useEffect(() => {
    if (value !== searchTerm) {
      setSearchTerm(value)
    }
  }, [value]) // Don't include searchTerm to avoid infinite loop
  
  return (
    <div className={cn('relative', className)}>
      {/* Main Search Input */}
      <div className={cn(
        'relative flex items-center',
        'border border-border rounded-md bg-background',
        'transition-all duration-200',
        {
          'ring-2 ring-primary/30 border-primary/50': isFocused,
          'hover:border-border/80': !isFocused
        }
      )}>
        {/* Search Icon */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <Search size={14} />
        </div>
        
        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 150)} // Delay to allow history clicks
          placeholder={placeholder}
          className={cn(
            'w-full pl-9 pr-9 py-2 text-sm bg-transparent',
            'focus:outline-none placeholder:text-muted-foreground'
          )}
          data-testid="search-input"
        />
        
        {/* Clear Button */}
        {searchTerm && (
          <button
            className={cn(
              'absolute right-8 top-1/2 -translate-y-1/2',
              'text-muted-foreground hover:text-foreground transition-colors'
            )}
            onClick={handleClear}
            aria-label="Clear search"
            data-testid="search-clear"
          >
            <X size={14} />
          </button>
        )}
        
        {/* Advanced Search Toggle */}
        {onAdvancedSearch && (
          <button
            className={cn(
              'absolute right-3 top-1/2 -translate-y-1/2',
              'text-muted-foreground hover:text-foreground transition-colors',
              { 'text-primary': showAdvanced }
            )}
            onClick={() => setShowAdvanced(!showAdvanced)}
            aria-label="Advanced search options"
            data-testid="search-advanced-toggle"
          >
            <Filter size={14} />
          </button>
        )}
      </div>
      
      {/* Search History Dropdown */}
      {isFocused && searchHistory.length > 0 && !searchTerm && (
        <div className={cn(
          'absolute top-full left-0 right-0 mt-1 z-50',
          'bg-popover border border-border rounded-md shadow-lg',
          'py-1 max-h-48 overflow-y-auto'
        )}>
          <div className="px-3 py-1 text-xs text-muted-foreground font-medium border-b border-border">
            Recent Searches
          </div>
          {searchHistory.map((term, index) => (
            <button
              key={index}
              className={cn(
                'w-full px-3 py-2 text-left text-sm',
                'hover:bg-accent transition-colors',
                'flex items-center gap-2'
              )}
              onClick={() => handleHistoryClick(term)}
            >
              <Search size={12} className="text-muted-foreground" />
              <span className="flex-1 truncate">{term}</span>
            </button>
          ))}
          <div className="border-t border-border mt-1 pt-1">
            <button
              className="w-full px-3 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => {
                setSearchHistory([])
                localStorage.removeItem('sidebar-search-history')
              }}
            >
              Clear History
            </button>
          </div>
        </div>
      )}
      
      {/* Advanced Search Panel */}
      {showAdvanced && onAdvancedSearch && (
        <div className={cn(
          'absolute top-full left-0 right-0 mt-1 z-40',
          'bg-popover border border-border rounded-md shadow-lg p-4'
        )}>
          <div className="space-y-3">
            <div className="text-sm font-medium">Advanced Search Options</div>
            
            {/* Search Fields */}
            <div>
              <label className="text-xs text-muted-foreground">Search In:</label>
              <div className="mt-1 space-y-1">
                {config.searchFields.map(field => (
                  <label key={field} className="flex items-center gap-2 text-xs">
                    <input type="checkbox" defaultChecked className="text-primary" />
                    <span className="capitalize">{field.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Search Options */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" defaultChecked={!config.caseSensitive} />
                <span>Case insensitive</span>
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" defaultChecked={config.fuzzySearch} />
                <span>Fuzzy matching</span>
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" defaultChecked={config.highlightMatches} />
                <span>Highlight matches</span>
              </label>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2 pt-2 border-t border-border">
              <button className="flex-1 px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90">
                Apply
              </button>
              <button 
                className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setShowAdvanced(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Search Status */}
      {searchTerm && searchTerm.length < config.minLength && (
        <div className="absolute top-full left-0 right-0 mt-1 px-3 py-2 text-xs text-muted-foreground bg-muted rounded-md">
          Type at least {config.minLength} characters to search
        </div>
      )}
      
      {/* Search Info */}
      {config.maxResults && (
        <div className="mt-1 text-xs text-muted-foreground">
          Showing up to {config.maxResults} results
        </div>
      )}
    </div>
  )
}

export default SearchBar