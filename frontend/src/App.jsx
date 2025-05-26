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
  const [currentSearchQuery, setCurrentSearchQuery] = useState(''); // 현재 검색 쿼리 저장

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

  // 홈 뷰의 영화 목록을 불러오는 함수 (필터링된 영화 또는 인기 영화)
  const fetchHomeMovies = useCallback(async (filterParams = {}) => {
    setLoading(true);
    setError(null);
    try {
      const queryString = new URLSearchParams({
        type: 'discover', // TMDB discover 엔드포인트 사용
        ...filterParams,
      }).toString();
      const data = await fetchApi(`tmdb?${queryString}`);
      setMovies(data);
      setLastHomeFilter(filterParams); // 마지막 필터 상태 저장 (검색 제외)
    } catch (err) {
      console.error("Error fetching movies:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchApi]);

  // 초기 로드 또는 홈 뷰로 전환 시 영화 불러오기
  useEffect(() => {
    // currentView가 'home'이고, 상세 영화가 선택되지 않았으며,
    // 현재 검색 쿼리가 없을 때만 홈 뷰 영화 (인기 영화 또는 필터링된 영화)를 불러옵니다.
    if (currentView === 'home' && !selectedMovieId && !currentSearchQuery) {
      fetchHomeMovies(lastHomeFilter);
    }
  }, [fetchHomeMovies, currentView, selectedMovieId, lastHomeFilter, currentSearchQuery]);


  // 검색 처리
  const handleSearch = async (query) => {
    setCurrentView('home'); // 검색 시 홈 뷰로 전환
    setSelectedMovieId(null); // 상세 보기 해제
    setCurrentSearchQuery(query); // 현재 검색 쿼리 저장
    setLoading(true);
    setError(null);
    try {
      const data = await fetchApi(`tmdb?type=search&query=${encodeURIComponent(query)}`);
      setMovies(data);
      localStorage.setItem('lastSearchQuery', query);
      // 검색 시 lastHomeFilter는 유지하거나, 검색 결과에 따라 초기화하지 않습니다.
      // 왜냐하면 검색은 discover 필터링과 별개로 작동하기 때문입니다.
      // setLastHomeFilter({}); // 이 라인 제거 또는 주석 처리
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
    // 'home' 뷰로 돌아갈 때, currentSearchQuery가 있다면 검색 결과를 유지하고,
    // 없다면 (혹은 비어 있다면) fetchHomeMovies에 의해 인기 영화가 로드됩니다.
  };

  // MovieFilter에서 필터 적용 시 호출될 함수
  const handleApplyFilter = async (filterParams) => {
    setCurrentView('home'); // 필터 적용 시 홈 뷰로 전환
    setSelectedMovieId(null); // 상세 보기 해제
    setCurrentSearchQuery(''); // 필터 적용 시 검색 쿼리 초기화 (검색 결과 대신 필터 결과 보여줌)
    await fetchHomeMovies(filterParams); // 필터 파라미터로 영화 불러오기
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>TMDB Insight</h1>
        <SearchBar onSearch={handleSearch} />
        <nav className="main-nav">
          {/* 홈 버튼 클릭 시 검색 쿼리 초기화 및 홈 뷰로 이동 */}
          <button onClick={() => { setCurrentView('home'); setSelectedMovieId(null); setCurrentSearchQuery(''); }}>홈</button>
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
              {/* 홈 뷰일 때만 MovieFilter 렌더링 */}
              {/* 검색 쿼리와 관계없이 필터 컴포넌트 유지 */}
              <MovieFilter onApplyFilter={handleApplyFilter} /> {/* !currentSearchQuery 조건 제거 */}
              <div className="movie-grid">
                {movies.length > 0 ? (
                  movies.map(movie => (
                    <MovieCard key={movie.id} movie={movie} onClick={() => handleMovieClick(movie.id)} />
                  ))
                ) : (
                  // 로딩 중이 아니고 에러도 없는데 영화가 없으면 메시지 표시
                  !loading && !error && (
                    <p className="no-items">
                      {currentSearchQuery
                        ? `"${currentSearchQuery}"에 대한 검색 결과가 없습니다.`
                        : (Object.keys(lastHomeFilter).length > 0
                           ? "선택된 필터에 해당하는 영화가 없습니다."
                           : "표시할 영화가 없습니다."
                          )
                      }
                    </p>
                  )
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