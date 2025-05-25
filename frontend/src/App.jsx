// frontend/src/App.jsx

import React, { useState, useEffect, useCallback } from 'react';
// react-router-dom 관련 임포트 완전히 제거 (이제 사용하지 않음)

import SearchBar from './components/SearchBar';
import MovieCard from './components/MovieCard';
import MovieDetail from './components/MovieDetail';
import FavoriteMovies from './components/FavoriteMovies'; // 찜 목록
import RecentMovies from './components/RecentMovies';     // 최근 본 영화
import MovieFilter from './components/MovieFilter';       // 고급 필터
import './components/styles.css';

function App() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMovieId, setSelectedMovieId] = useState(null); // 영화 상세 페이지 표시 여부
  const [currentView, setCurrentView] = useState('home'); // 'home', 'favorites', 'recent'

  // API 기본 경로 설정 - 이제 App.jsx에서 직접 관리
  const API_BASE_PATH = 'https://backend-api-eta-jet.vercel.app/api';

  /**
   * TMDB API를 호출하는 범용 헬퍼 함수 (App.jsx 내부로 이동)
   * @param {string} endpoint tmdb 뒤에 붙을 엔드포인트 (예: 'tmdb?type=popular')
   * @param {object} options fetch API에 전달할 추가 옵션 (headers, method 등)
   * @returns {Promise<any>} API 응답 데이터
   * @throws {Error} API 호출 실패 시 에러 발생
   */
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
  }, [API_BASE_PATH]); // API_BASE_PATH가 변경될 일이 없으므로 안정적

  // 인기 영화 또는 필터링된 영화 불러오기
  const fetchMovies = useCallback(async (filterParams = {}) => {
    setLoading(true);
    setError(null);
    try {
      const queryString = new URLSearchParams({
        type: 'discover', // TMDB discover 엔드포인트 사용
        ...filterParams,
      }).toString();
      const data = await fetchApi(`tmdb?${queryString}`); // App.jsx 내부 fetchApi 사용
      setMovies(data);
    } catch (err) {
      console.error("Error fetching movies:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchApi]);

  useEffect(() => {
    // 초기 로드 시 인기 영화 불러오기 (home 뷰일 때만)
    if (currentView === 'home') {
      fetchMovies();
    }
  }, [fetchMovies, currentView]);

  const handleSearch = async (query) => {
    setCurrentView('home'); // 검색 시 홈 뷰로 전환
    setSelectedMovieId(null); // 상세 보기 해제
    setLoading(true);
    setError(null);
    try {
      const data = await fetchApi(`tmdb?type=search&query=${encodeURIComponent(query)}`); // App.jsx 내부 fetchApi 사용
      setMovies(data);
      localStorage.setItem('lastSearchQuery', query);
    } catch (err) {
      console.error("Error searching movies:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMovieClick = (id) => {
    setSelectedMovieId(id); // 선택된 영화 ID 설정하여 MovieDetail 렌더링
    
    // 최근 본 영화 저장 로직
    const recent = JSON.parse(localStorage.getItem('recentMovies') || '[]');
    let updatedRecent = recent.filter(item => item.id !== id); // 기존 항목 제거
    updatedRecent.unshift({ id: id, timestamp: Date.now() }); // 맨 앞에 새 항목 추가

    const MAX_RECENT_MOVIES = 10; // 최대 10개만 유지
    if (updatedRecent.length > MAX_RECENT_MOVIES) {
        updatedRecent = updatedRecent.slice(0, MAX_RECENT_MOVIES);
    }
    localStorage.setItem('recentMovies', JSON.stringify(updatedRecent));
  };

  const handleBackToList = () => {
    setSelectedMovieId(null); // 상세 보기 해제
    // 이전에 어떤 뷰였는지에 따라 해당 뷰의 상태를 유지하거나 기본 뷰로 돌아감
    if (currentView === 'home') {
      fetchMovies(); // 홈으로 돌아가서 인기 영화를 다시 로드
    }
    // favorites나 recent 뷰에서 돌아왔다면 해당 뷰를 유지 (추가 로직 필요 없음)
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
          <button onClick={() => { setCurrentView('home'); setSelectedMovieId(null); fetchMovies(); }}>홈</button>
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
                  !loading && !error && <p>검색 결과 또는 필터링된 영화가 없습니다.</p>
                )}
              </div>
            </>
          )}
          {currentView === 'favorites' && <FavoriteMovies fetchApi={fetchApi} />}
          {currentView === 'recent' && <RecentMovies fetchApi={fetchApi} />}
        </>
      )}
    </div>
  );
}

export default App;