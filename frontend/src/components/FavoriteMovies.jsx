// frontend/src/components/FavoriteMovies.jsx

import React, { useState, useEffect } from 'react';
import MovieCard from './MovieCard';


// fetchApi prop을 받도록 변경
function FavoriteMovies({ fetchApi }) {
  const [favoriteMovieIds, setFavoriteMovieIds] = useState([]);
  const [favoriteMoviesData, setFavoriteMoviesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const ids = JSON.parse(localStorage.getItem('favoriteMovies') || '[]');
    setFavoriteMovieIds(ids);
  }, []);

  useEffect(() => {
    const fetchFavoriteMovies = async () => {
      if (favoriteMovieIds.length === 0) {
        setLoading(false);
        setFavoriteMoviesData([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Promise.allSettled를 사용하여 개별 API 호출 에러 처리 개선
        const results = await Promise.allSettled(
          favoriteMovieIds.map(id =>
            fetchApi(`tmdb?type=movie&id=${id}`) // prop으로 받은 fetchApi 사용
          )
        );

        const successfulMovies = results
            .filter(result => result.status === 'fulfilled' && result.value)
            .map(result => result.value);

        setFavoriteMoviesData(successfulMovies);

        const failedFetches = results.filter(result => result.status === 'rejected');
        if (failedFetches.length > 0) {
            console.warn("Some favorite movies failed to load:", failedFetches);
        }

      } catch (err) {
        setError("찜 목록 영화를 불러오는 데 실패했습니다.");
        console.error("Error fetching favorite movies:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFavoriteMovies();
  }, [favoriteMovieIds, fetchApi]); // fetchApi를 의존성 배열에 추가

  const toggleFavorite = (movieId) => {
    let updatedFavorites;
    if (favoriteMovieIds.includes(movieId)) {
      updatedFavorites = favoriteMovieIds.filter(id => id !== movieId);
    } else {
      updatedFavorites = [...favoriteMovieIds, movieId];
    }
    localStorage.setItem('favoriteMovies', JSON.stringify(updatedFavorites));
    setFavoriteMovieIds(updatedFavorites);
  };

  if (loading) return <p className="loading-message">찜 목록 로딩 중...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="favorites-section">
      <h2>나의 찜 목록</h2>
      {favoriteMoviesData.length === 0 ? (
        <p className="no-items">찜한 영화가 없습니다. 영화를 탐색하고 찜해 보세요!</p>
      ) : (
        <div className="movie-grid">
          {favoriteMoviesData.map(movie => (
            <div key={movie.id} className="movie-card-wrapper">
                  {/* Link 대신 클릭 핸들러 사용 (MovieCard에 onClick prop 전달) */}
                <MovieCard movie={movie} onClick={() => {
                      // 여기서 App.jsx의 handleMovieClick을 호출할 방법이 필요합니다.
                      // FavoriteMovies가 직접 MovieDetail을 렌더링하지 않으므로,
                      // App.jsx에서 영화 상세 보기로 전환할 수 있는 prop을 받아야 합니다.
                      // 일단 MovieCard의 onClick은 MovieDetail을 바로 띄우지 않습니다.
                      // 이 부분은 App.jsx의 MovieCard 렌더링 부분을 참고하여 수정해야 합니다.
                      // 임시로 console.log만 남깁니다.
                      console.log("Favorite movie clicked:", movie.id);
                  }} />
              <button
                onClick={() => toggleFavorite(movie.id)}
                className="favorite-button remove-favorite"
              >
                찜 해제
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FavoriteMovies;