// frontend/src/components/FavoriteMovies.jsx

import React, { useState, useEffect, useCallback } from 'react'; // useCallback 임포트 추가
import MovieCard from './MovieCard';

// fetchApi와 onMovieClick prop을 받도록 변경
function FavoriteMovies({ fetchApi, onMovieClick }) {
  const [favoriteMovieIds, setFavoriteMovieIds] = useState([]);
  const [favoriteMoviesData, setFavoriteMoviesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 찜 목록 데이터를 localStorage에서 가져오는 함수
  const getFavoritesFromLocalStorage = () => {
    try {
      // MovieDetail.jsx와 동일한 'favorites' 키 사용
      const favorites = localStorage.getItem('favorites');
      return favorites ? JSON.parse(favorites) : [];
    } catch (e) {
      console.error("Failed to parse favorites from localStorage:", e);
      return [];
    }
  };

  // 찜 목록 데이터를 localStorage에 저장하는 함수
  const saveFavoritesToLocalStorage = (favorites) => {
    try {
      // MovieDetail.jsx와 동일한 'favorites' 키 사용
      localStorage.setItem('favorites', JSON.stringify(favorites));
    } catch (e) {
      console.error("Failed to save favorites to localStorage:", e);
    }
  };

  // 찜 상태 토글 (여기서는 '찜 해제' 기능으로 주로 사용)
  // useCallback을 사용하여 함수가 불필요하게 재생성되는 것을 방지
  const toggleFavorite = useCallback((movieIdToToggle) => {
    const favorites = getFavoritesFromLocalStorage();
    let updatedFavorites;

    if (favorites.includes(movieIdToToggle)) {
      // 찜 목록에서 제거
      updatedFavorites = favorites.filter(id => id !== movieIdToToggle);
    } else {
      // 찜 목록에 추가 (이 컴포넌트에서는 주로 제거만 사용)
      updatedFavorites = [...favorites, movieIdToToggle];
    }

    saveFavoritesToLocalStorage(updatedFavorites);
    setFavoriteMovieIds(updatedFavorites); // 상태 업데이트로 리렌더링 유발
  }, []); // 의존성 배열 없음: getFavoritesFromLocalStorage와 saveFavoritesToLocalStorage는 변경되지 않으므로

  // 컴포넌트 마운트 시 및 toggleFavorite 호출 시 localStorage에서 찜 목록 ID 로드
  useEffect(() => {
    const ids = getFavoritesFromLocalStorage();
    setFavoriteMovieIds(ids);
  }, [toggleFavorite]); // toggleFavorite가 변경될 때도 다시 로드 (사실상 초기 로드 역할)

  // favoriteMovieIds가 변경될 때마다 해당 영화 정보 fetch
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
            console.warn("일부 찜한 영화 정보를 불러오는 데 실패했습니다:", failedFetches);
        }

      } catch (err) {
        setError("찜 목록 영화를 불러오는 데 실패했습니다.");
        console.error("Error fetching favorite movies:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFavoriteMovies();
  }, [favoriteMovieIds, fetchApi]); // favoriteMovieIds 또는 fetchApi 변경 시 재실행

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
              {/* MovieCard 클릭 시 App.jsx의 handleMovieClick을 호출하도록 연결 */}
              <MovieCard movie={movie} onClick={() => onMovieClick(movie.id)} />
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