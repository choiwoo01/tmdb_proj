// backend-api/api/process_data.js

// TMDB API Access Token (Bearer Token)
const TMDB_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN; // 변경: TMDB_API_KEY 대신 TMDB_ACCESS_TOKEN 사용
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Authorization 헤더 추가

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { type, genre_id, limit = 5 } = req.query; // 'top_actors_by_genre', 'trending_overview_summary'

    // TMDB API 호출을 위한 헤더
    const headers = {
        'Authorization': `Bearer ${TMDB_ACCESS_TOKEN}`, // Access Token 사용
        'Content-Type': 'application/json'
    };

    try {
        if (!TMDB_ACCESS_TOKEN) {
            throw new Error("TMDB_ACCESS_TOKEN environment variable is not set.");
        }

        if (type === 'top_actors_by_genre') {
            const currentGenreId = genre_id || 28; // Action (기본값)
            const numMoviesToProcess = 10; 

            const discoverRes = await fetch(`${TMDB_BASE_URL}/discover/movie?language=ko-KR&sort_by=popularity.desc&with_genres=${currentGenreId}&page=1`, { headers });
            if (!discoverRes.ok) throw new Error('Failed to fetch discover movies');
            const discoverData = await discoverRes.json();

            const movies = discoverData.results.slice(0, numMoviesToProcess);
            const actorCounts = {};

            for (const movie of movies) {
                const creditsRes = await fetch(`${TMDB_BASE_URL}/movie/${movie.id}/credits?language=ko-KR`, { headers });
                if (!creditsRes.ok) continue;
                const creditsData = await creditsRes.json();

                creditsData.cast.slice(0, 3).forEach(castMember => {
                    if (castMember.known_for_department === 'Acting') {
                        actorCounts[castMember.name] = (actorCounts[castMember.name] || 0) + 1;
                    }
                });
            }

            const sortedActors = Object.entries(actorCounts)
                .sort(([, countA], [, countB]) => countB - countA)
                .slice(0, parseInt(limit));

            return res.status(200).json(sortedActors.map(([name, count]) => ({ name, count })));

        } else if (type === 'trending_overview_summary') {
            const trendingRes = await fetch(`${TMDB_BASE_URL}/trending/movie/week?language=ko-KR`, { headers });
            if (!trendingRes.ok) throw new Error('Failed to fetch trending movies');
            const trendingData = await trendingRes.json();

            const overviews = trendingData.results.map(movie => movie.overview).join(' ');
            
            const words = overviews.toLowerCase().match(/\b\w+\b/g);
            const wordCounts = {};
            if (words) {
                words.forEach(word => {
                    if (!['is', 'the', 'a', 'an', 'and', 'to', 'of', 'in', 'it', 'for', 'on', 'with', 'from', 'as', 'but', 'by', 'that', 'this', 'he', 'she', 'they', 'what', 'who', 'when', 'where', 'why', 'how'].includes(word) && word.length > 2) {
                        wordCounts[word] = (wordCounts[word] || 0) + 1;
                    }
                });
            }

            const sortedWords = Object.entries(wordCounts)
                .sort(([, countA], [, countB]) => countB - countA)
                .slice(0, parseInt(limit));

            return res.status(200).json(sortedWords.map(([word, count]) => ({ word, count })));

        } else {
            return res.status(400).json({ message: "Invalid process type." });
        }

    } catch (error) {
        console.error("Process data function error:", error);
        return res.status(500).json({ message: "Internal server error.", details: error.message });
    }
}