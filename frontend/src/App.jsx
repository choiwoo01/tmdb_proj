// frontend/src/App.jsx

import React, { useState, useEffect } from 'react';
import SearchBar from './components/SearchBar';
import MovieCard from './components/MovieCard';
import MovieDetail from './components/MovieDetail';
import './components/styles.css'; // 공통 스타일 시트

function App() {
  const [movies, setMovies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMovieId, setSelectedMovieId] = useState(null);

  // 로컬 개발 시에는 '/api', 배포 시에는 Nginx 프록시를 통해 같은 도메인으로
  const API_BASE_PATH = 'https://backend-api-eta-jet.vercel.app/api';

  // 인기 영화 불러오기
  useEffect(() => {
    const fetchPopularMovies = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_PATH}/tmdb?type=popular`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch popular movies');
        }
        setMovies(data);
      } catch (err) {
        console.error("Error fetching popular movies:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPopularMovies();
  }, []);

  const handleSearch = async (query) => {
    setSearchTerm(query);
    setSelectedMovieId(null); // 검색 시 상세 보기 해제
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_PATH}/tmdb?type=search&query=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to search movies');
      }
      setMovies(data);
      // LocalStorage에 최근 검색어 저장 (가산점 3)
      localStorage.setItem('lastSearchQuery', query);
    } catch (err) {
      console.error("Error searching movies:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMovieClick = (id) => {
    setSelectedMovieId(id);
  };

  const handleBackToList = () => {
    setSelectedMovieId(null);
    // 검색어가 있다면 검색 결과 유지, 없으면 인기 영화 다시 로드
    if (searchTerm) {
      handleSearch(searchTerm);
    } else {
      // popular movies를 다시 fetch하는 로직 (useEffect의 내용을 함수로 분리하는 것이 좋음)
      window.location.reload(); // 간단하게 페이지 새로고침
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>TMDB Insight</h1>
        <SearchBar onSearch={handleSearch} />
      </header>
      
      {loading && <p className="loading-message">로딩 중...</p>}
      {error && <p className="error-message">오류: {error}</p>}

      {selectedMovieId ? (
        <MovieDetail movieId={selectedMovieId} onBack={handleBackToList} apiBasePath={API_BASE_PATH} />
      ) : (
        <div className="movie-grid">
          {movies.length > 0 ? (
            movies.map(movie => (
              <MovieCard key={movie.id} movie={movie} onClick={handleMovieClick} />
            ))
          ) : (
            !loading && !error && <p>검색 결과 또는 인기 영화가 없습니다.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;