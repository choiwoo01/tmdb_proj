// frontend/src/components/MovieDetail.jsx

import React, { useState, useEffect } from 'react';

function MovieDetail({ movieId, onBack, fetchApi }) { 
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // 찜 상태를 관리하는 새로운 state
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    const fetchMovieDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchApi(`tmdb?type=movie&id=${movieId}`);
        setMovie(data);
        // 영화 상세 정보를 불러온 후, 찜 상태 확인
        checkFavoriteStatus(data.id); 
      } catch (err) {
        console.error("Error fetching movie details:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (movieId) {
      fetchMovieDetail();
    }
  }, [movieId, fetchApi]);

  // --- 찜하기 기능 관련 로직 시작 ---

  // 찜 목록 데이터를 localStorage에서 가져오는 함수
  const getFavoritesFromLocalStorage = () => {
    try {
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
      localStorage.setItem('favorites', JSON.stringify(favorites));
    } catch (e) {
      console.error("Failed to save favorites to localStorage:", e);
    }
  };

  // 현재 영화가 찜 목록에 있는지 확인하는 함수
  const checkFavoriteStatus = (id) => {
    const favorites = getFavoritesFromLocalStorage();
    setIsFavorited(favorites.some(favMovieId => favMovieId === id));
  };

  // 찜하기 버튼 클릭 핸들러
  const handleFavoriteToggle = () => {
    const favorites = getFavoritesFromLocalStorage();
    let updatedFavorites;

    if (isFavorited) {
      // 찜 목록에서 제거
      updatedFavorites = favorites.filter(favMovieId => favMovieId !== movie.id);
    } else {
      // 찜 목록에 추가
      updatedFavorites = [...favorites, movie.id];
    }
    
    saveFavoritesToLocalStorage(updatedFavorites);
    setIsFavorited(!isFavorited); // 찜 상태 토글
  };

  // --- 찜하기 기능 관련 로직 끝 ---


  if (loading) return <p className="loading-message">영화 상세 정보 로딩 중...</p>;
  if (error) return <p className="error-message">오류: {error}</p>;
  if (!movie) return <p>영화 정보를 찾을 수 없습니다.</p>;

  // 수정된 트레일러 URL 생성
  const youtubeTrailerUrl = movie.trailer_url ? `https://www.youtube.com/embed/${movie.trailer_url.split('/').pop()}` : null;
  // 참고: 백엔드에서 정확한 YouTube URL(예: embed URL)을 넘겨준다면 이 부분은 불필요할 수 있습니다.
  // 백엔드에서 `https://www.youtube.com/embed/${trailer.key}`로 직접 생성하여 넘겨주는 것이 좋습니다.

  return (
    <div className="movie-detail">
      <button onClick={onBack} className="back-button">목록으로 돌아가기</button>
      <img src={movie.backdrop_path || movie.poster_path} alt={movie.title} className="detail-backdrop" />
      <div className="detail-content">
        <h2>{movie.title}</h2>
        {/* 찜하기 버튼 추가 */}
        <button 
          onClick={handleFavoriteToggle} 
          className={`favorite-button ${isFavorited ? 'favorited' : ''}`}
        >
          {isFavorited ? '❤️ 찜 목록에서 제거' : '🤍 찜하기'}
        </button>

        <p><strong>개봉일:</strong> {movie.release_date}</p>
        <p><strong>평점:</strong> {movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</p>
        <p>
          <strong>장르:</strong>{' '}
          {movie.genres && movie.genres.length > 0
            ? movie.genres.map(g => g.name).join(', ')
            : '정보 없음'}
        </p>
        <p><strong>러닝타임:</strong> {movie.runtime ? `${movie.runtime}분` : '정보 없음'}</p>
        <p><strong>줄거리:</strong> {movie.overview || '줄거리 정보가 없습니다.'}</p>

        {youtubeTrailerUrl && (
          <div className="trailer-container">
            <h3>트레일러</h3>
            <iframe
              width="560"
              height="315"
              src={youtubeTrailerUrl}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Movie Trailer"
            ></iframe>
          </div>
        )}
      </div>
    </div>
  );
}

export default MovieDetail;