// frontend/src/components/MovieCard.jsx

import React from 'react';

// onClick prop을 받도록 수정
function MovieCard({ movie, onClick }) {
  const imageUrl = movie.poster_path; // 이미지는 이미 전체 URL
  const title = movie.title;
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';

  return (
    // div에 onClick 핸들러 추가
    <div className="movie-card" onClick={onClick}>
      <img src={imageUrl} alt={title} className="movie-poster" />
      <div className="movie-info">
        <h3>{title}</h3>
        <p>평점: {rating}</p>
      </div>
    </div>
  );
}

export default MovieCard;