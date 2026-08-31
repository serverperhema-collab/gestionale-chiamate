export class CapResolver {
    private static cache: Record<string, any> = {};

    static async getBounds(cap: string) {
        if (this.cache[cap]) return this.cache[cap];

        try {
            const url = `https://nominatim.openstreetmap.org/search?postalcode=${cap}&country=Italy&format=json`;
            const response = await fetch(url, { headers: { 'User-Agent': 'GestionaleEstrazioni/2.0' } });
            const data = await response.json();
            
            if (data && data.length > 0) {
                const b = data[0].boundingbox;
                const bounds = {
                    minLat: parseFloat(b[0]),
                    maxLat: parseFloat(b[1]),
                    minLng: parseFloat(b[2]),
                    maxLng: parseFloat(b[3])
                };
                this.cache[cap] = bounds;
                return bounds;
            }
        } catch (e) {
            console.error("Nominatim error for CAP " + cap, e);
        }

        // Fallback Roma
        return {
            minLat: 41.79,
            maxLat: 42.00,
            minLng: 12.35,
            maxLng: 12.65
        };
    }
}
