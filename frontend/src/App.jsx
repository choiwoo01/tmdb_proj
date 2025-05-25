// frontend/src/App.jsx

import React, { useState, useEffect, useCallback } from 'react';
import SearchBar from './components/SearchBar';
import MovieCard from './components/MovieCard';
import MovieDetail from './components/MovieDetail';
import FavoriteMovies from './components/FavoriteMovies'; // 찜 목록
import RecentMovies from './components/RecentMovies';     // 최근 본 영화
import MovieFilter from './components/MovieFilter';       // 고급 필터
import './components/styles.css';

function App() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMovieId, setSelectedMovieId] = useState(null); // 영화 상세 페이지 표시 여부
  const [currentView, setCurrentView] = useState('home'); // 'home', 'favorites', 'recent'
  const [lastHomeFilter, setLastHomeFilter] = useState({}); // 홈 뷰의 마지막 필터 상태 저장

  const API_BASE_PATH = '/api';

  const fetchApi = useCallback(async (endpoint, options = {}) => {
    const url = `${API_BASE_PATH}/${endpoint}`;

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || response.statusText || `API request failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error(`Error fetching from ${url}:`, error);
      throw error;
    }
  }, [API_BASE_PATH]);

  // 홈 뷰의 영화 목록을 불러오는 함수
  const fetchMovies = useCallback(async (filterParams = {}) => {
    setLoading(true);
    setError(null);
    try {
      const queryString = new URLSearchParams({
        type: 'discover', // TMDB discover 엔드포인트 사용
        ...filterParams,
      }).toString();
      const data = await fetchApi(`tmdb?${queryString}`);
      setMovies(data);
      setLastHomeFilter(filterParams); // 마지막 필터 상태 저장
    } catch (err) {
      console.error("Error fetching movies:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchApi]);

  // 초기 로드 시 인기 영화 불러오기 (home 뷰일 때만)
  useEffect(() => {
    if (currentView === 'home' && !selectedMovieId) {
      // home으로 돌아왔을 때, 이전에 적용된 필터로 다시 로드
      fetchMovies(lastHomeFilter); 
    }
  }, [fetchMovies, currentView, selectedMovieId, lastHomeFilter]);

  // 검색 처리
  const handleSearch = async (query) => {
    setCurrentView('home'); // 검색 시 홈 뷰로 전환
    setSelectedMovieId(null); // 상세 보기 해제
    setLoading(true);
    setError(null);
    try {
      const data = await fetchApi(`tmdb?type=search&query=${encodeURIComponent(query)}`);
      setMovies(data);
      localStorage.setItem('lastSearchQuery', query);
      setLastHomeFilter({}); // 검색 시 필터 초기화
    } catch (err) {
      console.error("Error searching movies:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 영화 카드 클릭 시 상세 페이지로 이동
  const handleMovieClick = (id) => {
    setSelectedMovieId(id); // 선택된 영화 ID 설정하여 MovieDetail 렌더링
  };

  // 최근 본 영화 저장 로직 (selectedMovieId가 변경될 때만 실행)
  useEffect(() => {
    if (selectedMovieId) {
      const recent = JSON.parse(localStorage.getItem('recentMovies') || '[]');
      let updatedRecent = recent.filter(item => item.id !== selectedMovieId); // 기존 항목 제거
      updatedRecent.unshift({ id: selectedMovieId, timestamp: Date.now() }); // 맨 앞에 새 항목 추가

      const MAX_RECENT_MOVIES = 20; // 최대 20개만 유지 (필요에 따라 조절)
      if (updatedRecent.length > MAX_RECENT_MOVIES) {
          updatedRecent = updatedRecent.slice(0, MAX_RECENT_MOVIES);
      }
      localStorage.setItem('recentMovies', JSON.stringify(updatedRecent));
    }
  }, [selectedMovieId]);

  // 상세 페이지에서 목록으로 돌아가기
  const handleBackToList = () => {
    setSelectedMovieId(null); // 상세 보기 해제
    // currentView는 이미 설정되어 있으므로 별도의 setCurrentView 호출 필요 없음
  };

  // MovieFilter에서 필터 적용 시 호출될 함수
  const handleApplyFilter = async (filterParams) => {
    setCurrentView('home'); // 필터 적용 시 홈 뷰로 전환
    setSelectedMovieId(null); // 상세 보기 해제
    await fetchMovies(filterParams); // 필터 파라미터로 영화 불러오기
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>TMDB Insight</h1>
        <SearchBar onSearch={handleSearch} />
        <nav className="main-nav">
          <button onClick={() => { setCurrentView('home'); setSelectedMovieId(null); }}>홈</button>
          <button onClick={() => { setCurrentView('favorites'); setSelectedMovieId(null); }}>찜 목록</button>
          <button onClick={() => { setCurrentView('recent'); setSelectedMovieId(null); }}>최근 본 영화</button>
        </nav>
      </header>
      
      {loading && <p className="loading-message">로딩 중...</p>}
      {error && <p className="error-message">오류: {error}</p>}

      {/* 조건부 렌더링 */}
      {selectedMovieId ? (
        // MovieDetail에 movieId를 prop으로 전달
        <MovieDetail movieId={selectedMovieId} onBack={handleBackToList} fetchApi={fetchApi} />
      ) : (
        <>
          {currentView === 'home' && (
            <>
              <MovieFilter onApplyFilter={handleApplyFilter} />
              <div className="movie-grid">
                {movies.length > 0 ? (
                  movies.map(movie => (
                    <MovieCard key={movie.id} movie={movie} onClick={() => handleMovieClick(movie.id)} />
                  ))
                ) : (
                  !loading && !error && <p className="no-items">검색 결과 또는 필터링된 영화가 없습니다.</p>
                )}
              </div>
            </>
          )}
          {currentView === 'favorites' && (
            // FavoriteMovies에 onMovieClick prop 전달
            <FavoriteMovies fetchApi={fetchApi} onMovieClick={handleMovieClick} />
          )}
          {currentView === 'recent' && (
            // RecentMovies에 onMovieClick prop 전달
            <RecentMovies fetchApi={fetchApi} onMovieClick={handleMovieClick} />
          )}
        </>
      )}
    </div>
  );
}

export default App;