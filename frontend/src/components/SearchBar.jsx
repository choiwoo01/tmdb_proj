// frontend/src/components/SearchBar.jsx

import React, { useState } from 'react';

function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="영화 또는 TV 쇼 검색..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button type="submit">검색</button>
    </form>
  );
}

export default SearchBar;