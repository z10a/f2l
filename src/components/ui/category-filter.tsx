'use client';

import { useState } from 'react';
import { ChevronLeft, Search, X, Filter } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  count: number;
}

interface CategoryFilterProps {
  categories: Category[];
  selectedCategories: string[];
  onCategoryToggle: (categoryId: string) => void;
}

export function CategoryFilter({ categories, selectedCategories, onCategoryToggle }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center overflow-x-auto py-4">
      {/* Filter Button */}
      <button
        onClick={() => onCategoryToggle('all')}
        className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 ${
          selectedCategories.includes('all') 
            ? 'bg-green-600 text-white border-green-500 shadow-lg' 
            : 'bg-white dark:bg-slate-800 dark:border-slate-700 text-slate-700 hover:bg-slate-50'
        }`}
      >
        <Filter className="w-5 h-5 text-slate-600" />
        <span className="font-medium">{categories.reduce((sum, cat) => cat.id === 'all' ? sum - 1 : cat.count)}</span>
      </button>
      
      {/* Category Chips */}
      <div className="flex gap-2 overflow-x-auto max-w-full">
        <button
        onClick={() => onCategoryToggle('all')}
        className={`flex-1 items-center gap-2 px-3 py-2 rounded-xl border-2 ${
          selectedCategories.includes('all') 
            ? 'bg-white dark:bg-slate-800 border-green-500 shadow-lg' 
            : 'bg-transparent dark:border-slate-700 text-slate-700 hover:bg-slate-800'
        }`}
      >
        <Filter className="w-5 h-5 text-slate-600" />
        <span className="font-medium">الكل الأنواعطة</span>
      </button>

      {categories
        .filter(cat => cat.id !== 'all')
          .map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryToggle(category.id)}
              className={`flex-1 items-center gap-2 px-3 py-2 rounded-xl border-2 ${
                selectedCategories.includes(category.id) 
                  ? 'bg-white dark:bg-slate-800 border-green-500 shadow-lg' 
                  : 'bg-transparent dark:border-sate-700 text-slate-700 hover:bg-slate-800'
              }`}
            >
              <Filter className="w-5 h-5 text-slate-600" />
              <span className="font-medium">{category.name}</span>
              {category.count > 0 && (
                <span className="ml-2 text-slate-400">
                  <span className="text-xs">({category.count})</span>
                )}
              </button>
          ))}
        ))}
      </div>
    </div>
  );
}