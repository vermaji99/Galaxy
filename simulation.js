// --- 1. Scene Setup ---
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
var renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('.webgl'),
    antialias: true,
    powerPreference: "high-performance"
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping; 
renderer.toneMappingExposure = 1.0; 

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// --- 2. Global Loaders & Constants ---
var textureLoader = new THREE.TextureLoader();

// Base URLs
var localTextureBaseUrl = './assets/textures/';
var cdnTextureBaseUrl = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/';

// Mapping for local files to their CDN fallbacks (just in case local fails)
const textureFallbacks = {
    '8k_sun.jpg': 'sun.jpg',
    'mercury.jpg': 'mercury.jpg',
    'venus_surface.jpg': 'venus_surface.jpg',
    '4k_venus_atmosphere.jpg': 'venus_atmosphere.jpg',
    '8k_mars.jpg': 'mars.jpg',
    '8k_jupiter.jpg': 'jupiter.jpg',
    '8k_saturn.jpg': 'saturn.jpg',
    '8k_saturn_ring_alpha.png': 'saturn_ring_alpha.png',
    '2k_uranus.jpg': 'uranus.jpg',
    '2k_neptune.jpg': 'neptune.jpg',
    '8k_moon.jpg': 'moon.jpg'
};

// Earth-specific high-res assets (always CDN as they look better)
const earthTextures = {
    day: cdnTextureBaseUrl + 'earth_atmos_2048.jpg', 
    night: cdnTextureBaseUrl + 'earth_nightmap_2048.jpg', 
    specular: cdnTextureBaseUrl + 'earth_specular_2048.jpg', 
    normal: cdnTextureBaseUrl + 'earth_normal_2048.jpg',
    clouds: cdnTextureBaseUrl + 'earth_clouds_2048.jpg'
};

// Helper: Load Texture with CDN Fallback
function loadTexture(material, mapType, filename, isLocal = true) {
    var primaryUrl = isLocal ? localTextureBaseUrl + filename : filename;
    var fallbackUrl = cdnTextureBaseUrl + (textureFallbacks[filename] || filename);
    
    // Attempt local load
    textureLoader.load(
        primaryUrl,
        function(tex) {
            tex.encoding = THREE.sRGBEncoding;
            tex.anisotropy = 16;
            material[mapType] = tex;
            material.needsUpdate = true;
            console.log('Loaded: ' + filename);
        },
        undefined,
        function() {
            console.warn('Local failed, trying CDN: ' + filename);
            // Attempt CDN fallback
            textureLoader.load(
                fallbackUrl,
                function(tex) {
                    tex.encoding = THREE.sRGBEncoding;
                    tex.anisotropy = 16;
                    material[mapType] = tex;
                    material.needsUpdate = true;
                }
            );
        }
    );
}

// --- 3. Lighting ---
// Minimal Ambient Light for deep space realism
var ambientLight = new THREE.AmbientLight(0xffffff, 0.2); 
scene.add(ambientLight);

// Point Light at the Sun's center - Main light source
var sunLight = new THREE.PointLight(0xffffff, 1.0, 2000); 
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

// Hemisphere light for subtle fill
var hemiLight = new THREE.HemisphereLight(0xffffff, 0x000000, 0.2);
scene.add(hemiLight);

// --- 4. Celestial Objects Definitions ---

// Helper: Create Atmosphere Glow
function createAtmosphere(planet, size, color) {
    var canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    var ctx = canvas.getContext('2d');
    var grad = ctx.createRadialGradient(64, 64, 45, 64, 64, 64);
    grad.addColorStop(0.85, 'rgba(0, 0, 0, 0)'); // Transparent inner
    grad.addColorStop(0.95, color.replace('1)', '0.3)')); // Soft blue rim
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)'); // Soft edge
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    
    var sprite = new THREE.Sprite(new THREE.SpriteMaterial({ 
        map: new THREE.CanvasTexture(canvas), 
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.6 // Lower opacity so it doesn't wash out the planet
    }));
    sprite.scale.set(size * 2.2, size * 2.2, 1); 
    planet.add(sprite);
}

// Helper: Create Saturn Rings with High-Resolution Realistic Bands
function createSaturnRings(planet, inner, outer) {
    var geometry = new THREE.RingGeometry(inner, outer, 256); 
    var pos = geometry.attributes.position;
    var v3 = new THREE.Vector3();
    for (var i = 0; i < pos.count; i++) {
        v3.fromBufferAttribute(pos, i);
        var dist = v3.length();
        var normalized = (dist - inner) / (outer - inner);
        geometry.attributes.uv.setXY(i, normalized, 0.5);
    }

    var ringMat = new THREE.MeshStandardMaterial({ 
        side: THREE.DoubleSide, 
        transparent: true, 
        opacity: 0.8, 
        roughness: 0.8,
        metalness: 0.0
    });
    loadTexture(ringMat, 'map', '8k_saturn_ring_alpha.png');

    var ring = new THREE.Mesh(geometry, ringMat);
    ring.rotation.x = Math.PI / 2;
    planet.add(ring);
}

// Starfield
function createStarfield() {
    var starGeometry = new THREE.BufferGeometry();
    var starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.6 });
    var starVertices = [];
    for (var i = 0; i < 20000; i++) {
        starVertices.push((Math.random() - 0.5) * 4000, (Math.random() - 0.5) * 4000, (Math.random() - 0.5) * 4000);
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    var stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
}
createStarfield();

// Galaxy Skybox
function createGalaxy() {
    var galaxyGeometry = new THREE.SphereGeometry(1800, 64, 64);
    var galaxyMaterial = new THREE.MeshBasicMaterial({
        side: THREE.BackSide,
        transparent: true,
        opacity: 0.3, // Much lower opacity for a darker feel
        color: 0x050508 // Darker, less blue color
    });
    loadTexture(galaxyMaterial, 'map', cdnTextureBaseUrl + 'starmap_4k.jpg', false);
    var galaxy = new THREE.Mesh(galaxyGeometry, galaxyMaterial);
    scene.add(galaxy);
}
createGalaxy();

// Helper: Create Orbit Ring
function createOrbit(distance) {
    var geometry = new THREE.TorusGeometry(distance, 0.05, 16, 300);
    var material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.06 });
    var orbit = new THREE.Mesh(geometry, material);
    orbit.rotation.x = Math.PI / 2;
    scene.add(orbit);
}



// Helper: Create Planet with Layers (Normal, Specular, Clouds)
function createPlanet(size, textureFile, x, name, color, tilt, atmosphereColor, extras) {
    var geometry = new THREE.SphereGeometry(size, 128, 128); 
    
    // 1. Material setup - Use pure white so texture isn't tinted
    var material = new THREE.MeshStandardMaterial({ 
        color: 0xffffff, 
        roughness: 0.8,
        metalness: 0.1
    });

    var isEarth = (name === 'Earth');

    // 2. Apply main texture
    if (isEarth) {
        loadTexture(material, 'map', earthTextures.day, false);
    } else {
        loadTexture(material, 'map', textureFile);
    }

    // 3. Add Normal and Specular maps if available
    if (extras && extras.normalMap) {
        if (isEarth) {
            loadTexture(material, 'normalMap', earthTextures.normal, false);
        } else {
            loadTexture(material, 'normalMap', extras.normalMap);
        }
    }
    if (extras && extras.specularMap) {
        if (isEarth) {
            loadTexture(material, 'roughnessMap', earthTextures.specular, false);
        } else {
            loadTexture(material, 'roughnessMap', extras.specularMap);
        }
    }

    var planet = new THREE.Mesh(geometry, material);
    planet.name = name;
    planet.rotation.z = (tilt || 0) * (Math.PI / 180);
    
    var planetGroup = new THREE.Group();
    planetGroup.add(planet);

    // 4. Earth-specific Political Boundaries (Removed for clarity)

    // 5. Cloud Layer (Removed for Earth to ensure clarity)
    var clouds = null;
    if (extras && extras.clouds && !isEarth) {
        var cloudOffset = 0.04; 
        var cloudGeom = new THREE.SphereGeometry(size + cloudOffset, 128, 128);
        var targetOpacity = 0.4;
        var cloudMat = new THREE.MeshLambertMaterial({ 
            transparent: true,
            opacity: targetOpacity, 
            depthWrite: false
        });
        loadTexture(cloudMat, 'map', extras.clouds);
        clouds = new THREE.Mesh(cloudGeom, cloudMat);
        planet.add(clouds);
    }
    
    // Atmosphere (Removed for Earth to ensure clarity)
    if (atmosphereColor && !isEarth) {
        createAtmosphere(planet, size, atmosphereColor);
    }
    
    var orbitGroup = new THREE.Object3D();
    orbitGroup.add(planetGroup);
    scene.add(orbitGroup);
    planetGroup.position.x = x;
    
    // Saturn's Ring Special Handling
    if (name === 'Saturn') {
        createSaturnRings(planet, size * 1.4, size * 2.5);
    }
    
    return { mesh: planet, group: orbitGroup, clouds: clouds };
}

// Sun - Brilliant Glowing Star
var sunGeometry = new THREE.SphereGeometry(15, 128, 128);
var sunMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xffffff // Set to white so texture is not tinted
});
loadTexture(sunMaterial, 'map', '8k_sun.jpg');
var sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.name = 'Sun';
scene.add(sun);

// Sun Corona Glow
function createSunGlow() {
    var canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    var ctx = canvas.getContext('2d');
    var grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, 'rgba(255, 255, 200, 1)');
    grad.addColorStop(0.2, 'rgba(255, 200, 50, 0.8)');
    grad.addColorStop(0.5, 'rgba(255, 100, 0, 0.3)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
    
    var sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ 
        map: new THREE.CanvasTexture(canvas), 
        blending: THREE.AdditiveBlending,
        transparent: true
    }));
    sunGlow.scale.set(100, 100, 1);
sun.add(sunGlow);
}
createSunGlow();

// Planets Data & Creation with Realistic Textures and Slower Speeds
var planets = [];
var planetConfigs = [
    { name: 'Mercury', size: 1.2, texture: 'mercury.jpg', dist: 40, speed: 0.002, tilt: 0.03, color: 0xaaaaaa, 
      extras: { roughness: 0.95 }, rotSpeed: 0.0001 }, // Very slow rotation (58.6 days)
    { name: 'Venus', size: 2.8, texture: 'venus_surface.jpg', dist: 65, speed: 0.0015, tilt: 177.4, color: 0xffa500, atmosphere: 'rgba(255, 200, 100, 1)',
      extras: { clouds: '4k_venus_atmosphere.jpg', roughness: 0.8 }, rotSpeed: -0.00005 }, // Retrograde, very slow (243 days)
    { name: 'Earth', size: 3.0, texture: 'earth_atmos_2048.jpg', dist: 95, speed: 0.001, tilt: 23.44, color: 0xffffff, atmosphere: 'rgba(100, 150, 255, 1)',
      extras: { clouds: 'earth_clouds_2048.jpg', normalMap: 'earth_normal_2048.jpg', specularMap: 'earth_specular_2048.jpg', roughness: 1.0, metalness: 0.3 }, rotSpeed: 0.005 }, // Reference (1 day)
    { name: 'Mars', size: 1.8, texture: '8k_mars.jpg', dist: 125, speed: 0.0008, tilt: 25.19, color: 0xff4500, atmosphere: 'rgba(255, 100, 100, 1)',
      extras: { roughness: 0.9 }, rotSpeed: 0.0048 }, // Similar to Earth (1.03 days)
    { name: 'Jupiter', size: 9.0, texture: '8k_jupiter.jpg', dist: 190, speed: 0.0004, tilt: 3.13, color: 0xffa500,
      extras: { roughness: 0.7, metalness: 0.0 }, rotSpeed: 0.012 }, // Fast rotation (9.9 hours)
    { name: 'Saturn', size: 7.5, texture: '8k_saturn.jpg', dist: 260, speed: 0.0003, tilt: 26.73, color: 0xf0e68c,
      extras: { roughness: 0.7, metalness: 0.0 }, rotSpeed: 0.011 }, // Fast rotation (10.7 hours)
    { name: 'Uranus', size: 5.0, texture: '2k_uranus.jpg', dist: 330, speed: 0.0002, tilt: 97.77, color: 0xadd8e6,
      extras: { roughness: 0.8, metalness: 0.0 }, rotSpeed: -0.007 }, // Retrograde, fast (17.2 hours)
    { name: 'Neptune', size: 4.8, texture: '2k_neptune.jpg', dist: 400, speed: 0.0001, tilt: 28.32, color: 0x00008b,
      extras: { roughness: 0.8, metalness: 0.0 }, rotSpeed: 0.0075 } // Fast rotation (16.1 hours)
];

planetConfigs.forEach(function(conf) {
    createOrbit(conf.dist);
    var p = createPlanet(conf.size, conf.texture, conf.dist, conf.name, conf.color, conf.tilt, conf.atmosphere, conf.extras);
    planets.push({ mesh: p.mesh, group: p.group, speed: conf.speed, clouds: p.clouds, rotSpeed: conf.rotSpeed });
});

// Earth's Moon
var earthObj = planets.find(p => p.mesh.name === 'Earth');
var moonMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.8, 64, 64),
    new THREE.MeshStandardMaterial({ 
        color: 0xffffff, // White base
        roughness: 0.9 
    })
);
loadTexture(moonMesh.material, 'map', '8k_moon.jpg');
moonMesh.position.x = 6;
earthObj.mesh.add(moonMesh);

// Asteroid Belt
var asteroidBelt = new THREE.Object3D();
scene.add(asteroidBelt);
for (var i = 0; i < 4000; i++) {
    var ast = new THREE.Mesh(new THREE.SphereGeometry(Math.random() * 0.2, 8, 8), new THREE.MeshStandardMaterial({ color: 0x777777 }));
    var angle = Math.random() * Math.PI * 2;
    var d = 150 + Math.random() * 25;
    ast.position.set(Math.cos(angle) * d, (Math.random() - 0.5) * 4, Math.sin(angle) * d);
    ast.rotation.set(Math.random(), Math.random(), Math.random());
    asteroidBelt.add(ast);
}

// --- 5. Interaction & UI ---
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var infoPanel = document.getElementById('info-panel');
var targetFocus = null;
window.isDragging = false; // Make global for extensions.js
var startPoint = { x: 0, y: 0 };

var planetData = {
    mercury: { distance: '57.9M km', radius: '2,440 km', gravity: '3.7 m/s²', dayLength: '1407.6h', orbitalPeriod: '88d', surfaceTemp: '167°C', funFact: 'Smallest planet.' },
    venus: { distance: '108.2M km', radius: '6,052 km', gravity: '8.9 m/s²', dayLength: '5832.5h', orbitalPeriod: '225d', surfaceTemp: '462°C', funFact: 'Hottest planet.' },
    earth: { distance: '149.6M km', radius: '6,371 km', gravity: '9.8 m/s²', dayLength: '24h', orbitalPeriod: '365d', surfaceTemp: '15°C', funFact: 'You are here!' },
    mars: { distance: '227.9M km', radius: '3,390 km', gravity: '3.7 m/s²', dayLength: '24.6h', orbitalPeriod: '687d', surfaceTemp: '-65°C', funFact: 'Home to Olympus Mons.' },
    jupiter: { distance: '778.5M km', radius: '69,911 km', gravity: '24.8 m/s²', dayLength: '9.9h', orbitalPeriod: '11.9y', surfaceTemp: '-145°C', funFact: 'Great Red Spot storm.' },
    saturn: { distance: '1.4B km', radius: '58,232 km', gravity: '10.4 m/s²', dayLength: '10.7h', orbitalPeriod: '29.5y', surfaceTemp: '-178°C', funFact: 'Ice rings.' },
    uranus: { distance: '2.9B km', radius: '25,362 km', gravity: '8.7 m/s²', dayLength: '17.2h', orbitalPeriod: '84y', surfaceTemp: '-224°C', funFact: 'Side rotator.' },
    neptune: { distance: '4.5B km', radius: '24,622 km', gravity: '11.2 m/s²', dayLength: '16.1h', orbitalPeriod: '164.8y', surfaceTemp: '-214°C', funFact: 'Strongest winds.' }
};

// Handle both mouse and touch interaction professionally
function handleInteraction(clientX, clientY, isMove = false) {
    if (isMove) {
        const dist = Math.sqrt(Math.pow(clientX - startPoint.x, 2) + Math.pow(clientY - startPoint.y, 2));
        if (dist > 5) window.isDragging = true;
        return;
    }

    if (window.isDragging) return;

    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(scene.children, true);
    
    if (intersects.length > 0) {
        var obj = intersects[0].object;
        var p = planets.find(p => p.mesh === obj || p.mesh === obj.parent || (obj.parent && p.mesh === obj.parent.parent));
        if (p) {
            targetFocus = p.mesh;
            var data = planetData[p.mesh.name.toLowerCase()];
            document.getElementById('planet-name').textContent = p.mesh.name;
            document.getElementById('distance').textContent = data.distance;
            document.getElementById('radius').textContent = data.radius;
            document.getElementById('gravity').textContent = data.gravity;
            document.getElementById('day-length').textContent = data.dayLength;
            document.getElementById('orbital-period').textContent = data.orbitalPeriod;
            document.getElementById('surface-temp').textContent = data.surfaceTemp;
            document.getElementById('fun-fact').textContent = data.funFact;
            infoPanel.classList.remove('hidden');
        }
    }
}

window.addEventListener('pointerdown', (e) => {
    window.isDragging = false;
    startPoint = { x: e.clientX, y: e.clientY };
});

window.addEventListener('pointermove', (e) => {
    handleInteraction(e.clientX, e.clientY, true);
});

window.addEventListener('pointerup', (e) => {
    handleInteraction(e.clientX, e.clientY);
});

document.getElementById('close-panel').addEventListener('pointerup', function(e) { 
    e.stopPropagation();
    infoPanel.classList.add('hidden'); 
    targetFocus = null;
    gsap.to(controls.target, { x: 0, y: 0, z: 0, duration: 1.5, ease: "power2.inOut" });
});

// --- 6. Post-Processing & Animation ---
var composer = new THREE.EffectComposer(renderer);
composer.addPass(new THREE.RenderPass(scene, camera));
var bloom = new THREE.UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight), 
    1.0, 0.4, 0.85
);
// Optimize bloom for mobile performance
const isMobile = window.innerWidth < 768;
bloom.threshold = 0.95;
bloom.strength = isMobile ? 0.6 : 1.0; 
bloom.radius = isMobile ? 0.3 : 0.5;
composer.addPass(bloom);

var controls = new THREE.OrbitControls(camera, renderer.domElement);
camera.position.set(0, 300, 600);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.rotateSpeed = 0.5; // Smoother rotation for touch
controls.minDistance = 3.5; // Allow surface level zoom (Earth size is 3.0)
controls.maxDistance = 1500;
controls.update();

window.addEventListener('resize', function() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    composer.setSize(width, height);
});

function animate() {
    requestAnimationFrame(animate);
    
    // Update active modules
    if (typeof updateExtensions === 'function') {
        updateExtensions();
    }

    sun.rotation.y += 0.0005; // Sun axial rotation
    moonMesh.rotation.y += 0.002;
    
    planets.forEach(p => {
        p.mesh.rotation.y += p.rotSpeed * 0.5; // Slower axial rotation
        p.group.rotation.y += p.speed * 0.5; // Slower orbital speed
        
        if (p.clouds) {
            p.clouds.rotation.y += 0.0003; // Slower cloud movement
        }
    });
    
    asteroidBelt.rotation.y += 0.00002;
    
    if (targetFocus) {
        var worldPos = new THREE.Vector3();
        targetFocus.getWorldPosition(worldPos);
        controls.target.lerp(worldPos, 0.05); // Smoother camera tracking
    }
    
    controls.update();
    // Re-enable composer for bloom effect (glow)
    composer.render();
}

// --- 7. Space Exploration Extensions ---
if (typeof createMoons === 'function') {
    createMoons();
    createAsteroidBelt();
    createStarField();
    createGalaxies();
    createComets();
    enableDeepSpaceZoom();
}

animate();
