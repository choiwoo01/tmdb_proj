// frontend/src/components/RecentMovies.jsx
import React, { useState, useEffect } from 'react';
// Link 임포트 제거 (App에서 라우터 제거했으니)
// import { Link } from 'react-router-dom';
import MovieCard from './MovieCard';
// fetchTmdbApi 임포트 제거 (App에서 받아옴)
// import { fetchTmdbApi } from '../utils/api';

// fetchApi prop을 받도록 변경
function RecentMovies({ fetchApi }) {
  const [recentMovieIds, setRecentMovieIds] = useState([]);
  const [recentMoviesData, setRecentMoviesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const recent = JSON.parse(localStorage.getItem('recentMovies') || '[]');
    const sortedRecent = recent.sort((a, b) => b.timestamp - a.timestamp);
    setRecentMovieIds(sortedRecent.map(item => item.id));
  }, []);

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
            console.warn("Some recent movies failed to load:", failedFetches);
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
            <div key={movie.id}> {/* Link 대신 div로 래핑 */}
                  {/* MovieCard 클릭 시 App.jsx의 handleMovieClick을 호출할 방법이 필요 */}
                <MovieCard movie={movie} onClick={() => {
                      // App.jsx에서 RecentMovies로 handleMovieClick을 prop으로 전달해야 합니다.
                      // 현재는 그냥 console.log만 남깁니다.
                      console.log("Recent movie clicked:", movie.id);
                  }} />
              </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RecentMovies;