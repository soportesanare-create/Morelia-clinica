import * as THREE from 'three';

// All 38 photos
const imageFiles = [
    "WhatsApp Image 2026-05-26 at 9.55.29 AM (1).jpeg",
    "WhatsApp Image 2026-05-26 at 9.55.29 AM (2).jpeg",
    "WhatsApp Image 2026-05-26 at 9.55.29 AM (3).jpeg",
    "WhatsApp Image 2026-05-26 at 9.55.29 AM (4).jpeg",
    "WhatsApp Image 2026-05-26 at 9.55.29 AM (5).jpeg",
    "WhatsApp Image 2026-05-26 at 9.55.29 AM (6).jpeg",
    "WhatsApp Image 2026-05-26 at 9.55.29 AM.jpeg",
    "WhatsApp Image 2026-05-26 at 9.55.30 AM (1).jpeg",
    "WhatsApp Image 2026-05-26 at 9.55.30 AM (2).jpeg",
    "WhatsApp Image 2026-05-26 at 9.55.30 AM (4).jpeg",
    "WhatsApp Image 2026-05-26 at 9.55.30 AM (5).jpeg",
    "WhatsApp Image 2026-05-26 at 9.55.30 AM (6).jpeg",
    "WhatsApp Image 2026-05-26 at 9.55.30 AM (7).jpeg",
    "WhatsApp Image 2026-05-26 at 9.55.30 AM (8).jpeg",
    "WhatsApp Image 2026-05-26 at 9.55.30 AM.jpeg",
    ...Array.from({length: 23}, (_, i) => `morelia-${String(i+1).padStart(3,'0')}.webp`)
];

// ── Scene ──────────────────────────────────────────────────────────
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf8f6f2);   // warm off-white
scene.fog = new THREE.FogExp2(0xf8f6f2, 0.012);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 25;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// ── Lighting ───────────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0xffffff, 1.2));

const sunLight = new THREE.DirectionalLight(0xfff5e4, 1.0);
sunLight.position.set(8, 12, 10);
scene.add(sunLight);

const fillLight = new THREE.DirectionalLight(0xe8f0ff, 0.5);
fillLight.position.set(-8, -4, 6);
scene.add(fillLight);

// Warm gold point at core
const goldPoint = new THREE.PointLight(0xc8963e, 2.5, 40);
goldPoint.position.set(0, 0, 5);
scene.add(goldPoint);

// ── Nucleus (warm gold/beige palette) ─────────────────────────────
const coreGroup = new THREE.Group();
scene.add(coreGroup);

const mkWire = (color, opacity) => new THREE.MeshBasicMaterial({
    color, wireframe: true, transparent: true, opacity
});
const mkLine = (color, opacity) => new THREE.LineBasicMaterial({
    color, transparent: true, opacity
});
const mkSolid = (color, opacity = 1) => new THREE.MeshStandardMaterial({
    color, transparent: opacity < 1, opacity, roughness: 0.4, metalness: 0.3
});

// Outer wireframe icosahedron
const outerSphere = new THREE.Mesh(
    new THREE.IcosahedronGeometry(4, 2),
    mkWire(0xc8963e, 0.25)
);
coreGroup.add(outerSphere);

// Three orbit rings
const ringData = [
    { r: 3.4, tube: 0.04, color: 0xb08850, opacity: 0.7, rx: Math.PI/2, ry: 0 },
    { r: 2.8, tube: 0.025, color: 0xd4b483, opacity: 0.5, rx: 0,       ry: Math.PI/3 },
    { r: 2.2, tube: 0.02,  color: 0xa07840, opacity: 0.4, rx: Math.PI/4, ry: Math.PI/4 },
];
const rings = ringData.map(d => {
    const m = new THREE.Mesh(
        new THREE.TorusGeometry(d.r, d.tube, 16, 120),
        new THREE.MeshStandardMaterial({ color: d.color, transparent: true, opacity: d.opacity, metalness: 0.6, roughness: 0.3 })
    );
    m.rotation.x = d.rx; m.rotation.y = d.ry;
    coreGroup.add(m);
    return m;
});

// Inner octahedron (solid warm gold)
const innerCore = new THREE.Mesh(
    new THREE.OctahedronGeometry(1.2, 0),
    mkSolid(0xb08850)
);
coreGroup.add(innerCore);

// Floating data particles — tiny cubes
const particleGeom = new THREE.BoxGeometry(0.08, 0.08, 0.08);
const particleMat = mkWire(0xc8963e, 0.6);
const particles = [];
for (let i = 0; i < 60; i++) {
    const p = new THREE.Mesh(particleGeom, particleMat);
    p.position.set(
        (Math.random() - 0.5) * 9,
        (Math.random() - 0.5) * 9,
        (Math.random() - 0.5) * 9
    );
    p.userData.axis = new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize();
    p.userData.speed = 0.008 + Math.random() * 0.012;
    coreGroup.add(p);
    particles.push(p);
}

// ── Gallery ────────────────────────────────────────────────────────
const textureLoader = new THREE.TextureLoader();
const photoGroup = new THREE.Group();
scene.add(photoGroup);

const photoMeshes = [];       // { group, targetX, targetY, targetZ, src }
const carouselRadius = 16;
const itemsPerRow = 13;
const totalRows = Math.ceil(imageFiles.length / itemsPerRow);

imageFiles.forEach((file, index) => {
    textureLoader.load(encodeURI(file), (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        const aspect = texture.image.width / texture.image.height;
        const w = 3.6 * aspect, h = 3.6;

        // Photo plane
        const mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(w, h),
            new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide })
        );

        // Warm gold frame
        const frameMat = new THREE.LineBasicMaterial({ color: 0xb08850, transparent: true, opacity: 0.7 });
        const frame = new THREE.LineSegments(
            new THREE.EdgesGeometry(new THREE.PlaneGeometry(w + 0.08, h + 0.08)),
            frameMat
        );

        const group = new THREE.Group();
        group.add(mesh);
        group.add(frame);
        group.scale.set(0, 0, 0);
        group.position.set(0, 0, 0);

        // Target position in cylinder
        const row = Math.floor(index / itemsPerRow);
        const col = index % itemsPerRow;
        const countInRow = (row === totalRows - 1 && imageFiles.length % itemsPerRow)
            ? imageFiles.length % itemsPerRow : itemsPerRow;
        const angle = (col / countInRow) * Math.PI * 2;
        const yPos = (row - (totalRows - 1) / 2) * -5;

        group.userData = {
            targetX: Math.cos(angle) * carouselRadius,
            targetY: yPos,
            targetZ: Math.sin(angle) * carouselRadius,
            baseY: yPos,
            src: file          // raw filename (not encoded)
        };

        photoGroup.add(group);
        photoMeshes.push(group);

        // Register so lightbox arrows can navigate in load order
        registerSrc(file);

    }, undefined, err => console.warn('Image load error:', err));
});

// ── Lightbox ───────────────────────────────────────────────────────
const lightbox   = document.getElementById('lightbox');
const lbImg      = document.getElementById('lightbox-img');
const lbClose    = document.getElementById('lightbox-close');
const lbBackdrop = document.getElementById('lightbox-backdrop');
const lbPrev     = document.getElementById('lb-prev');
const lbNext     = document.getElementById('lb-next');
const lbCounter  = document.getElementById('lb-counter');

// Ordered list of loaded image sources (filled as textures load)
const loadedSrcs = [];
let currentLbIndex = 0;

function registerSrc(src) {
    if (!loadedSrcs.includes(src)) loadedSrcs.push(src);
}

function openLightbox(src) {
    const idx = loadedSrcs.indexOf(src);
    currentLbIndex = idx >= 0 ? idx : 0;
    showAtIndex(currentLbIndex);
    lightbox.classList.remove('hidden');
}

function showAtIndex(i) {
    if (loadedSrcs.length === 0) return;
    currentLbIndex = ((i % loadedSrcs.length) + loadedSrcs.length) % loadedSrcs.length;
    lbImg.src = encodeURI(loadedSrcs[currentLbIndex]);
    lbCounter.textContent = `${currentLbIndex + 1} / ${loadedSrcs.length}`;
}

function closeLightbox() {
    lightbox.classList.add('hidden');
    setTimeout(() => { lbImg.src = ''; }, 350);
}

// Button events
lbClose.addEventListener('click',    (e) => { e.stopPropagation(); closeLightbox(); });
lbBackdrop.addEventListener('click', () => closeLightbox());
lbPrev.addEventListener('click',     (e) => { e.stopPropagation(); showAtIndex(currentLbIndex - 1); });
lbNext.addEventListener('click',     (e) => { e.stopPropagation(); showAtIndex(currentLbIndex + 1); });

// Keyboard navigation
window.addEventListener('keydown', e => {
    if (lightbox.classList.contains('hidden')) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  showAtIndex(currentLbIndex - 1);
    if (e.key === 'ArrowRight') showAtIndex(currentLbIndex + 1);
});

// Touch / swipe support
let touchStartX = 0;
lightbox.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
lightbox.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) dx < 0 ? showAtIndex(currentLbIndex + 1) : showAtIndex(currentLbIndex - 1);
});

// ── Interaction ────────────────────────────────────────────────────
let systemActive = false;
const raycaster  = new THREE.Raycaster();
const mouse      = new THREE.Vector2();

window.addEventListener('click', (e) => {
    // Skip if lightbox is open
    if (!lightbox.classList.contains('hidden')) return;

    mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    if (!systemActive) {
        // Hit test on nucleus
        if (raycaster.intersectObjects(coreGroup.children, true).length > 0) {
            activateSystem();
        }
    } else {
        // Hit test on photo panels
        const hits = raycaster.intersectObjects(
            photoMeshes.flatMap(g => g.children), true
        );
        if (hits.length > 0) {
            const hitGroup = hits[0].object.parent; // the group
            if (hitGroup.userData.src) openLightbox(encodeURI(hitGroup.userData.src));
        }
    }
});

function activateSystem() {
    systemActive = true;
    document.getElementById('hud-hint').classList.add('hidden');

    // Nucleus explodes outward
    gsap.to(coreGroup.scale, { x: 6, y: 6, z: 6, duration: 1.8, ease: 'power2.in' });
    coreGroup.children.forEach(c => {
        if (c.material) gsap.to(c.material, { opacity: 0, duration: 1.2 });
    });

    // Photos burst out
    photoMeshes.forEach((group, i) => {
        const delay = 0.8 + Math.random() * 1.8;
        gsap.to(group.scale, { x: 1, y: 1, z: 1, duration: 1.4, delay, ease: 'back.out(1.1)' });
        gsap.to(group.position, {
            x: group.userData.targetX,
            y: group.userData.targetY,
            z: group.userData.targetZ,
            duration: 2.2, delay, ease: 'power3.out',
            onUpdate: () => group.lookAt(0, group.position.y, 0)
        });
    });

    // Camera glides in
    gsap.to(camera.position, { z: 2, y: 0, duration: 4.5, delay: 2, ease: 'power2.inOut' });

    // Change cursor to pointer on hover hint
    container.style.cursor = 'pointer';
}

// ── Mouse tracking ─────────────────────────────────────────────────
let mouseX = 0, mouseY = 0;
let targetScrollY = 0;
const halfW = window.innerWidth / 2;
const halfH = window.innerHeight / 2;

document.addEventListener('mousemove', e => {
    mouseX = e.clientX - halfW;
    mouseY = e.clientY - halfH;

    if (systemActive && camera.position.z < 5) {
        // Hover over photos → show pointer
        mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(photoMeshes.flatMap(g => g.children), true);
        container.style.cursor = hits.length > 0 ? 'zoom-in' : 'grab';
    }
});

window.addEventListener('wheel', e => {
    if (systemActive && camera.position.z < 5) {
        targetScrollY -= e.deltaY * 0.012;
        const maxY = Math.max((totalRows - 1) * 2.5, 0);
        targetScrollY = Math.max(-maxY, Math.min(maxY, targetScrollY));
    }
});

// ── Render loop ────────────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    if (!systemActive) {
        outerSphere.rotation.x = t * 0.18;
        outerSphere.rotation.y = t * 0.27;
        rings[0].rotation.y = t * 0.5;
        rings[0].rotation.z = t * 0.15;
        rings[1].rotation.x = -t * 0.55;
        rings[2].rotation.z = t * 0.35;
        innerCore.rotation.y = t * 0.9;
        innerCore.rotation.x = t * 0.45;
        particles.forEach(p => p.position.applyAxisAngle(p.userData.axis, p.userData.speed));

        // Gentle parallax
        coreGroup.position.x = mouseX * 0.0015;
        coreGroup.position.y = -mouseY * 0.0015;
    }

    if (systemActive) {
        const rx = mouseX * 0.0008;
        photoGroup.rotation.y += 0.0012 + 0.04 * (rx - photoGroup.rotation.y);
        camera.position.y += (targetScrollY - camera.position.y) * 0.06;

        // Gentle float
        photoMeshes.forEach((g, i) => {
            if (g.scale.x > 0.9) {
                g.position.y = g.userData.baseY + Math.sin(t * 1.6 + i * 0.4) * 0.12;
            }
        });
    }

    renderer.render(scene, camera);
}
animate();

// ── Resize ─────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
