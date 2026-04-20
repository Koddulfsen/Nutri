'use client';

interface ControlsBarProps {
  onSortChange: (sortBy: string) => void;
  onFilterChange: (filter: string) => void;
  onSearchChange: (query: string) => void;
}

export default function ControlsBar({
  onSortChange,
  onFilterChange,
  onSearchChange
}: ControlsBarProps) {
  return (
    <section className="controls-bar" aria-label="Filter and sort controls">
      <div className="control-group">
        <label className="control-label" htmlFor="sort-select">
          Sort:
        </label>
        <select
          id="sort-select"
          className="dropdown"
          onChange={(e) => onSortChange(e.target.value)}
          defaultValue="rda-desc"
        >
          <option value="rda-desc">RDA % (High to Low)</option>
          <option value="rda-asc">RDA % (Low to High)</option>
          <option value="name-asc">Name (A-Z)</option>
          <option value="amount-desc">Amount (High to Low)</option>
        </select>
      </div>

      <div className="control-group">
        <label className="control-label" htmlFor="filter-select">
          Filter:
        </label>
        <select
          id="filter-select"
          className="dropdown"
          onChange={(e) => onFilterChange(e.target.value)}
          defaultValue="all"
        >
          <option value="all">All Compounds</option>
          <option value="below-rda">Below RDA</option>
          <option value="optimal">Optimal</option>
          <option value="above-rda">Above RDA</option>
        </select>
      </div>

      <div className="control-group">
        <label className="control-label" htmlFor="search-compound">
          Search:
        </label>
        <input
          type="text"
          id="search-compound"
          className="search-input"
          placeholder="Search compounds..."
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </section>
  );
}
