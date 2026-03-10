import { useState } from 'react';

const FilterSection = ({
  searchQuery, setSearchQuery,
  selectedCategory, setSelectedCategory,
  selectedType, setSelectedType,
  categories,
  hasActiveFilters,
  onClearFilters,
}) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="filter-section">
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search transactions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`filter-btn ${hasActiveFilters ? 'active' : ''}`}
        >
          <i className="bi bi-funnel"></i> Filters
        </button>
      </div>

      {showFilters && (
        <div className="filter-panel">
          <div className="filter-group">
            <label className="filter-label">Type</label>
            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="filter-select">
              <option value="all">All Types</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Category</label>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="filter-select">
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button onClick={onClearFilters} className="clear-btn">Clear Filters</button>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterSection;


