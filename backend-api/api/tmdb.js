// backend-api/api/tmdb.js

// TMDB API Access Token (Bearer Token)
const TMDB_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN; // 변경: TMDB_API_KEY 대신 TMDB_ACCESS_TOKEN 사용
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Authorization 헤더 추가

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { type, query, id, page = 1, ...filterParams } = req.query;

    let url = '';
    let movies = [];
    let error = null;

    // TMDB API 호출을 위한 헤더
    const headers = {
        'Authorization': `Bearer ${TMDB_ACCESS_TOKEN}`, // Access Token 사용
        'Content-Type': 'application/json'
    };

    try {
        if (!TMDB_ACCESS_TOKEN) {
            throw new Error("TMDB_ACCESS_TOKEN environment variable is not set.");
        }

        if (type === 'popular') {
            url = `${TMDB_BASE_URL}/movie/popular?language=ko-KR&page=${page}`;
            const response = await fetch(url, { headers });
            const data = await response.json();
            if (!response.ok) {
                error = data.status_message || 'Failed to fetch popular movies from TMDB.';
            } else {
                movies = data.results.map(movie => ({
                    id: movie.id,
                    title: movie.title,
                    poster_path: movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : null,
                    vote_average: movie.vote_average
                }));
            }
        } else if (type === 'search' && query) {
            url = `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&language=ko-KR&page=${page}`;
            const response = await fetch(url, { headers });
            const data = await response.json();
            if (!response.ok) {
                error = data.status_message || 'Failed to search movies from TMDB.';
            } else {
                movies = data.results.map(movie => ({
                    id: movie.id,
                    title: movie.title,
                    poster_path: movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : null,
                    vote_average: movie.vote_average
                }));
            }
        } else if (type === 'movie' && id) {
            url = `${TMDB_BASE_URL}/movie/${id}?language=ko-KR`;
            const response = await fetch(url, { headers });
            const movieData = await response.json();
            if (!response.ok) {
                error = movieData.status_message || `Failed to fetch movie details for ID ${id}.`;
            } else {
                // 특정 영화 상세 정보는 직접 반환
                return res.status(200).json({
                    id: movieData.id,
                    title: movieData.title,
                    overview: movieData.overview,
                    release_date: movieData.release_date,
                    poster_path: movieData.poster_path ? `${IMAGE_BASE_URL}${movieData.poster_path}` : null,
                    backdrop_path: movieData.backdrop_path ? `${IMAGE_BASE_URL}${movieData.backdrop_path}` : null,
                    vote_average: movieData.vote_average,
                    genres: movieData.genres,
                    runtime: movieData.runtime,
                    // TMDB API에서 트레일러 정보도 가져오기 (videos 엔드포인트)
                    trailer_url: await getMovieTrailer(id, TMDB_ACCESS_TOKEN)
                });
            }
        } else if (type === 'discover') { // 고급 필터링용
            // discover 엔드포인트는 복잡한 쿼리 파라미터를 가집니다.
            // filterParams를 직접 URLSearchParams에 추가합니다.
            const params = new URLSearchParams({ language: 'ko-KR', page: page });
            for (const key in filterParams) {
                if (filterParams[key]) {
                    params.append(key, filterParams[key]);
                }
            }
            url = `${TMDB_BASE_URL}/discover/movie?${params.toString()}`;
            const response = await fetch(url, { headers });
            const data = await response.json();
            if (!response.ok) {
                error = data.status_message || 'Failed to fetch discovered movies from TMDB.';
            } else {
                movies = data.results.map(movie => ({
                    id: movie.id,
                    title: movie.title,
                    poster_path: movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : null,
                    vote_average: movie.vote_average
                }));
            }
        } else {
            error = "Invalid request type or missing parameters.";
        }

        if (error) {
            return res.status(400).json({ error: error });
        } else {
            return res.status(200).json(movies);
        }

    } catch (err) {
        console.error("TMDB API proxy error:", err);
        return res.status(500).json({ error: `Internal server error: ${err.message}` });
    }
}

// 영화 ID로 트레일러 URL을 가져오는 헬퍼 함수
async function getMovieTrailer(movieId, accessToken) {
    const url = `${TMDB_BASE_URL}/movie/${movieId}/videos?language=en-US`; // 영어 트레일러 우선
    const headers = { 'Authorization': `Bearer ${accessToken}` };
    try {
        const response = await fetch(url, { headers });
        const data = await response.json();
        if (response.ok && data.results && data.results.length > 0) {
            const trailer = data.results.find(video => video.type === 'Trailer' && video.site === 'YouTube');
            if (trailer) {
                // 정확한 YouTube 임베드 URL 형식
                return `https://www.youtube.com/embed/${trailer.key}`; // <-- 이 부분!
            }
        }
    } catch (e) {
        console.error(`영화 ${movieId}의 트레일러를 가져오는 중 오류 발생:`, e);
    }
    return null;
}