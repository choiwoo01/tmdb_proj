// frontend/src/components/RecentMovies.jsx
import React, { useState, useEffect, useCallback } from 'react'; // useCallback 임포트 추가
import MovieCard from './MovieCard';

// fetchApi와 onMovieClick prop을 받도록 변경
function RecentMovies({ fetchApi, onMovieClick }) {
  const [recentMovieIds, setRecentMovieIds] = useState([]);
  const [recentMoviesData, setRecentMoviesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 최근 본 영화 데이터를 localStorage에서 가져오는 함수
  const getRecentMoviesFromLocalStorage = useCallback(() => { // useCallback 추가
    try {
      const recent = localStorage.getItem('recentMovies');
      return recent ? JSON.parse(recent) : [];
    } catch (e) {
      console.error("Failed to parse recent movies from localStorage:", e);
      return [];
    }
  }, []);

  // 컴포넌트 마운트 시 localStorage에서 최근 본 영화 ID 로드
  useEffect(() => {
    const recent = getRecentMoviesFromLocalStorage();
    const sortedRecent = recent.sort((a, b) => b.timestamp - a.timestamp);
    setRecentMovieIds(sortedRecent.map(item => item.id));
  }, [getRecentMoviesFromLocalStorage]); // 의존성 배열에 getRecentMoviesFromLocalStorage 추가

  // recentMovieIds가 변경될 때마다 해당 영화 정보 fetch
  useEffect(() => {
    const fetchRecentMovies = async () => {
      if (recentMovieIds.length === 0) {
        setLoading(false);
        setRecentMoviesData([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Promise.allSettled를 사용하여 개별 API 호출 에러 처리 개선
        const results = await Promise.allSettled(
          recentMovieIds.map(id =>
            fetchApi(`tmdb?type=movie&id=${id}`) // prop으로 받은 fetchApi 사용
          )
        );

        const successfulMovies = results
            .filter(result => result.status === 'fulfilled' && result.value)
            .map(result => result.value);

        setRecentMoviesData(successfulMovies);

        const failedFetches = results.filter(result => result.status === 'rejected');
        if (failedFetches.length > 0) {
            console.warn("일부 최근 본 영화 정보를 불러오는 데 실패했습니다:", failedFetches);
        }

      } catch (err) {
        setError("최근 본 영화를 불러오는 데 실패했습니다.");
        console.error("Error fetching recent movies:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentMovies();
  }, [recentMovieIds, fetchApi]); // fetchApi를 의존성 배열에 추가

  if (loading) return <p className="loading-message">최근 본 영화 로딩 중...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="recent-section">
      <h2>최근 본 영화</h2>
      {recentMoviesData.length === 0 ? (
        <p className="no-items">최근 본 영화가 없습니다. 영화 상세 페이지를 방문해 보세요!</p>
      ) : (
        <div className="movie-grid">
          {recentMoviesData.map(movie => (
            <div key={movie.id}>
              {/* MovieCard 클릭 시 App.jsx의 handleMovieClick을 호출하도록 연결 */}
              <MovieCard movie={movie} onClick={() => onMovieClick(movie.id)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RecentMovies;