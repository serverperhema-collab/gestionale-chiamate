export function getGoogleIncludedType(concept: string): string | null {
    const c = concept.toLowerCase();
    if (c.includes('pizzeria')) return 'pizza_restaurant';
    if (c.includes('ristorant')) return 'restaurant';
    if (c.includes('idraulico')) return 'plumber';
    if (c.includes('elettricista')) return 'electrician';
    if (c.includes('albergh') || c.includes('hotel')) return 'hotel';
    if (c.includes('campegg')) return 'campground';
    if (c.includes('parchegg')) return 'parking';
    if (c.includes('distributor')) return 'gas_station';
    if (c.includes('poste')) return 'post_office';
    if (c.includes('farmaci')) return 'pharmacy';
    if (c.includes('supermercat')) return 'supermarket';
    if (c.includes('scuol')) return 'school';
    if (c.includes('universit')) return 'university';
    if (c.includes('ospedal')) return 'hospital';
    if (c.includes('banch') || c.includes('banca')) return 'bank';
    if (c.includes('palestr')) return 'gym';
    if (c.includes('muse')) return 'museum';
    if (c.includes('bar ') || c === 'bar') return 'bar';
    if (c.includes('estetist')) return 'beauty_salon';
    if (c.includes('parrucchier')) return 'hair_care';
    if (c.includes('dentist')) return 'dentist';
    if (c.includes('meccanic')) return 'car_repair';
    return null;
}
