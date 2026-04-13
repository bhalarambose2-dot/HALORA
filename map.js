<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes">
    <title>Jaipur & Jodhpur | Interactive Maps</title>
    <!-- Leaflet CSS + JS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            background: #eef2f5;
            font-family: 'Segoe UI', Roboto, 'Inter', sans-serif;
            padding: 20px 16px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .map-container {
            max-width: 1200px;
            width: 100%;
            background: white;
            border-radius: 32px;
            box-shadow: 0 20px 35px -12px rgba(0,0,0,0.2);
            overflow: hidden;
        }
        .city-tabs {
            display: flex;
            background: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
        }
        .tab-btn {
            flex: 1;
            padding: 16px;
            text-align: center;
            font-weight: 700;
            font-size: 18px;
            cursor: pointer;
            background: transparent;
            border: none;
            transition: 0.2s;
            color: #334155;
        }
        .tab-btn.active {
            background: white;
            color: #1e7b4b;
            border-bottom: 3px solid #1e7b4b;
        }
        .map-wrapper {
            position: relative;
            height: 500px;
            width: 100%;
        }
        #jaipurMap, #jodhpurMap {
            height: 100%;
            width: 100%;
        }
        .hidden-map {
            display: none;
        }
        .info-panel {
            padding: 16px 20px;
            background: #f9fafb;
            border-top: 1px solid #e2e8f0;
            font-size: 14px;
            color: #1e293b;
        }
        .badge-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 8px;
        }
        .badge {
            background: #eef2ff;
            padding: 4px 12px;
            border-radius: 30px;
            font-size: 12px;
            font-weight: 500;
        }
        @media (max-width: 640px) {
            .map-wrapper { height: 400px; }
            .tab-btn { font-size: 16px; padding: 12px; }
        }
    </style>
</head>
<body>
<div class="map-container">
    <div class="city-tabs">
        <button class="tab-btn active" id="jaipurTab">📍 Jaipur (Pink City)</button>
        <button class="tab-btn" id="jodhpurTab">🏜️ Jodhpur (Blue City)</button>
    </div>
    <div class="map-wrapper">
        <div id="jaipurMap"></div>
        <div id="jodhpurMap" class="hidden-map"></div>
    </div>
    <div class="info-panel">
        <strong>📍 Major locations</strong>
        <div class="badge-list" id="locationBadges">
            <!-- dynamic badges will be filled by JS -->
        </div>
        <div style="margin-top: 8px; font-size:12px; color:#5b6e8c;">
            📍 Tap any marker for details | 🗺️ Zoom in/out for street view
        </div>
    </div>
</div>

<script>
    // ---------- JAIPUR LOCATIONS (lat, lng, name, icon) ----------
    const jaipurPlaces = [
        { name: "Jaipur Railway Station", lat: 26.9185, lng: 75.7873, type: "station" },
        { name: "Jaipur International Airport (JAI)", lat: 26.8241, lng: 75.8122, type: "airport" },
        { name: "Hawa Mahal", lat: 26.9239, lng: 75.8267, type: "heritage" },
        { name: "Amer Fort", lat: 26.9859, lng: 75.8513, type: "fort" },
        { name: "City Palace", lat: 26.9255, lng: 75.8236, type: "palace" },
        { name: "Jantar Mantar", lat: 26.9247, lng: 75.8246, type: "observatory" },
        { name: "Jal Mahal", lat: 26.9534, lng: 75.8465, type: "lake" },
        { name: "Albert Hall Museum", lat: 26.9115, lng: 75.8196, type: "museum" },
        { name: "Birla Mandir", lat: 26.8926, lng: 75.8057, type: "temple" },
        { name: "Chokhi Dhani", lat: 26.8321, lng: 75.8055, type: "resort" },
        { name: "Sanganer", lat: 26.8572, lng: 75.7876, type: "suburb" },
        { name: "Mansarovar", lat: 26.8555, lng: 75.7654, type: "locality" },
        { name: "Vaishali Nagar", lat: 26.8913, lng: 75.7352, type: "locality" },
        { name: "Malviya Nagar", lat: 26.8558, lng: 75.7862, type: "locality" },
        { name: "C-Scheme", lat: 26.9027, lng: 75.7911, type: "area" },
        { name: "Tonk Road", lat: 26.8402, lng: 75.7953, type: "road" },
        { name: "Sitapura", lat: 26.8204, lng: 75.7998, type: "industrial" },
        { name: "Jhotwara", lat: 26.9437, lng: 75.7209, type: "suburb" },
        { name: "Vidyadhar Nagar", lat: 26.9372, lng: 75.7621, type: "colony" },
        { name: "Kukas", lat: 26.9785, lng: 75.8143, type: "town" },
        { name: "Bani Park", lat: 26.9125, lng: 75.7805, type: "locality" },
        { name: "Raja Park", lat: 26.8762, lng: 75.8001, type: "colony" },
        { name: "Gopalpura Bypass", lat: 26.8325, lng: 75.7712, type: "highway" }
    ];

    // ---------- JODHPUR LOCATIONS ----------
    const jodhpurPlaces = [
        { name: "Jodhpur Railway Station", lat: 26.2918, lng: 73.0294, type: "station" },
        { name: "Jodhpur Airport (JDH)", lat: 26.2519, lng: 73.0489, type: "airport" },
        { name: "Mehrangarh Fort", lat: 26.2985, lng: 73.0193, type: "fort" },
        { name: "Jaswant Thada", lat: 26.3028, lng: 73.0251, type: "memorial" },
        { name: "Umaid Bhawan Palace", lat: 26.2815, lng: 73.0432, type: "palace" },
        { name: "Kaylana Lake", lat: 26.2774, lng: 72.9975, type: "lake" },
        { name: "Mandore Garden", lat: 26.3413, lng: 73.0312, type: "garden" },
        { name: "Sardar Market (Clock Tower)", lat: 26.2932, lng: 73.0255, type: "market" },
        { name: "Ghanta Ghar", lat: 26.2929, lng: 73.0261, type: "landmark" },
        { name: "Rao Jodha Desert Rock Park", lat: 26.3002, lng: 73.0182, type: "park" },
        { name: "Balsamand Lake", lat: 26.3367, lng: 73.0056, type: "lake" },
        { name: "Pal Balaji Temple", lat: 26.3245, lng: 73.0415, type: "temple" },
        { name: "Shastri Nagar", lat: 26.2844, lng: 73.0427, type: "locality" },
        { name: "Ratanada", lat: 26.2713, lng: 73.0368, type: "locality" },
        { name: "Sardarpura", lat: 26.2836, lng: 73.0332, type: "colony" },
        { name: "Chopasani Road", lat: 26.2721, lng: 73.0245, type: "road" },
        { name: "Basni", lat: 26.2624, lng: 73.0225, type: "industrial" },
        { name: "Paota", lat: 26.3045, lng: 73.0147, type: "suburb" },
        { name: "Soorsagar", lat: 26.3456, lng: 73.0021, type: "village" }
    ];

    // custom marker icon (optional)
    function getIcon(color = "#1e7b4b") {
        return L.divIcon({
            html: `<div style="background-color:${color}; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.3);"><i class="fa fa-map-marker" style="color:white; font-size:12px;"></i></div>`,
            iconSize: [24, 24],
            popupAnchor: [0, -12]
        });
    }

    // fallback: if fontawesome not loaded, simple marker
    function simpleIcon(color) {
        return L.divIcon({
            html: `<div style="background:${color}; width:22px; height:22px; border-radius:22px; border:2px solid white; box-shadow:0 1px 4px black;"></div>`,
            iconSize: [22, 22]
        });
    }

    let jaipurMap, jodhpurMap;
    let jaipurMarkers = [], jodhpurMarkers = [];

    function initJaipurMap() {
        jaipurMap = L.map('jaipurMap').setView([26.9124, 75.7873], 12);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> & CartoDB',
            subdomains: 'abcd',
            maxZoom: 18
        }).addTo(jaipurMap);
        
        jaipurPlaces.forEach(place => {
            let marker = L.marker([place.lat, place.lng], { icon: simpleIcon("#1e7b4b") })
                .addTo(jaipurMap)
                .bindPopup(`<b>${place.name}</b><br>📍 ${place.type}`);
            jaipurMarkers.push(marker);
        });
    }

    function initJodhpurMap() {
        jodhpurMap = L.map('jodhpurMap').setView([26.291, 73.027], 12);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OSM contributors',
            subdomains: 'abcd'
        }).addTo(jodhpurMap);
        
        jodhpurPlaces.forEach(place => {
            let marker = L.marker([place.lat, place.lng], { icon: simpleIcon("#e67e22") })
                .addTo(jodhpurMap)
                .bindPopup(`<b>${place.name}</b><br>🏜️ ${place.type}`);
            jodhpurMarkers.push(marker);
        });
    }

    // tab switching
    const jaipurTab = document.getElementById('jaipurTab');
    const jodhpurTab = document.getElementById('jodhpurTab');
    const jaipurDiv = document.getElementById('jaipurMap');
    const jodhpurDiv = document.getElementById('jodhpurMap');
    const badgeContainer = document.getElementById('locationBadges');

    function updateBadges(city) {
        let places = city === 'jaipur' ? jaipurPlaces : jodhpurPlaces;
        badgeContainer.innerHTML = places.map(p => `<span class="badge">${p.name}</span>`).join('');
    }

    function showJaipur() {
        jaipurDiv.classList.remove('hidden-map');
        jodhpurDiv.classList.add('hidden-map');
        jaipurTab.classList.add('active');
        jodhpurTab.classList.remove('active');
        updateBadges('jaipur');
        // resize map fix
        setTimeout(() => { if(jaipurMap) jaipurMap.invalidateSize(); }, 100);
    }

    function showJodhpur() {
        jodhpurDiv.classList.remove('hidden-map');
        jaipurDiv.classList.add('hidden-map');
        jodhpurTab.classList.add('active');
        jaipurTab.classList.remove('active');
        updateBadges('jodhpur');
        setTimeout(() => { if(jodhpurMap) jodhpurMap.invalidateSize(); }, 100);
    }

    jaipurTab.addEventListener('click', showJaipur);
    jodhpurTab.addEventListener('click', showJodhpur);

    // initialize both maps
    initJaipurMap();
    initJodhpurMap();
    
    // initially show jaipur
    showJaipur();

    // optional: add Fontawesome for nicer icons (just visual)
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css';
    document.head.appendChild(link);
</script>
</body>
</html>
