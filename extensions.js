
// --- Space Exploration Extensions ---

// 1. Planet Moons System
const moonData = {
    'Earth': [
        { name: 'Moon', size: 0.8, dist: 6, speed: 0.01, texture: '8k_moon.jpg' }
    ],
    'Mars': [
        { name: 'Phobos', size: 0.2, dist: 3, speed: 0.02, color: 0x8b7d7b },
        { name: 'Deimos', size: 0.15, dist: 4.5, speed: 0.015, color: 0xa9a9a9 }
    ],
    'Jupiter': [
        { name: 'Io', size: 0.4, dist: 13, speed: 0.01, color: 0xffef00 },
        { name: 'Europa', size: 0.38, dist: 15, speed: 0.008, color: 0xcccccc },
        { name: 'Ganymede', size: 0.55, dist: 18, speed: 0.006, color: 0x999999 },
        { name: 'Callisto', size: 0.52, dist: 22, speed: 0.004, color: 0x777777 }
    ],
    'Saturn': [
        { name: 'Titan', size: 0.6, dist: 15, speed: 0.007, color: 0xffd700 },
        { name: 'Enceladus', size: 0.25, dist: 11, speed: 0.012, color: 0xffffff },
        { name: 'Rhea', size: 0.3, dist: 13, speed: 0.009, color: 0xdddddd }
    ],
    'Uranus': [
        { name: 'Titania', size: 0.35, dist: 8, speed: 0.01, color: 0xcccccc },
        { name: 'Oberon', size: 0.33, dist: 10, speed: 0.008, color: 0xbbbbbb }
    ],
    'Neptune': [
        { name: 'Triton', size: 0.45, dist: 8, speed: 0.009, color: 0xeeeeee }
    ]
};

var moonObjects = [];

function createMoons() {
    // Hide original Earth moon if it exists
    if (typeof moonMesh !== 'undefined') {
        moonMesh.visible = false;
    }

    planets.forEach(p => {
        const moons = moonData[p.mesh.name];
        if (moons) {
            moons.forEach(m => {
                // Moon Group for Orbit
                const moonOrbitGroup = new THREE.Group();
                p.mesh.add(moonOrbitGroup);

                // Moon Mesh
                const geometry = new THREE.SphereGeometry(m.size, 32, 32);
                let material;
                if (m.texture) {
                    material = new THREE.MeshStandardMaterial({ roughness: 0.9 });
                    loadTexture(material, 'map', m.texture);
                } else {
                    material = new THREE.MeshStandardMaterial({ color: m.color, roughness: 0.8 });
                }
                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.x = m.dist;
                mesh.name = m.name;
                moonOrbitGroup.add(mesh);

                // Moon Orbit Path (Subtle)
                const orbitGeom = new THREE.TorusGeometry(m.dist, 0.01, 8, 128);
                const orbitMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1 });
                const orbit = new THREE.Mesh(orbitGeom, orbitMat);
                orbit.rotation.x = Math.PI / 2;
                moonOrbitGroup.add(orbit);

                moonObjects.push({
                    mesh: mesh,
                    orbitGroup: moonOrbitGroup,
                    speed: m.speed,
                    rotSpeed: 0.01 + Math.random() * 0.02
                });
            });
        }
    });
}

// 2. Asteroid Belt (Optimized with InstancedMesh)
let instancedAsteroids;
let asteroidCount = 8000;
let asteroidData = [];

function createAsteroidBelt() {
    asteroidData = [];
    // Hide original asteroid belt if it exists
    if (typeof asteroidBelt !== 'undefined') {
        asteroidBelt.visible = false;
    }

    const geometry = new THREE.IcosahedronGeometry(0.15, 0);
    const material = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 });
    instancedAsteroids = new THREE.InstancedMesh(geometry, material, asteroidCount);

    const dummy = new THREE.Object3D();
    for (let i = 0; i < asteroidCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 145 + Math.random() * 35; // Between Mars (125) and Jupiter (190)
        const x = Math.cos(angle) * dist;
        const y = (Math.random() - 0.5) * 5;
        const z = Math.sin(angle) * dist;

        dummy.position.set(x, y, z);
        dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        const scale = 0.5 + Math.random() * 1.5;
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        instancedAsteroids.setMatrixAt(i, dummy.matrix);

        asteroidData.push({
            angle: angle,
            dist: dist,
            speed: 0.0001 + Math.random() * 0.0002,
            y: y,
            rotX: Math.random() * 0.01,
            rotY: Math.random() * 0.01,
            rotZ: Math.random() * 0.01
        });
    }
    scene.add(instancedAsteroids);
}

// 3. Meteoroids / Comets
const comets = [];
function createComets() {
    setInterval(() => {
        if (comets.length < 5) {
            spawnComet();
        }
    }, 5000);
}

function spawnComet() {
    const cometGroup = new THREE.Group();
    
    // Comet Head
    const headGeom = new THREE.SphereGeometry(0.5, 8, 8);
    const headMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const head = new THREE.Mesh(headGeom, headMat);
    cometGroup.add(head);

    // Comet Tail (Sprite or Particles)
    const tailCanvas = document.createElement('canvas');
    tailCanvas.width = 64; tailCanvas.height = 64;
    const ctx = tailCanvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(0, 255, 255, 0.8)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const tailMat = new THREE.SpriteMaterial({ 
        map: new THREE.CanvasTexture(tailCanvas),
        blending: THREE.AdditiveBlending,
        transparent: true
    });
    
    for(let i=0; i<15; i++) {
        const sprite = new THREE.Sprite(tailMat);
        sprite.scale.set(1, 1, 1);
        sprite.position.x = -i * 0.8;
        sprite.scale.multiplyScalar(1 - i/15);
        cometGroup.add(sprite);
    }

    // Random start and direction
    const startAngle = Math.random() * Math.PI * 2;
    const startDist = 500;
    cometGroup.position.set(Math.cos(startAngle) * startDist, (Math.random()-0.5)*100, Math.sin(startAngle) * startDist);
    
    const target = new THREE.Vector3(0, 0, 0);
    const direction = target.clone().sub(cometGroup.position).normalize();
    
    scene.add(cometGroup);
    comets.push({ group: cometGroup, direction: direction, speed: 1.5 + Math.random() * 2 });
}

// 4. Deep Space Star Field & 5. Major Stars Information
let deepStars;
const majorStarsData = [
    { name: 'Sirius', pos: [1000, 200, -800], dist: '8.6 ly', type: 'A1V', size: '1.7x Sun' },
    { name: 'Betelgeuse', pos: [-1200, 400, 500], dist: '642 ly', type: 'M1-2', size: '887x Sun' },
    { name: 'Rigel', pos: [-900, -300, 1100], dist: '860 ly', type: 'B8Ia', size: '79x Sun' },
    { name: 'Polaris', pos: [0, 1500, 0], dist: '433 ly', type: 'F7Ib', size: '37.5x Sun' },
    { name: 'Alpha Centauri', pos: [400, -500, -1300], dist: '4.37 ly', type: 'G2V', size: '1.1x Sun' },
    // Saptrishi (Ursa Major / Big Dipper)
    { name: 'Duhbe (Saptrishi)', pos: [-150, 1400, -400], dist: '123 ly', type: 'K0III', size: '30x Sun' },
    { name: 'Merak (Saptrishi)', pos: [-200, 1350, -350], dist: '79 ly', type: 'A1V', size: '3x Sun' },
    { name: 'Phecda (Saptrishi)', pos: [-250, 1300, -300], dist: '83 ly', type: 'A0V', size: '3x Sun' },
    { name: 'Megrez (Saptrishi)', pos: [-220, 1250, -250], dist: '81 ly', type: 'A3V', size: '2x Sun' },
    { name: 'Alioth (Saptrishi)', pos: [-280, 1200, -200], dist: '81 ly', type: 'A0V', size: '4x Sun' },
    { name: 'Mizar (Saptrishi)', pos: [-320, 1150, -150], dist: '78 ly', type: 'A2V', size: '2.5x Sun' },
    { name: 'Alkaid (Saptrishi)', pos: [-380, 1100, -100], dist: '101 ly', type: 'B3V', size: '3.4x Sun' }
];

function createStarField() {
    // Hide original starfield if it exists
    scene.children.forEach(c => {
        if (c instanceof THREE.Points && c.geometry.attributes.position.count === 20000) {
            c.visible = false;
        }
    });
    
    const starGeom = new THREE.BufferGeometry();
    const starCount = 15000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
        const x = (Math.random() - 0.5) * 5000;
        const y = (Math.random() - 0.5) * 5000;
        const z = (Math.random() - 0.5) * 5000;
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        const brightness = 0.5 + Math.random() * 0.5;
        colors[i * 3] = brightness;
        colors[i * 3 + 1] = brightness;
        colors[i * 3 + 2] = brightness;

        sizes[i] = Math.random() * 1.5;
    }

    starGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starGeom.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const starMat = new THREE.PointsMaterial({
        size: 1,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    });

    deepStars = new THREE.Points(starGeom, starMat);
    scene.add(deepStars);

    // Create Major Stars as clickable sprites
    majorStarsData.forEach(s => {
        const canvas = document.createElement('canvas');
        canvas.width = 64; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        
        // Make Saptrishi stars glow slightly differently (golden)
        if (s.name.includes('Saptrishi')) {
            grad.addColorStop(0, 'rgba(255, 255, 200, 1)');
            grad.addColorStop(0.3, 'rgba(255, 200, 50, 0.8)');
        } else {
            grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
            grad.addColorStop(0.3, 'rgba(200, 220, 255, 0.8)');
        }
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 64);

        const mat = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), blending: THREE.AdditiveBlending });
        const sprite = new THREE.Sprite(mat);
        sprite.position.set(...s.pos);
        sprite.scale.set(s.name.includes('Saptrishi') ? 15 : 20, s.name.includes('Saptrishi') ? 15 : 20, 1);
        sprite.userData = { isStar: true, info: s };
        scene.add(sprite);
    });

    // Draw Constellation Lines for Saptrishi
    const saptrishiStars = majorStarsData.filter(s => s.name.includes('Saptrishi'));
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 });
    
    // Connect Merak to Duhbe
    const connect = (s1, s2) => {
        const points = [new THREE.Vector3(...s1.pos), new THREE.Vector3(...s2.pos)];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, lineMaterial);
        scene.add(line);
    };

    // Merak to Duhbe (Pointers to Polaris)
    connect(saptrishiStars[1], saptrishiStars[0]);
    // Merak to Phecda
    connect(saptrishiStars[1], saptrishiStars[2]);
    // Phecda to Megrez
    connect(saptrishiStars[2], saptrishiStars[3]);
    // Megrez to Alioth
    connect(saptrishiStars[3], saptrishiStars[4]);
    // Alioth to Mizar
    connect(saptrishiStars[4], saptrishiStars[5]);
    // Mizar to Alkaid
    connect(saptrishiStars[5], saptrishiStars[6]);
    // Megrez to Duhbe (closes the bowl)
    connect(saptrishiStars[3], saptrishiStars[0]);
}

// 6. Galaxy Layer
let galaxyLayer;
function createGalaxies() {
    galaxyLayer = new THREE.Group();
    scene.add(galaxyLayer);

    // Use real galaxy textures
    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = 'anonymous';

    const galaxyTextures = [
        textureLoader.load('https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/M31_spiral_galaxy.jpg/640px-M31_spiral_galaxy.jpg'),
        textureLoader.load('https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/M51_HST_ACS_WFC3.jpg/640px-M51_HST_ACS_WFC3.jpg'),
        textureLoader.load('https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/M81_HST.jpg/640px-M81_HST.jpg')
    ];

    // Create many galaxies
    const galaxyCount = 60;
    for(let i=0; i<galaxyCount; i++) {
        const baseOpacity = 0.4 + Math.random() * 0.4;
        const texIndex = Math.floor(Math.random() * galaxyTextures.length);
        
        const mat = new THREE.SpriteMaterial({ 
            map: galaxyTextures[texIndex], 
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: baseOpacity,
            depthWrite: false
        });
        
        const sprite = new THREE.Sprite(mat);
        sprite.userData = { baseOpacity: baseOpacity };
        
        // Random position far away
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const dist = 2500 + Math.random() * 2000;
        
        sprite.position.set(
            dist * Math.sin(phi) * Math.cos(theta),
            dist * Math.sin(phi) * Math.sin(theta),
            dist * Math.cos(phi)
        );
        
        // Random size
        const size = 600 + Math.random() * 800;
        sprite.scale.set(size, size, 1);
        
        // Random rotation (simulated by color variation as sprites always face camera)
        sprite.material.color.setHSL(Math.random(), 0.2, 0.9);
        
        galaxyLayer.add(sprite);
    }
    
    // Add a few named "Hero" galaxies with specific positions
    const heroGalaxies = [
        { name: 'Andromeda', pos: [2000, 1000, -2000], size: 1500, tex: 0 },
        { name: 'Whirlpool', pos: [-2500, -1500, 1000], size: 1200, tex: 1 },
        { name: 'Bode\'s Galaxy', pos: [0, 2500, -2500], size: 1300, tex: 2 }
    ];
    
    heroGalaxies.forEach(g => {
        const baseOpacity = 0.9;
        const mat = new THREE.SpriteMaterial({ 
            map: galaxyTextures[g.tex], 
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: baseOpacity,
            depthWrite: false
        });
        const sprite = new THREE.Sprite(mat);
        sprite.userData = { baseOpacity: baseOpacity };
        sprite.position.set(...g.pos);
        sprite.scale.set(g.size, g.size, 1);
        galaxyLayer.add(sprite);
    });
}

// 7. Cinematic Zoom Out Mode
function enableDeepSpaceZoom() {
    controls.maxDistance = 15000; // Match the high-scale limit for extreme deep space zoom
    
    // UI Buttons (Responsive Classes used from style.css)
    const zoomBtn = document.createElement('button');
    zoomBtn.id = 'cinematic-zoom-btn';
    zoomBtn.className = 'control-btn';
    zoomBtn.innerHTML = '🔭 Explore Deep Space';
    zoomBtn.style.bottom = '30px';
    document.body.appendChild(zoomBtn);

    zoomBtn.onclick = () => {
        gsap.to(camera.position, {
            x: 2000, y: 1500, z: 3000,
            duration: 4,
            ease: "power2.inOut",
            onUpdate: () => controls.update()
        });
    };

    // Add Reset Button
    const resetBtn = document.createElement('button');
    resetBtn.id = 'reset-view-btn';
    resetBtn.className = 'control-btn';
    resetBtn.innerHTML = '☀️ Reset to Sun';
    resetBtn.style.cssText = `
        position: absolute;
        bottom: 30px;
        left: 20px;
        background: rgba(255, 100, 0, 0.2);
        color: #ffaa00;
        border: 1px solid #ffaa00;
        padding: 10px 20px;
        border-radius: 30px;
        font-family: 'Orbitron', sans-serif;
        font-size: 14px;
        cursor: pointer;
        z-index: 100;
        transition: all 0.3s ease;
    `;
    resetBtn.onmouseover = () => resetBtn.style.background = 'rgba(255, 100, 0, 0.4)';
    resetBtn.onmouseout = () => resetBtn.style.background = 'rgba(255, 100, 0, 0.2)';
    document.body.appendChild(resetBtn);

    resetBtn.onclick = () => {
        // Clear planet focus
        if (typeof targetFocus !== 'undefined') {
            // Check if global variable or need to find it
            // In simulation.js it's global, so we can set it
            window.targetFocus = null; 
        }
        
        // Hide info panels
        if (typeof infoPanel !== 'undefined') infoPanel.classList.add('hidden');
        starInfoPanel.classList.add('hidden');

        // Reset camera and controls
        gsap.to(camera.position, {
            x: 0, y: 300, z: 600,
            duration: 3,
            ease: "power2.inOut"
        });
        gsap.to(controls.target, {
            x: 0, y: 0, z: 0,
            duration: 3,
            ease: "power2.inOut",
            onUpdate: () => controls.update()
        });
    };

    // --- Professional Star Catalog Dropdown (Right Side) ---
    const starMenuContainer = document.createElement('div');
    starMenuContainer.id = 'star-catalog-container';
    starMenuContainer.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
    `;
    document.body.appendChild(starMenuContainer);

    // Dropdown Toggle Button
    const catalogToggle = document.createElement('button');
    catalogToggle.className = 'control-btn';
    catalogToggle.style.cssText = `
        position: relative;
        left: 0;
        transform: none;
        margin: 0;
        width: 160px;
        background: rgba(0, 40, 80, 0.9);
        border: 1px solid #00ffff;
        box-shadow: 0 0 15px rgba(0, 255, 255, 0.4);
    `;
    catalogToggle.innerHTML = '📂 Star Catalog ▾';
    starMenuContainer.appendChild(catalogToggle);

    // Star List (Hidden by default)
    const starList = document.createElement('div');
    starList.id = 'star-list';
    starList.style.cssText = `
        display: none;
        flex-direction: column;
        gap: 5px;
        margin-top: 10px;
        max-height: 50vh;
        overflow-y: auto;
        padding-right: 5px;
        align-items: flex-end;
    `;
    starMenuContainer.appendChild(starList);

    // Toggle Logic
    catalogToggle.onclick = (e) => {
        e.stopPropagation();
        const isHidden = starList.style.display === 'none';
        starList.style.display = isHidden ? 'flex' : 'none';
        catalogToggle.innerHTML = isHidden ? '📂 Star Catalog ▴' : '📂 Star Catalog ▾';
    };

    // Close dropdown when clicking elsewhere
    window.addEventListener('click', () => {
        starList.style.display = 'none';
        catalogToggle.innerHTML = '📂 Star Catalog ▾';
    });

    const starsToMenu = majorStarsData.filter(s => !s.name.includes('Saptrishi'));

    // Populate List
    starsToMenu.forEach(s => {
        const btn = document.createElement('button');
        btn.className = 'control-btn';
        btn.style.cssText = `
            position: relative;
            left: 0;
            transform: none;
            margin: 0;
            width: 140px;
            font-size: 11px;
            padding: 8px 12px;
            background: rgba(0, 20, 40, 0.85);
        `;
        btn.innerHTML = `⭐ ${s.name}`;
        btn.onclick = (e) => {
            e.stopPropagation();
            focusOnStar(s);
            starList.style.display = 'none';
            catalogToggle.innerHTML = '📂 Star Catalog ▾';
        };
        starList.appendChild(btn);
    });

    // Saptrishi Button in List
    const saptrishiBtn = document.createElement('button');
    saptrishiBtn.className = 'control-btn btn-golden';
    saptrishiBtn.style.cssText = `
        position: relative;
        left: 0;
        transform: none;
        margin: 0;
        width: 140px;
        font-size: 11px;
        padding: 8px 12px;
    `;
    saptrishiBtn.innerHTML = '✨ Saptrishi';
    saptrishiBtn.onclick = (e) => {
        e.stopPropagation();
        gsap.to(camera.position, {
            x: -500, y: 1800, z: 800,
            duration: 3,
            ease: "power2.inOut",
            onUpdate: () => {
                controls.target.set(-250, 1250, -250);
                controls.update();
            }
        });
        starList.style.display = 'none';
        catalogToggle.innerHTML = '📂 Star Catalog ▾';
    };
    starList.appendChild(saptrishiBtn);

    function focusOnStar(s) {
        const targetPos = new THREE.Vector3(...s.pos);
        const camOffset = targetPos.clone().normalize().multiplyScalar(100);
        const camPos = targetPos.clone().add(camOffset);

        gsap.to(camera.position, {
            x: camPos.x, y: camPos.y, z: camPos.z,
            duration: 3,
            ease: "power2.inOut",
            onUpdate: () => {
                controls.target.copy(targetPos);
                controls.update();
            }
        });

        // Show Info
        starInfoPanel.innerHTML = `
            <h3 style="margin-top:0">${s.name}</h3>
            <p>Distance: ${s.dist}</p>
            <p>Type: ${s.type}</p>
            <p>Size: ${s.size}</p>
        `;
        starInfoPanel.classList.remove('hidden');
        setTimeout(() => starInfoPanel.classList.add('hidden'), 8000);
    }
}

// Update loop for extensions
function updateExtensions() {
    // Galaxy Visibility Logic
    if (typeof galaxyLayer !== 'undefined' && galaxyLayer) {
        const dist = camera.position.length();
        // Make galaxies visible sooner and fade them in
        if (dist > 800) {
            galaxyLayer.visible = true;
            // Simple opacity fade based on distance
            const opacity = Math.min((dist - 800) / 1000, 1);
            galaxyLayer.children.forEach(child => {
                child.material.opacity = opacity * (child.userData.baseOpacity || 0.8);
            });
        } else {
            galaxyLayer.visible = false;
        }
    }

    // Moons
    moonObjects.forEach(m => {
        m.orbitGroup.rotation.y += m.speed;
        m.mesh.rotation.y += m.rotSpeed;
    });

    // Asteroids
    if (instancedAsteroids) {
        const dummy = new THREE.Object3D();
        for (let i = 0; i < asteroidCount; i++) {
            const data = asteroidData[i];
            data.angle += data.speed;
            const x = Math.cos(data.angle) * data.dist;
            const z = Math.sin(data.angle) * data.dist;
            
            dummy.position.set(x, data.y, z);
            dummy.rotation.set(data.angle, data.angle * 0.5, 0);
            dummy.scale.setScalar(1);
            dummy.updateMatrix();
            instancedAsteroids.setMatrixAt(i, dummy.matrix);
        }
        instancedAsteroids.instanceMatrix.needsUpdate = true;
    }

    // Comets
    for (let i = comets.length - 1; i >= 0; i--) {
        const c = comets[i];
        c.group.position.add(c.direction.clone().multiplyScalar(c.speed));
        if (c.group.position.length() > 2000) {
            scene.remove(c.group);
            comets.splice(i, 1);
        }
    }

    // Twinkling Stars
    if (deepStars) {
        const sizes = deepStars.geometry.attributes.size.array;
        for (let i = 0; i < sizes.length; i++) {
            sizes[i] = 1.0 + Math.sin(Date.now() * 0.001 + i) * 0.5;
        }
        deepStars.geometry.attributes.size.needsUpdate = true;
    }
}

// Star Info UI
const starInfoPanel = document.createElement('div');
starInfoPanel.id = 'star-info-panel';
starInfoPanel.className = 'hidden';
document.body.appendChild(starInfoPanel);

// Handle Star Clicks with professional touch support
function handleStarInteraction(clientX, clientY) {
    if (window.isDragging) return; // Re-use isDragging from simulation.js

    const mouse = new THREE.Vector2(
        (clientX / window.innerWidth) * 2 - 1,
        -(clientY / window.innerHeight) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    if (intersects.length > 0) {
        const obj = intersects[0].object;
        if (obj.userData && obj.userData.isStar) {
            const info = obj.userData.info;
            starInfoPanel.innerHTML = `
                <h3 style="margin-top:0">${info.name}</h3>
                <p>Distance: ${info.dist}</p>
                <p>Type: ${info.type}</p>
                <p>Size: ${info.size}</p>
            `;
            starInfoPanel.classList.remove('hidden');
            setTimeout(() => starInfoPanel.classList.add('hidden'), 5000);
        }
    }
}

window.addEventListener('pointerup', (e) => {
    handleStarInteraction(e.clientX, e.clientY);
});

// --- Initialize Extensions ---
createMoons();
createAsteroidBelt();
createStarField();
createGalaxies();
createComets();
enableDeepSpaceZoom();
