import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FilterOption {
  label: string;
  value: string;
}

interface DataTableFilterProps {
  onSearch: (value: string) => void;
  onFilterChange?: (value: string) => void;
  filterPlaceholder?: string;
  filterOptions?: FilterOption[];
  searchPlaceholder?: string;
}

export function DataTableFilter({ 
  onSearch, 
  onFilterChange, 
  filterPlaceholder = "Filtrar por...", 
  filterOptions = [],
  searchPlaceholder = "Buscar..."
}: DataTableFilterProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <Input 
          className="pl-10 bg-white" 
          placeholder={searchPlaceholder}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      
      {onFilterChange && filterOptions.length > 0 && (
        <div className="w-full md:w-48">
          <Select onValueChange={onFilterChange}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder={filterPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {filterOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
