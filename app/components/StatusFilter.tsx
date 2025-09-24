'use client'

import React from 'react'

interface StatusFilterProps {
  selectedFilter: 'New' | 'Migrating' | 'Migrated'
  onFilterChange: (filter: 'New' | 'Migrating' | 'Migrated') => void
  counts?: {
    new: number
    migrating: number
    migrated: number
  }
}

const StatusFilter: React.FC<StatusFilterProps> = ({ 
  selectedFilter, 
  onFilterChange, 
  counts 
}) => {
  const filters = [
    { 
      key: 'New' as const, 
      label: 'New', 
      count: counts?.new || 0,
      color: 'text-green-400 border-green-500 hover:border-green-400'
    },
    { 
      key: 'Migrating' as const, 
      label: 'Migrating', 
      count: counts?.migrating || 0,
      color: 'text-yellow-400 border-yellow-500 hover:border-yellow-400'
    },
    { 
      key: 'Migrated' as const, 
      label: 'Migrated', 
      count: counts?.migrated || 0,
      color: 'text-blue-400 border-blue-500 hover:border-blue-400'
    }
  ]

  // Commented out unused function
  // const getSelectedStyle = (filterKey: string) => {
  //   if (selectedFilter === filterKey) {
  //     switch (filterKey) {
  //       case 'New':
  //         return 'bg-green-500/20 border-green-400 text-green-300'
  //       case 'Migrating':
  //         return 'bg-yellow-500/20 border-yellow-400 text-yellow-300'
  //       case 'Migrated':
  //         return 'bg-blue-500/20 border-blue-400 text-blue-300'
  //       default:
  //         return 'bg-gray-600/20 border-gray-400 text-gray-300'
  //     }
  //   }
  //   return ''
  // }

  return (
    <div className="flex gap-2 mb-4">
      {filters.map((filter) => (
        <button
          key={filter.key}
          onClick={() => onFilterChange(filter.key)}
          className={`
            px-3 py-1 rounded text-sm font-medium transition-colors
            ${selectedFilter === filter.key 
              ? filter.key === 'New' ? 'bg-green-500 text-white' :
                filter.key === 'Migrating' ? 'bg-yellow-500 text-white' :
                'bg-blue-500 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }
          `}
        >
          {filter.label}
          {counts && (
            <span className="ml-1 text-xs">
              ({filter.count})
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

export default StatusFilter
