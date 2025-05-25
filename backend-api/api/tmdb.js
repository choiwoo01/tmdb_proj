// backend-api/api/tmdb.js

// TMDB API 키는 Vercel 환경 변수로 설정합니다.
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"; // 포스터, 프로필 이미지 등에 사용

// API 호출 헬퍼 함수 (Rate Limit 관리를 위한 기본적인 지연 포함)
async function callTmdbApi(path, queryParams = {}) {
    if (!TMDB_API_KEY) {
        throw new Error("TMDB API Key is not set.");
    }

    const queryString = new URLSearchParams({
        api_key: TMDB_API_KEY,
        language: "ko-KR", // 한국어로 데이터 요청
        ...queryParams
    }).toString();

    const fullUrl = `${TMDB_BASE_URL}${path}?${queryString}`;
    
    // 기본적인 지연 (TMDB Rate Limit은 비교적 관대하지만, 안전을 위해)
    await new Promise(resolve => setTimeout(resolve, 50)); 

    try {
        const response = await fetch(fullUrl);
        if (!response.ok) {
            console.error(`TMDB API call failed: ${response.status} ${response.statusText} for ${fullUrl}`);
            const errorBody = await response.text(); // 오류 본문 확인
            console.error('Error Response Body:', errorBody);

            if (response.status === 429) { // Too Many Requests
                throw new Error("RATE_LIMIT_EXCEEDED");
            }
            if (response.status === 404) { // Not Found
                throw new Error("NOT_FOUND");
            }
            throw new Error(`API call failed with status ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error during TMDB API call:", error.message);
        throw error;
    }
}

export default async function handler(req, res) {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*'); // 프로덕션에서는 실제 프론트엔드 도메인으로 제한
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { type, id, query } = req.query; // type: 'popular', 'search', 'detail', 'credits'

    try {
        let data;
        let responseData = {};

        switch (type) {
            case 'popular':
                data = await callTmdbApi('/movie/popular', { page: 1 });
                responseData = data.results.map(movie => ({
                    id: movie.id,
                    title: movie.title,
                    poster_path: movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : null,
                    release_date: movie.release_date,
                    vote_average: movie.vote_average
                }));
                break;
            case 'search':
                if (!query) throw new Error("Search query is required.");
                data = await callTmdbApi('/search/movie', { query: query });
                responseData = data.results.map(movie => ({
                    id: movie.id,
                    title: movie.title,
                    poster_path: movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : null,
                    release_date: movie.release_date,
                    vote_average: movie.vote_average
                }));
                break;
            case 'detail':
                if (!id) throw new Error("Movie ID is required.");
                data = await callTmdbApi(`/movie/${id}`);
                const credits = await callTmdbApi(`/movie/${id}/credits`);
                const videos = await callTmdbApi(`/movie/${id}/videos`); // 트레일러 영상

                responseData = {
                    id: data.id,
                    title: data.title,
                    overview: data.overview,
                    poster_path: data.poster_path ? `${IMAGE_BASE_URL}${data.poster_path}` : null,
                    backdrop_path: data.backdrop_path ? `${IMAGE_BASE_URL}${data.backdrop_path}` : null,
                    release_date: data.release_date,
                    vote_average: data.vote_average,
                    genres: data.genres.map(g => g.name),
                    runtime: data.runtime,
                    cast: credits.cast.slice(0, 5).map(c => ({ // 주요 배우 5명
                        id: c.id,
                        name: c.name,
                        character: c.character,
                        profile_path: c.profile_path ? `${IMAGE_BASE_URL}${c.profile_path}` : null
                    })),
                    director: credits.crew.find(c => c.job === 'Director')?.name || 'N/A',
                    trailer_key: videos.results.find(v => v.type === 'Trailer' && v.site === 'YouTube')?.key || null
                };
                break;
            default:
                return res.status(400).json({ error: "Invalid API type." });
        }

        res.status(200).json(responseData);

    } catch (error) {
        console.error("Error in Serverless Function:", error.message);
        if (error.message === "RATE_LIMIT_EXCEEDED") {
            return res.status(429).json({ error: "TMDB API Rate Limit Exceeded. Please try again after some time." });
        }
        if (error.message === "NOT_FOUND") {
            return res.status(404).json({ error: "Resource not found. Please check your request." });
        }
        return res.status(500).json({ error: `Internal Server Error: ${error.message}` });
    }
}