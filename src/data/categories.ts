export interface CategoryConfig {
    id: string;
    label: string;
    group: string;
    googleTypes: string[];
    osmTags: string[];
}

export const CATEGORIES: CategoryConfig[] = [
    // Ristorazione e Locali
    { id: 'ristoranti', label: 'Ristoranti e Pizzerie', group: 'Ristorazione e Locali', googleTypes: ['restaurant'], osmTags: ['amenity=restaurant', 'amenity=fast_food'] },
    { id: 'bar', label: 'Bar, Caffetterie e Pub', group: 'Ristorazione e Locali', googleTypes: ['bar', 'cafe'], osmTags: ['amenity=bar', 'amenity=cafe', 'amenity=pub', 'amenity=ice_cream'] },
    { id: 'panetterie', label: 'Panetterie e Pasticcerie', group: 'Ristorazione e Locali', googleTypes: ['bakery'], osmTags: ['shop=bakery', 'shop=pastry'] },
    { id: 'consegna_asporto', label: 'Consegna e Asporto', group: 'Ristorazione e Locali', googleTypes: ['meal_delivery', 'meal_takeaway'], osmTags: ['amenity=fast_food'] },

    // Commercio al Dettaglio
    { id: 'supermercati', label: 'Supermercati e Alimentari', group: 'Commercio al Dettaglio', googleTypes: ['supermarket', 'convenience_store'], osmTags: ['shop=supermarket', 'shop=convenience'] },
    { id: 'abbigliamento', label: 'Negozi di Abbigliamento e Scarpe', group: 'Commercio al Dettaglio', googleTypes: ['clothing_store', 'shoe_store'], osmTags: ['shop=clothes', 'shop=shoes', 'shop=boutique'] },
    { id: 'elettronica', label: 'Elettronica e Informatica', group: 'Commercio al Dettaglio', googleTypes: ['electronics_store'], osmTags: ['shop=electronics', 'shop=computer'] },
    { id: 'ferramenta', label: 'Ferramenta e Bricolage', group: 'Commercio al Dettaglio', googleTypes: ['hardware_store'], osmTags: ['shop=hardware', 'shop=doityourself'] },
    { id: 'arredamento', label: 'Arredamento e Articoli per la Casa', group: 'Commercio al Dettaglio', googleTypes: ['furniture_store', 'home_goods_store'], osmTags: ['shop=furniture', 'shop=houseware'] },
    { id: 'gioiellerie', label: 'Gioiellerie e Orologerie', group: 'Commercio al Dettaglio', googleTypes: ['jewelry_store'], osmTags: ['shop=jewelry', 'shop=watches'] },
    { id: 'animali', label: 'Articoli per Animali', group: 'Commercio al Dettaglio', googleTypes: ['pet_store'], osmTags: ['shop=pet'] },
    { id: 'librerie', label: 'Librerie e Cartolerie', group: 'Commercio al Dettaglio', googleTypes: ['book_store'], osmTags: ['shop=books', 'shop=stationery'] },
    { id: 'grandi_magazzini', label: 'Grandi Magazzini e Centri Commerciali', group: 'Commercio al Dettaglio', googleTypes: ['department_store', 'shopping_mall'], osmTags: ['shop=department_store', 'shop=mall'] },
    { id: 'biciclette', label: 'Negozi di Biciclette', group: 'Commercio al Dettaglio', googleTypes: ['bicycle_store'], osmTags: ['shop=bicycle'] },
    { id: 'fioristi', label: 'Fioristi e Vivai', group: 'Commercio al Dettaglio', googleTypes: ['florist'], osmTags: ['shop=florist'] },
    { id: 'liquori', label: 'Enoteche e Liquori', group: 'Commercio al Dettaglio', googleTypes: ['liquor_store'], osmTags: ['shop=alcohol', 'shop=beverages'] },
    { id: 'generico', label: 'Negozi Generici', group: 'Commercio al Dettaglio', googleTypes: ['store'], osmTags: ['shop'] },

    // Salute e Benessere
    { id: 'farmacie', label: 'Farmacie e Parafarmacie', group: 'Salute e Benessere', googleTypes: ['pharmacy', 'drugstore'], osmTags: ['amenity=pharmacy'] },
    { id: 'medici', label: 'Medici e Poliambulatori', group: 'Salute e Benessere', googleTypes: ['doctor', 'hospital'], osmTags: ['amenity=doctors', 'amenity=clinic', 'amenity=hospital'] },
    { id: 'dentisti', label: 'Dentisti e Studi Odontoiatrici', group: 'Salute e Benessere', googleTypes: ['dentist'], osmTags: ['amenity=dentist'] },
    { id: 'fisioterapisti', label: 'Fisioterapisti', group: 'Salute e Benessere', googleTypes: ['physiotherapist'], osmTags: ['healthcare=physiotherapist'] },
    { id: 'veterinari', label: 'Veterinari', group: 'Salute e Benessere', googleTypes: ['veterinary_care'], osmTags: ['amenity=veterinary'] },
    { id: 'estetica', label: 'Parrucchieri e Centri Estetici', group: 'Salute e Benessere', googleTypes: ['hair_care', 'beauty_salon'], osmTags: ['shop=hairdresser', 'shop=beauty'] },
    { id: 'palestre', label: 'Palestre e Centri Sportivi', group: 'Salute e Benessere', googleTypes: ['gym', 'sports_complex', 'sports_club'], osmTags: ['leisure=fitness_centre', 'leisure=sports_centre'] },
    { id: 'spa', label: 'Centri Benessere e SPA', group: 'Salute e Benessere', googleTypes: ['spa'], osmTags: ['leisure=sauna', 'leisure=spa'] },
    { id: 'case_di_riposo', label: 'Case di Riposo e RSA', group: 'Salute e Benessere', googleTypes: ['nursing_home', 'health'], osmTags: ['amenity=social_facility', 'amenity=nursing_home'] },

    // Professionisti e Uffici
    { id: 'avvocati', label: 'Avvocati e Studi Legali', group: 'Professionisti e Uffici', googleTypes: ['lawyer'], osmTags: ['office=lawyer'] },
    { id: 'commercialisti', label: 'Commercialisti e Consulenti', group: 'Professionisti e Uffici', googleTypes: ['accounting'], osmTags: ['office=accountant', 'office=tax_advisor'] },
    { id: 'agenzie_immobiliari', label: 'Agenzie Immobiliari', group: 'Professionisti e Uffici', googleTypes: ['real_estate_agency'], osmTags: ['office=estate_agent', 'shop=estate_agent'] },
    { id: 'agenzie_assicurative', label: 'Agenzie Assicurative', group: 'Professionisti e Uffici', googleTypes: ['insurance_agency'], osmTags: ['office=insurance'] },
    { id: 'banche', label: 'Banche e Istituti di Credito', group: 'Professionisti e Uffici', googleTypes: ['bank', 'atm'], osmTags: ['amenity=bank', 'amenity=atm'] },

    // Artigiani e Servizi
    { id: 'meccanici', label: 'Meccanici, Carrozzieri e Gommisti', group: 'Artigiani e Servizi', googleTypes: ['car_repair'], osmTags: ['shop=car_repair', 'shop=tyres', 'shop=car_parts'] },
    { id: 'autolavaggi', label: 'Autolavaggi', group: 'Artigiani e Servizi', googleTypes: ['car_wash'], osmTags: ['amenity=car_wash'] },
    { id: 'concessionarie', label: 'Concessionarie Auto', group: 'Artigiani e Servizi', googleTypes: ['car_dealer'], osmTags: ['shop=car'] },
    { id: 'noleggio_auto', label: 'Noleggio Auto', group: 'Artigiani e Servizi', googleTypes: ['car_rental'], osmTags: ['amenity=car_rental'] },
    { id: 'elettricisti', label: 'Elettricisti', group: 'Artigiani e Servizi', googleTypes: ['electrician'], osmTags: ['craft=electrician'] },
    { id: 'idraulici', label: 'Idraulici', group: 'Artigiani e Servizi', googleTypes: ['plumber'], osmTags: ['craft=plumber'] },
    { id: 'imbianchini', label: 'Imbianchini ed Edilizia', group: 'Artigiani e Servizi', googleTypes: ['painter', 'roofing_contractor'], osmTags: ['craft=painter', 'craft=builder', 'craft=carpenter'] },
    { id: 'fabbri', label: 'Fabbri e Serraturieri', group: 'Artigiani e Servizi', googleTypes: ['locksmith'], osmTags: ['craft=locksmith'] },
    { id: 'lavanderie', label: 'Lavanderie', group: 'Artigiani e Servizi', googleTypes: ['laundry'], osmTags: ['shop=laundry', 'shop=dry_cleaning'] },
    { id: 'traslochi', label: 'Ditte di Traslochi', group: 'Artigiani e Servizi', googleTypes: ['moving_company'], osmTags: ['office=moving_company'] },
    { id: 'pompe_funebri', label: 'Pompe Funebri e Cimiteri', group: 'Artigiani e Servizi', googleTypes: ['funeral_home', 'cemetery'], osmTags: ['shop=funeral_directors', 'landuse=cemetery'] },

    // Intrattenimento e Cultura
    { id: 'musei', label: 'Musei e Gallerie d\'Arte', group: 'Intrattenimento e Cultura', googleTypes: ['museum', 'art_gallery'], osmTags: ['tourism=museum', 'tourism=gallery'] },
    { id: 'cinema', label: 'Cinema e Videoteche', group: 'Intrattenimento e Cultura', googleTypes: ['movie_theater', 'movie_rental'], osmTags: ['amenity=cinema', 'shop=video'] },
    { id: 'parchi_divertimento', label: 'Parchi Divertimento e Acquari', group: 'Intrattenimento e Cultura', googleTypes: ['amusement_park', 'aquarium'], osmTags: ['tourism=theme_park', 'tourism=aquarium'] },
    { id: 'parchi_pubblici', label: 'Parchi Pubblici', group: 'Intrattenimento e Cultura', googleTypes: ['park'], osmTags: ['leisure=park'] },
    { id: 'stadi', label: 'Stadi e Arene', group: 'Intrattenimento e Cultura', googleTypes: ['stadium'], osmTags: ['leisure=stadium'] },
    { id: 'zoo', label: 'Zoo e Parchi Faunistici', group: 'Intrattenimento e Cultura', googleTypes: ['zoo'], osmTags: ['tourism=zoo'] },
    { id: 'discoteche', label: 'Discoteche e Night Club', group: 'Intrattenimento e Cultura', googleTypes: ['night_club'], osmTags: ['amenity=nightclub'] },
    { id: 'casino', label: 'Casinò e Sale Giochi', group: 'Intrattenimento e Cultura', googleTypes: ['casino', 'bowling_alley'], osmTags: ['amenity=casino', 'leisure=bowling_alley'] },
    { id: 'attrazioni', label: 'Attrazioni Turistiche', group: 'Intrattenimento e Cultura', googleTypes: ['tourist_attraction'], osmTags: ['tourism=attraction'] },

    // Istruzione e Religione
    { id: 'scuole_infanzia', label: 'Scuole Primarie e Materne', group: 'Istruzione e Religione', googleTypes: ['primary_school'], osmTags: ['amenity=kindergarten'] },
    { id: 'scuole', label: 'Scuole e Istituti Superiori', group: 'Istruzione e Religione', googleTypes: ['school', 'secondary_school'], osmTags: ['amenity=school'] },
    { id: 'universita', label: 'Università', group: 'Istruzione e Religione', googleTypes: ['university'], osmTags: ['amenity=university'] },
    { id: 'autoscuole', label: 'Autoscuole e Scuole Guida', group: 'Istruzione e Religione', googleTypes: ['driving_school'], osmTags: ['amenity=driving_school'] },
    { id: 'biblioteche', label: 'Biblioteche', group: 'Istruzione e Religione', googleTypes: ['library'], osmTags: ['amenity=library'] },
    { id: 'chiese', label: 'Chiese e Luoghi di Culto Cattolici', group: 'Istruzione e Religione', googleTypes: ['church'], osmTags: ['amenity=place_of_worship'] },
    { id: 'altre_religioni', label: 'Moschee, Sinagoghe e Templi', group: 'Istruzione e Religione', googleTypes: ['hindu_temple', 'mosque', 'synagogue'], osmTags: ['amenity=place_of_worship'] },

    // Trasporti e Viaggi
    { id: 'aeroporti', label: 'Aeroporti', group: 'Trasporti e Viaggi', googleTypes: ['airport'], osmTags: ['aeroway=aerodrome'] },
    { id: 'stazioni_treno', label: 'Stazioni Ferroviarie', group: 'Trasporti e Viaggi', googleTypes: ['train_station', 'light_rail_station', 'subway_station'], osmTags: ['railway=station', 'railway=halt'] },
    { id: 'stazioni_bus', label: 'Stazioni e Fermate Autobus', group: 'Trasporti e Viaggi', googleTypes: ['bus_station', 'transit_station'], osmTags: ['amenity=bus_station', 'highway=bus_stop'] },
    { id: 'taxi', label: 'Parcheggi Taxi', group: 'Trasporti e Viaggi', googleTypes: ['taxi_stand'], osmTags: ['amenity=taxi'] },
    { id: 'distributori', label: 'Distributori di Carburante', group: 'Trasporti e Viaggi', googleTypes: ['gas_station'], osmTags: ['amenity=fuel'] },
    { id: 'parcheggi', label: 'Parcheggi e Rimesse', group: 'Trasporti e Viaggi', googleTypes: ['parking'], osmTags: ['amenity=parking'] },
    { id: 'alberghi', label: 'Alberghi, B&B e Alloggi', group: 'Trasporti e Viaggi', googleTypes: ['lodging'], osmTags: ['tourism=hotel', 'tourism=bed_and_breakfast', 'tourism=guest_house'] },
    { id: 'campeggi', label: 'Campeggi e Aree Camper', group: 'Trasporti e Viaggi', googleTypes: ['campground', 'rv_park'], osmTags: ['tourism=camp_site', 'tourism=caravan_site'] },
    { id: 'agenzie_viaggi', label: 'Agenzie di Viaggi', group: 'Trasporti e Viaggi', googleTypes: ['travel_agency'], osmTags: ['shop=travel_agency'] },

    // Servizi Pubblici e Istituzioni
    { id: 'comuni', label: 'Comuni e Uffici Governativi', group: 'Servizi Pubblici', googleTypes: ['city_hall', 'local_government_office'], osmTags: ['amenity=townhall', 'office=government'] },
    { id: 'tribunali', label: 'Tribunali', group: 'Servizi Pubblici', googleTypes: ['courthouse'], osmTags: ['amenity=courthouse'] },
    { id: 'ambasciate', label: 'Ambasciate e Consolati', group: 'Servizi Pubblici', googleTypes: ['embassy'], osmTags: ['amenity=embassy'] },
    { id: 'vigili_fuoco', label: 'Vigili del Fuoco', group: 'Servizi Pubblici', googleTypes: ['fire_station'], osmTags: ['amenity=fire_station'] },
    { id: 'polizia', label: 'Polizia e Forze dell\'Ordine', group: 'Servizi Pubblici', googleTypes: ['police'], osmTags: ['amenity=police'] },
    { id: 'poste', label: 'Uffici Postali', group: 'Servizi Pubblici', googleTypes: ['post_office'], osmTags: ['amenity=post_office'] },
    
    // Varie
    { id: 'magazzini', label: 'Magazzini e Depositi', group: 'Varie', googleTypes: ['storage'], osmTags: ['building=warehouse'] }
];
