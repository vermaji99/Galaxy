
// --- 4. Deep Space Star Field & 5. Major Stars Information
let deepStars, nebulaClouds;
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

function createDeepSpaceStars() {
    // Hide original starfield if it exists
    scene.children.forEach(c => {
        if (c instanceof THREE.Points && c.geometry.attributes.position.count === 20000) {
            c.visible = false;
        }
    });
    
    const starGeom = new THREE.BufferGeometry();
    const starCount = 30000; // Increased for "massive" feel
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
        const dist = 1000 + Math.random() * 4000;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        
        positions[i * 3] = dist * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = dist * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = dist * Math.cos(phi);

        const brightness = 0.4 + Math.random() * 0.6;
        colors[i * 3] = brightness;
        colors[i * 3 + 1] = brightness + 0.1; // Slight blue tint
        colors[i * 3 + 2] = brightness + 0.2;

        sizes[i] = 0.5 + Math.random() * 2.0;
    }

    starGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starGeom.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const starMat = new THREE.PointsMaterial({
        size: 1.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending
    });

    deepStars = new THREE.Points(starGeom, starMat);
    scene.add(deepStars);

    // Create Nebula Clouds
    nebulaClouds = new THREE.Group();
    scene.add(nebulaClouds);
    
    const nebulaTex = new THREE.TextureLoader().load('https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Dust_Clouds_of_the_Orion_Nebula.jpg/640px-Dust_Clouds_of_the_Orion_Nebula.jpg');
    for(let i=0; i<8; i++) {
        const mat = new THREE.SpriteMaterial({ 
            map: nebulaTex, 
            transparent: true, 
            opacity: 0.05, 
            blending: THREE.AdditiveBlending,
            color: new THREE.Color().setHSL(Math.random(), 0.5, 0.5)
        });
        const sprite = new THREE.Sprite(mat);
        const dist = 3000;
        sprite.position.set((Math.random()-0.5)*dist, (Math.random()-0.5)*dist, (Math.random()-0.5)*dist);
        sprite.scale.set(2000, 2000, 1);
        nebulaClouds.add(sprite);
    }

    // Create Major Stars
    majorStarsData.forEach(s => {
        const canvas = document.createElement('canvas');
        canvas.width = 64; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        
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

    // Saptrishi Constellation Lines
    const saptrishiStars = majorStarsData.filter(s => s.name.includes('Saptrishi'));
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 });
    const connect = (s1, s2) => {
        const points = [new THREE.Vector3(...s1.pos), new THREE.Vector3(...s2.pos)];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, lineMaterial);
        scene.add(line);
    };
    connect(saptrishiStars[1], saptrishiStars[0]);
    connect(saptrishiStars[1], saptrishiStars[2]);
    connect(saptrishiStars[2], saptrishiStars[3]);
    connect(saptrishiStars[3], saptrishiStars[4]);
    connect(saptrishiStars[4], saptrishiStars[5]);
    connect(saptrishiStars[5], saptrishiStars[6]);
    connect(saptrishiStars[3], saptrishiStars[0]);
}

// 6. Milky Way & Distant Galaxies
let milkyWay, distantGalaxiesGroup;

function createMilkyWayGalaxy() {
    const texLoader = new THREE.TextureLoader();
    const milkyWayTex = texLoader.load('https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/ESO-VLT-Laser-Phot-28a-07.jpg/640px-ESO-VLT-Laser-Phot-28a-07.jpg');
    
    const geometry = new THREE.PlaneGeometry(3000, 3000);
    const material = new THREE.MeshBasicMaterial({
        map: milkyWayTex,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
    });
    
    milkyWay = new THREE.Mesh(geometry, material);
    milkyWay.position.set(0, -500, -1000);
    milkyWay.rotation.x = Math.PI / 2.5;
    scene.add(milkyWay);
}

function createDistantGalaxies() {
    distantGalaxiesGroup = new THREE.Group();
    scene.add(distantGalaxiesGroup);

    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = 'anonymous';

    const galaxyTextures = [
        textureLoader.load('https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/M31_spiral_galaxy.jpg/640px-M31_spiral_galaxy.jpg'), // Andromeda
        textureLoader.load('https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/M51_HST_ACS_WFC3.jpg/640px-M51_HST_ACS_WFC3.jpg'), // Whirlpool
        textureLoader.load('https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Sombrero_Galaxy.jpg/640px-Sombrero_Galaxy.jpg'), // Sombrero
        textureLoader.load('https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/M81_HST.jpg/640px-M81_HST.jpg'), // Bode's
        textureLoader.load('https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/M33_HST_full.jpg/640px-M33_HST_full.jpg') // Triangulum
    ];

    for(let i=0; i<60; i++) {
        const baseOpacity = 0.3 + Math.random() * 0.4;
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
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const dist = 3000 + Math.random() * 2000;
        
        sprite.position.set(dist * Math.sin(phi) * Math.cos(theta), dist * Math.sin(phi) * Math.sin(theta), dist * Math.cos(phi));
        const size = 600 + Math.random() * 800;
        sprite.scale.set(size, size, 1);
        sprite.material.color.setHSL(Math.random(), 0.2, 0.9);
        distantGalaxiesGroup.add(sprite);
    }
}

function updateDeepSpaceVisibility(cameraDistance) {
    // Level 1-2: Close View (cameraDistance < 800)
    // Level 3: Far Zoom (cameraDistance 800 - 1500)
    // Level 4: Extreme Zoom (cameraDistance > 1500)

    if (milkyWay) {
        milkyWay.visible = cameraDistance > 600;
        milkyWay.material.opacity = Math.min((cameraDistance - 600) / 1000, 0.4);
        milkyWay.rotation.z += 0.0001; // Subtle rotation
    }

    if (distantGalaxiesGroup) {
        distantGalaxiesGroup.visible = cameraDistance > 1200;
        const groupOpacity = Math.min((cameraDistance - 1200) / 1000, 1);
        distantGalaxiesGroup.children.forEach(child => {
            child.material.opacity = groupOpacity * (child.userData.baseOpacity || 0.8);
        });
    }

    if (deepStars) {
        deepStars.visible = cameraDistance > 400;
        deepStars.material.opacity = Math.min((cameraDistance - 400) / 800, 0.8);
    }
    
    if (nebulaClouds) {
        nebulaClouds.visible = cameraDistance > 1500;
        nebulaClouds.children.forEach(c => {
            c.material.opacity = Math.min((cameraDistance - 1500) / 2000, 0.05);
        });
    }
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
            x: 2500, y: 1800, z: 3500,
            duration: 5,
            ease: "power2.inOut",
            onUpdate: () => controls.update()
        });
    };

    const saptrishiBtn = document.createElement('button');
    saptrishiBtn.id = 'find-saptrishi-btn';
    saptrishiBtn.className = 'control-btn btn-golden';
    saptrishiBtn.innerHTML = '✨ Locate Saptrishi';
    saptrishiBtn.style.bottom = '80px';
    document.body.appendChild(saptrishiBtn);

    saptrishiBtn.onclick = () => {
        gsap.to(camera.position, {
            x: -500, y: 1800, z: 800,
            duration: 3,
            ease: "power2.inOut",
            onUpdate: () => {
                controls.target.set(-250, 1250, -250);
                controls.update();
            }
        });
    };
}

// Update loop for extensions
function updateExtensions() {
    const cameraDist = camera.position.length();
    updateDeepSpaceVisibility(cameraDist);

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
        if (c.group.position.length() > 3000) {
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

function handleStarInteraction(clientX, clientY) {
    if (window.isDragging) return;
    const mouse = new THREE.Vector2((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
        const obj = intersects[0].object;
        if (obj.userData && obj.userData.isStar) {
            const info = obj.userData.info;
            starInfoPanel.innerHTML = `<h3>${info.name}</h3><p>Dist: ${info.dist}</p><p>Type: ${info.type}</p><p>Size: ${info.size}</p>`;
            starInfoPanel.classList.remove('hidden');
            setTimeout(() => starInfoPanel.classList.add('hidden'), 5000);
        }
    }
}

window.addEventListener('pointerup', (e) => handleStarInteraction(e.clientX, e.clientY));

// --- Initialize Extensions ---
createMoons();
createAsteroidBelt();
createDeepSpaceStars();
createMilkyWayGalaxy();
createDistantGalaxies();
createComets();
enableDeepSpaceZoom();
