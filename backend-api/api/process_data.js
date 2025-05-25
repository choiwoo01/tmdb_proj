// backend-api/api/process_data.js

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { type, movie_id, limit = 5 } = req.query; // 'top_actors_by_genre', 'trending_overview_summary'

    try {
        if (type === 'top_actors_by_genre') {
            // 예시: 특정 장르의 가장 인기 있는 영화들의 주연 배우 목록과 출현 횟수 계산
            // 이 기능은 TMDB API의 'discover' 엔드포인트와 'credits' 엔드포인트를 조합해야 합니다.
            // 복잡도를 위해 여기서는 매우 단순화된 예시를 제시합니다.
            
            const genreId = req.query.genre_id || 28; // Action (기본값)
            const numMoviesToProcess = 10; // 처리할 영화의 수 (실행 시간 제한 고려)

            const discoverRes = await fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=ko-KR&sort_by=popularity.desc&with_genres=${genreId}&page=1`);
            if (!discoverRes.ok) throw new Error('Failed to fetch discover movies');
            const discoverData = await discoverRes.json();

            const movies = discoverData.results.slice(0, numMoviesToProcess);
            const actorCounts = {};

            for (const movie of movies) {
                const creditsRes = await fetch(`${TMDB_BASE_URL}/movie/${movie.id}/credits?api_key=${TMDB_API_KEY}&language=ko-KR`);
                if (!creditsRes.ok) continue; // 크레딧 불러오기 실패 시 스킵
                const creditsData = await creditsRes.json();

                // 상위 3명의 배우만 고려
                creditsData.cast.slice(0, 3).forEach(castMember => {
                    if (castMember.known_for_department === 'Acting') { // 배우인 경우만
                        actorCounts[castMember.name] = (actorCounts[castMember.name] || 0) + 1;
                    }
                });
            }

            // 출현 횟수 기준으로 정렬
            const sortedActors = Object.entries(actorCounts)
                .sort(([, countA], [, countB]) => countB - countA)
                .slice(0, parseInt(limit)); // 요청된 수만큼 제한

            return res.status(200).json(sortedActors.map(([name, count]) => ({ name, count })));

        } else if (type === 'trending_overview_summary') {
            // 예시: 현재 트렌딩 영화들의 줄거리에서 주요 단어 빈도수 계산
            // 이 또한 영속적인 저장이 불가능하므로, 매번 요청 시 계산됩니다.
            
            const trendingRes = await fetch(`${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}&language=ko-KR`);
            if (!trendingRes.ok) throw new Error('Failed to fetch trending movies');
            const trendingData = await trendingRes.json();

            const overviews = trendingData.results.map(movie => movie.overview).join(' ');
            
            // 간단한 단어 빈도수 계산 (불용어 제거 및 소문자 변환 등은 생략하여 단순화)
            const words = overviews.toLowerCase().match(/\b\w+\b/g); // 단어만 추출
            const wordCounts = {};
            if (words) {
                words.forEach(word => {
                    // 흔한 불용어(stop words) 제거 (매우 간단한 예시)
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