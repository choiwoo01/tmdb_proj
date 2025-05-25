// frontend/src/components/MovieFilter.jsx
import React, { useState, useEffect } from 'react';

// 장르 목록 (TMDB API에서 가져오거나 하드코딩)
const genres = [
  { id: 28, name: '액션' }, { id: 12, name: '모험' }, { id: 16, name: '애니메이션' },
  { id: 35, name: '코미디' }, { id: 80, name: '범죄' }, { id: 99, name: '다큐멘터리' },
  { id: 18, name: '드라마' }, { id: 10751, name: '가족' }, { id: 14, name: '판타지' },
  { id:36, name: '역사' }, { id: 27, name: '공포' }, { id: 10402, name: '음악' },
  { id: 9648, name: '미스터리' }, { id: 10749, name: '로맨스' }, { id: 878, name: 'SF' },
  { id: 10770, name: 'TV 영화' }, { id: 53, name: '스릴러' }, { id: 10752, name: '전쟁' },
  { id: 37, name: '서부' }
];

function MovieFilter({ onApplyFilter }) {
  const [selectedGenre, setSelectedGenre] = useState('');
  const [releaseYear, setReleaseYear] = useState('');
  const [minRating, setMinRating] = useState('');
  const [sortBy, setSortBy] = useState('popularity.desc');

  const handleApply = () => {
    const params = {
      sort_by: sortBy,
      'vote_average.gte': minRating,
      'primary_release_year': releaseYear,
      'with_genres': selectedGenre,
      // 추가 필터 (예: language, adult 등)
      language: 'ko-KR' // 한국어 결과 필터링
    };

    // 값이 없는 파라미터는 제거
    Object.keys(params).forEach(key => {
      if (!params[key]) {
        delete params[key];
      }
    });
    onApplyFilter(params);
  };

  return (
    <div className="movie-filter">
      <h3>영화 필터링</h3>
      <div className="filter-group">
        <label htmlFor="genre-select">장르:</label>
        <select id="genre-select" value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)}>
          <option value="">모든 장르</option>
          {genres.map(genre => (
            <option key={genre.id} value={genre.id}>{genre.name}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="year-input">출시 연도:</label>
        <input
          type="number"
          id="year-input"
          placeholder="예: 2023"
          value={releaseYear}
          onChange={(e) => setReleaseYear(e.target.value)}
        />
      </div>

      <div className="filter-group">
        <label htmlFor="rating-input">최소 평점:</label>
        <input
          type="number"
          id="rating-input"
          min="0"
          max="10"
          step="0.5"
          placeholder="0.0 - 10.0"
          value={minRating}
          onChange={(e) => setMinRating(e.target.value)}
        />
      </div>

      <div className="filter-group">
        <label htmlFor="sort-select">정렬 기준:</label>
        <select id="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="popularity.desc">인기순 (내림차순)</option>
          <option value="popularity.asc">인기순 (오름차순)</option>
          <option value="vote_average.desc">평점순 (내림차순)</option>
          <option value="vote_average.asc">평점순 (오름차순)</option>
          <option value="primary_release_date.desc">최신순</option>
          <option value="primary_release_date.asc">오래된순</option>
        </select>
      </div>

      <button onClick={handleApply}>필터 적용</button>
    </div>
  );
}

export default MovieFilter;