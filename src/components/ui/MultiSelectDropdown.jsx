import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';

export const MultiSelectDropdown = ({ 
  options, 
  selected, 
  onChange, 
  placeholder = "Select options...",
  label = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOption = (value) => {
    const newSelected = selected.includes(value)
      ? selected.filter(item => item !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  const removeOption = (e, value) => {
    e.stopPropagation();
    onChange(selected.filter(item => item !== value));
  };

  const toggleSelectAll = () => {
    if (selected.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map(o => o.value));
    }
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      
      <div 
        className="min-h-[40px] w-full border border-gray-300 rounded-md bg-white px-3 py-1.5 flex items-center justify-between cursor-pointer focus-within:ring-2 focus-within:ring-orange-600 focus-within:border-transparent"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1 flex-1">
          {selected.length === 0 ? (
            <span className="text-gray-400 text-sm">{placeholder}</span>
          ) : (
            selected.map(value => {
              const option = options.find(o => o.value === value);
              return option ? (
                <span 
                  key={value} 
                  className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-md flex items-center gap-1"
                >
                  {option.label}
                  <button 
                    onClick={(e) => removeOption(e, value)}
                    className="hover:bg-orange-200 rounded-full p-0.5 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              ) : null;
            })
          )}
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          {selected.length > 0 && (
            <button 
              onClick={(e) => { e.stopPropagation(); onChange([]); }}
              className="hover:text-gray-600 p-1"
            >
              <X size={16} />
            </button>
          )}
          <ChevronsUpDown size={16} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-gray-100">
            <input 
              type="text" 
              className="w-full text-sm outline-none px-2 py-1 border-b border-transparent focus:border-orange-200"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          <div className="flex justify-between px-3 py-2 border-b border-gray-100 bg-gray-50 text-xs">
            <button 
              type="button" 
              onClick={toggleSelectAll}
              className="text-orange-600 hover:text-orange-700 font-medium"
            >
              {selected.length === options.length ? 'Clear All' : 'Select All'}
            </button>
            <span className="text-gray-500">{selected.length} selected</span>
          </div>

          <div className="overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="p-2 text-sm text-gray-500 text-center">No options found.</div>
            ) : (
              filteredOptions.map(option => {
                const isSelected = selected.includes(option.value);
                return (
                  <div
                    key={option.value}
                    onClick={() => toggleOption(option.value)}
                    className={`flex items-center px-2 py-2 text-sm cursor-pointer rounded-sm hover:bg-orange-50 ${isSelected ? 'bg-orange-50/50' : ''}`}
                  >
                    <div className={`w-4 h-4 rounded border mr-2 flex items-center justify-center ${isSelected ? 'bg-orange-600 border-orange-600 text-white' : 'border-gray-300'}`}>
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                    <span className="flex-1">{option.label}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
