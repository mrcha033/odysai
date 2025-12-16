export interface SearchResult {
    title: string;
    link: string;
    snippet: string;
    rating?: number;
    imageUrl?: string;
}

export class SearchService {
    private readonly serperApiKey = process.env.SERPER_API_KEY;

    async searchPlaces(city: string): Promise<SearchResult[]> {
        if (!this.serperApiKey) {
            console.warn('[Search] No SERPER_API_KEY found. Using mock fallback.');
            return this.mockFallback(city);
        }

        try {
            const query = `Top rated tourist attractions in ${city} ${new Date().getFullYear()}`;
            const response = await fetch('https://google.serper.dev/search', {
                method: 'POST',
                headers: {
                    'X-API-KEY': this.serperApiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ q: query, num: 10 }),
            });

            const data = await response.json();
            return this.normalizeSerperResults(data, city);
        } catch (error) {
            console.error('[Search] API failed:', error);
            return this.mockFallback(city);
        }
    }

    private normalizeSerperResults(data: any, city: string): SearchResult[] {
        const organinc = data.organic || [];
        // Prioritize places/knowledgeGraph if available, but Serper mainly returns organic for broad queries
        // We map organic results to our schema
        return organinc.map((item: any) => ({
            title: item.title.replace(' - TripAdvisor', '').replace(' - Wikipedia', ''),
            link: item.link,
            snippet: item.snippet,
            rating: item.rating || undefined, // Serper sometimes returns rating
            imageUrl: item.imageUrl, // Custom field if we supported images search, regular search might not have it
        })).slice(0, 8);
    }

    private mockFallback(city: string): SearchResult[] {
        return [
            {
                title: `${city} Central Park (Mock)`,
                link: '#',
                snippet: 'A beautiful park in the heart of the city.',
                rating: 4.8
            },
            {
                title: `${city} National Museum (Mock)`,
                link: '#',
                snippet: 'Famous museum with historical artifacts.',
                rating: 4.7
            },
            {
                title: `${city} Tower (Mock)`,
                link: '#',
                snippet: 'Iconic observation tower with panoramic views.',
                rating: 4.5
            },
            {
                title: 'Please Add SERPER_API_KEY',
                link: 'https://serper.dev',
                snippet: 'To see real results, add SERPER_API_KEY to your .env file.',
                rating: 5.0
            }
        ];
    }
}

export const searchService = new SearchService();
