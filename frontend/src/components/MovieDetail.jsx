// frontend/src/components/MovieDetail.jsx

import React, { useState, useEffect } from 'react';

function MovieDetail({ movieId, onBack, fetchApi }) { 

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMovieDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        // prop으로 받은 fetchApi 함수 사용
        const data = await fetchApi(`tmdb?type=movie&id=${movieId}`);
        setMovie(data);
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
  }, [movieId, fetchApi]); // fetchApi를 의존성 배열에 추가

  if (loading) return <p className="loading-message">영화 상세 정보 로딩 중...</p>;
  if (error) return <p className="error-message">오류: {error}</p>;
  if (!movie) return <p>영화 정보를 찾을 수 없습니다.</p>;

  const youtubeTrailerUrl = movie.trailer_url;

  return (
    <div className="movie-detail">
      <button onClick={onBack} className="back-button">목록으로 돌아가기</button>
      <img src={movie.backdrop_path || movie.poster_path} alt={movie.title} className="detail-backdrop" />
      <div className="detail-content">
        <h2>{movie.title}</h2>
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