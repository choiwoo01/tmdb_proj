// frontend/src/components/MovieCard.jsx

import React from 'react';

function MovieCard({ movie, onClick }) {
  const posterUrl = movie.poster_path 
    ? movie.poster_path 
    : 'https://via.placeholder.com/200x300?text=No+Image'; // 이미지가 없을 때 대체 이미지

  return (
    <div className="movie-card" onClick={() => onClick(movie.id)}>
      <img src={posterUrl} alt={movie.title} />
      <div className="movie-info">
        <h3>{movie.title}</h3>
        <p>개봉: {movie.release_date}</p>
        <p>평점: {movie.vote_average.toFixed(1)}</p>
      </div>
    </div>
  );
}

export default MovieCard;