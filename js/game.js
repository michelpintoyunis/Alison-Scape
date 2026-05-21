// ==========================================
        // CONFIGURATION
        // ==========================================
        
        const WORLD_SIZE = 4000; 
        const MAP_LIMIT = WORLD_SIZE / 2 - 100;
        const NUM_TREES = 600;
        const NUM_RUINS = 150;
        
        // Speed balancing
        const PLAYER_SPEED = 10; // Caminar rápido
        const SPRINT_MULTIPLIER = 1.5; // Correr = 30
        const PLAYER_HEIGHT = 10;
        
        // ==========================================
        // AUDIO SYSTEM (Web Audio API)
        // ==========================================
        let audioCtx;
        let bgmOsc1, bgmOsc2, bgmGain, bgmFilter;
        let chaseOsc, chaseGain;
        let isAudioInitialized = false;
        const deathSound = new Audio('assets/audio/game_over.ogg');
        
        const menuMusic = new Audio('assets/audio/alison_scape_soundtrack.mp3');
        menuMusic.loop = true;
        menuMusic.volume = 0.3; // Volumen bajo
        
        // Touch device detection for mobile controls & UI scale adjustments
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;

        // Splash screen click to enter and autoplay enabler
        const splashScreen = document.getElementById('splash-screen');
        if (splashScreen) {
            splashScreen.addEventListener('click', () => {
                splashScreen.classList.add('fade-out');
                if (menuMusic.paused) {
                    menuMusic.play().catch(e => console.log("Audio play prevented:", e));
                }
                setTimeout(() => {
                    splashScreen.style.display = 'none';
                    splashScreen.classList.remove('fade-out');
                }, 1000);
            });
        }

        // General Fallback
        document.body.addEventListener('click', () => {
            if (menuMusic.paused) {
                const startDisplay = window.getComputedStyle(document.getElementById('start-screen')).display;
                if (startDisplay !== 'none') {
                    menuMusic.play().catch(e => console.log("Audio play prevented:", e));
                }
            }
        });

        function initAudio() {
            if (isAudioInitialized) return;
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContext();

            bgmOsc1 = audioCtx.createOscillator();
            bgmOsc2 = audioCtx.createOscillator();
            bgmOsc1.type = 'sine';
            bgmOsc2.type = 'sawtooth';
            
            bgmOsc1.frequency.value = 45;
            bgmOsc2.frequency.value = 46.5;

            bgmFilter = audioCtx.createBiquadFilter();
            bgmFilter.type = 'lowpass';
            bgmFilter.frequency.value = 200;

            bgmGain = audioCtx.createGain();
            bgmGain.gain.value = 0.08; 

            bgmOsc1.connect(bgmFilter);
            bgmOsc2.connect(bgmFilter);
            bgmFilter.connect(bgmGain);
            bgmGain.connect(audioCtx.destination);
            
            bgmOsc1.start();
            bgmOsc2.start();

            chaseOsc = audioCtx.createOscillator();
            chaseOsc.type = 'square';
            chaseOsc.frequency.value = 100;

            chaseGain = audioCtx.createGain();
            chaseGain.gain.value = 0;

            const chaseFilter = audioCtx.createBiquadFilter();
            chaseFilter.type = 'bandpass';
            chaseFilter.frequency.value = 500;

            chaseOsc.connect(chaseFilter);
            chaseFilter.connect(chaseGain);
            chaseGain.connect(audioCtx.destination);
            chaseOsc.start();

            isAudioInitialized = true;
        }

        function playShootSound() {
            if (!audioCtx) return;
            const t = audioCtx.currentTime;
            
            const bufferSize = audioCtx.sampleRate * 0.5;
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            
            const noise = audioCtx.createBufferSource();
            noise.buffer = buffer;
            
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(3000, t);
            filter.frequency.exponentialRampToValueAtTime(100, t + 0.3);
            
            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0.8, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
            
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(audioCtx.destination);
            
            noise.start(t);

            const osc = audioCtx.createOscillator();
            osc.type = 'square';
            osc.frequency.setValueAtTime(150, t);
            osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
            
            const oscGain = audioCtx.createGain();
            oscGain.gain.setValueAtTime(1, t);
            oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
            
            osc.connect(oscGain);
            oscGain.connect(audioCtx.destination);
            osc.start(t);
            osc.stop(t+0.1);
        }

        function playEmptyClickSound() {
            if (!audioCtx) return;
            const t = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            osc.type = 'square';
            osc.frequency.setValueAtTime(800, t);
            osc.frequency.exponentialRampToValueAtTime(200, t + 0.05);
            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0.5, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(t);
            osc.stop(t+0.05);
        }

        function playHitSound() {
            if (!audioCtx) return;
            const t = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(400, t);
            osc.frequency.exponentialRampToValueAtTime(50, t + 0.5);
            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(1, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(t);
            osc.stop(t+0.5);
        }

        function playPickupSound() {
            if (!audioCtx) return;
            const t = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, t);
            osc.frequency.linearRampToValueAtTime(1200, t + 0.2);
            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0.5, t);
            gain.gain.linearRampToValueAtTime(0, t + 0.2);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(t);
            osc.stop(t+0.2);
        }

        function playDamageSound() {
            if (!audioCtx) return;
            const t = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            osc.type = 'square';
            osc.frequency.setValueAtTime(100, t);
            osc.frequency.linearRampToValueAtTime(50, t + 0.2);
            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0.5, t);
            gain.gain.linearRampToValueAtTime(0, t + 0.2);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(t);
            osc.stop(t+0.2);
        }

        function playFootstep() {
            if (!audioCtx) return;
            const t = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(80, t);
            osc.frequency.exponentialRampToValueAtTime(10, t + 0.1);
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(t);
            osc.stop(t + 0.1);
        }

        // ==========================================
        // PROCEDURAL GENERATION UTILS
        // ==========================================
        class LCG {
            constructor(seed) { this.seed = seed; }
            next() {
                this.seed = (this.seed * 9301 + 49297) % 233280;
                return this.seed / 233280;
            }
            nextRange(min, max) {
                return min + this.next() * (max - min);
            }
        }
        const rng = new LCG(666); 

        // ==========================================
        // THREE.JS SCENE SETUP
        // ==========================================
        const container = document.getElementById('game-container');
        const scene = new THREE.Scene();
        
        const fogColor = new THREE.Color(0x1a2a40); // Noche visible
        scene.background = fogColor;
        scene.fog = new THREE.FogExp2(fogColor, 0.001); 

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1500);
        
        const pitchObject = new THREE.Group();
        pitchObject.add(camera);
        
        const yawObject = new THREE.Group();
        yawObject.position.y = PLAYER_HEIGHT;
        yawObject.add(pitchObject);
        scene.add(yawObject);

        const renderer = new THREE.WebGLRenderer({ antialias: false }); 
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); 
        container.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0x666688, 1.2); 
        scene.add(ambientLight);

        // Linterna removida por solicitud

        // ==========================================
        // WEAPON SYSTEM
        // ==========================================
        const weaponGroup = new THREE.Group();
        weaponGroup.position.set(0.8, -1.0, -1.8); // Posicionado más cerca para una pistola
        weaponGroup.rotation.y = 0.15; 
        weaponGroup.rotation.z = 0.05;
        weaponGroup.rotation.x = 0.05;

        // Materiales
        const bodyMat = new THREE.MeshPhongMaterial({ color: 0x333333, flatShading: true, shininess: 60 });
        const accentMat = new THREE.MeshPhongMaterial({ color: 0x111111, flatShading: true, shininess: 20 });

        // Corredera (Slide - parte superior de la pistola)
        const slide = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.25, 1.2), bodyMat);
        slide.position.set(0, 0, 0);
        
        // Empuñadura (Grip)
        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.7, 0.35), accentMat);
        grip.rotation.x = Math.PI / 12;
        grip.position.set(0, -0.4, 0.35);

        // Cañón interno que sobresale un poco (Barrel)
        const barrelObjGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.4, 12);
        barrelObjGeo.rotateX(Math.PI / 2);
        const barrel = new THREE.Mesh(barrelObjGeo, accentMat);
        barrel.position.set(0, -0.05, -0.6);

        // Guardamonte (Trigger Guard)
        const triggerGuard = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.2, 0.35), accentMat);
        triggerGuard.rotation.x = Math.PI / 4;
        triggerGuard.position.set(0, -0.25, 0.05);

        // Gatillo (Trigger)
        const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.15, 0.05), bodyMat);
        trigger.rotation.x = -Math.PI / 8;
        trigger.position.set(0, -0.2, 0.15);

        // Mira trasera (Rear Sight)
        const rearSight = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.1), accentMat);
        rearSight.position.set(0, 0.15, 0.5);

        // Mira delantera (Front Sight)
        const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.05), accentMat);
        frontSight.position.set(0, 0.15, -0.55);

        weaponGroup.add(slide);
        weaponGroup.add(grip);
        weaponGroup.add(barrel);
        weaponGroup.add(triggerGuard);
        weaponGroup.add(trigger);
        weaponGroup.add(rearSight);
        weaponGroup.add(frontSight);
        
        // Muzzle Flash
        const flashMat = new THREE.SpriteMaterial({ color: 0xffffaa, transparent: true, opacity: 0 });
        const muzzleFlashSprite = new THREE.Sprite(flashMat);
        muzzleFlashSprite.scale.set(1.5, 1.5, 1);
        muzzleFlashSprite.position.set(0, -0.05, -1.2); 
        weaponGroup.add(muzzleFlashSprite);

        const muzzleLight = new THREE.PointLight(0xffaa00, 0, 20);
        muzzleLight.position.set(0, -0.05, -1.2);
        weaponGroup.add(muzzleLight);

        pitchObject.add(weaponGroup);

        let recoilTime = 0;
        let isShooting = false;
        let isReloading = false;
        const raycaster = new THREE.Raycaster();

        // ==========================================
        // BULLET PICKUP SYSTEM
        // ==========================================
        const NUM_BULLETS = 15; // 15 balas individuales esparcidas por el mapa
        const bulletsPool = [];
        
        const bulletPickGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8);
        bulletPickGeo.rotateX(Math.PI / 2); // Acostarla
        bulletPickGeo.rotateZ(Math.PI / 6); // Angulo interesante
        const bulletPickMat = new THREE.MeshPhongMaterial({ 
            color: 0xffd700, 
            emissive: 0x443300, 
            shininess: 100, 
            flatShading: true 
        });
        
        function createBulletPickup() {
            const mesh = new THREE.Mesh(bulletPickGeo, bulletPickMat);
            const light = new THREE.PointLight(0xffd700, 0.8, 15);
            light.position.y = 1;
            mesh.add(light);
            scene.add(mesh);
            return mesh;
        }

        function respawnSingleBullet(bulletMesh) {
            let px = rng.nextRange(-MAP_LIMIT + 100, MAP_LIMIT - 100);
            let pz = rng.nextRange(-MAP_LIMIT + 100, MAP_LIMIT - 100);
            
            while (Math.hypot(yawObject.position.x - px, yawObject.position.z - pz) < 100) {
                px = rng.nextRange(-MAP_LIMIT + 100, MAP_LIMIT - 100);
                pz = rng.nextRange(-MAP_LIMIT + 100, MAP_LIMIT - 100);
            }
            
            bulletMesh.position.set(px, getElevation(px, pz) + 1.0, pz);
        }

        function initBulletPickups() {
            for (let i = 0; i < NUM_BULLETS; i++) {
                const b = createBulletPickup();
                respawnSingleBullet(b);
                bulletsPool.push(b);
            }
        }

        // ==========================================
        // WORLD GENERATION 
        // ==========================================
        const colliders = []; 

        function createWorld() {
            const planeGeo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, 128, 128);
            planeGeo.rotateX(-Math.PI / 2);
            
            const positions = planeGeo.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                const x = positions[i];
                const z = positions[i + 2];
                const y = Math.sin(x * 0.005) * 15 + Math.cos(z * 0.004) * 15 + Math.sin((x+z)*0.01) * 5;
                positions[i + 1] = y;
            }
            planeGeo.computeVertexNormals();

            const groundMat = new THREE.MeshPhongMaterial({
                color: 0x2d402d,
                flatShading: true,
                shininess: 0
            });
            const ground = new THREE.Mesh(planeGeo, groundMat);
            scene.add(ground);

            const objMat = new THREE.MeshPhongMaterial({ color: 0x555555, flatShading: true }); 
            const obstaclesGroup = new THREE.Group();

            for (let i = 0; i < NUM_TREES + NUM_RUINS; i++) {
                const x = rng.nextRange(-MAP_LIMIT, MAP_LIMIT);
                const z = rng.nextRange(-MAP_LIMIT, MAP_LIMIT);
                if (Math.abs(x) < 100 && Math.abs(z) < 100) continue; 

                const w = rng.nextRange(3, 15);
                const h = rng.nextRange(10, 40);
                const d = rng.nextRange(3, 15);
                
                const boxGeo = new THREE.BoxGeometry(w, h, d);
                boxGeo.translate(0, h/2, 0);
                const obs = new THREE.Mesh(boxGeo, objMat);
                obs.position.set(x, getElevation(x,z) - 2, z);
                obs.rotation.y = rng.nextRange(0, Math.PI);
                
                obstaclesGroup.add(obs);
                colliders.push({ x: x, z: z, r: Math.max(w, d) * 0.6 });
            }
            scene.add(obstaclesGroup);

            const wallMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
            const wallThickness = 100;
            const wallHeight = 200;
            const limits = [
                { x: 0, z: -MAP_LIMIT - wallThickness/2, w: WORLD_SIZE, d: wallThickness }, 
                { x: 0, z: MAP_LIMIT + wallThickness/2, w: WORLD_SIZE, d: wallThickness },  
                { x: -MAP_LIMIT - wallThickness/2, z: 0, w: wallThickness, d: WORLD_SIZE }, 
                { x: MAP_LIMIT + wallThickness/2, z: 0, w: wallThickness, d: WORLD_SIZE }   
            ];

            limits.forEach(l => {
                const wGeo = new THREE.BoxGeometry(l.w, wallHeight, l.d);
                const wall = new THREE.Mesh(wGeo, wallMat);
                wall.position.set(l.x, wallHeight/2, l.z);
                scene.add(wall);
            });
        }

        function getElevation(x, z) {
            return Math.sin(x * 0.005) * 15 + Math.cos(z * 0.004) * 15 + Math.sin((x+z)*0.01) * 5;
        }

        createWorld();
        initBulletPickups();

        // ==========================================
        // PLAYER MECHANICS
        // ==========================================
        const player = {
            velocity: new THREE.Vector3(),
            direction: new THREE.Vector3(),
            stamina: 100,
            health: 100,
            ammo: 30,
            reserveAmmo: 0,
            isSprinting: false,
            radius: 3,
            kills: 0
        };

        let moveForward = false;
        let moveBackward = false;
        let moveLeft = false;
        let moveRight = false;

        const PI_2 = Math.PI / 2;

        document.addEventListener('mousemove', (event) => {
            if (document.pointerLockElement === document.body && gameState === 'PLAYING') {
                const movementX = event.movementX || 0;
                const movementY = event.movementY || 0;

                yawObject.rotation.y -= movementX * 0.002;
                pitchObject.rotation.x -= movementY * 0.002;
                
                pitchObject.rotation.x = Math.max(-PI_2, Math.min(PI_2, pitchObject.rotation.x));
            }
        });

        document.addEventListener('mousedown', (event) => {
            if (gameState === 'PLAYING') {
                if (document.pointerLockElement !== document.body && !isTouchDevice) {
                    document.body.requestPointerLock();
                } else if (event.button === 0 && !isShooting && !isTouchDevice) {
                    shootWeapon();
                }
            }
        });

        document.addEventListener('pointerlockchange', () => {
            if (isTouchDevice) return; // Touch devices bypass pointer lock
            if (document.pointerLockElement !== document.body) {
                if (gameState === 'PLAYING') pauseGame();
            } else {
                if (gameState === 'PAUSED') resumeGame();
            }
        });

        function pauseGame() {
            gameState = 'PAUSED';
            document.getElementById('pause-screen').style.display = 'flex';
            document.getElementById('hud').style.display = 'none';
            document.getElementById('touch-controls').style.display = 'none'; // Hide touch layout
            if (audioCtx) audioCtx.suspend();
        }

        function resumeGame() {
            gameState = 'PLAYING';
            document.getElementById('pause-screen').style.display = 'none';
            document.getElementById('hud').style.display = 'block';
            if (isTouchDevice) {
                document.getElementById('touch-controls').style.display = 'block'; // Show touch layout
            }
            if (audioCtx) audioCtx.resume();
            prevTime = performance.now();
        }

        document.addEventListener('keydown', (event) => {
            switch (event.code) {
                case 'ArrowUp': case 'KeyW': moveForward = true; break;
                case 'ArrowLeft': case 'KeyA': moveLeft = true; break;
                case 'ArrowDown': case 'KeyS': moveBackward = true; break;
                case 'ArrowRight': case 'KeyD': moveRight = true; break;
                case 'ShiftLeft': case 'ShiftRight': player.isSprinting = true; break;
                case 'KeyR': reloadWeapon(); break;
            }
        });

        document.addEventListener('keyup', (event) => {
            switch (event.code) {
                case 'ArrowUp': case 'KeyW': moveForward = false; break;
                case 'ArrowLeft': case 'KeyA': moveLeft = false; break;
                case 'ArrowDown': case 'KeyS': moveBackward = false; break;
                case 'ArrowRight': case 'KeyD': moveRight = false; break;
                case 'ShiftLeft': case 'ShiftRight': player.isSprinting = false; break;
            }
        });

        // ==========================================
        // TOUCH INTERACTIVE INPUT SYSTEMS (MOBILE)
        // ==========================================
        let touchStartX = 0;
        let touchStartY = 0;
        let isTouchingCamera = false;

        window.addEventListener('touchstart', (event) => {
            // Bypass input checks on controls zone
            if (event.target.closest('#touch-controls') || gameState !== 'PLAYING') return;
            
            const touch = event.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            isTouchingCamera = true;
        }, { passive: true });

        window.addEventListener('touchmove', (event) => {
            if (!isTouchingCamera || gameState !== 'PLAYING') return;
            
            const touch = event.touches[0];
            const deltaX = touch.clientX - touchStartX;
            const deltaY = touch.clientY - touchStartY;
            
            // Speed sensitivity control for drag looking
            const mobileSensitivity = 0.005;
            yawObject.rotation.y -= deltaX * mobileSensitivity;
            pitchObject.rotation.x -= deltaY * mobileSensitivity;
            pitchObject.rotation.x = Math.max(-PI_2, Math.min(PI_2, pitchObject.rotation.x));
            
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
        }, { passive: true });

        window.addEventListener('touchend', () => {
            isTouchingCamera = false;
        }, { passive: true });

        // Map visual buttons to keyboard/game states
        if (isTouchDevice) {
            const touchUp = document.getElementById('touch-up');
            const touchDown = document.getElementById('touch-down');
            const touchLeft = document.getElementById('touch-left');
            const touchRight = document.getElementById('touch-right');
            const touchSprint = document.getElementById('touch-sprint');
            const touchReload = document.getElementById('touch-reload');
            const touchShoot = document.getElementById('touch-shoot');
            const touchPause = document.getElementById('touch-pause');

            touchUp.addEventListener('touchstart', (e) => { e.preventDefault(); moveForward = true; });
            touchUp.addEventListener('touchend', (e) => { e.preventDefault(); moveForward = false; });
            touchUp.addEventListener('touchcancel', (e) => { e.preventDefault(); moveForward = false; });

            touchDown.addEventListener('touchstart', (e) => { e.preventDefault(); moveBackward = true; });
            touchDown.addEventListener('touchend', (e) => { e.preventDefault(); moveBackward = false; });
            touchDown.addEventListener('touchcancel', (e) => { e.preventDefault(); moveBackward = false; });

            touchLeft.addEventListener('touchstart', (e) => { e.preventDefault(); moveLeft = true; });
            touchLeft.addEventListener('touchend', (e) => { e.preventDefault(); moveLeft = false; });
            touchLeft.addEventListener('touchcancel', (e) => { e.preventDefault(); moveLeft = false; });

            touchRight.addEventListener('touchstart', (e) => { e.preventDefault(); moveRight = true; });
            touchRight.addEventListener('touchend', (e) => { e.preventDefault(); moveRight = false; });
            touchRight.addEventListener('touchcancel', (e) => { e.preventDefault(); moveRight = false; });

            touchSprint.addEventListener('touchstart', (e) => { e.preventDefault(); player.isSprinting = true; });
            touchSprint.addEventListener('touchend', (e) => { e.preventDefault(); player.isSprinting = false; });
            touchSprint.addEventListener('touchcancel', (e) => { e.preventDefault(); player.isSprinting = false; });

            touchShoot.addEventListener('touchstart', (e) => { e.preventDefault(); if (!isShooting) shootWeapon(); });
            touchReload.addEventListener('touchstart', (e) => { e.preventDefault(); reloadWeapon(); });
            touchPause.addEventListener('touchstart', (e) => { e.preventDefault(); if (gameState === 'PLAYING') pauseGame(); });
        }

        function shootWeapon() {
            if (isReloading) return;
            if (player.ammo <= 0) {
                playEmptyClickSound();
                return;
            }

            player.ammo--;
            document.getElementById('ammo-val').innerText = player.ammo;
            
            isShooting = true;
            recoilTime = 0.2; 
            
            playShootSound();

            muzzleFlashSprite.material.opacity = 1;
            muzzleLight.intensity = 2;
            setTimeout(() => { 
                muzzleFlashSprite.material.opacity = 0; 
                muzzleLight.intensity = 0; 
            }, 50);

            raycaster.setFromCamera(new THREE.Vector2(0,0), camera);
            
            const activeTargets = alisonsList.filter(a => a.sprite.visible).map(a => a.sprite);
            if (activeTargets.length > 0) {
                const intersects = raycaster.intersectObjects(activeTargets);
                if (intersects.length > 0) {
                    const hitSprite = intersects[0].object;
                    const hitAlisonObj = alisonsList.find(a => a.sprite === hitSprite);
                    if (hitAlisonObj) damageIndividualAlison(hitAlisonObj);
                }
            }

            setTimeout(() => { isShooting = false; }, 400); 
        }

        function reloadWeapon() {
            if (isReloading || player.ammo === 30 || player.reserveAmmo <= 0) {
                return;
            }
            
            isReloading = true;
            playEmptyClickSound(); // Sonido para iniciar recarga
            
            // Animación de recarga: bajar el arma e inclinarla
            weaponGroup.position.y = -3.5;
            weaponGroup.rotation.z = Math.PI / 4;
            
            setTimeout(() => {
                const needed = 30 - player.ammo;
                const reloadAmount = Math.min(needed, player.reserveAmmo);
                player.ammo += reloadAmount;
                player.reserveAmmo -= reloadAmount;
                
                document.getElementById('ammo-val').innerText = player.ammo;
                document.getElementById('reserve-val').innerText = player.reserveAmmo;
                
                playPickupSound(); // Sonido al terminar de recargar
                
                weaponGroup.position.y = -1.5;
                weaponGroup.rotation.z = 0;
                
                isReloading = false;
            }, 1000); // 1 segundo de retraso para recarga
        }

        function collectSingleBullet(bulletMesh) {
            player.reserveAmmo += 30;
            document.getElementById('reserve-val').innerText = player.reserveAmmo;
            playPickupSound();
            respawnSingleBullet(bulletMesh);
        }

        // ==========================================
        // ALISON AI & BODY
        // ==========================================
        const alisonsList = [];
        let alisonTexture = null;

        function createAlisonSprite() {
            if (!alisonTexture) {
                alisonTexture = new THREE.TextureLoader().load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAR8AAAGaCAYAAAA2KkcmAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAP+lSURBVHhe7P1p0HVreteH/a57WGvt6Rne6Qw9SWp1t2iDSMpWBBZllVNAUaAwhOJDKKeKqiAKQr5BqrCTqkDKOAjZpIIR+WAbHIKNAQEmEaECtoJAhDDJYMkgpFZ3nz7DOz3jHtZwT1c+3Ot5znvebjS2+j1Cz//UPu/zrL33s9dea93Xuob/9b/k0WuvKXe4wx3u8DWGeXnDHe5whzt8LXBnfO5whzu8EtwZnzvc4Q6vBHfG5w53uMMrwZ3xucMd7vBKcGd87nCHO7wS3BmfO9zhDq8Ed8bnDne4wyvBnfG5wx3u8EpwZ3zucIc7vBLcGZ873OEOrwR3xucOd7jDK8Gd8bnDHe7wSnBnfO5whzu8EtwZnzvc4Q6vBHfG5w53uMMrwZ3xucMd7vBKcGd87nCHO7wS3BmfO9zhDq8Ed8bnDne4wyvBnfG5wx3u8EpwZ3zucIc7vBLcGZ873OEOrwR3xucOd7jDK8Gd8bnDHe7wSnBnfO5whzu8EtwZnzvc4Q6vBHfG5w53uMMrwZ3xucMd7vBKII9ee01f3viLDc45mqbBOQeAiLz8kjvc4Rc8SimEaSLEiOqrX/a/qI2P955f/s3fzLd/+7fzjd/4jSyXS4wxd8bnDv9KIqXEs2fP+Lt/9+/yfX/tr5FzfvklX1P8ojU+i8WC3/ybfhO/+3f/bj75yU/ivX/5JXe4w7+SGIaBH/zBH+Q7f9fvYhiGl5/+msGu1us/+PLGf9Xhvec3/IbfwO//fb+Pb/zGb8Ra+/JL7nCHf2XhveeTn/wkb7zxBj/wt/82McaXX/I1wS8646OqfPrTn+Z/+/t/P5/97GdfCLG0PnT+92v6+GrjxbDx5/D35fZ/PwX0yz/m9rDKl/+Jl18L/7KNP3P8jL/6z/Y8vHwOX9FDvsK2f+njBvUgfeQjH+Ef/eN/zJe+9KUXnvva4Rdd2CUi/Lt/4A/we37P76FpmnlrAS2gcT5JpW6+OTIq8yIqX76QbnBzEaipD6ivfxFqXrhgmC8CAWz9+7evu/nBfOXPkxde85We/0AR8+a7lBcu1Hk/bn6+2d+b1wLIzWdbMPLBz/vAFTMfu5e+6u1Xu/kOMn/GzWv1xddQjf5NEvQrbftKuPmbMO/7zWfNm1Sh6Jefhw+gzN9nPsfzj18RN/t8+8tPsm83+MA18/J+vLD/t+fmJ/l8+OB+IvAV85Mv7tv8swjQAG7+3Pq+P/bH/hjf9Uf/6Afe/bXCLzrj8+DBA/7rv/JX+NSnPnW7rcSey7d/lIsv/gvGi6dYCq2zaIoQM7EPpGHCeEe3bPCNR5xDjBBiwFhD0zbknJnGid31REqJ1dGCxaIjJ9he75n6ntN7R9jGkoBchOvtxOP3rujHBGJwxiC5nhJVQ6ZQUAyCM5aiSimKs4aEssuRVJSFdTiUPK83AzgRrAHvDF3naJeejBJDxDeeVdfh/QIjDYfDwMXVJVMIWDGErFznwrMpcFCwtn5fmdeJohgtLAXuO8s97+mco8REKpmoSlQYFLaqXIZAQNg0DQ+MYSlAzhQEA3iBpXMoypATkUJnHK0Iqh9ctGqEiLLNhYyhEYMVQ9TMPmXGnEGVY+858YYjb2lubV/BOlgtF7SdpfUeKcKw7ckhsGoXTDFSipKKknNBRPDGsFg2hBgZQ8Q5h289jXeghRAi3jtKybO9VNqu4fTRhsVmiViwzhJjoJSCdRYVAWNnO1CAghrFNA6xAkYw3pByARVEHKUoiEfFYMRhrKVINS71/BhEqsE1RoFCzomYC93ppzn52C8Dulvj833f9338r37n73zx8H7N8IvO+Hzbv/lv8hf+wl+4LatDgWnH8x/+fn7o//UXefdHfohWCq8/uMfCCgwBHSPj9oAC7bLFtRa36LDecb29Zr1ZszleM42BsZ94+60zrq92PHrjPienxzx7dsHF82vWi5aPf93r2M4yKFwfIj/xxTPeeWfHxfWIYlk2npJrGFNUSDmDUZxYWuexxpBV8QL7knka6kI5bjwLVYoWEMEaQyuCs+C9sDpq2ZyuwSqHfsQ7y2a5JkbL5Xbkyfk1l/sDpRQ650nAuyHx+X3PzljENYgoogWjdRFLzpxq4VPrJR/vGlbOQcpYa4ml0GvhuiiPU+bz/cB1Vh4ul3y6bXiA4krBiKExlk6UlbeEopyPI31JrJxnZQTRgjUGI4KiFCtcpMwXp4lBDa14WhH2KXIRIoecoRTuO8cn1wu+buk5coIVoCjOwXrTsl43NNaSDhP9tmflHI9Ojtn3I9MUmWKZPVnBmcJi5clFmWJmjJlYMt5bvDO0RujalpQiORWyZrql4xOfeZPXP/Ea6pRCJMRA03hUhSzQLRazM1NQSeDArRvUCeIE01iGKQIGa1pyNkyxMEyZ1eqI5WZDQrHOYq3HiqBSEJMQU1ASKQ4MQTn6xK/mzf/Rd4Ac3Xpd3//938//4rf/9g+ska8VflHlfKy1/I7f8Tv41m/91vc3aqY/e4ef+Nt/jR//u3+b88+9jQmRjbN0FHwOeAVXCrYojoKTQmMNTjPj9Z7WWlbOEXYDh/MD/VlPPkSaIvQXPVfvXZH7yOv3jjhatez2O663ey4uJr7w1hlpMpRiEbEUFfqUicZTKKCKmxdoYx0RZUwJay1Bhb4UjLEsrWGJ1kVsLUsrrLxh4QVrCyIZLZEcIilOaAxMQ+Lycs+PPXnOj59fsQOC80QxTKpcohxEiECioCgqSuMcnTWsjOH1ruVjyyUrhVQiJWeO2o5GCo2CFSWLYTKGbC0W4Z4q953lyBpOnOPEG1YGFoBIJqWAiKGzlkaVzlqWrnpWnbO0reeQM2dq6J0n+IYB4XlMXJdCsIZkG5J1GHGsjOBRXAGnilMoYyCFCZ0COkU6Y3ntZM3ppkPHCaZE5xz31gsagdYaVq2ltbBsW0KMxCkxjoESEgtraRF8UWyBzlisZlato2sMGififo/JidYYpsNAGnpaa2gtOAPWJISEdwqmIFLIKTD1BzRFBLDG0DiDscKy63DeoVpw1uCtYIxiTEaICAnyhGgkhkh78nVs3vgmkPc9n7feeovv/d7vfX89fA3xi4bhvF6v+c7f+Tv57V9m5QtxHDh750vE7R5fPJ16fBFsqeEOpZBSJo6ZEgRTPF4NLhtaLNonwjYyXIw8f+uceDVx7FeYUbh8vKWMcNwsWYhFgjJuE8/e2/Olx1uebQNDgnaxJLuGp0l5J2WeaeEghmgEnV3ziHJ2OPDW9pqzcWAsmaww5kxSxRvDcjYMnTPY2XVXVWJIHHYDh/1ADsrYZ662A8/3E09i5hnClXFcquFc4UIspelol0u6tsMaA6WwMI77zvH1qyX/2tGab9qsedh4pCT6GElak/qtsSyMsEQ4RnngLa91DSdWaI3SGaU1mVYTXhOegrfQWcOm8dxrPUvrEIGshayFkgtqwDUO5w3GGJxxGGtQZzFtQ/GOaAwTsEd4rvBE4WmC86jsEoRiUCwlGxbLNavVCmstXdfQdZ6iBWMN62XHovM4C9bWfKGI0HWek9WCh/eOeP3eKceLJV4cUhSDYeEbOt9Ahv3VgYvHF1w9ueZwMTJcjRwuD/SXe8J2JO568jBBCGhMtw/JmRwj02Fg6gdSCIgWnIO2a2jbBmMMWhRrLM46TDFoTMRxIvQDaZhIMZFDNT45v5xzerX4ReH5fOxjH+O7v/u7+V/+O/8Om83mpWczeX/Oez/0g1z8xBcxo7JqPeuFY73wLJctXdMyDZHry5H+MJ/EAiVlwhAgKRqU3cXI/nzCiWfVLQlDIE2FVddyullw72RFzJlnFweebxNP9onzURHjyWLZpsKXxolLFaRtMaXgEawK3lnEOXYlMzrLwnucGBClAEsMx9bSOQeqKIoYyKpo0ZpXzaBFSBn6qFz0mWdT5spaom+w83ey1pAQijEUMXhn8CgLY3jgGz7RtHy8bTidw661KFIKWcAh1QswBisgLyRlOwOnzvLRTce91tFqobGCFcU5oWtr2ECBhhoyTmECBWssSQtZCuINQWAbC1mVBsNCq2eLc0Qt1Mi1ZojFWHKpxymXgkFonGHhHatFS0qBkjOb1QJnhf1uQBXEOIYYGKZIyplcMjllUkqIFryRajRFaMx8jihzqNsQU4RSAOGwPTAOI5oKKURKyBjqd9eSyCmSNaOiWO9Qo5SSCDGSQ8JYi/eetulADMMQKKWeZy1KSRkDlBLRlEg5EsMEJVNyIoTM4v6nOP7oZz/g+Xzxi198ZZ7Pv7LGR0Q4Pj7m1/7aX8uf+I//Y77lW77lKxAJMxoP5Mt3ufwX/4THP/pjyFRYt9XF7lrHYtFhMDx7uuXdx3u2+0gYE2TIU6KEhBSDqGHsM4d9ZAqlxv0h0bmGzaphc9TSLTzb/cQ7Zzse7zNnQTmoYVTDk2Hk3XHkPCvRGFrf4DEYlLoeDZFMzJnWWu53HWsRFiKsjGUBdCJ4I/UCVEXE1IJRVkpWitYkd5+Up0Pk87uBMwTrG06M4c224563rKxBCgQtpJJxKKfe8br1fNw1fF3jkRg4jD2nrede17A0wsq3OBRRpTWCE/DG0Ill4yz3vOWNpeeNTcvSFFxWGlOT7L4RFp3DGAO54AXWXYcxArMRjCmTJVOMEkU5hExKhZW1nApYIJXMIUZSVsQYiirWGZIoAQgKVmFhDJ0xlJQ49AdSTCy7FmcM/W4iRGUMmW0/MaWC9x5nLaVUL7IUpXEWI0LrHd2iPj+GiVwK1lpyCFhj8NYz9ANSBGsEY4S28Sy6FqQQU0ApiAU1imsdrmlAhDQFSlZa67HU0DylxDQMaE7kKRDGnsN2i6VgNKNkiioxTOQYKSUTs2H54NN3xufnG5vNht/ym38z/7t/79/jd33nd3L//v2XXqGgidJf8Oxz/4Tp2RcZ3vsc2/fewcXCw5M19082OKOUUpiC8s7jLT/xZMt2LGQ1SAaiUqIiaolT4TBE9n2mDwlBcNbivOAbwTcGv2jZR+ULZ3t+6PmWnzgEnqVaUXoWIldaGIwhFKWfJoJmJgMDsC+F8zhxKBlnPR3gtNAAC2PpjOAMGJE5O0MNGRVygrEofSrsQ2bIcK7Ck5CZjOG+b3jDWj7aNTxoW7yxjFoICOTEEcrrxvKmCJ/oWh45x5QC2zDx5smGk7bB5UgjltY6WmtpRfAieIGFNWwax73O82DZcrLytAIuZdZdx2rV0TQ1Z+EAi7KwlnsnG7rWU3IhaiGUggosugZRSCHhcuFe07ARxSrEXJi0YLzBIrTGcH+5RBRySVgxeFUWAmvnWFhL5xu6rmW9XJBzYXuIjDEzpMIhJgSD856YClNIlKwIsGg8iOK8Y7nuUBWmYaqelfeoFhZNQ+sbRAurRcfp6RGbzQLn7NzKA8YbmkWDWogl45qGxjs0K3GISIHGNlBMvenFhAUoCXJEcqCkCW9ANM/hlSBzSV7UkIule/Apjj/2WZD2zvh8taGqfPQjH+GPfvd3853f+Z18wzd8w5ezl1VBI+dvf4G/81f/PM8+/9+zLDuWeYedJsq+pzXVJRcppJi4vBh473nPO9eRfYJUwKlgilBCYRgT+z6ynzK7MTGkgneexhnEQbtoaJYNtm046yM/dn7gh3YjbyXlCmEvMDpDtJYohiJCRphE6RUOwF6VZ+PANiVUDKJgSsKhtFrL6mKErHX/6sUlKEJU4VCUrUIvhmwbetswWEvTNLzuHK8LHFkhlcSz7Z6LMCHOskZ5w1o+4T1vGMMDgY0xTCUz5MiJt2yshZSRmcIkmvGiWKRWspywMIaFNywaCzGgIdJgeOPhQ+6dbtAccKpQMkahaxzHmyXkyK6fGFMm5mpWF01NRHuER+s1J42HEDBasNbQNY61b1iL4X7XcmI9NgW8czTG0BpDY6CT6v0svGXRtagRnlxccb4PpAwZQxJALKXAmBLGWXzrWXQNR0crnLdMMZBVCdNEDBkj4J27pTsYgFLoGsvRyZJ20WK9BWuwjaFdNviululjzjjjETVMfSAOASeOzrXkWJgOIyYXHIpBIUecKN5Wo11yRtTUEn4WjBqMCrlUz+foY7/kzvh8tWGM4Vu/9Vv5nu/5Hr7t277tK4RYgBbS4Zov/MP/L9/3f/tP+ct/5s/QpD0fv79gUQJxv2f77IrdswNlyEgBLYbnZweeXyeuE4xqCVTOlhNLToUhFYakjAnGrORSO+WdhaKFxbqjWXXEBG9f9Pyz5zv+xRDYOUeyloJQxFBk5tTN5Lk838lDzowlE6DWMAo4a/Eis4dhSKoMajjkTJ+18ohQIjBoYa/KFmEURwRGqYauEcupgZVWPtFbuwOf3x8YjGHjHG9awze0LR9tGo5FWUhNGFsjNCI8aBsWRsghzHQ2RW9yTgrOCE4EZyr3JMdEnhKmSE3QGmW9XmCdZRomihasCG3jWC4adn3PRT+xmyIBRbWwbj0thYX3PDo+wgpsdweMwolveOQcD1Be844H1tHFhFWt+yEGvUlgl4I1NVzLmhmS8tazKy5DoekWiAqhKFmVVAMjTu8dc3K0xlqwjSNb4TBO7HZ7dKZIWKnn39zQ+XINRXPJNAvPYtNhvEesxTgLomgphCmRg9Iah8ZCHhKSDYtmSeMXxCGSxsTKt7U8rxlKQlAsBquCFq1/13i0AKXeJHOxdI8+NRuf5s74fLWgqnz7v/Vv8V3f9V185jOf+fKudM2QI4wHfuRvfz9/4o/8n/j+//YH+NLb56x85l/7+kcsJXP15DnXz3bsrwI5CohB1XJ+PXExZC4jDGIYZn6KM46QC/tc2KbCPhZSqTmGZeMwAoWCaSym8Ryi8sOPL/gn5zveKzAZTxGpZLN5n0VMzdXMngsIRYQi1NcieNuwdo4jZ1nbmne4VuVJSFwoHMQwqJIpBC2MpTDNxdcokBSCCHl2+1stmJKIpbArYBrPva7jdWf5mHd8pHHc945OKufGaKExhk6Ejbc0s4tvrUFLXdStqSGYN1Lv0FSvqOSCqNx6SSqKcYam8ZSUK38IWCxa2rZl3/dsh8CUqlFat57jrmHpLKvWIyVztT3QTxOdsdzrGk6dYW0NkgIlpTkHY0CEXUqEUmrIozCESJ8TzlrUeM73A3sVjG8YU+agSlRhUmHEUFBKicQUGOJEyNUjs96yWixrWGctnfcIhcYZGuvIOVO0JsttY2kXLWKqV15UayJ7DEgWSiqEIWIweNfStWucbwn7gCngjcVYMKrkFDCl4MQizMZHLIJDc+U1GRUKhsWjb2Tz8W+6Mz5fTXzLt3wL/+V/8V/w+uuvv2R4CpTEdHXO3/xLf55/9P1/k7/+vd/L3/qBH+TpdiQWOO6EX/qxh9xfN1w9u+T5O1fsd5kQIObMMCXOdhNnY+EiFvZFGG+6CUSYClwV5TIV9qXUfIyv1aishSnFaji8ZxuV/+7pGf9sF9iJJUldEDeM2LrrN/tfy7oy/1s7DQTB0ljLiW84MhaPMJbC86w8LoX3psABITtLRslFSSKogDEWa20luGHmFEKtVGmuFTHEcOwsj4zj65ctb7QNR1ZorWAolFQwMwO8gZq7mT3Bxlq0gDOGlW/ovKWd2ccic+VpNqiiNz+DUmgai5sNqXWW5bpjsejo+4m+n7DGsOk6TleededYeMOybYhjYN+PxKQsreHeomXpBCmZwxS4DpE+ZYoxqAhXOlcHvYdSuAyRq1xJfAnLVSgcMIxFed73nKXMIJarrDwbJw7TWKt4mhHrSNSKW9u2dF2LN2BEsQLWKMtFi3eWFANqBNsYsOXGHGNdAyg5ZnLIWAxxCEx9oGuWLJZrEEMpcusxGmswtno+JabZSM2k2QJGbM2JpQy51EqkWrrXvpHNx74JzJ3x+TlDRPhlv/SX8n/9k3+SR48effBJLQzbc97+pz/En/oP/wj/yR//4/z/fvDv8e7T5wwKh1Jd4YcLyze9fsJr947YPr/m7PE1/aBMuYZQUzY8HTPPonKFIRhHEUsywlSUqwLPcuEyFyZqdae1NW+zS4l9jKi1iHc8HyM//HzLl5IyWYcidWHefiGD0er9qIJRA1p9IFTrRSeGddOwtpaSM7sUuS6Fc4Sdb9irMqmCNTQCxlqmXPueGhE6wMwJ6aJKLoUGZWmEhVSi4qmxPHTCI+fYCBitpWXVKkilpbDwTS0vSw3BRGqIYUXw1tDMYZmhsq4VQW/CAqlkuRvPMOdKmuzaFmMEYy1N42maht3+wDiG6tWsOjYLhxelazySC2EMkBVnLEdtw7rzWIFSlF2IXOXMgJKNIYthj+JFWBpLyoXH48iVghjPxZR5PEyM1jNYx0UpXFjHuRYeTxNvjwOIsGlbutmfG1MiUftZGm/xzlJCIk4RUWHZOYwRMoXVesn6aInz1YNquwVt26AZSkw443BiIdeKGghWHDnk2VgbBIOx1WOF2mpjjcOaWhsVhRwzMSRyCOQQkJyIWene+BRHn/jsnfH5amC1WvHv/+E/zL/xr//rX+bxlMMV3/8X/yv+0p/+U/zg/+f7ySlRYqAB7q03SM6YlHh91fKph8ectp6nbz/l6nzkEIWrmLnI1bg8zcrjolyqkoyjGMOAcl2U85y5FmGvUKzFGyFl5SIm3hpGrlLBth7vHNdJ+cJ+4mmEOHs9N6j5kpv+QsHc0mPme+Tc22mA1jtAuJoGng4D5zGyU6Bp6LoOZwwdcGIqEW8fA8k4rBic1ESlVW75KRtjORHDqTXc844H3nHiLGsjtAbczNd5362Hxjq8CM5KJbgZi6hijcEZwWgNn26+QaGSBYsW7JwHsvPDCXhnMTMhMuda1UKE3a4njIGl86y8w4liRWnnPrIcMs5YOutYzEZPSl2USUvlK4mhiGUCDjMZ0yJc58SzaWKPQXzLk3Hi8TARXEOwlsEYJmtqf1op9MDKe46bFi/UFpKUGFXfD5PVMA2RcQoIsOoaUOXQDzjvWSzammj2Le1iASqMfU+cpur5GYs3jpKU8TCxvdiRpkTXeJyxtX/LgrGCMdWrNMZijcNo9ShjiIS+J04DWiLOVg5W98anOfq6XwrmLuH8c8Zv+22/jf/N7/29X2Z4wuGaH/h//BX+wz/4f+Cf/ZMf5mTT8MlPPOLRUcf91nFshLUY1lZ4bd3y8dMVS2M4f3rJ1eXINihnWXmaM4+j8gw4Q7gWGLIyFGVfCle5cBECo7Uk63C+Jvmitby17/ncYWBboHGOdduwTcpPXO05S3obct3gxtbMQcnt9huIgJiakS6qDDGyS4HROkYjBBVSTCycq/kQlBMRxBoGhGgcMnsiUNsFFsZhtbAW2GTlvnc87Bo2VugEvBg6a3AodjaMbr7gnQXvauOqdbXvKuZUPR83d+nPBDpFiKUQU8a6SoSsHKAazrWNx1mDoOQUGYaRfhzZDyOHYUJToTVm5j3BovXcPz3FGUtOicY0WDEkoMx5FGcMIhYVUxtEjbDLhV3ROd8jbLVwnZW+FLYxca2FQSAag207ijUUBLEO37VYoMmF1hrGEBliDduuc0FNw/Ywsj+MxFhIIeOssGqqtzoMgVwKqRS22x228XjfMBwGdrstMrdOWGNxTUMcAuNu5Pp8SxgD3gq+8bWIlRI5R0KIpBhr6V+FEmtCn1yIcUS0sFg4RJSgQvv6Zzj+hl8G5sPB8/kF217xy3/5L+cP/cGX7WZBp57/8nv+L3z3f/Dv8+ziksVmwaffvMev+vRr/KrP3Off+OQJv+TNNR9fC5/oHI+8hZjYXe447EZCgqg1gfu4wJcKfCkmnoTA+Rh4GibemXqehImLFNlrYRcTfcxcx8J7MfLjw8hbOXMmhndT5lnKbJNyNgauQiTxFTRuXsDs/Lzwu6I3hEGpycMokMzMRBZb17qtJMNmbjwVMbULGkPS2qMVFaIWtGgt1eeET5nOQINiciLnxBAjOddKSmMdTipj2QozH0fwztMtF3TLjqZzHK0XNI1FtfYlWalVSAREFGPBUtCSK/nOCM4YnAoSM2WIEAqmQIyJGBOqlczXWIuUWrFaNC3rxYLGOTTV8vSQM2/ve/6Hpxc87UcwlsYabKkJcrQgRjFWSCjqbT0mWm8WPcKEkEzNxQ05E0tlVjuFZRFeaxesFwuuMrydlXcUvhASP7of+MJ+4ieue97aRy6DMpXKkAZT2dFZoRjCmChJkCzkKaMps2g7jo6O8U3HEGI1eKYm75dty7praL3HouQ4EYY9074nHwJlKJhsGK9Hrp5dMR0CVgULOAdKomgkx5Gcw4uX2SvHL0jjc//+ff7dP/AHODo6emGrQhz57/7uD/Cn/rM/zZe++A6vnx7zS1474lOPlry+MdxfG1673/HRNzY8PO04WVuMRqZxZBgDY8hEFaIYegznufBkmmqndCyMWRkKjApDUcaiBAxTKexT5PnQ89448O40cokSnGN0jqsEV6FwnZRJBLWzK/MvxU2gonXRGqlhj9bgLFPIc+kXobZPAI2zdAaMFoJmtmSuUmLQygiOWuUhOjE4VTRHvCgrZznxvnbxa2EMgUMMpDlE6ryrLGQRlo2n8w7rhaazLNYdfuExzrA8WiHOkikYU0MD31i61rJeNhwtGxpna/tHzpQCmgsl1WRrCRnJYIpgpZahm9axaCt7WEvNPdk5POsPlZlsnSUJPAuBt/cDZ1NkSJlSlAy35fKFWI6so0HIKoypkLQaZzXVy0EsQ85c9Hsuh56IMpUIJbIxQi6FJ7tdlRqxnossXBbLTg29OiZqvs9YUzvevaVxnq5rGafMfh9BHSQYdnuc8ZycnLJab1BjyEVpfMdyucY5z7Lr6Lol0xC4OLtgf7klTxGbC1JyLePn6jU5Y7E180PjHW3jaJzDiKK53nA+TPgFZ3xEhP/5b/kt/Kpf9as++ITCj//If8+f+I++m3fffY912/Jo4fn0ow33OsPF82c8fu8Jjx+/x9X1Gc5mjtcty1VbS8yHwG7KXMXMtQoXKXIVI0NRghqyQJFaMVGxtYJlBDW1FB61MGpmFMNoDdkaCpBmz+gsKOdDZPqX6GO9aIpu7JKgNAKNFhqtoY8WrWXbojXc1GqcrCiSEwtjcCUTc2KnhVErNb+ZE8JSlAahQfEoTcksraHzFi81rDFGcLaGUoZavfHW1FyJKI2tuR7xBgyknNj1B66316Q8S3IKWCd4b2k7z6LzbJYdx5sVXVMX5c3FV5PYtUcpx0QpBUrlvjhraduGbuFZrlqOjze0jef66or+0M85oowArfd0iwadj31WZcqJIWcoSqvKYk6KT6UQ0EpjUMUotM7hnUW15otEcyUnotiSIUX6viej2KYhqJBtg7YLRgzW+6p2IJUIuV60tE2D90LbesaY2fUTwxgZDiPb6y0hjlhrGMaRft/TOE9OmeurHYf9ACjDYeD543Ouz67prw+Efc+w75kOVYMox4gxhm6xwDuHquJtlWBpnccWQxgGNL1awfiX8QvO+PyKX/Er+L2/9/d+kESoShz3/IO/83f40R/+Z6x8x6l3PGgc69axuz7w+N1LDruE0QajFkohl4wWJWVlPwa2qXCWC+/FiafjxKC1p0qReld8AUWgoOSbbM3MwVGEUurrxdQwaV8y74wjT0OsLQtf4bDXInotq9ffq8zCSdfxkc0RD1drFt5jrcxGoVaVlouOzWrBcrHAG6GT2ti5cA1aYInwwDjWBdYidCitQGeE07bjpGkwmtn1B1KuOaP7bcejbsHSGjRnQgiUkt83Sk4wbjY8pRBzoShz60HGimLMHD6aqsGTcybnjOYIWitcqrkycLFoEbTMx27OYciNgRVoGsdmvWaxWBBj4rA/4K2rFTJNNMBD7/hI6zkxVbojqhJnIcFm9ty0JMYUmCioq2JcrbesG8fJckFjLcwNr/e6ho+0DR9zjmMR0My6a3hts+ZB22FmpYEshmk2gF7q42S95P7xCu+rB9Q0HjUw5cxhmAhTgAK77Y6h77m+uGQ69EgubC+3PH96TgyFdrnAeYdgaKTBqaFEagVMpCoXzBWunCt/qaoYRFLMxCFSYmLhG1r3FYi3rxBfvgo+pBARfv2v//X8Z//pf8obb7zxwjO1T+vv/Y3/J3/uz/7nnF1ds3GONcBh4PnjS95++4Kz8wHRBmda8qSEoTAeIv12Yn89su8Dh6RVdU+EvTFEZgLgbHhUK4P1BqJgb5+jdiVVQk31W0RQMeyL8vb+wHkIRFPzMz8VhBoePXINr7uGzdwvVXunfA2xWs+ya1l0bfVEjNDHSMFgsbhYODGWtWZ8jqy1cOocnRG0ZLwzHPkGciGEhBPDylru+Yb7bcPGewxCKoVSMjKz9pvWI656fSknxjGCOJz1tRRMDYvqokiEKTKNkWmKNUwSe1s2hloWLyqkovX4qaEkpYRMHhNxDIQQGKeRy6srLs+v6FzLw4cPOTpaVyVJUR41DR9dLrjnPLYoZGVpLY98xwPX0GI4hMghBVSUzllO2o43Fis+vtywFoOmgEHpRHjgHZ9sG76p6/ioMWyAY+s4tZYNVRtomgIhKyPCpIoVy6JxdK2lSCGkQCwJZsKhM1WR0tsG7zx5ilyfXRL7EVMK47bn+uwSk5XNZsV6s8J7Rxwjw25iOiTKkCFDYxze+RqOq9bKFyBajbemyh+iKIu2w/sbAb0PB35BGB8R4Tf9xt/IH/2u7/ryJlHNPPvi5/hP/vj/mbc//zlOlh0POsdJaxFN5JTYLNdslhtyTFyd73j27JrdPtEPmX7IpEnJERKGA/C0H+nn5C7mg8nhm/YB5v3ixijNL7oJheorK6IYDqJMRsjMf/engGhm4R332pZj7zAp3SZbl96zaJrZ8NXwJJdCHyMXY89lmBhKopVKRjwR5ZTCQ2d40FgMhX4KHMaJlCJODMerFZumpZ1lHlyp/UNVoOpmllmhiKKmynWoFlJSdv3Ivh9rsnTOK5jKgqPMzbc5KTFkpqkyjs28QJiPWT3UN7U4atk4ASEhuVCScjiM7LY9bdOyXC6opChq6wSFI2e413iOnMUqSCmsjeONruWh93RaaCmceM96VjTuFE6k9qz5MM1VIsVoptHEMgUWMc6vF8iZ/jByGAb240iYPbpSSq3o5YiI4hqHGkhWsF2DaYSus6wWDauurZm7kkGEcRhxonTe12254JzBuUpP6LqW5aIjTplxGyijYqrCG5KlspiLoiUyDmOVRTEOUYfBQa4/z8nGF66yV4tfEMbnO37Db+AP/+E/zMOHDz/4hBb6y+f81T/7p3nrx36clXWspbAwgeO15aMfvc9rj0554/X7vPbghM4vKBGmAS52gcs+zaVZU8ujpRILdyEQZyenGpabJVF1dmVumvyXncbaOlBJdVDzD7U14iaE+wpJnxchNdFc8we1ulSJfII3lkXT0rkGhyWHKp+RixJUOZsC7x52bFPEWqUjcWLho53nUVMVDkUgGmEQIeSCE1gag9VS967UBk6ZnThnwDmLdQZQUsmEmJnG6vWEmOmnygafUiVoTjGTUuXsVDmh2q5Sw9fa8d80tvYlSe0BM6ZKiBiUViytWBa26hbFKTFOkSIGYy392NMPI2gt2XfWsnCGhQVvqtyrFVhaOG0sGyccW+ETvuFTiyWvGYtNkTKNLErinoWVoSoBiGCtw4ghxMwYI0GVWLS20pTCftanXqyWLFrPxls2jcHaTJRCskpuDGbV4Y/XSGtoF5bjTYs1iThV7e+Hrz/k9MEpvu1wTcPR8Yb1ZoFzBqwQciRrYrVa0HmHZNBQSIfEdDUwXu0pU6wBfyloSphikVTDM6LDS4sps/7zT8ft/hrhQ298vvmbv5nv/u7v5sGDBx98QpUcDvyt7/1z/Dd/7s9yhPLmasGbRx33jho2p571iefotKvSlMYQ+0gcMrkYLg6R82HENC1WLJqgFEPBouJAqwxWkTr1QURrOfsreC03d26ZXzenKd7P4UjVo6n9WS+/+8txY5qcgVISOQYQyKWKWqX8vqgVZTaEBZIKSQwBmEoGTYhmVg5eW7YcNxaZNYHyTIyrhrAqjRnKLbu6JtSVTAYDvhMWqxZjYBwn+mHi4urA1W4kpHrcMJ4+K+dj5mKM9KlQtOZwQsoMMRGLVg2cxrNoG0TKnCmb78nz7ogWls6zaVta64kxE3MVAztMA6nkWlETxTtH17iaCDc1ce6s0BrBG7BacCVz6iyfaFu+rml4INChrLzhqLEce2Fla8WocQ3rtsOJIyiMWugVBhS842RzxGm3pMXixLBUuCeFrzta8PEHx7jWcn7Y0mti8eCU9ngNnWd11HL/4YblqiHlhG0bjh/cZ318ivUNqtSu+cbjWodvHVmUq+014zjUvKAKEoGpkPaRuBtJU6yeJAUpCVIiT0oeC9MQ679TIsf3PfQPAz7Uxme1WvG//j2/h5OTkxe2Kmhge/EO/82f/8/563/hz7K2mY892PDaccfp0rFaeVarjlSUi4st+/3IdtsThohVw8K3nK47jhctosow1bKy3jZw1kQpL52qr2R4fr5QbZYholxNI5f9nj5mppxmw6GknKp8A4Kf+6JUBJE60WHhLAsnNM7iRYkpcJhGplzICNZaFm1L6zzOVpErOzebytxXZoxBDIipoYTzDgVSEUIsDCGzmwL7GLkOiadD5K2+54u7nospocaiVKJfmf+eQRBVSkr173uHytzuMdsfIzVhn3MhxoRA5e0gLLoFJyfHdF1L17as59xI23m8E7wTGgPL1rJoLM5XCY2FKPedcGKh00xLYSnKUjPNLJrWUBPdY8hsY+J5ymyNo0cYFHb7A3kaa0VxGgi7HS4FjkX56L0lX/eRE1YLR6ZgFw3dyZLmeMnq3hHrh0dsHm7ojluapWd1uoHGsRt6DsOhMqanEfGWo3vHHN8/5dFrj9icnCCmnl9UKakQQyYeAjoVOuuwKDLnuXTWG9JU0JQJYyQOAT5kMqofauPzbd/2bfzqX/2rX1j09bb4/O3P8Sf/g/89f+KP/B+5fPIFHj1Y8fCkxbvEFHr6vuf66sDzp9c8fe+Sp48v2F4d0EytGhjDa6sFbx5taASmHDHOo8awH6f5HM3Gp6YVvvaQmjPa5cTb2x0XYSKKEnLiMIwMszcENefhFRpj8eLojGdtHcuiSIqEFAg5MqXMGOcub4E0jWiqVZqUC1Fn787U7q9YMkV07sp3JE1kUTCCzFIgYjwYR0QYVDlLmXfHyLNY+UVF5rI3VaPoxnsspUqFBIRDCIy5cpcUxYghlcw4BYZxIsZcp1x4R9d5Npsl680ag1BKomkczdKzPlqx2ixYLhu6ztI4obGKlVxDUKMsbG2GbVRZo5xaw0oVUsKrctp2rJqGhPBkmvjiGHgcE7tSp4IcLRrWjcOWxElreWOz4NgU7q8tR2tD28H6qKFbWFZHS/AG03naoyXL+ycs7x0jncNvWtb3j3GLlixgvcc6izGO5WZDs+iIOTNNgf4w1kqWlRqOAd74ShRVwamBWJCk5CFRpozJSuMaGqmeoC2C1ZsS5AcvtVeFD63x+cZPfpI/+T3f85LmckHLyP/7L/9XfP/3/WWWXeYbvvEN7j1Ykkn0Y6Tg2BwdEWPh/NmWMoG3Lc54UMthCOx3O7wWPvnmQz7y2imtdzgrqDEk48DYl87PPHhOKvHvZwqh5kZffPykKDWpHVR5PAw818gkQp63Fy2EnObqUPV8Nt2Czjc4gY1zHFvH2noalZrDUfDGsfYtD+cKz6lrQKHPifNh4HIcCJowruazmsbhGodxlpCh70fGMVLmBtHaZV/7nVZNi4pwKJldKai1WOugzPmolIhzR/nN/0MunA2BJ/uefUoUKdXLekGsXYzBu1oO92bmGhnLNEWGMBFSYkp1JE1G8a3Ht56urYaq6TzGC42vs8s6b1k6y4l3vO4Mr1vDWsBmOBLDQ+/Z2Nr0uk2FJyXyLCfUGR42lm86XvP1K89DD589XfMtr53yqZXl4drQOGUY9yzXjtffvIdvYQojqopahzQtZtnSbDo2D4/pjtcUa1icrNmcnoA1mMZhF56YM9eXW54/fs711YFxjLTesFo0rJct66Wna2ula9gd2J3tuHrvmmk7olMmDZHWOBrjyUMi96F6Rj/Vtfc1xIfO+IgI/9N/+9/me7/3e79c7L1kfvwf/iA/8Df+Km++fswv+cwncE54/OSSH/3CM955cs3Qh1ldUshJKMUSpsL+MDHESpkPKdM2luPjJQ/uHbFadOQCfUiMpVBqzvF2AeitCPvP/szdLqb58ZNBRBCtDYNRpI7RMWbmzFQNHNWa+AXFWSGmiWE4UMLIgsKJMSylti94W5sSnXP1bmiE47blZLVE2oYDwl6VNJMmodB0lnbhEVN7tuIUCaFQ8uyZqJJKQbVgVVnNPV8orJqG027ByrvbWVv1OBZCKgQVJgz7Au/0PWcxotbQLVqcqy0hzjmapjJ8W+9ve9piSlxfb3n29Bn73YFSMiVXzWLV6i0aZ3Cdo+08zhmMM6yPliyXTTWsklk65WHnOPFV/9oJnFjhI074mINHBo59VQ6IOdCawusLz0fWDaeNcr81fObRMV9/3PD6wvL6yYpF54khsL3eYaQKrOUwMg4DYZpQsYwhIU3D+t4xBYiacU2La1vEVu1mVWWKE9M4MA4D9uY6hLkpteofLRYtvnGUmBm3A2E/oVMh7ifCrmfY7slDZLre019sieP08qX2SvGhMz4f/9jH+UN/6A/x+uuvv/RMIfZb/sHf+ZuEwzkP7m8oZeS9t5/y9jtXvHMR2E4WsQu2lz2765ExwT4UDlHpI1yMgUPKNKsFpw9Pue73vPveY6apar5sQ6BPt7TBWxgRGlvFzX9ys/HVgQDOOqx1eN/M6dgbkbFZokLrTK+q2QzDOFJKovPC/aXnyCmdVZwRpBRKSrXbOQYOIbINE2fDwLNh4HwKjAUa5+tkZK1Jc9VSiYQxk1Oh/mqwGMhCzKW2AzjLwld9n6UI93zDPWtp0ZoQNlKbSY0hpMR+ilxPiYsxcD5Wr843vspLAClnYoy1JSDXSQwpVdpEiJndrqfvJ0pRjNjKdZkNeoyRXKqU6U1lsus8q1VbBeoFhEzrDcedZ9N6nAiNKKfe8qY3fNwJX+8tH288jxrPAyucGjhuYd1Zll44XjpOVpbOZo6XltPjNYvGoQrX1z2XF1vCMGJyJo0jKSV8U0XFnPWoNQzTSBgmskIWwc6i8XGqY3ScqSTS46MV3cJXb28YOfQ9h2EEV3XBfePp2paTzYrVokUK9FcH9ufX9BfXEDINtqrIfYjwoTI+xhh+3+//fXz6059+yTso5Ljn7N3P4UrAGxgOey7PtvTXgTgZbLuh2JZ+LBwOhUOAXTacx8LTIfJ0SjwPiR2F5ekR6/vHPDu/4r3nl0wKF7lwHhLxNtn8/ony1nO8Oqax7laB7+cDL3pG1nvGFOf8TCWR5aykVEgx33KN1Bp2MTLMmjgfOz3m4w+OOF5YmsZg3XwcdTZSGA4Y3g6Rz02B91ImmTop1SmUlGYPZR7lkjIhZFKsLR0pZsYh1DEyOTFNY+UFaaFDud947hvDqXMsZ3kNb4Qj7zn2noVz5JTpQ+AwTSys4aTtkFIY+okpRJCqXVNmg5NTlaatM8FqNt6aWmnKOZO1VMZ6LvW4lPpC5wybRcumbSpnyQitqzIiVrTON7O1Iuasslk4Hq48b7SWr+88n24s37xY8D959JCv33Scdk0dvJgryWY87ChxZLPqsFKIISCqLL2jEaF1Hk1z86hv6hSRWJPszjpyqEMW2+WCxUnN/zhrkVKwswibM8Jms2C9atlsViyXHU3TMAyBwzCBqfPKVicrfOuYQm0e1VQoYyL1kbCrHtEs7v2hwYfK+Hzm05/mf/Yd3/HS1sSwfcLf/5v/Nf/3P/kf8bf+xl9ne3lFKXUqQ0yGopYijutS+PzllvOgXBbD8yI8QXiiylmBg3Vo1+I3Hdtp4mJ3wPgF0Td8oe95HEYiSrmtudSGicY6jFYmbt361YdQPQ6dh8BZY9kPIzEG3CwTcfvJIpQqeFNVCU2t0C2c8NrJkvtHHb5R1NQUbilKSIUhZa5D5FKVnRGCsbTOcewdD7oFC+dqeOYNbdvgrCclyEmrSrDxc0NmwlrHuqsd1zdSqZ0Rjr2tovJOaC11jLC1NFZY+ir41XWepvGcLld84uSER90CYmYYJ0qhlpSNmcX/q/Gs5M5K0DRSj0dMmRDSPKyvNsXWFpCqi+PEYsXixeIweLEs2oauafDGVLmPnGuXvcBy4bl/uuZk2XDi4KE1vG6F45SqNOuyoZRIyVUqdppqT1XTeFLK5BhYNI4Hp8ecHB1RYmG47kn9xHQYGHd7ULAYNCs5RmLIYAy+a1HjSLFygOI01VYVZ+uNWCDnWLWQnKszzLRK3jbLBaZxRI34hce3DmsN3jrW3QqHIU2xHsufj4v3Z4kPjfFRVX7lr/yVLJfLF7YW9lfP+Yt/5nv4e//tX2X7/G2evP0OKcI4Zs4uBy6HyL4IuxTZlczBOgbn2RnHpViurWNnPQdrGY2leMtQCo8vLtmPkWgdZyHwzjixta7q7OhNl1Y1NSEGrvdbYp5Dsq9i7KVzrgKtiebGWlZNS54mLMrRakXbeGQeDqgCeqsFNHORVFl4x6P1kofrBevWIU5uxbMOs47zoSh7VfYKsdSpF6dieOQcxzfKh1ITxOOUOBwm9mNkmPWp9yHT50JI1Qgfr1fc26wrx8bZalycY22hNXV2V+dq8tZoZTUbaod5jBEP3G8bjv08LJAqjN/Y2uBZvcD5QM18qZvFU0qpYeQUybmGX2KkjqSxVVzLWY+17lae1RhL13VVP8hUKkFtSjXV40CBACREEy3KSkDChC0Fb2vQWc+/1OGBxtJ2LTlVLaOj1ZJHD09Ztp6pH+i3B9IUyCFWJraxFFVKyaQYyTljjJuP+cDh0BPGCZk5YpU1nUi53hBDCEzjhDGwXC1pFkuKGIYp1oZXXwXpc6reqrEG37i5knZ72X0o8KHYHRHhzTff5Lf+1t/60jOFn/jxf8bf/zvfz9Gm5Y03H+GblkMf+dLjHZ97sufz24nPHQ48G0assZxu1iTgYhw4DxMjhmg8B4RB6hzv7RS5OkxgPWOG9/Y926LEuWtdpCoJWqC1sxZzyTNL+auPm1DOIlgtdMbSYnhtc8SRa2CK7y+6uRwO4L0nThMaE/ebho+0HeuSIQayGrZZeWt74L0xEsSAtXXKRZxoRbhvLQ+cY2MMDYqbvYspZq72Exf7wOUQOR8jT/YDj7cD2zEz3Mh85oytg4fxBlqrLK2wlDqexts6UbUatMyQE5ezptFVDFzHwHXfE1Nk0bQ0xs2dYfV43GTYRGozrbeV3VxKDT9zVshVQKsu5iofOk0TwzARYpqPcBUPc1J5QkYE4yprPM+Lu5TC0I/srwZKzGgqWGqDqTOQknLxfMvUh3l4X62OItC0rg4ntIaiiZQmhr4njYkcClM/4WWWWI2RHGINredx0GbutSsxE4YBEWHRtnSLBjFSq3eLjsWixVnHNAW6psE6wzRNTONEjJGilRdScqUFCKC24Bce19rauvEhwis3PsYY7t27x2/6jb+RT3/60y89qzy4f8r/+Jf/Mrw1PHnyjH5MTNlx0StP9pnnEa5K7S7urGWFIaTMNiQOqbANgcs4cRUDvcIuJp5d7bk+TGTb8HyKvD1MjMag89EwOjNs24b1oqnJS1MXvZqfRnvE7NF8MG/1lVFd6sp/AUhZGaeRTdfw8Xv3WTmHxjy7PMzTLernl1LQnFmgHHvLva42jaYxse8D7+0DX9hPnBcYpeoGN85w5B2nxnDPVTVHh9ZO86IIhpSFIRZCgYIlYznkwlUIHLISiyHlQgiRKUzElGroUqAVYeGrjrXMRMhUcpUXyVUzOsUIWBJSvaopMuVMnyNjDHOoWEMbZmPhrcPaqpyoWhPgKZcqb5KVaaod9XkWQys5E6dASomQIjHVgLom69+XhC2z1k+86T3rA2Go6oBozRN5aympMA0BzTUfZcXiTG3U1AL3759yfHxEzpntdsfQT8SY6A8T26s90zAwHPbst1dM/a6et9WS5WqB5kRJmdWiY7Vcggr9OBJTxrlaLYwp1gQ/iusauqMOMxsfVGkXLd1qg/OVPuGtpek8rvU0m4522SKzsfyw4JUbn9OTEz7y5pv8ul/3676M01PSyHtf+hxXl8/5sX/+Y/zIP/1R+r4wZM/VVNhnw4QjUjklR11HZwyHEBhSJc1NRdnHxDZGDrlwORaeXB246DPbYni3Hzmbk66q1WgANAL3lwt8zpiSgSpVwE8z52PmzvafFuZQ/IZkF8NU+7mkqv4lqQLsRuxtOVtEaTvHZrlg4z2nnedo0TAdBq4uD1zsAo+HwHkR9sbRF2EqgmBZWseCgs+FkhOxZMZSc0JBC/ha2hfjsNbT+AbvG4z1ZKlyhlmEpFXHGLGI84g1NN7SmGpQs9YkcVaQWbrieLnkwdGadddRECZjGYBdSFyPgaloTaJaM4dZNf9zczidFaxxxFJIKohYSoZpCjURX3LNyeRSq2NTIMRIP40M08Q4TkwhkG574uqxrW0ZtUu8dVV+wmGQksmpqiqWXCdClFRnklX6BcSQ8NazXm9YLTfkJISQEXWULKSg7LcHrs4vSdNE27ZVu9pY2qZh2O7ZnZ9XfZ4YGYaBKaSqQV3q8Qul0OeEP1ry8Ove4Oj1hyyPj2i6Ft+2WF+rXrlUOQ1VrSGoqwx14w32rqv9fSy6jgcPHvAd3/EdfPazn33BU6gduu98/kf4vr/0p3n3rR/nnbfe4fpiImXLkKCPSuXmVsV+K7WLOpVYp1YuOtquwzpfdSCcY8JxmYSzZLgWyzsx8k4YGW0VB7sxFqYo9xcrHjQNCxVkpqWL1AToT9Ok/DTNVM31yE14YaD1ls1iSd/3PLm+qhpAc9JRoVZy5rE5K1uF34+dwxaYhsR2iFWb2Dhy09BjeJ4yZymz07poYxGGUtilwlUs7LJymQIXU2QfIorUlhOtjZ9VD6bmTrIWksJUlENS9jHTp8QhF/pUuVRTSowpM6ZctZVng9xaeLRZ0jWG62liHyODwj4XhnnMT8iJWGbJ11L5RIXKzizygrHWOn++aIH535sOAjGKUmq5PmUokFNmHCfiGDBZ8EVZWEMn1Jbfed67BbyCB6QIJc0tCypVoztGckiYuTiQUuHqYst+N9H4Jd4tmKbCoZ/ICXTWV45jqNKwpTDuB3bnl4yXB/bnl2yfXzBs98QQsQjHxxvu3buHtRbrPUcP7/Pg6z/K6Td+gtXH3kQ3G3Sxwq+OMO0KxVdeW4QYK6k050wYA+WmCvghwys1Pienp/yyb/5mfs2v+TVzorlOpExxYnf9lB/7F/+UMB1YLxaEMSJqsOox4ilaeS81ajGAYaROkRBfpzg0sw5uvbtZ+pQ56yeex8LjUHuQtlQtZMQiYrCqdVLnYslxBkm5XulzCVeYZ2DfkNpePqlzwkIpqL5fEv/JILMsqAU637BpOxpreHp5xcVhIM3d8ErVIq6oQ9gXUnMsLitTP9GHzFUsXBapqorG8Hgc+GIMPFG4wnAQYRDDHjjPhbOUOA+BXVGuY+R6muhLYR8TfYrEnCmp6v1YgZALUymMKAOFszjy1vbAu/ues3HiOtU+r+1Y5Wf7WBhzYUzVy1LqoMCM1nAuRvYpk6iaymMqtY8tJULOJKVKeQjVIzKKGENWOISJWBSZJzvc3hlyNRzVQ6l0iUXbYcWgpbajdCocuZZN0+BRNCVizGiu/ClnDK2tgvde6kRQEmiclRep10OcEs+eXPLeF5/x7N0rrs979teBwyGB9TSLDtM0II5pSuz3I8NuYPvsiqdffMz5l56zf74jj6l+tnV0yxXr03sslkfYtmN5esrmzTdpH5xiNmtksWAqwhCVgiXFOhfTqEOKoUQlTYX+MJCm+H4j8ocIr9T4fPSjH+Xbv/3b+chHPjKXVZWry+ecPX+PfnfOa49O+OxnP4N3rlYTjKP1DVKkJhvnBkXRUvkuKfO0n3i223N1fU3MkayFEDPDFBlTYRThKkYe9wOXJTOJnQ2PRQp1BHDjuWcdMgb6YaiiYDd2Zb4D2pt56bPWTfVabA2JoA7n+2l4Pjozd6vubsO6W9A1HdvdgYt+JItDjbu90JmnHCy7BUftgo46eqbEzKEPPBsmvnTY895+z24capK3JJ5p4RnCpRquMWxVuCxwVgpnpXCpsMvKvii7DNsU2efAkGMVnAewSpEqPZoEAgW7WTC1Le/1A89C4ioVtrGwC+//e0iFISuhKENMXB56Qip46wg5sRsGghZc2xJU2ebEPifizbRWhXyjMkDGuJrkxcAYUw0VZRbX15nvM+eMUsykkNCiHG1OuH/vHptFV6VKqLPKFkZwpVBiYRwnxjBX0BBaY1lYR9USBEc99qvFAm8cIoYwJfrrgd3ZnrN3r9g+3zMNiVKg6Vra5QoVRyxCKQ4tDlsccR/YPblgONsxXvaUqdD6ls3RMbZpmVKiCPh2gTpPEKFPhetpYEoFcfWGGUIihUyeMiWWGh7G+t0lg0ZIoZBi4Tax+SHAK92TT3/603zTZz5D27a3Iddhv4UyMozXaB7o99ecnZ0xToGYC7EoY4zkmb26WS3YdC0KXA4T51MtuQ8oxTryLJdaAIyrIt3GEo0jq6sl2iJozjhRjpzjDedZibKfBg5aiDOvBAVvDfc2G46W6zpHac4TGWuxrr5OxGB/GnXNarBqfcc6S+cbvPUMIfJ0u2enkGbGMbPxs8bgfYMztoqv59pysA+B5yHyXsycF+EgVQi/5mbmxG5M7DSzU7gUODfCmTWcG8ulGPZi2WfYpcyhFILMI3lUyDeCsVbAVFGxUBLFKBOFA8q+1GGM4yw/MWihV6VXZZRCQIgYDiEzTBONrXPmW9/QWYcUZUiZ83Fil2rTadE6bSLlXPMtueCso21r60ZMdSCecXUaq7X1BlBKocRMjJULtNsPXG53dQqIqV6zMYbWCeumYbNo6ZrKr8pa5WFlDsEaI3WEkAitN2zWS443m1ncvqVxzextgMdUvaWmpWkbxBgOw8R2mNgeArshcPb8iquLHWnKUAxODEYVUsEYj3ENMVYd52EYsN5hmwYzfzeNhVISYgXXOciZHEc01/4to1Un8vYGeTOk0b7gGX4I8FOvkJ9HfOyjH+XRo0c4V0uOkCGP7K6eMPaX7PeXXJw/rZTyKXE2TDweei7DUKdEUmitpbWWGAJTSsSbGeTO3nZn6+yyh1xnJ6lA1jmZiaUzho133F+0PGhbNtaSi7LNhYmaD6rGsdA5x6ZtsfMk0Sr7WZs3c6rSD51raF2DlTorC+aw7Qa3npKZy62GUmCcJg7jwHYY6Esh1SMyZ0wquq7DGsM4jVz3e/o0UUS5TpmnMXEeUx2XLJ6CpaihKIQChxC5Hka2IbAHdsawNZYrY7gUw5nCZakD8oLe6FC/f7Uqitja7GmMUHKpN4VSmLQwlExQoc+FqSiBOpbmkDNjVsaSGXJhyoWU68zx467lpG1ZOIc1NTS+jInLFBhyIosha9V2zkkBU5tdrdaudVdDa2ssztfhhSBoroTDxtay+P4wcHZ+xfOzK8Yxolqfa5xl0VqOVgtO1wuOFw2r1tG5OnrHW0PnLK2zdM7irSWFSIyRxjZM/cS4H2ooXuq1YK2j7Vqsdbe6R4+f7/jS02ueXgw8v+x5dralHxI6VzCXy0WtfKHsDzuGoWc6HEAVa2syP8ZIiqHqNM03XyMFkcyidTgL0zjSHwZymRuR51xbt+ho2+YD19Krxis1Pqenp2w2m7kyVJHCQOjPyeM1h/0F19eX9IeeQyjsSuaqJA6UuS9aOAwDu8OeXPILVr32P/VDT0hxJudVdT6dk6hG6mSIk6bho+s1H18t+WjTct/byhOKdQxxNmbWZK5TD7rGMQ17+n5HyXWuVM0JCSA01rNsF3jjZ1+lwsiNFOn7W0vRWhYuSsmFKWWu+559CkThA6L1N++NKRLiRIgTiuKbBnUNe5RLLezF1MrdrJzIzcQNatUkq9LHwC5GDlrYpcQ2Z64NXGjNAfWlhkhF6+fe6PmoaD3qs9dgjCVMiRQSjfV468goU4pMuTAV6EOgT4mpUBtKS92eVTHz8MJ2bmbNRVFjwRhCgW3K7OJEnyIhF0oRUqqhUcmFRePZLJa4AuMwEcdUZ8nPo2ucnUfXNA1t05BzYbc/MAy1wdLY+r1KSWiJeCOsO09nBZHaYFyk5uSssRSUKQUOw8DhcGC73XP2/JL9diClQsi1YjiEyDhNjGNgGCJ9Hzm/7Hl+NXB22XO1nbjuI4cpEVO9GS6XC5rG19HKOWGNVJa59/VmVep0EnKkxEBJE5QJNGGk4OYJGTknUqrGMcY0F2EKhYJvmtvr6cOAV2p8nHN47983PlqgBIxmwrTj2Xtvs99umWIB6/DdAvFtLQG7hjLPWAqzPKfOOZQq3F7j/9nkzPZeQKsr6lDWzvCoMbxuCh838BGBNcJ5CHzhsOOqpGp8qCFX6yxd4xmGnqhVf1ekVmFqgnnmpsxCWUXrBWyktgoYW8Oy95PQ87+m8nwySkLJMld1ZohUSr1IHYWbUqRznjcf3OfR/VNs287z5zMxlzoTXXX+7rxghAwZQ9TCIUzsptpkekiRfS4crDBag/oW49qqxWgcbm67qOHM3Pku1WuzOEwqrJ3n2DeIKlGEJNVzSkVJc/Ur5EyWypOq89vroMOpRLbjSB8DrWtYtwuMNYx5HmU0BcaU6zkuUJISp6ri2Mx8oloK18rPEcH4OlNsue5YLD1H645l66u3ys1Y5srvmWJiiokQq1B9zFUP+2ro2Q4j+ykyxMpFGmJiipkYCjkoKRTGKTOlOsttHxK7KTJMVa86TqmWzYsg0mBMi+KISQkhE3KpaRhr6MPIOIU6Uto7VidrmlVHJpPmueuEgEkRTRMlVy9IJZJKJOSIbyxHxxtWq8rk9t5TcialesP+MOGVGp84K9ndYg5vtteX/Ni/+BGeP3tCDIVpzDjxLPyCtpnDGZ1LmPM0zhuS3vthjtSIXWZtnkriQUqmFeFh2/L1ywVvGOEYZUUVLU8qXKNclsQgQpmbOo3W+eQ5JyZNNRF6k4+ZdX5UK5O3HwbGUMlfMldFcq7SD7f7N+PGEOlMc6532/e/z4uvoUZstfTdCCfrDt86LseB80M/T7usnwd8gCEMtSVDpTreSevAvKw1F4ZYUIM1DkwdfDcpNbw1gs5s5awFUmXRGjO3eajgqHPSndQ57bXsnWvVyFaGMfNpSfPkVPGOZtWSnLBNkeuU6XMNqMESESbNTAXq7NT6WSVplb2dBwOqCKlATIWUMrFksIbleslyvarfX8GJobF1Zn0tRWs1pkXQTH0ohKwMqdCnwiEnxgJjKfS5DokMBbQIOQsxw1hgl+E6K9dZOURlSkJIMERljAWDsGma24cVQYytXrmxjDlzdrXlnSdPeX55RTYFv2qxrSPliRxHTAwQIhomJEe0jGAjtlHEFVRyveS90C5bshQwBucduaQ5tfHhwSs1PkPfz1WuG1hW6yMuLi/4h3//H/Nj//yLXF9O9IdCyYZhnNjvdqQ41vzKPPDtZmm+v7AF5t4YEVOZnfPCbZ3npGv5yHrFG13Lyhh2w8iXtju+NPS8Mw1c5Mo9uSlMiioWxRnY9z1TLig3jY+zYZtRFMZYRa5uoC+U5W+NzUs/w/vx2MtMIhEh5Vq2r55VofWWZtVyftjyxfMzrlN8X27odnfme90L+1dTVDUPhMwdbAo6hzq7VLiImcuUuZoXX9Zq0oqYecHmKq9ReQ61EVRrS4q3hsY5vFgM1WPrfJ06auf2jliqSmIoEW0M2QpRYCi5ehipEuzqVFZDMVLzX2V+JChaF3/KSizClJR+jIRcVRlLKaSca77wMDCNAVTpvMMbQ8rVWOVSyCo1R5IhF4OxnqZpcb4jqmEsyjYp21TY55oUz1o/u0+ZgxauUuJ8DFzHzEGlUgjGxMUU2YWEOMfSeZbOzY24szfrLNtx4snVNddhIjrQ1hBEGeLIFCdSGOu442mkjANxf0BjqNKpkrFeMN4g3pBK4jAMZIQpZq63e1QM7aIjv5h3/BDglRqfKYSXDIZhuTzirS+8zT/9pz/BD/2TL/H4SU+KnikouyHMd/cb8uss7m5r6HK7Zuf8S50e8f7iW3Ytm+WCpfXYlAkx8WwY+YnDwI9NgR8LI2+FkasQKivXCMYoq8bz6GjD0nlyjFhrWS0WtK6GGTK78fXzarhRqO7/zfd70ZP5cpQ6e6nMzFkEbqai3uQxK+cbUKy1LDcLkhaeXG+5Lkp8wXt5/zAoRXJ1628IL3MSErHEVKpLnjMhZfYlc5YTZwpnBa5KYdTa3JjmkDKlTJ5bhHKuc6EsdYKpM0JjLJ2rne7eVh3pVeNp5pHPRW/LL4i3db58Y1ksmtpAa+cQWmufWblpRC2Fobw/HSNkmAo1xxIz+xBvQ57DlOiHyNXVgcvLHf1hIt8MItRqLEEpt95SFTmbUiHEWkFsZDZShZofK4VBlb4oA7DPmV1O7LOyz8J1zuxLrYwm49hnqhGPmW1KjLkQtTDFyJRK9SxzYsyZfYxcHEaSsxw9OuX4tXuYzrLtD1xcnHM47IjTQAkTGgKi8wyQObWQch3DY0yd/THFqnKZs3BxsaMfI365rCObPkTuzys1PkcfaKdQQAlT4H/4kX/OW29v+fw7I8+uCjE7kjqyzOOJa4YF1boKZM4j6AuLvP5Wcy6KQaQO9BtT4Plhy+evr/mRi0t+/NDzDDg4R+w6JmvIN9PxEDyG08WC46aBGGit5WSxorMOTXVGE/PalpkAeFNd++li/hMfgL7QQDqbLwTFirJZtqwXC66vr9n2YxVpF0O5PZ03YVsNF43WqRrIi/1mlSuVZw8iZq28GmvAmqrTbGrYitS/W7RWUObdQUuZ5SzM7YK2UkfZOKl9WNXg1eR6KhlEsVZoWkuzcDTe0nUt665l1VgaN/cfSfXIKr/HEhD6Utjlwj4lhqS1gpZrC01lW2d2U2Q3ZXZDYt9HhqkK7iegT5kpzT1s8n7puVC9sVCUSWvYljRXD2ru0TMYnFi8cRjjGdRwGTODWAKWYj3GeYxzRK1J+0khqpAw9KVwNU5cTVXQLubClBO29fjlAtoG9R4aT/GWPkUutjuutgeGfqDkXA28N7jGY1yt5OaUiVPksB+JqeBajxolpjp1RAGMxzYLfNvdXk0fBrxS4/Po0aOXthT+8T/6B/zwj/w4274Q1DCqp1fDdgqE+cL/4NC9F8KXOd54MVmrtyVxraXsMDEAl0U5U7gyhuAstu1oXIuzHu88dtbQMcbWMnoIrJznzc0p99olJcU6l3zO+7yYl2E2iD9XyAuXypzxwBvDsqn7t91PjLGQqRWtl6+r2g7ywZwRH7j86hHLAjFXmsDSNaydY2EMfm6vMtYgxlePbib7yQvfW1FKiTXhTrntsDYiVeQrVXXBWt2r1R0MpJK43m6Z+gMlRVTnJtBSbtnOocCoNbzZpUpA3ObCVU4MCIFZz8gYohj6An2CsQhTAbEe23bEUhhjYsiJMHsJjXe389CQKmma5jntNUGecNbQmDqWx9aUE31RzlPmLCtbhFFgUhiA65x4HhNXORHEYl3tjwsFzmLmsiijMYwKyViSt0Qn9Fp4vu354nvP+cK7z3jrvWdcbg9VnzpnxmmgH4Z6nlzlemFcTSQX6IeRi+staoTleolpwHnHcrmkaZpZWuNuXPItjo6OPrhBC+fnl1xeDoxZUNuRbMNFP7EL9YLWudnw/UxPRb331mU1D7K8/ZkXvKOi8yQFA8k6srFY61l2C4yCJp25LbV6lTQzlEQy1BHFRmi0IJopmpm7juriN1JDwZ8pXggZdU6617vtnLeaI5WFd7z56D6P7t+n7wOXu4E485XgBZf6BQ+ntp7wPh9JKzVAqRKp1XhXrRjRQqvQFsXkWv4XA+KERKUCTEXJ1GSzmYX265QLwThLKTDlOr2zzGS/2amtAnD5RmumNmvGKRKnRE4Zncl9aR6hM5VKUtyV+ZESu6xss7JLcMiFUWFSS1TDVKT2muWqPxQwZOfAe7RpUGtRY8kIsWTkRl5jHlhYECJVISFSmdyVPGpqaKqF0RjOc+ZZKVwhbBX2wMHAhRbeSYkvhIl3xsBoLeI9WQx9Ea6y8mSKPJsCB2CihnRX48QuJi77kfNd4NnFgfPrgayCbzpUZB7MGDiMI1mULELWeShjUZquDh1UC+2qoWkskMklMI0DGnMdnfwhwis1Ph9MNgMY/v7f/8dcHyJtu6JbdEwxso0jUQrZ1ANdXZmX3vozQF0L7/NfRGSeBT6Rcpop6HXxFq1zxMeU2aXE5TSwTWOt/pjaVc0LnkCR+ZefKWbj9aLHJLMmC0BjLSfrjvvHG5Zdy/l2xxAztSNsLmFR9+nm8z/gkc1i87fQmh2vebO6wcwJ6EEN18BelOQAVw3MkBJ9zkQR1FmyaF2spYAzGG+Jqow5E28qaVqlPG6Os1FzOwSk2rxaMZN5WF9jalk/AweFa+CqKNe5NsXuSuYyZ65TYZeUq5i5yonrlNmlXDlLubBX5WqKnB0GLg8TISlFquEJpRIda+7q5vMrG3y6oQqokDEkDEOuBm0UoRfhomQOYoi+YRJhMoZBDFvreGKEt7XwnMxgDee58CwldlJZ5xcoXxqnuk2Vy93IbowkMaj19FPm4rJnGBJN1+Kco0Rluw289+Sa690ExpNUKj9MLKqG9WbD6ekxMRaurvbstj0pZRrnsDnTX22Z+uHntG6+2nilxufLYfiRf/7jXPcR7xtSSozTWF1hoQYeLzBuf7aobnb1AkSEVAr9+D4hsc7enhOepXCYRq6GkfO+52l/4GKq7Fudu9yZ+4++2uf1xksRwFtH4xzT2PPs/Dnb24bT9/NDXxZezR7UVwoBb7ZbW6daOFuV/yYRrnLkeQzsKIxSvYBUoM/KoJWLVMMTqO1Cgm9bogi9KoMaQtFairfz8UGxzmBt3RdjbFUPdJXUGQ0MJaGzRxVVauNrKVyj7KW2buxVuMxwLoYzFc5SYZuVbUpc58SuwHWprR6XIfLsMPB4d+CinzikmtzdxcghZSZjqjJjgUPOnE+B8xi5SpldgX2pzPEn48hlKWyLchYCF+PIWG40FWqFcwL2qmznz++N5wrhnZj4Ukx8KWWeiPBMLE9VeRYzV1Phcoj0UVE15FgwGdbNgnvLNSvXEvuRqQ8cdj277YE4ayKVmcdVSibmxDiOhClWGVkxOGdpnKNrPevVgnF7YHd2fXtT/TDgQ2R86kU65eq27/uREMKcXKaS5HjZU/q5o3oH9VPqfzMnZ56MgAhRC6PW/qXJGCatDY31jl6rW3NU89WHCEbA2dpGMMXI1fbAGFJNQYuhmJrkvkl+/1S4MUbGGKypOa7GV7GpoWTOw8TzceBqCoRSeS+HrPS5Jm7zPPKlmFppdM7Usb5T5HmIt6qQYmunuXGmClu52hVfd0LBCcXVPrDzceKdw8h1KgRqXmUvwm6eKR9nA3VAuVTlaSmcFeVCYYdhMpbRGPYoWy1sVdmpcp3hOhcuU2GblF6FvlQj2aPsU2abCmc58ywVnmV4npWzXLgohbOUOStwIYZrhV0ppJmtXr+LoNYxqTCWaoxjKmxD5L1+5Cnw1AhvhcDn+p4vHXp2xnPAchUS10NkN0TCmNAxsxDPm6enbFzDeHUg7AOS63l68PCU9dGKqKXSH8yc5teqLDn2I+tlx8MH91l2HQbwjafpWqYpctj3P08X6c8OHyLjc+OC176qlOt0zAyo1JG7X34Hfz88+tmiRh81tNJbblA9qaJzRDOLYqV5ymbUmp+oXkeeJVcrz+XFfNPPBbeeCcqicbTWEUIdjLgf4wdbL16QHP0AbgYdSvmAx1ioXokxBjPPlodq9Hchso2JSStVoGlaRCxXWTmUWiK+kevEGoxRxNRS+Pk48e4UuKCGMFmh5Ix3lm7R1qMtinNS+5Ic+M4zWeHxFPj8MPJ8DreuVLkGwtwq4kwVgFcj7EW5FOXaCDsRtqUwYBnF0itsRdhqYafCtghXKuwUdkU5FGFCGFWq0mVKXClcFOEJ8NQ5nojhOcIFlmuxbMVwEMNoLE275Hi5ZulclV5FuUqJyymyC7Ea5zk8u5RCdB7TLbGLNck1mG7BoumwpqGII1vHlASNhhaHUyGPme3FnufvXXG4GomxNta61pGplbJk6rpA6pnXUqo0SxFSLIQxMva1l1FmPlHNTn548OEyPvPd2HmPOFfvKi+mKbR6Gu8/fs62p779pb/xcjL7RidGTG20rNM6dV5M83vmEO7LDeTPDlrqOBjvhNPjDW1bO/T3/VR5IjcVri+7oOp+qc6aMzeP2ZhUB7Mm7M2sjWy08njGmBhz9eha5zhdLDhyLYhlGzOT1LDJSa2CiVHEg28ciDCosC8wmEparMP8qk7yNFZJU+ccXddinWW9WbFYdogYohqidSRjmErhUAoTVTFRoI6SMbNitDXVExXlSpQnMfIsZ660cJinckxS8y3vlsw7qnw+TnwxRN6Jkccpc54zZ2HiSUy8lwvvpcLjlHl3ijxX4co5LkW4EsPeOg7GMoit3pxzXISJd/oDz6fA82HgOtR59X2YKFJJk9FYJp3VIU1tb8FYDlo4myb2RRHXopia3FeBbNhf7hl3AVsci27NYrnCdS2maSjGosZhmyViG7RYBEtjGxrbcNgfODs7ZxjCfFNVsmT8skF8Zal/WPChMz5t2+J9W91DrQzlG8jcs/X+48uX3s8Gt1Wl22rRS+0N3DRVvgAjML+Ped++WhClVu4UuqahbWrXf0Hox0Au7wvd1/TV+59dG2fnjO7LkPrdoHaZ5pjQlCm5TkUYprEmiYvSYXjgG7qSmabI5TQRoAqhG4sRKJKx3tAu29rvZR3G1NHTZjYiSYRYlGEMlKS4WQzMtZbje8fVMMbMynqOfYunMstz7frEUkXfmVnIaa54ZoTLMHEWI89z4rkoF8C1wiSQreEgcGYMz5znrVT4iRj5fM68mwvPs/JsqoTKx1l5J0aehcRFSFzlzE4Me2O4NnAwVXztUApX48g2Z85S5DxErnNhLEqYKaB5zgHlXNgfDuwOPYfhwOXumn4aGHLkyX7PO/2Oq1wn5GJs7VovyhgSOQlSDF3TgTgOIdCuV7TLNUMojAna1RG+XTGNieEwUbLUyKEYLBZjBdt6ihOGMDKlMMuofoXr4hXhQ2d85iwv5YZG+/OAlxOzXwkic/UJexsnF2q5WGYmsVLlHr7aUK0jia3UVooY60SGw/5AzqCzguNPdSHdeGoyV9FujZRWI1VKZfNOMTLFQMyRVEIdadN13G8cthT248gYa6jp7UwEnEMv11pwhiEkUi4ce8fDbklS5SIGLktCfU2MV0NZBfKXR2vu3b9fR9FMiSMMr1nHRsGp4lRpECwFUYhIVTXIta/OO38rar/VzGUOXFDm1phCFkMRywj0IoRuwaFtubCW5wLXYjiIpRfDXoRtgUks2ViGlDmkymo+lJpkH4CDUbYoOynYdsHx8TH3j444Wi5vtbXNvKQEQ9ZqTPZTYCoJrAVvSSh2sSA0jmfTSHAGv1oSUQ4hUAq3PXZn2x1vP3nOmJRoPBf7noDD+AUYj4qjP0RiLKSkWNewOl6xOllhlx6c4dAP7Hb7D8ijfBjw4TM+MIczL4Yw1csoVK1mQ21UfJ8q/zPATzFV4is9J8yfNX/ebQm7pjC+8nteCsFuDJ73Dc79ZELeOuvQVEEyZyzTFNgPE7Fwm1x+6S0voHqLYmb+z1fKhAu3npP3/nZ/3KypY0TpjKHRgsYIWbm/WHLkG1oxdNbhpM7g8o2lj5nH13v2MeFFkNkreB4i1zmiTnBeWG1WbE7XGD+LfjnLYaqsY4tUjpEIrQgrEVYoywJehABclsLTaaJPVVCs83XUsZ21kZi/txdLIw5rDCmV2ulv6rytLJU/NAlEYBLDUJQhV61pReqYnxA5xMAwy8jm2aBl5+ZWjFzL86WQ8wsKBzekVqFqKRlBjaWIwcyC/NY7ojGcxcx708hOC+oc2FmJQWtLyZgyUeD09dd4+LGPEgHTLsA6zi+2XO96YoEstVdtmhLTGGuXforEkggpkdVg5sLChwkfOuOTS6nM4Re8k5vkrhiHNW6mE86G5+WF9VPhxmC88LjBy8biRQ/JiLnV5Ll9QGXxvoQX/87LhqnoPFPppccttOBMTbBuuiWt78i5Xog37SUv5pl0vthvvsetQVa5Ndqq7xu/28+ae8bSPJDuRqOn9qpBTrFOQShKay3HzrGi0Aq01uFROmc4Wq04xMTT3cTFYcR4x5gTT6bARU40mwXdUUsyieIK3dEC11kSlQt0iLVfKxmYZukHUworlKP54VGmUrhImYuUuZomcsmsrOHRcsFHVhvuu46VGjbGc+waVq6Zz02dV9+iLEU4so6Vcxg1lNk7CgjGe5aLBau2o3GelDNjjHXSRe3CvT3/Ywzsh57z7Zaz6yuuh0M1QHPLyY2EClI1lKDK/ZZcJ6Qa69nHyDv7Hc9TqbIwpSo8GOtIIvQxMaQI3vDgjUd0x0dc9z2+6zDG8tbbb/P0+TmHEBmL0ofIoZ/Y7noOh8AwBGJWQiwc+rEOHfxpePxfS3y4jM9M809pVmrT/L5n8UKo8KJR+Apr/yfFzWJ3LxEcXzYSQrV6P50Q7WWIMdhZq0huRt3MjxIT5PIBo1OTwVXUyojQOM+q7dg0HU6lasfk96t+N+/5oPGsBL7G1NHABvnA/t9Ut0RkHpxXOeGpJERrgtlJfY+1lZ8TZynR1npUEzEFxBi6xiJF5yF8BkoVhDdWGErmKmWuUUpj2WyWtJ0jS8Z2nmbdIY1DzTwdwxqKNQwxc1AlmtoTthA4AlYKtkCclRKjwpALMWeOjPCms3zMOV5DOaZwCtw3Dm9gdxgYYqw6zAWO5seqGJpZZK0ymsF5z6JtWXUNy6atOjgoKSshZlKuifsYU9VLEkMARqjDJmeRfxGpo3Gcqw3Q802qcQ0r30Kp3eZ9SgQFsYZUMtMYKVW5jKCFPgZS1iqE1nZ1bJKxaFEOuz1X51eEUMC0JLHsp8p4P78cuLoeOBwSRaV6XwUwhpjSzZX9ocCHy/hQDUy9addq1gcWf6mkqhtUXsvPzDioKq3zdL59f+Gq1urSrL9jcsGLYeE8rXNVCMzcjNz9qQ9Zybn2g+Wa/H2xeqazLIa3jrZp6mfOzkztDq9Snc5YjEKIiXGa6rF4+bqZf9f5/QvreLA+4nSxYuE93lq8CF6EhXMsfEPnGxrv68+NZ7NYcW+94d6i48Gy48FyyWaWak0qjDHfNlcCtdplLdYYpAiH/UCOmdP1gocnR+xi5p1hAGe5t1ly1Fn+/+z9WXck3XGmCz5mtgd3jwFTTt9AiRpO1emrHv7/3+iLrlo1HkkUvykzAcTk7nvvvrAdyCRLpEo6qibOajpXMPEBASAQEW5u9to7tLYSgrDbb90VMCjjNPZuCywap9UN4+m2pwYEKpFGEMiq3AyZh83EJicCwgTsaEzrzFQL21q5U+HWlFZWjsuFKjCgbJoweEvXLUjdTfE0zxxOF3/++riXVdwWpGeRLWVlXhbWtfQxxpfWqkbqHs5fulkPFLy+bZMZd8PEh2nPPg2UZeW8zIgKd9PEd9sbHuJAqM1zxooXOjNzf2s1tDTm5wPZAqE01tOFNhdMIjF7J7QuDuo/Hs4cjj5q5WH04rkKT88Lz4f5z8Xnjx3Nc9i68fvvFpavn7bf71T+Zw9tMOaB0FthvCn2VrmbYu1y5mEYuB9HpugdgagQLPyuHepXncvvd0hOVOyq+/7Ir/dpxTGOKF5kcops0sBunNjERLSAmrK2yvFyZq5frli/87u/6p5EYEiBfYxMpowxMuXMNvvfcZMH9imzzxO7YWI3juxy5DZn9mrcIDyI8DYa2y6qPSD8cDrz4+FIVGMTEtTKPF9Ivas7HM7MxyMZ2MTAqbnN7RSNt9vEZBXq2i1BlePjE7TCdrtx47FSvED2yOZWv6jKS3VsKtDYqvAmRD4MmbdDZmyVUFZya0hdKXXFamGjwi4bRSpV8djh1kh1RVulUJm7w2WtlWVdWNeZVCpTg02tbNQYVRlSIsZIE7d/cZdBL8RBjRQid5sd+82W2MMEQJjnhXVZUCCoMsbAaEJbVtZlodEYYuR9zvwqJt6FyFAq62VhXTwPbLTIoErG0GVleT4QlkpqSqy42DUExjRiRZAVWMRDCkujocyXwuH5wufPZ3786cDj4fzn4vOHjvqiSNcXL19fabtZdr/HVx//6466eJzu9Ygxsp0mNtPEzTjxMG65TyN3FhlQoghBGog79dBKz+QqtJ7q8E8Vw5eCJH013xmpoSdVeGKGkJtymwcepon9OJFMWZaZx+OJ0zw7ZqxffreLo/qhLjwNImQztC6wXGCdyQL7EHiImVtRtsAksFFhA9yosWuVm1p40yrfNHhXYd9Z5b/Uyk8IH1cfXbZmhOKWfykHzJRlXtmmgXe7LSH6enczbdjR2JsyJnGv5CAcH59ZTmfu97d88/atx9EsK7lWbky5j0aq1Q3CWuPcCnMtUCtTqdyVwkOpvGuNOwVtxS1sg3IRD0GUqAzbgZwDRmNAmJpjVbWuoLiSnUYyGFNgnxNbGjetsG+Fm17sBhWsW+SuUjguM+fLgmpgyJkshpVGu1xc1Y+/L9fq+I/gv6tK48TKRVYXfma/QNwLvKGyq5UMDGbsYmIX/OtTztzf3jJooJ1m2vGEXhZsqQwaGDFiAc4L7Xgh1cY2JoYQoTaen08sp8p8aXw+LZwX+in/P75X/xTHqyo+9JP4ipVerTNa91xpv8dp+dccTYXDcuG0zh28deVyjAlFKM0d9mpdkepX5dCD5koplO4oyEvH88dfyvYV+fD62JMZyQxthdAqdzmzF2NTIbdGK4Xj+cRpnVnpSv6vyJX/4/wFiLK0wtO68LzOXJaVpSxIWRhaYwBircRaGWvjpjXueuG5rQu3rbKXxh6Y+l90qpUaIilEWl1RiifnqJCHREwBE2GKkU0MnuhRG4MKt0HZBhiSgbReexuGcLvdcX9z68kjwFaVmxi4C5GbYGyju/0ZDW2VIJWBxo7GA5UPqrxT4S4ob/Yb7u/2FBUutWBThgBC4SYFbhU2rZClYbUylsoGIbdGorEx5SEab4NyQ2FXC/tauGuNqa205eJj9HXs1Sug71SGeV04r4u/BOLM8RwDKQZS8A2TZ6QLc/E03SkkRhHuQuTdZmJSJTe4S5m3Y2bURmiV7ZB4+3BP0sjyfGI9nJkfD1w+P5NKg8uF5fEJWwuhQlA3QIum1Nq4nFdqUQqB01KZ61VE/DqOV1d86CiO33ycuVql/u5g8687WvdtuQbhXUl567JwOB85Xc48XU4c6+q2oTTmZaasqxee33sU/5LXsvVNUlZhExo3yXi7yexUmNS3OtocePZVaaF2MmPfaX11+90RbK0rj6cTPx6OPK0e9FeWhbiubFtlYiG3QqoLQ13ZtMK+NcZWCP33Kg3rmiUBShFyiGwssi4XTy6loFEZhsyQfCQNtWLLgi4rqbglxz4quzG9eMiEYARTYnc7DKJohVhgUt9AbbKyTcYuGqPCoMKkyjYYUzB2QbhV4aZV9rVwb8bDdoNG43lZ0By5e3uP5UCZF/Zm3AtMvTNUjBFjr8qmj22bWrkRuBXYi3eEeyp3VG5KIVwWrJQvI3oH6EqrLOvKeV0o0sjThOqX7LAhZ3abiZSCj1+tsbPAu5h5lzJbUawWIkIWZQqBu2HgYRoYgpJMeXN3z7s3b5mGASmVySJZlPnwjK4LMs9cnh5hXmnFfag9gFLRBnVplKWxzMUxpPjnVfs/e0jHZq5ePNeP7V90qv/x41pCBGFZFg6nI6VU1to4FXed++F44PFy5lLdU5imtE4u9KfOb3+sG/v6az4eNcYYuAnGN9PAuyGxCQ1pK6UWXNzQO8CXV8d/z9W03lfE3g3StVrVM+eYa6P0zcjUlPd54G0Q3ppwa42pNTLeSRier3Wolcda+bRWnsvCghvh56BkkR4loy/ueXGIxCEh4q9LEMVqY6qVWxG2pTGpEoDlMnvGeYOlLBAUovv+tOqZ8yaQo2IGKQpjFEZVRhH2MbCLkV00dsHYxcA+GjfR2ERlOR/47Y8/8ng5MW1Gdpst67Kyni/sLPBmSKSgPC8Ln1Y3f8vi4POAsFPhXoQtjVGEUYWtCvemfJcyf7vf8/12w9tx4CZFj+Bunr6xtsq8rtTWuuvhF6xPu++3lIrMM1OFv8wj/36c+AuUfJlZzyeWy4lRhX00dlHIAqkJ0zBwd3dHDJlWGvvNjtvdjv1m5GG3ZZsCslxol4v7Z3d3hvNlZVkLbRVacdGzivjyxK7Whq/jeHXF5+sV8pebIE2/GBq/GBt/6QL+xceVf4cnMayl+GpVYC6Fp2Xh43zmeV0o+Aq09e/7eoz6Q4WndcuD0rs3WkWpbhuahNEaU4BBK9ZV9as05uqAaJHWZR241v53QO0vmM/1803E9XAqjHlgCoEdlbdZuY+N+8G4T8oklVQrsVVCqWirtNr/9p7VVVqj9A7detEEj8pRM+I4kjYTpW/uVJTYt0V7FW6AVBt1XrgcF9bVY2ou60oLRsiJtXWQuDsEijiep9qIBkMITGpMZmxzYMrGkJQojRyV7SYz5UhdV8rlwu0Q+f7+hoftxHK+UJeVKWW2KYMpn+aZfzydeK6V0iG4QZWdKVuFUCtaFkLz52Zslfcx8LebiX+32fB9HrjLmcEMoXlabPdvui5IrpiP0HrixEwoK7EUhrLyJgTexcSeyq40biRyP2x5s9vxsNuyGRwH1NYYeirt6fnIfLqwHcaOVRVudhNTCkhZKMsFaU5M9WWN27uspXoqRx/RrQnhnxrX/4THqyo+L0/N722O/mCB+beaxfrhY5iDrVWFVfUFF/Kq8/vf8cePLw/NH6iIsB1Gsiq6zuiyIGvxCJgmbmfaYOnpC3QfY2hdQf672nVpTn6M6hgStUCpaIW7nHk/JvYBJoPRYNLmrGGB8TrSqLK14P9tymBGpsf39qjpY1lZyoqZEqIRh0TK6XfoCUYj09gr3KgQW6PMhVYqrcC6NubSwAJpHJjLyrrMxGhIEBoV0Ypa93hWGEwYFJLBkBQ1mNcFaNzc3DBNE9ECb6Yt//7DO/7dt98g88zpcMJE0Vpcu4awqLJa4Ngah1qYcczGo3RcLOzrAzesu4b0bWrhBtgCCdDmvtW8uBp8eZU9pDCSghJRUm3caeT9NHKTIvebDd++vecmRn612fFX92/5cPfAtx++4f2H96RhoJaC0noSa+H58yeePn7icjxyeHrm9Hxgvpx6zo9HQte5vOwg1LwTX4uzpOkXc1Pf6L6m41U9GsFb+K/X2X/y4ytXw3/N4V2PF1TrIKqUFZbSb56tXaqfnFWad1mduEYH4I1GMmOIngRhtWLS2OTEm+2Wt9PI1gRtjVALWzXepIHcGqWtlOYAeqYySWPAb7eq3Kqyay5n2NAYqGQc9Kxd6CnmJMI8JEKK1OYdTwrRC3ataIPUgVypjfVSWC+F0vO11rV0W9LEvKyczudOTgSkkpKSk7m5fBZiaKg1aiu+CFhXjsvC3BpiEZVEsIH9OPDtZsPQGr/89gfaZWWXR6zC+bxSSiWnzHa3pWnggPC5Vh5L5bGsrqBX148tzTPCTg0eLwsfzzOP88y5Fgrio2/fyl4Lj7/GBRV8VDVjG5S7EHmfEt/t9jzst8Qhstnu2KeRb4aRd9OOTRq65UViLV7MczJudlvGIZPMCECZZ9qyQhPOl9kvPLiFxtJ9nKUTSMGjkQSXm6i4VOfP2q5/5rjqjL6ME308+gO3/yscrV8mo/jaPlbn+pTVfYIKSlU3BVtqcWC3r9FErnYS/r2bFLkdJzYpMllgGwJ3wIcQ+HYYuB8y25wIVCiFdSkeDzP3NIZaOjPZi8skwlaEURtZGoFCpLIxIeExvYbrubRVQoCUo5uXBUODMdeVpVyTMvCxxCcQ92YuHtlDBTWjtMp8ubCWBYm+htcAFgysEaKSx0DKhmqjtMJl8SSK47KyVsVsYBj2bMY9SkKrUZYG1dhtb7jb3ZCiq8LXZghCxjVWsyoHjF+a8EOp/NhtTi+mHFvlqVY+lspPTfixNn5uuFE8PhavPdqZjs2p+uiYEEYxdgq3qtyZsLXA/c0tMSWqKKfLmVYro0WiwOV84en5keP5xLzMNBrTduT27gYN7ki4320Ze1e0XhZa8XGviReec0/vuFzjeboPNioUnBF+qZ6D9pqOV1d86IVHOrHvnz3+J+7yTx1/bGL7t++6BFUnAQ6qZAEVYxG4IO4D3ODcKud5Ye4Z8IKPVSlEkgUG087bCbzNmbsQuauNNw3eAW9Uuc0JE7isC6dSOCwr57myzIV1bSyVboHqvKUkMChk15ej1xU0wlaNASG0RqyNIMIwZMbR5QN5GiAoSy0Uqo86gFzHMTwaQ1wN689rbSzzTK2VED2Kudl181hYy0oLlZv7DW+/vWfcDRAEDQGL7l0japhGUhxRInWF43HhdFqxMJLzBjST8o40bLg03wTFvjU9N3hG+AXhoxo/AweBiwirBU4iPCN8Aj6Z8ajKAU8treBXhK82jTkmtsPIbsjsQ2DbYCwrQ6vsthO73Y4UMxqMw/HAPJ+IMZCHkZAjJopUV+/HGLl9uCduJr8A9ffAOi+0tf83Hpt9OhfOS+W8Vo5rcTX+snCYZy6rU0Kel4XfPD/xm+cDh/V/nVPEv+Z4dcVnWZwzgfQXGahSX27S7UKvtz9cQv7w4bhOvzlw8ru3f4vjqx+jIiTzTmXspEJBmJtwAJ7KwtNy4XA6M/c3japiEshmjDEypsQYIptWeVML36rynSnfqvC9Kt+FwL2AzGdaXWjquqXa87laVQ8U1MBaG3PpiRP9T7auUlcasXnxuRGY+tbGBEwb4zSw2WwYppFhmrDoAsog5o6FOTIMgRjEcS7Fe7/mOern44VSVlJyop5E38C0WmlrwWjc7rd8/xff8atff8e0Hyg0Qkxspi3TmNlMI+M40JqPckMaiSFzfL5wOs00AhYTFjMhTjR8/R3UH9PSGmfgrMpRjefmSa2XnlayinAW4WzGUdzL+bgU1upaq2kcGYaEBMfhUsz++sTg3Q/KJiX2N1tuHvbsbrfs73aYKY9PjxwuJyQFdve33D88IKp8/OUjy2Xm/v6eN998wIaBKgZXwumnJ07HI0PK3OxuWBfl8+HC42V56WyquDxlrisrBVRYqJxa5bkWzqX8qy/W/yuOV1d8au3IWcdJ/u27kP8fHb0mGoJII5mQaMTSsOq2rZdr8mUtHMr6JfGhW11MQ5dcpERWZQB2tfEN8Neq/K0Kf6nwITTemLAXF2Sm1piacGOBfYgMpkSBQVz1nXv80KXCuaxclsUxHCB2fs1WpZPxCkkaWQVK5XI6cblcnArQGufTjDZPLM2DcbMfuL0dSKMh0R0Taw9TlKsFa3Wl+ZiTZ9mvFVsbuQgTRsJxEwGOpxOn08zlPLOsK42VcQpM28Baj6zrid1mw+3mhmwZFgjN2A07siYoEIEgzojWupAFBhqh36IEVJXWBBFjRTi0xqEJn04zn44nTn2lriLQGsuy0MrqozRQ+nh7Kp62EqfEh199YPf2lgszaUoMm4QmIU8DJ1YOdSZsRxeTni6EEHl4955pd4vFAQsZw6jnheV45HxaOB0vPD2e+Pw88/PThY/nhQWPddqFwH3ObMzI6o6TQWAbI7sYiF57X83x6orPtdh8DebJtRH6vfv+nzn+V/w8OjVAm7gXjyhBYRsT93lgq0rqXde5NZ5r5Vg9e2ouzXEThKiBKWU2MTCJMLTGRGVDYdsK9yJ8CMq3QXln4rYTZSHVytZcRrFtK3cKd1HZR99mbUzYamMjkBWsud2q0UgKSRojwkaUrQk7bezN2FlgE5RRBcrKfDrBWtBaoSwkEaIapo0UKlkrOYh3At121W9CUC/E1hqsBSmVUIUsxkaMUYz5eOaHH37kH3/zjxyfjtSlcDycuByPqDTUCufLE6fTJ1o5E80z4kcLbGImh0AO0XlTy4VWnOGcaexEeFDhXpU9wq4JOxHkminWvDNaVVlUKN1D2oKRQ3AgfZ5p1Ul/Nzm5YJXGcZ15PJ+Yy0KeEvv9CDLz2x/+nt/+w9/x8ecf2Ww3/OXf/jUP37znLIXH44FaGtEiNzd3bPa3LGtjXt3q5PT0yNOnX9BSmCwQKyzHC6fjxbeirRERdjFxPyRugvF2mrifJoLApMa7MfNhGtnH2Gkar6MCvbriA19o7FfhpDpu/0+bpP8rjn+rn3nlIYWOy4x5YDOM7DebrrOqTDHwdkzcqbHr8gmqR9LMwFI9Q1wdzWCIkf2Q2QVlR2HbFrZt5rau3NbKvQg36kzfWwvsekcU6kLWxm1Q7tQZuzcGN9HYJ2Mbja0KN0G4jcJ9CjzkyF2K3A6J2/7xTYrcpsBdDNynwG0w7kJkI7AJypv9nt0wkkTZDyO7nBktkHGuTFhdq3WVdGTxbmZCmVB2MRMbXJ6PnD4/wWVhCMYUI9shs5smDPj88TM///gLtTSGlInBiDGw30ykaEgoTGMkBCjrhXk+UtaZHJWgjbXOtLpS64K0mSSNicaNwIM5S/q2NR7Et33a46Zr9WhtU8FUyCmynUa2OTNFt9ugugB2E427qGwpSMerQhD2YyJL5fT0mdOnT7TTifPTJw6ff0FYuH+z5827O6Dw008/cDqdGYYNNzcPNDU+/fLRV+qHZz7+9geOnx6JKDebDWNIRIwxBG7HgYdhYDIlt65jA7/YiCC1MCn+WsbAFP5MMvyDxxdh6es85Cti4RWXySEy5cR+HLkZB27GkW1KDKZs+rr1FuG2FKZaCKUQUN9giZFjYgiZKQ5s08A2RW7MuG/wrjXe18r7svKhVb5R4Y0aOzVGceFjFhiCMJrxEJTvg/G9CO+jcpcC+8HYJOEmmReSGHhIgQ858e2YeJsTb4bA25x4yJlbi9yHyH0w9kHZBe+YBg0klCSCrgUrldS8Y4nAIEIukObGpgq7pmybsKvCXpS9GDtz7st6OPP4w888/vQL7bKwiZHdlJk2I8OYCObujZd5dduKFEnR7VtDhEZxM/pkhCTM8zNlObKWA2s7stYzl/WAhEqMja0J9zGwV5iskq0SqCQqm16UIr6tymIMTZga7FplK11kio+jYwhkDUhrDA3e5ciDOW9qh/BNynwIkfF04uN/++/88J/+M+effmKoldvNwNu7HZtJUc605cjz0ydOlwuaR2wYuJwv/PDbH/j57/6Bw88/US8zMRjb3Y5pGjBTsgr3KfE+J76dMncpkgSEigpE6V5YpZARdsHYh8DrEle8suLzao5+dfi6Dv7OONg8QWyTMvfTyF3M7ETYtMbUCmNbuQnGw5i4U7gplVsVdqKMpoROalMRJovsQ+AuJW5j4E6M+9Z4UyrvgLfSeK/Ge1XeqXFvwkAl9ltWmEy4CcqbGPjOAt+lyLug7AOkVtmoF5F9FLZa2RnsA2yDcJOFfQpsgrANwi4pmyBsgrALwiTCpLAxZQxKqJX1dEJKpcwrbV7IJkQVYoONCLcWeZMH7ixyo5EdgdsQuUmZjQX0srI+n1hPMwHIwUhRUevOjK05ea45s7u20r2ofclQKMzr4qziUrmczyzzkVbPtHahcaG1C9iKxcqUle2g7KdADlBbYa4zrSxYZ55TV7QVtwah8VAb71vjWyrvqNzhr63WhVYW904aE5OCrAvDWngbjfcI703ZLoU8rwxzZSyNTYCbKRBlxtYLspwYItzdbnl4c8fudk9IiXVeGNWwUpifDkw58XB/x3a7oZZKWzzmeTBlY8ouRPbBXt5XSftyQ82LeorsciSZv+de0/Hn4vN7xxULcidAnJ/yUnT8v7U1BnWt0V7VhYmtcVeLj0dl5V7gQZV78VZ/UxuDQLzS35uvpIfmQsY9jVsR3krjLZV3WnmgcQfc0riVxp0KO1MmU5IKgzbGIEzqxedtDHxIkffR1/H7qERWpqjskrLNwiYJY2hsojIFYQjCEIUxKTnBEBtDgNGc8Typ651GVSYzBjUiSmzKdhgcDDfruWWNydQLacps1JjEnEUdIrs8kJpQnk/U04wtuDeNKTGob8VoXImVdfUs8lILfLXdrGt5MWxb14XL6cjp+MS6nqAtiKy0tlDbBawSsjDtMrvbkbz1CBlX6DiXKuAnrSFEYKfCu6D8RTT+KgS+F+FNKwx1JdCwVtgG5d2U0bJwuVzYtMoHC3wTlFuETRN2VblPiXf7LW9vJt7sRiaD9fjIenxkjMqbuz27my1qwk8//sjz4ycnGKaItsZmsyHmxNPhifNlprRKbe4wGRCiNJK6YDeq9s2lkGNgE52eEUTcBbT9edX+uo5eUK7cIlNjM05M3ctXRdD+RGlzO4xNTOySciuN21q5q4WHVnhP5dsG3wLfUHlbVh6K21ckaQiVpRWcSgYxKKNUblvlpi7ctZUHKm/FsZ07E94E420KfQwSNtLbfxVyVHIQcoBtNG6CcmON+yi8HQJvtom7TeRmUHZT5GaT2E+RmymxGY0pG9MQGJIx5sAQzW9BGUwZVdkG/zerjyWhQphB5opVSGpQG+uysJZCEmObIpuciCqE4sC01kabF46fnjl+eqSdZ0L1ETRbIJixXhNjBU8GcZ4k/I4ThHsh11Io60xbV5caVHcoDNoQCq1dkLYQpBKjcnN/w+52h5hiyc3aEHXAXRoJN6oXaUSpbARuaNyZcCvO2wmlYLUSmstINlR0WRFR7jXwTTDeBmMSyDRiLVgpbKLwzd2ebx9u2UZjPjxyevqMtYUxBz5+/JmPn3/hcHzifDpRWsViZNpumbYbSoPn44nTcuG0FuZSXTrRaRwe/uiPvalQqT1JVkAKKRrB5NUAzdfjz8Xnq6M1953J4puTMQSmlMim7HPmYRq4y5G7ZHwIkbc07uvCvizsiptQPSi81cabVnnTGrcCk3oEzFIK51aZpSdUAKlWQi2M3ebiVhp35uzYO1XepMC7FHkTA7fm41DWRpBKMkjBleA5wKCNSWEX4HYM7MfAfoxMSdkkZTtFbvaZ/SayzcoUYQiNbL6BGqORTZ14KLA1YwpeeEy8U2vnFS2Ncp6RpbKfJqIpa12ptWCmpGiYgTRP2lzXyuUyc3o+cX4+Uk4XZC2+4UqJMWdUlPnioxS4NQTIi36MVhF1fzlqYTkfaWVBu5d0UvMOzIRWF9bzmTYvsBTaCroox89n2tyw5t2bS0SFpbsCnEvhWAprrbS60tYFWRZCrURx/pO1wlbgbQyMpSKlkszYCuxVmYDo6ly0Of4S6koGRlFkLVyeT6QYyUMGq8z1TBwDbz+8Ydxu+Pj5M4fLBVLyhNxlcUdFNZ4uFw7rykpzVX0tLHWlqXtVVYFVKwtdnKyNpoUQhBj+7ePG/88c/39ZfP4gd6i6ynsyZW/KXYzsY+A2Bh5y4H0KfBMD70X4RoXvQuC9OQ5zG4RbE+5UeFDjXdf1vE2+/kzSMJ8s3HALYUIYqcS6ODbTClsRdgL7viZ/GyNvk/EQA7fJ2EVljMI0GHc3I/t9YjMFxsEYB2M3BHZj4GbKbMfAJhlTVLJB1uojV4IpK+Ng5Kgkdb/khLObcweQB3MANnTNkFRhOc8spwuHz0+s5wtD8Aib2KkFKRjDkFBttOYykaV5fE3t2iVpEJqbtLlS25/7shRa8W0g1Y1LTJXQY4REIKh55rv5NqpRnFXdnJ1dl6XTABpaK1bALo3Pv/3E84+PcFyR00pqbiKPuLxlAWZpXFp54VpJJ2EGgYR5Ua7wzWbkfU5YcVFwaDBIY6QRmxddrY0UjPv9jl+9f8d3D29Yno/89Pe/5fD4yHw58/T8yOPTI5v9hvFmQ1U4Lxeenp44nWdQ47Qs/PLpIysNzLi0ToYE5uaWKOeysgDFoHhuIKtWijW/avTubkzpVXU//5coPteV9v+So9chEXFOjir3WnkjlTfq5L13FnhX4UMt/IXArwW+E+GDCd+lwLcp8m0KfIjG+xR417uVdzHyEPvaOiTuLHBnyr7BvlTuWuOhwU6UnTrf5DYoDzHykCJvcuI++Zr0Lgu32dhnYzcK+23gzbuJt2827G8T0y4w7Yz9PnJ3N3B3P7DfjdxsB263mdtNZjsYYzZ2Y+Rul3nYZ243yT8fhDGqa8aCE9LcgAukm6rV1ljX6p7HKfgquyxuUG+BHIzoLRJrWV0h3u05Gj3EsJMMpYuIDaGVQl1XdK3YCroIVpSAe2q/bAdxHVVtjgN5p+pY07ounM9n1stCXdZuIeF8ps1gMJ/IpTAAtnqCiDbvTgLqeWSqXkTVyZZBelcl/nlrjaEs/trmAGVlWReExtRB36SCtUo02A6Bm21mO/oIen58hvPMNg0MIbBcZiwYt7c3XC4nfvn0M60VNpuJGI3D6cDhcPBQx3UhjQPb7RYxYaZruWpjqY3junCuKwuFoo0qlSaNEA0NwjQlcg7QCZ+v4Xjdxefq7YO33VTfNP1zx4t04vduXx/XlTlXXhE+999F453C21Z4J4XbVrhl5Y1UfhWMX5vxq6C8t8YbhTcGb80Bynch8BCV22DcmrIX2NLYqXATjDch8MaUe3GnvAca9ypOBux2ng9BeEjG2yFxNwR2WZmSMAVlE8Xd/obAdmNMgzFtjWFU0gBxMNLGGKZAHgMxGTEKKRlDDgw5MObAOESG5P/6fwfGMTLkQDI/+V5sJtoXo7KlwWWZaaWy3YyoNdb5TJDGYMqg7tp3Pp1Z1xUqNHETtCYOtBePoH/RerXm3jhSGqEJsTZSg7Hh+JJ4QORL3jxCK41ldma2dgxHRCjLSl1X2uoYU6CRFXIQdmNiM0amZKgKl7JwLsUNzWphaI3cGmPzkTOJFz9tzbVXVLQWt3IN6ut5EQYR9uoEzNALqdHY5cT9dssmJR9TTxdCE253W243WzYxcTONvL2/w0xY1jNpCLx5d8fdwy1qjZ9//pGff/6ZPI3EISMqDGNGQ/AQQ/CLgkKRxlq/srlSIeVAiEow2O4GUvrz2PU/dVwZzjFGxh7l0mvEHy1A7SvL1d+//e7h7nxegPwKd5MTD0F5Y8o3Ufl+CLw3uCsL7wR+lRLfJePbpHzIgTdRuI/G+xx5nyIPOXIblBtTtqZsgjEGnNxnwkNU3ifjfRDeB+HBGnfWeBsj3+TMN2PibQq8GQJ3g7EbjM1g5Ag5CTkb02hMY2AcFA0F0YqlhmXFsqIRsMJSL6zNE8TVFItKTEZKgZAN9+dvxKTkFEhJiQGiNqLi2V2ddzXXlfNauPTbeZ45Xw40iqvcgxKsMUUvXGVZWOdKueaHo6zFleDuFul+RaV0IWkpyOrJDKFCrpAqDBI8OqZCK66OL8vCuhTWuXA5z5RaCNEYp0yMwUe74vYesbmvUKIRAwzZ2AwDu81IzgkRJSrk7m804IXHt3rCYOZiWwGt7oP03W7D2xQZSmODcmuRO1NiWZG6EtWdB77/8I7/2//21/zFd99xs9myXma0whQTu3FgCpEsRp1n1vWCKeQcqG1hKScqHlCw1kKcRjQGnk7PnC8X6BeE0tzuZO0Jp0UANVLMRPUIJjN1AFoU/bfSLf4bHa+2+FyPEITddkOOobvd+Tz+rzkKvsYFSCkxDgPDMJCDJxi8iZmHboVwF5V7Eb414RtV3kfjxiq3QXjIkTcpcBeN26jcJfOPg7K3wDYI+yBs+xi3NeE2GO9i5Nsh8/2Q+DYa74PxJhofcuCbwTGiN2Pgborsd4ntFBgnY5gSaYyMo3co4xRJOTjvxSBGI6SAJcWSIiYvZvcSFI2KJYMoaAKsUdWFuhqFkI2YlBiNGHuB+uo5Ls3f4Ke1cphXzuuF4/FAazO7m4lhNII2cvB177JWlnllXirnpbw4Iy6r29QuxUeFtRcKVt+chebdhdVGNh+DpLi/Ng2GYQDpf9u6+pKrNiwKm01mSBm7Wu6WlUjDakHXFc4X6nGmLTOjNN6lyIMpW+kmalSGLjtJPS46i5DVC1AWeIiBm1pI88zQGjtRHmJgB2iprqPKgdv9xG47MAxdhJrcl2eIxnYYmGJiTCNRjKUnX6Rs1DZzPD3R2kLMRhoCcUw0E8514XC6cFpm1uaWGQuVlcZM5bSuXErheF749PjMZV5Yuo9SXeHwfOJ8Wb86G/70x6srPtJbdJFu1L0Wj5mlAwf/ikNw3k5Uw6TH14gQzRm7SYStGVsqu1a5jS5D2LfKOwv85XbkwxDYa2NrjZuo3A6BfTI2pkzSPYfVSYSTOgFsH/x2E5T7GHiTAt+kwK9y4ldj5Psx8s0QeEjKbVB2SZiSMSQjJSUNgTBGbAzEQbHovjfuf2P+dIh0BXfAQkAtIGaggpi6ZUMOSFRXoJtS5KsxVADzBA8RF4gG9TA/xEl+QiOoUoHjWjivhfO6Mi/OMpbgmeUi7gLpWeaN41p4vFyY1wpi/stECRYI4qmnVj2RVK+6uC49Crjyf11WzsuKmrIZh24+7w6E8QoIB7e4rWvBEFJTB8qbG7dbKVhxAJplRWdP8NgCY3PNV/wKbI8NkjhrfDTrSnW4j5GdKUNzcuc2GDdRucu+WZwGY7cbubtzNvLxfOKXX35hni8MIXIzbdhvtgwxM3Q5To6RINBq4fD8yPHwTGvVLwBDpqmb1Z8vM+dl9q5v7cm9flbQBOIQGccBxJ0h8jgSc+JwOnM6F54PM/Plz4mlf/TwcevLfO/t+UqK3ib/S49r4TGEIWXGNDCl7FsaEXJzMea9Nu5pPJhyHxx/uY/GuxT5Zkh8mBK3ObiR+ZDYpcjY2/MxGNk8D9zbdmUTAtsUuY2JfQjsg3IbjbugvB0i320T3+9HvtuNvN1kbkfldopsJlc+N220CC0KNTYk+3yg0TsZDeIpqmo09R10M6W59wUaAgQvDE2hmUKO1OBJsNcOcJkXanXTtnXteVPiq+7ra6HAEJ2PU/Fm5XS+8PH5mefLzPEyU1qjIZzmwtN54bAUDks3uirN3fbAkxXU/GIgihbfDF1H6VorZV2d5Fkd5La+Fpe1EhsMauyHge2YmHIkmFJW91/OVRk1sAnZuxc1shhJfXOXxFyoq92cPnTdmfptNCGrklW98KhbujqRM7A1ZVAjNXcp2Abhdog87EY2o3ekt/f3bPY71lI4HA4s5wtBg7spbnaMw8iyrJzOJ0KX6EgtlGVmnS8cj0cO5xMWlJAdzxLwFFULHl7Z468Rt04NIbDdbhg3ExKUvBlI08BcG5dauCw+7v65+PwzR7tqvJpnZc1LQdCekumWBn/oEPHM8i83o1VBMKIGkrkp+d6Ee6WvxuFbEX6dAr/KgTeq7EXZiXCflDdj4H4QHgbjJhnbruUZVJhi8Hjdvjr2DQnEnpKQxd+8KTgpcErK3RS420TuNsbdPnJ/G3l4GLl/M7G9GUhjQoeMDgkdApYNsiHR4Fp4gpu5iwTMIoRADYakQBgSlo2YIhpCL0oOv1Rv+wjXTsg9xVAciMXcJrS1xrw6TqOiJNxXKKs52HtZaVX49OmJy7wSYySkyFIbp6VxKo1zrRRR5tpYaMyrYxOtr9yv7PFa3WB+7WNZ62p7EYhiTCmQG9TDCZ1XhqbsYmQbI6Mpo3gB2Whga8ZejY0ok3SyZAxsh8yQjI0ZGwvs1MfknSj7ELkNyYuLGhsVMo7zJCpbg/ucGDtDPYkSkRez+dQKPs16qKOKEIIxDonb7YakgeW8UEshxkQeJ3dOqg2pUOeCro2kkXWpfHo6cHg+elKIGbWsBIQhJHKMTt5U6VFHbsNbl5XD8ehs8GCcSuHpMqNDghwo6hHMr+l4lcWH3q2IKmZGLRURYZqmfzYr/QpUywtQ6NwdFeePaKtEVm6pfCPwvTS+o/EXpvzVmPluSDyk4OrwHLifEvfbxH4wdtmYohed0G0orPmb1APxXPMV+psjdo5KjEoajDQKwyYybALTRpl2gWFnpL0R94G0T6T9QNiN6JiQFJBotGAUdcLYy3wiTvsVgxYEhoBOmbAZsc2AbQY0+/djShU3TpMgLsgcInGTiGOmqYOSGh336fQXNx7vdhlBnUG7lsL5vKAYSQJahCyBTYyYwLwsFJS5upFZsISquB2sCSYe5XLtrpYeV1RrHyHal6WBANH6Gr8JujTC0kgVwtoIayWXRl5dPzUC2+vYqz4OD7h5vo/Bbi1y7VBH+XLfvRm3wTld22AMIh37Ee5S4H4IftHpI/pNitzmyO6lAHoaxjYPWIM6L8TuUPj0+ZHT4ZlWKvN85nQ6YmrstztM4PT8xDpfPAAAnJjZCZu0FVaPXna2vY/BdImFIlgD1sr5eKS1QkqR58ORH37+xGme0aCMU2La5H9y9fKnOv74mfwnOqTfco8xHmJynk91v5s/dry0qCbcjZmbITDlwJQzwYTlfCQtC28EfhWMv5DGr4Py6xT4NjoAvFGYAuyydSawMkQlRedxBHGmK63g13R/I5iaOxD2dHbRisZKSErIio0BBkUnI0yBsI2EbcI2EdtEGAMtB8gBcoQUaMF8ldpXqgTxUcp8NHPQQ7EhYVNGxoSMCc2RFju+0/1+RRwrsujdlEbDckSC4wqagwPT+PMczDcmsccL19Kv6moEAstp4fx0RpdKFoMCtQgWMqWJg8GqxCtHp+dL6dWEvTVKdQLiXCq1+BbHf3vvyvC1d9LQiX6BUBRdKrZUcoGxNjbiGfOTuB5ta8Y2GLvgxWVrTnfYhcCmbyJ3wSOgt+bmaTsTbszYm7IxYdTKLinv9jvux8Q+ujp8G12Iu4n+8d68WA3qejctK8dPT534WJlPR46HA/P5wudPnzkcDohUTocDP//wI0+fPvH8+MTpcGJdV6zjY3VdCaKeBVZWal2pV41WA7Pw0s3U2liXlWVdWVvheDr5c7usLOvMMCVCjn8uPv/s0Z8fE8cZhhCwq9Xm/wRJSlolt8K3+w3f7Se2pm5+TiVJ48aUD8H4VVJ+nQN/PSa+z8pDdgFmDpUhKDlA1IpJJahgCjE5GGsmnWlrWPA8cjW3G21SHTkNQPIVSktKjYKOhk4RmSI6BWyTCdsJHTLERDWDECAoLajjNn1VrlEhKFU7JmTQrDkGlAyS0qLRglJNkRiQoA5Qx9AN3yPEQAuBYkKLgmYjjA5Kry85Y43YRYkCrN2APIbAEBN1KZyPM7IKoSnWlFZckW52bZ38QuHLdu8OW4PywnxuzNU9jda+Ni4FlqX2kQ8E7yJztxAZcLxFl0ZcG7kKuQpDc1Z2EiGKb6wmVXZqbMVdGbfmI9XGlJ05DrcLymRuoD8ZbKIH+G2DsrHgOJB4rPJWjanfbwCGVpmQPsopYwgYUC4zx0+fWJ6fkWXFaLS1cD6feXp8ZL1cqMvC558/8vMPP3N8PnE+ziyXwrr4+7utlePxwjJXyuqbS4CmDTFBoiLaUHVTfjHx2Bz1LrIJbKbMZjsiKqy1MM/za4J8Xlfx0d7qezQFtFZQqoOBwXy70fo6BO+EqE5EBP+0f7+31e+mxF1WBq1QZxLwdhh4FwIfTPlgwl+Okb/ZDny7ydxPke1gjuNEJQfFlL4BEizSN06e3hmTkScjjgHLClbRgOMpOaCDYVNCBoOsyOCdCUNEpgzDgKSMZP+XGHrhsV44zNfkQyT2rVU/syAYlpQ4RGzwFAmLAUnmhSaad0nRQWcxRSygFpGQIETEIs08kEoHRYL29NOOt7wQDv3pXUrlvK6cysJlLVA9SNAJiZXWOubWhybpRMWGby4rjbUVjxputRef4imrrb0kwa5LYVnWL6NfF31G8S7MGshakdWJiLH4v1r62OsLPLdPxQvSdfOV+ri1NWUblW0UtuHLin0XlJu+ydxH75KszlhZ3AFAhbHbjEzdYWBQB6GtNi7HA+fnR9p8Ynl6Yj2fCQg5GjkFtDXOhyOff/7I4engqSJzpRahXiOP18qyVC6nmefnI+fjhXmu1ObRPc38tZJwNeAGS8awyaQcUMX9tMfENA1M09BtYl9OtVdxvKriw1cjl+BaHSuFAd9IWasgfmJwHbE6S/Y6btGvspMpD3ngISfeROVDyty1xntV3qtwL41bqbzPkQ9T5HZ0Ql9K5szgLFhW4hiQKEgQzDzgTrNgWbDBCEPARsWy+BiTApYjNgTiZnDAeMpISl5Q0uDFJg9IGiCNaOwfq4sHMUWCQTCq+qgkKWBDJAyZOGb/vTn510S6lOFqm9DfZZ3tKma+glfD7SrUwSLzTRjq5WLtanERQU1Qc6/loF/ieA/LwtPlwvPlgpgR1dt+B4mvAPKXhFWRig9Z3c+6Z3yVVv1qvDrusxT/GaZCMi/8YzI2KTCqSywC4oCvuoVH6CzkbG7wFa1nx4tjcto1adbcuiPiUcTZYArKFLwA7VLwrkpgE7WLcV3tv0mR2+3kKaE5+DJBPckj4nFGCR8tpXkyB6WiCLVUltV5Tq138nUpHB6fefr8xHpZkGZo3+b5EynUAq0KZVGWc2NdhGUtzHWlNBeUNlw+gTWaVmJWxslZ7aIN00YwEKmUZaXMy8vr81qOV1d88GtmD7ovRBpjd5zLVIJob3G+jF/XAtQvsGi3SNhQeRPc4Ok7Gt+q8J0K3wTjTp34d5sDN1MkjxGJgmawDDYocWPEydCs/s71S6kXIzc9pibQbN6VWGOl0ALEKRM2GZsmdBzQMdNSghiRmJEwonFC00izBJYgJjQEjz2Ovt2SGKjRIDkG5CByRGLw4mFC7ZuTVlYoK6UutObaJ+8g+31QmgREAkigNg+Xc5P35plQ1ccmi4ralxEzmnvFNOnBerUhOHDcem55rW6JsTYvOB6l4xeIgGJqDsCH0DPaHSNrXwXxqcJmTNxuBzbR2HTiovSSqr2wJHUezqDBpRC904mqPX5ZCGKOT4liL4/BV/xTDEzJ5RZTVl8mBLcWSUFobWUtM2jForLbbwjJiZ0ewmd92+Tvt+vJ3spCaStLK/x8eObT6cTT5cIvT888Ph04HS9cTgtlbbTmmfWlKmtVWlXKKr3YwFIatcoXDKx4QQM8ZaN5ZJEmyKMRsyHSCMHIya1gpcJ6nqmLBwS8puNVPZ52XbH3KHaR6vR3KkNd2Jpf1aRX8D6dQW/Pr4VHEYZg6LrQTke2tbGvKzd15U4at523MaoyDolxTMRshMGIQyBOibRN2Gh9xIF+vtKiePEZDBnNQdrsxWLVSgvAELDtgG0mwnZEpwHbjLQcYUjYOGAp09QoKAWjiHNzLCViSoSUsJywIRGmARkjLUZqiF31GMDMz1a9ykQMEYe721erbNq1GfIntzZ9eVODOQN5WanL6mOsOgs6BP/x3k24d0/WSLboSZoiSDdGc9ays6FL86jn62LSmysvEFcxqYtFjWChizn1JXDwmvYR1R9h7SF4a/EECbooNeuVk+MvU1Jc2CnXrohu/uVdxZVYKTRCEMf0oydlDFGZhkA076DNBNWGmhfnpbhliD+DHqboMIH7NKkItRbmuXCZVydZXlYeD2eeTwufno788vnI07xyWBvPCzwuhV/mlZ/PKz+dVn44rvx0XvhlXvh4mnmeCwWlVXphcmcAEyGaEAOMU2K7G8hjIETxE6EWrHv8rJeV9VKcKyUO4r+W41UVH+kzesABvrsYmOrK2AqTwK0pgzS3XSj95Oo4Q1Zjm8e+iXEbhOVyocwXQivkVlzsCexM2ahbf5pUxKS3r40aBElCC0INQrW+XYoOGlvq26hkaIqEIUEyagQbI7ZNhF2GKdKGQM0BzQkdEmEzYIN/LGNCkncwVzCYYEjqBWrw4qM5Quqfj/47LSTUOj5k0aOM1bOpRDximd5xvDyxHUR+OVrfPjVFirhcoeF4jza0/91ONPein7oUYQrOlcrmnc/1NQClNu28KnfPo/X00q5wf7n11y708en6UK/ExtacyXte186q9hDE01pYfVXWS2d1nEfEdVh9vAl4Qe7Xshc1PTTE/IaBmEcyT2Nku8mY+kVm2o7sbm/Y7CbQyrK6oFbxgvvlsfpvMFXa6hE661w5nReens/M5xVpSqvGaS48z5XHpfJpKfz2PPN3hxP/+XDg//P8zH84HPlPhzP//XDmH05nPl9Wluqd65XNjLhQeBwz05S5vdvw8GbPMAanSEjrEplEK43z8wWrRg4Ruz7Jr+R4VcUHIKlyE43vpsy/f7jn+2lkZ/hWomt1Io0s7hmszUWht8PE1Lkm0ZTksQaoNGIQdsGtLe6ScZMCm2gM2ceKRu2XZz/hCPqy0na007dJ1sceGyKaExIjLZgXhzGg24TuErKJ1EEpUWgpUJPRkqGDFxZiRFLEpkycEnGTSVPGxugdVfKfSdQXAFlzRHNGY3JCoQYfoUJALHrx6uOGoIjo78z4ireJ0k96uIo+/SSS0gF8fFOiJl3YuNJaIaqQ1H2ch24/kb+iFfxTh4iC4tjEtVMVV7r3PNMv47I0V2o3B65rdb7LeV0518KxfiEuLs0d+168fszHKVPzsax3zU72vkpGfFuJNF8WjAnNwTlSUbAhYF3O4hcEXyS05CA8pSHFR0lR74ZK5zJdQfJaKoJS18blUihrI2AMmtikTLDIpTY+l8KnUnls8EuD36yF/1Yq/7VWftPghwaPpVLNXK0ujXMpnJcV1PluITpVIiQni8YUsXjNH/MwxXlevIsTZbkUjqeL18pXcryu4tMaNznw7ZD4yyHwl5vEbYRRK/sxeZ54XXmYMt/tdrydEpvgVg6bFLDqESatLUirtFoJamRVdsG4T8b9kNnnxHaM5ByQIO59oq6ZEhWaggZxoWY2NBuaI5ISYRixlJGcqTFQzKgpOsFvNxLvduh+wKaMTc5StjGhY0aGhOSIZPMuaQjIGAhTRKcEU0RHv8kQv5AEk3qxyslX6TEhMSEhgkU0po7jGE3dVlP6KKYvnYWDxtDjjKt3ItCcKNltNEwVUcGCuo/ytbvER5qsfbtjinVrWPAkj2un0V4kEXin0V9b/90NbdWJckDBC05pwtrcduMak+2GqG6atTS40DhX5wapCDF6lpY1xwKDL35euhP5SsM35kTOkRCEMATCxot+3AyEKRPH1F0BHOx3HhWew45RluUFb6muhWUulXktzGvhcJk5LZXalHltaFOmkBmDZ7InDWQLqBpLKe5QWKFiLBJ4EuGpRzYHVbZpYJcSgnFaK4/L4qp1ETccO5w5XWZO88zxdKKJi7BjDlQap+OJ+bIQeuTQ8exprq/plH89j4QGrXBngW9D4LZW7HIitJUxB+73I/fbkfuY+NUw8FdT5q+3G26DMapwI8qbYLyJgV1UojTMHBaJ0hgMJoXRGmMUQvBNDAFfN5tLCzDAoIUGATRGJCffTo0DNQZqCu5f2gmBOibCbkO83aHbEd2OyOQgs46JNkZkSNiYCbl3Td2xSoJS1X+fRvPxLgrNmuNHgb5WVVowmgWaOesZ6yt0lc79EcSM2nEg1EcvUQePr7NNq82p/aWg1TdC2rz7wN/f3eNInBndvZRC7zivtAeqj1TX/kpVsO6FY9I5KK2/th2HurKdtS8HWjfFOq2LY0X9Sq29kPUE+Rdb1WufZdYQda9iVXVjsGvxvA5DPo+hyRcEISl5TJ22kJCcsJyxlCAYTQOtG6d1mIhWnLzXFpDmj6jgnciplhczr+dl5bQWLquvxJMqu5wYzVfwVisRGDUwdquQ3IXOptY3eY1R4SZG7lMiiXBZF47LyrxWmgRaEw7PZ86nheVSOR8vnE4XlqUiFshDZr/fspkGJ4kG83jopeCI1es5XlHxAaqzVe9FiGVlnS/EYOQc2WwmbqaRb4aRt63xXhrvBPI8U5cLYyu8VeWbEPg2D+xMSAixdWC5eylPnTxofe63qO5vk82JW9db59vUqM7BSZkWE9XNdXpn4l2KyxkyuhnRzUjLGRkyOmYYvUBJ12eRDU3hpdg1rTRrPp5oc/2VNpdEqHM6mq+cfGUeXcclnQtEdO2Wj4pGM4OOxaj6Kv1Fwd4ardbefbiuiNKoS4UCgp/0DvRcv0deoKJo6kBwX5k3+gjVcNOx6mPuEI3BlIRLMlprOIvHVegmLkERc4Oy47pyLs7WNukeOr2AaB+drOvlPBrGJSuWPG6n09+92/EahShYEEJWx+TUGeLO0TIPCMSoTWgdgC9rYV0KbSm0ZaXOhXJeWc4rZSlox5FKg3PnKjX17uy0OF+pNt/IRROy+ainOEk1qXjMUYrsowuTs7pifkvjpgm71rhRIYvrGk+rx2ibeaGqpVEW7yxpAgW0dq/r0ghqjDkxDrmbm3Xe0Nr6mP16CtDrKj70ZALcS/dUVqoZaZrY3ewZY2IrylBWP6e1Ivi6sZSFvTT+Ogb+xhLfSmQ3V3YL3GvgTbclvUuBbVJyMgjdhCsZIQgW/eSW4OOOpIAmx1g0+tilOaPjiA4DOo3IOCLDAOPotzz414YMOXuRGjqxMDvW48xkdXlE8M2SBG/T/N9AM0FjRkJGLIMmxBISHKC2lAnD2DGg6CNYMEJU1MwBY3XsR69UBJ+yroAKrNVzwE8L6+yYRe0YDOLgszY31B9Ct5cQB+lf+h2BUhvzVY8kuK1ItxUdVDFa73YawZQQjRADTRqnuvK0rpxLIVlw3K6CrOL8FxEGNbYhsO+JqptkDDEwpECM6h2sgGgvQlKdEDooYUquDI/+PPtYGrxjW4W6CmWutEulngvtXKmnlflwYTmcWc8LbSnwgom5t9FcfaN3BfgViGpeGNVZ9su6uKfSV4TNQWEbHAbYqGfGD8CNGLca2Ha+0FwbT8vMXAux0wJAWJaVeh071akFY04EhHVeODwduTy75CU0oc6L+2X3C8ZrOl5X8RHhTOOxFOYmlCZczgt3dw98+833vHt4yy4Ydyny3cMDDzc7YlTWVjisC9pW3kaPMHkQYVNh04ytBG5jYhuN0YQUFAtgvdvxUctHGMxZwZ3a3Dsho0XDkhcSzVcAuOupBseAdEhoH7fIXmw0JVoKtBhpMUBMkCI1qI9PGmjqa3MvGua+PCH7JisOYMNL8VFNnaXc1eqqtN4haYy+mu18nM7EoRR3ofX1u49QbS0e+rc6kOrnre9ULBgqivRtVFQn0l3xnpcNFWDNcTL6UBTVT77RhNzlGUHM+TDm4KgGo4hjPYh1/pFQanMyXWmcysrS2dEq8uJGMAUlJ3/9VL2jcjwLX6FHJY2RtB1Im4EwZid3WngZO2spTrpbFrRWpBTaeUYuK8yrB/MV0CLIUl9GU8ElPrX682V4hxlEGGN6sVaxTqos3RJEuthYxVf/o3oK7NS3t5GVSeAmOvGx1srTMvO4rCytMsRAsuB+PsWFo9Pksc3S9XMpJYJG1vPCfDqjrbllSRPW0hiGxJjj7248/8THKyo+zjD7OM/8dr7wqQjPl0q0gQ/vvuP922/4/rvv+XBzy5th4rvbB97c3pJjYC2FUyk0YFTYiGeih+rGUC7684C8nI0YGpaFOCWIbrqlXUPl7+LmFHZ1cEK6G6Ame9FQSS9AEoMTAHOAnCE5H4cYaUFpwYuLj0PRC06MaIiI+UnRQqCa+X2DF6gWomu9NKIhoSF5zpQqTcyZ0Or4TjPXgfl4JqDm9xE/qZ1E2J/jfrRSaWuB4icapTrBMKiT6fqa3VQJ6hKKiHRujW+UruQ9Pwm9XRJ6gF1PzwwdQL3+5hWYqZzbSkUw0d4VODZxXAufLxc+X3y1vrbGWt1u1WUfra+M3ZLVrYCc+KfqXaxLTiISE02NKsLa0zNaKSzzzHI8U44nyvGELCtSihfh2mhrdR/o4mZnUr3AXd+nUZ0bFPWKSEFW7/Ryx7TalQnSQX3/TgfCg7ph/WjKYEZW2AfjLiU2MVJpnGvhXBylSWpo51MRjP3NhvuHm87r8U73fD6/3DfH6MZrMVAb1HVmM0b2++lLx/oKjldUfPzc+Fwq/+208J9PZ35zvrDZ3/Lh2295ePOWt3dv2I4jQ4zuxTtNbsTUvz2IMqAM6ieKOS+UIJCDB+xZABuM1BnN7nHjqEhrTrDTGFw0GgNm2kWjDgRfsRWJkWoOAksKXix6hyN9FMLCVe/u26jepdQGRY1qgRoCLUUk5T5mJZpFWkyUEL0gxeAFsq+A3SQsICG+cIR8Syddt+VFTdUQDX00uNIJHKPpShVYGm2psDbvunLCxoAm7wSt365s3iDqBUq9qAR1TEavV9SrzOJ6xZeOe2hgqY3zunKhci6V83VU651BA56WlY/zyuO6ciqNBWFtuHPiulKqyzJqraxrYVmKdzTWNXUdwL9aday1Oe+oiRvaF2iXleX5xHI4UU8X6unCOi8s88qyFA94KFeje9DWC2wvplmVbQwMQZFubREVt7sQH7/0Co2LY2atNWotHv2Mj4jqtcQLdWvsgrEz8/SL5iZ1U0yICEv1/C5RYbud2N5t2Ow3bLYjqsrldKGVSojGMGTSkKldzJuHyGY/EQb7guW9guNVFZ+GMKvyqTV+Wlc+rxWxyH57y353xzhOTDmzHSfGlNmkxM0wMKpwXguHy4Vyvb63glH8qpKN221mGI00GXETkUFdThH9JGvieUcvG6+gVKMry69AdEBTQFNEckDGiI0jEhPar7LXK22VLmlovTuRHtGrQhGhCFT1bge13r14EWuhfz4E326J0MwBcFR9i6N+87V674S6Gl66Psxnk969Wf+m5kmdVzPxVr0b0NZN4+NVTa+INZr4KOb/9qen+UbKgWB1cPg60tC9eZoDzI71uCPlZV051coiykxjbm7nKuqYyVorp1I5VjgX4Vxw0SmN2oS5FEp1kum6FDrsggb1UTGqP87mXU6ZV0e01069Xn1HrmuDZaXNK+2yss4OLrfSH3vP+nFOlKPYDRcwa5d2DKakHk8srTqjmCv50QuumYdQmsnLTVX8ZQrSN7HuD53UPaxDa0wW2eeBbcoEUe/W1gXVxjAGQlJOpzPn80xtkIaBYRqdw6RCqWsv0IU4Bu7f32Nj5Olw/J3z7U99vLriU0VZVbmoMYuiYlAabZ4Jqtze7Lm/u3dD7gb3wXg7DlALx3XhuHpsL81d3jZR2Q/BRaPbgG0CkpS1Jzqi+Lo6COqzhHc53fnPNVbX7ZKiyZXjEgwJkRq1b5yMKurK4xfytVDUx5Em4icRQlNXmPtG6wvuU9U7qdo7G6yLS4NvuFCjmnSr1L6v1m66FmK3Vvjy2DQ6PqTBfGSTrzg0vVPx7Zd3LCEG0pBfMC+NAaRRKZRaEH/0LyLP4HTGfpVXSgdj1246X5qzcpdamWvlXOC0VuYKpSmr+KZJO+undGuNuXrQ4NrHxSZ+gaj9d4hoZw03pDmWciVF1lp6GobjN8wrOq8OsBfHSHzcBClQS2fM94IaxBC041/evQlOG3BI8Es3bdIxruCdcjDrY2p3rgweypiTMk3GNEbGITBNkRgUlUpW9wWaovWE10oOwTPAEFotlFaIUbnbj3x4e0eaMp8/PfLp588cn06IBqZxdPwpBprAusyIwv7NLR/+6jvilDmez793xv1pj1dVfL4+agNqoZxPnD9+ROYLU1De3OyZckRbYXn6xG2rfGOBm6BEM5biQGZUYZsC+2xsckCtOHdGG6vgnUnl2j50+4romxAzVBMhZD/hxXk00Bm65rG0zqPpuVSqiJmLJF9u/rdcOSMq/nXpeAzdf7l1jAYJ7oWoThZs6jiYBC869WXk8pX61R4VFS8spogGNDim5NuzgIWEBWfmooKFqx9M94Huns/a1/ca4kv0rhuZOYBKH2URL0I+Pvjfd2mFY6k8l8pzj4V2OUTluPrnj7VyXirH88pcmgOy3ezMBalCxTEdEd9Ira2xlMLS6pfC2eUV0mkAtXmixRVQr8tKW1fastAuF4qrNJEiSHFJiY/kv/s/6ZIT6yC3Ryu57sw6AyGYdyzuowMxKiEq0YQQfJkxRGMaIrttYrvz2zQlNqOx3wZywu1XpBLFPacjxrxWnhc3ikegtdU1ZQIxefe+3UbWy4nz04nBIjkGlEZZK2VxsmdKgdoqacoMtxsWqTwfT15kX9Ep/3oeye8dIk5Qq/NMOx+IrD5GRSUlpS4XytMTD6Z8Y8K3KTKJ/zlJlZsUuM+RbVKGLGjHd+jG2yq+WXLALmCxA7txQHTArP+ruSdCfOHMlOrjUxXvbl5U2XzpRPzmJ0vfkzjhTwB1bKl1/VTv0V8M4H0E7HiUCtXcHOxqNFbNN11XacXL7xTvQV54x+oEyma9MJl4pxe0a7c8eqepFyPnH+nLmOijVh83+kYJnGynXbGuvWO9rJXP88LHy8zjUjiuPkL5GOVA8qkUnpeF59OFy9L6tt/X+631kQ1/PAgUgblW75ZKpXbpyAt2U1xE6WC5A+ZUkCKObC++1SqXxQtQbUjfVGnnNPU/6eXw4bK/ATsGaNGtVfIQfJINnUek4sZeUt1ATlywmiJMObAdIvvdwHY7oNp5UDjJU5tvqQy352i1MRcvysvqz0noo2RV90HCGq2urJczQzAe7m7Yb0bK5cz5+Zkyz4gqaRhZa0VjJA8Dnx+f+fmnRy7zCyjxKo5XV3xa8wVx3w24tV1dnc9TLlhU9rsN8/nIejmxa/AhBD6osXF/AjYh8DAOvNsO3G4y05RI2cl3tV/9Q0qk5Opyjb4Sd7lCQi17iIpmRLNrp/omyTuWbupET4hEfMXdQVPET56G6xZUfNb3L/nXqvb3gYh3JF0PcGUk+/f3AtfX8hLcCKyFhAT3XkadLOfdT/PHR48mVi9mbizWmdLxWtz893vxaz7OKd6F8YUVLXYtatfu5/rK+ObGv9I41cbHdeXneeXzUjjUxqXBucFpbZxK5VxhLnBeYF6K+/hU71ycsdVYW+OyLhyWC+d18eJTVs7rylI9pbPSK2uBVq64U4d4O5hOceymLW5BSnVx6Uvhaf9j4bkeV31UbZ5tdp2zZPAkEYILUqt6uZReLKE4lykIKUHKQoqeK3/NUSulIK1vEb/yHnLTNnfG1B7bnGNgTPkl+G9dV5Z5oRXXrdW6UMtMLTNaCzknbu9uEQKfPx9Y1sIyr/z2p4/89uMzh3l9TbXndRUfBbQqtCtQB0tZOF6OLMuZ8+WAUJnGRCszdVmpy8LQPHb4VnFrTBP2UbidIrtdZBjNNVrmHQji63VCH2nEqFVAAiJdX3H9F0MkUdW1Dl+kCl9R8L/6G6SvtgvN+/I+PlX8DepFrFtgdL1Vaz66XcccZ/E7sqvBSWwvAtKYnDsUAkWNouaWqy+PF1C31qhXaUV3NHzxfw79rgEk4lqzZE4PUB8JNfjaWl04/3tpl+7Xcw1xXFvj1Aqf18rPy8KndeHSKjOwNF+rn2tjbjAjLAiXBpdSmUvh0nVOS21cauVQCguNIo4BIoZbpHWpR79IgRe/1jdZFG+XpOFq/Ss7u6vs+6xM66+T84PcygP8AiDqlh6ug+tM8yCsFNZWfQzu2rcejwa4zYVLJTzE0EIHmKPjUfK1nYhA7G4tQ+iWHt1XetKeJddB7dBq9y/yx1kuC9RGCoZUN9YLKJvdhu3NjtN55R//7gfWc0Va4Lf/+In//N9/5r/+8sxjqf0sex0V6FUVH/A3gDZnfY4pUNvK5XLmfDny/PTIslxgXWmXBS2eTpFpvE3G92PmuzFxnwK7HMgRTK9qaZdSaHSuzlWx3t+PVLlupPqJrOanWMdlpAPCPm5dxxx/A3u3ci08/dZHCe2gcOu4Ue3PuHc3DlA7EHwd1boeqRMOuQb6daGab7365iu6HzNXQDp2xXwI7uFsXzAlB6F9eyYxukwjukI/js7EbsG7Ou+WAiEnL0DWxwt8/LoWWHrhXVvjUhvPpfBpXXha1xfD+lLhvHpRuVw7F1cFeIGqMDdYcPHo2gBRN55X61s1JYh6d9Suns+lg9puY+EZ8L5+vxIqvy5QNC9erW/YKs1dH8W5Q3o9La9Tl7l8IwxGGBNED028KhREe+G6gtBKV9iLj2PCl+fMnF+WQ+dAdf+hIQpjVLJVJqMb1Cu75HrFjFu7xlY7h8hYDjPz84UUIykGltPM8fFEHiY22x0ff/xIuSy8f/eetSn/7//jt/zHHz7xXBox5JfT7DUcr6/40AjSuB8Sb3JG6spxPnA4Hnh6/MzTx08cPn6C08wgHs53myIfhsyvtxu+GxJ3Ucge8M26LMzLmaYNS4E45G51al3J7punpkZRvPCE3vnI1Xa0F5z+cUdufaWtfYvUxx3E33im5viOz1JdJd3HFXNA2Zsh366puV2qr8r9ZuoAuDOvXQ/mOI4bxV+dDt3zJznPKHXha7DuingtPMk1aiEhITmnKPrndHJypJj1k7KPgL0YyotUw0sr+Ab6inUV3GLVC4t3cUH8RGvNC898NR2rvg1bu4H8pRVWXJzpNqHuRJDEiN0m1Zs/AXyTeKkeRtjpSazdmrW1Xg2rW8r2uRbpnZITLr/a9En/+Dru9vv6314JOZC3A3nr75lruW3dm8h/Ov15cR8kzF0S6kvUkd/HHRyV2PPbNoOxnyK7KbDJ5hsvM3bR2EdjFMFac2mLGBlj0Ejrns/jODJtt8yXlc8/P/H8eOK8LNSy8ObdG4Zxw48fn/nx44FS4dubG+6msc+kX/fqf7rj1RUfoRJVeYiJhxQZk1tDLsuZ9XLm8dMvnJ6f0LIyqfKQEm9i4M6UW2vcRWGKRgxX3MQ3ADH5ld7tR/3mILN74pgZZtm7CLwYIeFLl6N41yBu2CUaOtO4z+l2BY77SdtV3U17K69fRq7+jvWPgxeyK5bkhMBe+NRQDX4zZzKX3kU1uXKCAi0mWgzUGCkpOcM6x87S9p/VzJxRHb76N7hJmaSMpoRGQaUhzUl8TZv73KRehLsFhr9O/n9N/MQHD/gbVJnMGPv2sQmsNFYRVvFx61wL5+ZjmK/mnfOz4AU+irkyHsFwrk1plVJcRX4phfPqJMWlFCp9Vq1eEBo+drlZmp9ofiHwCKI/fOr5899a9SDD1mhBOnvcO1TFN4Sizt/xBBMfw9T37zSj0xNW1mWlrMsLX8hHtdY1WZHtENiNke0U2OZuaG/uyuC+VZ4Zn4CEkENgMw4Muw2EyNNhZjlX1kuhrYW8yawq/Jff/CM//fzI22nD//3De/5qGhjL6o/jlRyvrvjQrrl4vj9KY0ZMeT4duFzOPD098fz0RCsrOSrbaNxEY9sFe9scSElIg5tBxRSJOXl302P9RANNXYwpPXbEeTVXrVSXJ6giGqEXGhFDNPnnuh6ptSu3R6Bp90t24Ld1H53auyUftb50T945dX3ZdWP1wtPp6/+r8XsHl6/F6SqfqBIoEqgWWbsko8U+XgXfomFuFdHUZSR0Eet1jJPk3ZODzb1LoFGtYdltWx0vu+LiFe3bSF8QOO4wmrGPiZ1FFzpSOa4rSx+xzq1xqIWntYtJa2W9IkjNeT6+bnBczulMnkhhHSMrrTlfEFhbpfTHcD2lvozC/ma60h2u8LJ3UH446Pzlv8EJiio+pq1r8XSJxbGe0C1zra/XnQrh3k90iY7528VB6NagrNSyooLntwWXSkipvnnTRk5KjkLK3hWF4JYkUcQdI7tYNzQYQmAaMzFmnp/OPB9mUGMcBwe/Tfnx0yP/9Tc/89PziaTKbU5IWSnL8qUKv4Lj9RUf/AQttXGcF2wcyNupZx49c3h65tMvH5nPJ6wVBhU20TzILUVSMix2w6jRTdw1DxQ6sCxGldiLSk+L0NjXy/7CeJfQC4NdEyX8/t4NuXlna9eT1cl6pZQXr5xa/YSo/Urb+hv/CiY36Rwe7blcfeTCDLNA6IWRvlL3wuPZ7NcupDXHpegbIO+IhKqhY1Uu8XCSXo9XviZjmHShqxMbfVxwYmDTK5X5i69QE6880v1nvnq1iCrk4PHE++CEudoaz3Ph0+XCqRQuFU4VjtVX75cKHo5zpQe4cVltzv1xLpGPr9kCQy9oqvrSu5Tq2E1zjiB8VVxa6/Tnr4vLV1d95/D8AR/GPobVpXJ6PDE/X1yAaz7qWnJZi8Yv9IiQr8XJCMlIKRBDIF6lOgHSEN150HwcLZ0MG6J5/pp5LlwM4u+Y1ojmusRsRjQHtCmVn3/+hV9++UwTYXO7gWhclpWYR+amfDrNzE0Qix45Xqubkb2i43UVn9bXoddIXVU2ux339w+0As+fHlnngjbrGw0hmTDGSIr2wlAOY6LlQElKyRGGjA4ug5Dg9qd0VrFLInrgWi869nUHpEKVQJP4hYV8FXj2+9R+Ylq/KQ7M+vEFUL4WIBHXCYkKEnoxcgGU83a6IdiLYr2POk16cin4Vk6caVNRkIBKeNFyaUiuHRPn7dA7MQfTWy90uGLfoIhjFK3bZbx0bMFPOFLnDb0sjbxkmHgaREQYzK/QUYRTg1/mmcdaOeMuhaXjRIiD8NrtPuxFle5dTO0iV+2A69BV8mPwTZDQO6DOpL5uHRE3RfPtlXikcI+hoXU2dncMgd5huxiif8aP1jq3qTbqeWY9nllPC2Up/hpY9/aO6jFJuWeuRd8mWg9r/LJRFFpo3bfJcSA/8/pISO1kRSFmZ0RHFaSTZYMYrVQf4UpFRHn+5YnlPHN3f8Pdhzd8Phz4u7/7kcfPBw6nmeN5IcdEaY3PpzOXtbx0ga/leF3FB1y1DIzib7jNNLLb7ckaCUWYQmKMkdgp/oonEKQc0WSEKZP22x5ZMxK2e3S7R7cbdPC8LM2DYyXme+Rq1jsFH7WqeBstwVfZLwJQ7fezK4ZiPkr1dfoLK9m8e6M5hmBdY/VScDqz+HoSdmodAE2qs37VOUKoYz0vcgqRPgK6abx3NF9W945Pda2X+d+oGl7IkF4IO1jdC8sLY1sE68GCWPcwigG9RgWFbnjW64dIt9wQV2l7ppaPhT/PM/9wOvG5c31WfBQxfHOV1NymQ4ykxqBG7IXL7Vn9T87dsvWqAFfxPrI0l150ZYQ/e/5H9P/oJ/bvUAT8EBFaq551du1NvZX0O3TsyHo+mKwV5oW6rC/bPh+XI2EYCcPger/+nBKkZ2p5gSJCS+6G5sXJeofj8TamvnIfciRFZZoC2ymRo2GtYeKm/KXAfC48fz4xn1fyELl9syNsEvNS+OWHj3z64RGZC7c5sk+Rw+nMz8cjBXoM85fu7099vL7i0+OxtkG5HQK3u4ndtOH5+cDhcKY1oSyrO/E1PEMpOHBsYybuvOhIHtG8xcYNMm6wcUKnCZkGz0HPPT0iJ2zI3RDeO6dm2okYARsH/5p1B8HYsZK+kr5usa6FBHUOkaiPVb4N86/X61jU42Vqf787luQgio83/lzUjlm8fF/vRK7YlAPffrKbdeZ2x42Q3jXpVZLhK3hXwTtnKIzZn4MQv3Qz6oVMu9xEYqB2Ya2lgAUPpfP7KXSC3BSsuwn43/DzeeaneeUR4YL/DfQTX/tr7OnP/j1ZhZ0FNiGwCZHJjEEhizCqjx5JhKhGMC++DajXzLBee9w6xA8fh/9lJ5uIfrHn6KkUIv3ndFsODRFLGUuj26nEK/WhF56u360K1RqajDwl4hjRXsQteQHynAAhBVfJO/6jbKeBMUUASnGCYeuE7tN5piyre5BL5fPnz6zrymaY0NLYiPK3H95xM0TWupJSZDeORLsW5tdxvK7iIx1kVnjYD7y/3bAfEtbg7/7+H/l4ODn9vPha1URJV0Flzui4oeYJxgmmXmzGDTZuYByxzRabNjC53altJmwaYMxIjtg4EKbBUyZ65jnmVzhi59h0QSh9+0TvgJr4+HPtQK6i0NYV8y8r+g4yI1d70v71lyehdUzIu6Arbb/5ugzpETlfuq1rMeo/txdAH+V8Fd+uK/eOIdW+ZbOY0DRgaSQOGywkRDu4rB3wTm50r1nRLE5KjM7wdfS5EQU2MbCLgdyL67kJFw0saqyIkwtbJ19C5/H0sD8Vsng2+jaE/q+bhw2mJPFxK4ivDJRG6H8mV7C6A8/+PnLg/8s89j9x9M7PMSN1CMCcv+XOAT4mSgep9Wuxr16Fvh2y7EC0mG/LahcpN23e/WRFkxBHx4eCaZdluD1sMKB5akhrjbVW1iasawU18pCYdiPjduR8mfn4w0fKeeb+bk8Ogdwat0Mm4HKS/Tiy7UD3azpeV/HpxNvb7cCvv//Am/1Eu5z5u//j7/kvf/8Dn5fKQmcD0/xqMU6kzYa03xFvbom7e2TawbhBphGbNsiYIQ3IMKDT1L2WJ2QzUMfOcRkyOnjChA7Z44lzvMqX3dQ9NF+jft2BWO9I+uoVdRZ0M/ExxfoYpr249je5WuwrWz9B2nVjdmXstq6cckFaL2r+vWhnzwY/OehyDCc5947HOpAcgmNH0a/Mnvt1VcurEw5zJo8bT8FQd0TU0L2AgtMTJCsMgg7iVq3ByXSGG4dNZtwkd/PTHrUzWCCKW4icWuO5OaHwywbKt1j+MyB3cNVvxhgCQ//cNZnCOs7kuqxGpVKqr+K/xjS+3mpdWcv/1NHrJ9I80dON7x2XKZ3FripY72Zbay+jtPQ4a7pu7trteufoK3fRF6K8h01GRZJgU0TH1F0RuowlOBfoypTW5uPlXJ3EuTSwJNy/u+XtNw+M08jp+cTjTweOz2ekeZdEK4Rx4LmtPM4XCkIpK2Utv//n/0mPV1d8KpVhHPjmwxtSED7/9BP/4T/8R/7x8ZEf1sLHBofaKKKkaSRMI7bZE2/uiDd3hJtbwu6OuNljmz1tTF5YNgOMA21KtME/rtNAGxIMGXKiJO92Wmi0JLTYkNC6AtlFmO633AmHzTcSHSB4GZF8TPIx5ooRODbkRcKC63eucg9fn/exp+vA/I3er8bXEUvcCEy4Yjv9ZwigzqkBvlrXB/edHgYH26OD2deCeGVAe3H1QiQhdjwpYBr97AmhkxoFQifP4YXU1NfCWRr7IOyjsTHlNkQeQuDGAsMLxtLcx6eLKN103m1JAVeL9s4mqjjYLHT3RB/BYre0kCvuU330ak1otT9n1y6ob63EP3jB274cX6HPva5f7+cbtyuRsjmPqxcXt8CulLV4tBDiTgXXrVsfeZ060Umkwe1jNYp7Qg0BnTw6icHpDhI8G26YBmJM/nhFuNTG07Jyqmu/KAZKWZlPF5bjjFQHpWkQc6Kq8bys/HBeeFoXCl6cr4uL13K8quLzAruKMA6RIQR++48/8l/+7jd8KvBzE34zX/i8LtRgpP2OcHtLuLsl3t1h+xvqMCLj5EDzMKJ5gCEjk8fZMCaYEq13P7rdwjQiY6ZFoxi0azRyaDQrNC1d7tX6Fc7VW32J5G/oF7D3Cih31fS1EEm/Kl7fxNb1Zf2KKle8RgwV8yL0FUnQR7UOJvdRzcez/nP0Otb1QmfuB9T0urHyrK9q5ur4/uCreJdUtXOdukOid2s+XmhOhCkTpuyree30gZ6/ZSKkng6yD8aNGjemPJjyPgQezNibEro2q3QSo3/sUomlFNZaoWevhdYcFxLXOE0WuuWoCzIFdyh04LlfBKD3U73o9BFYu13G7x+Kb1eh9jG3UyOuGi/z1/b6XIcYQYzSXCC6rtUjjJvQqlIJLkQOoeOQLpHxsbxjg8FoSbvrZeg5bvElHbeKOBDek3RFldO68Ply5nl2a9nD6cTj52fmw5mEsR8yu3FE1KkH51r5zecnfvN8wmJGxQMYxX53q/enPl5V8bk+GFGB0ljXyuPxzD98OvCpCY8Kn9dCS4Ht7Z7t27fEhzvs/ga72cO0cR/lnDpYegWWE5oiDLHnpk/INKKbDQwDOoyUeDV6t+5g6BwXLxLiZmPm61MNbtFxXZN7RyTdYvVqDO857E37+jt8sTqt6hILH2kidP8dl1JY5/64xUeIPiZ5oeqcI8EJjVW+mMV2TKipW6h6AXLMCQve3vfCclXH0x+Td02dy9QtO5zf5NhVsw7Mj9kjgK7MbcETQQVMG0kqo4iTPQX20nhQ4Y0pd6JsEbYCW1WPMTIlo4TmzOrYvLMZ1MhSGVQ9Kqdblw4WPATwqmHvj0HNt0Y+WV2v7o4fSnMdvMgX3RatdfvTa2Fx8Lr10dVHWScqOkzXaRjx2l162Nv1QmEt0CQhklCNmGW3Z7H+muNhCIi/vj6S+2sRUu7jW4/zaV4omni3JaYvfKYQlLIWPn9+5vR8RtbGJkbu77ZMm+ydZV15rJX/+vETz2vhYbdnoz034NphvpLjVRUfeirCGALn5zP/8A8/8vPThY+XldltrLibMn/1l7/iV3/7Nwzv3xLv77GbG9ow+AnWu4mrdYafIR3ws+smK3oxSgnNIy0PtJQgj0jOrpMKLm2QXhCuP9d6aN9VnmDRjbisb5Lc6TB0gPq6cfLC4RyeiIXsXB7v81/GKdQZzbyQCa+xwtfOqk9YvYP6cnXvBbuPebWD1t72Oy7xhULghjQVvL0zH2KumzONbip2BdIdw0pIGLA8kDcbjwIK6nhYxzFUvRAl82y0m6DcBuUhBt7GyPugfBeEX6XIdynxTc58yJl3Q+I+e0je/Ri5S4ldDGxiZLAvRu2O+VRfx5sbpScRBvHfaeomX8hV9NqB4Sse1rEbLyhetGofHVurHVjujZO5F7SzmZ2AqddEk+t2MwQsjYRhg+XB5S+4Z0/r3bAE/1yj+eMSfEuJP//uZukXAgkR0dAfgFMfVaHVwhCV22HgbpoYNLCeZpbzTFlXSlu9Mc4umLacaJZ4fDowiPAwZe7GgTzE38HBXsPx6oqPVKFeFn779//I0+OZ46WhEtia8WDG//7Ne/793/wV9999g93dUaaJNUZWFWoH6EpdXYMk3fZBfN5V+cLnaE0Q6ZEqFmmxiy7TgGYf1yT5Ov4lPyu4wbuGhIVMCNl5NsGNuDTFTt67boqcbCbR+TiEgFnyEcrsJcEC7V2QXSUcX9boDe9M5Bqt87Lu/zJiifQO4PqxgpjbYlwfg29lrip68SKn17Gu40lKx5G86FrMiDob3Ls3T261ySOGbYwQQZN6/ll0T+NBhbsceZMjt1F5CMr7qPzVOPA348BfT5m/GDPf5MS3OXkRyom7GLgJxs6c23PteqL7O2I01zepMigepRMDQ0/8lObjlur1325/0idXtHU9ljnu1k3Vrt7KaCcFGjTrGF/wTtdHbi9grfnWSVJG0uBaOhVaWynlQsONv9TaSwDB1QMcNSeKVpzNnnoem3rRd06Pr/alY9XbELiLiX0IRJTWAx5FApe1sIoQciIPI/NaoDbe7vb8arfjYUzk6Fn12i9Ur+V4ZcUHGo3z6czHXx45zZ59fRcCfxmM/+fbe/5ff/trbvY7SggsQmcc+3dWKktdqG2FtnoRKoWyrrRlhdIzmma32WRxBizVcQEk0iTRtPv3BAfvivRuQYymTsK7ji8aPXVCg6vP/XOdUxO8c/CWGlR6oblKHbpAVS16IexQ6rWLEXwEu67Ze3vhGq0+XjV1Cr1YgM4+dozJA/LQLxQBv5+PY9cuziODXInNy/07QVECtUcIiyYK/vfHcSLvNsRtQseATS5liUPEIiRTbqLxZkg8mHEbhPcp8n3ut5j4JgXeReMhBd4k5S4IN6Y+sgVjEiWrG6xrz8hScaGpK71hMmVU1z6FvqW6dmDqTz10t0bfNPnC4IV53KE0C9L1WuYZ9ak5uJ7wqOUIVauP1gJl9RW4djrClVJBFxEjbtWB+mguJlj4IsugY19oB/m7fW4tbglSqxvYa/f+ySJkc+Z/qYW1FEyVUirz0hi2O8btnufThZ8/nTidLuyCB2VmaazrQq0O+L+m45UVHwcPj5eFn48XfrnMzK2yU/jLzcj/41ff8f27t+QheZezLqzzmfUyU5eeLFkXalkpq3+uLBfKZWa9nFnPJ9bjiXI5084X1vOJep6RpSKr22+qgwDQepTu1W8Zj7/xt7/P8S/jTL8556aDycE8STRGLEQseqIo9qWr8a7lC6DZcNsHeurFC7dHupart+985QEt6kXMweiAWvKu5goqq18hX7yhe6fVcBN96F2CeHvQ1H+u85S6DMVSL8De0peQqDFRo1MXbBpcQzcGjyXKwpA8lfMuGw8p8i73WwrcJ+UuGDsVNtKYRNmoG2m5mZYTEJOYG3CZp21Esz75NAbzjiers6Kj9vtZ841S7qZpATQrJKVFIPvXNAmWe1R20s7i9lx3TYr2JFtNXV6izv2pa6EuK1JLx4ZwNrM6JqNBnJv1Uoh8XV9wYzJLgZCzXyhwFrv0Lqz1VbkFJXZnhhwDyTwiGiqt1Zf4cBFhGEfSZssvz2f+029+4b9+fObTeUaAQGGeLyyteCz3n7ddf+zwaf1SGj/Phc/FfVF2Sfmb797w13/xnv0ue1czH1gPnymnI+1ypl4WWAu6NOhZ2+VyoZxnSs9maseFcrxQDzPl+Uw7LtTThXI4UQ4n6mlGl4os7gus3TnKgcor9sJXeIxSrgF+Yn2u963WtXCoBfTqodNTSJuZP/Ximy7HKXj5nquZmReeThwUfRl/roXk+vWGj2vtCjx7gpR/nS+FimtAoarH91Qn6DW0g6NX5rB2cDSjYSDEEYsTGic0TEgYaWGEYUKnDTJOlBBoOUJSV8MHT3AYTNhG74T2UdmZsjG33simpOtNPXAvqXiIoAjBhBhc8xSi+Bij3h96fpaRtKvAg/OPQjIkSadQ98VBaLTYvKgkgViR1NAEkrzoEF17VXqnpEld7Z++dLIVPFK6riAFFY/AEK1OuryyKb4abUpzH25fRDh25A6RSqNQpaA9SqddN2wmWHI8MUQlBSObkwSDwmb09AtLxs3DPWqB//abH/mPf/8T//B8ZG4wDhlTWMpMyAmJgfIvZHv/rz5eWfHxk/aM8FgbswjbKfA3f/UN/9u/+zXTlCjLibY8wvkTXB7h+Eh9fqYezrTzTLvMyLJSzwv1vMJxph0ulMczl18OlOcZDityhnpcqYeFdrxQnw/Uw5H1eKQdL7TTTJsv2LpitXkXXb2jdjpKFys2UHdop3bsxHt+LxZo6BnrAwTP95I+wvV3mr8Meh2LopMCxa+ovlXyMctFrObaKwcjetSyf03UZ4naLTfEe37vaMxtN6peNW2O+bTOUXFBqndEXjwjtASMqOwItkPDFo0b1LZY3hKmPTZuqXFgTREZMzIOrFGowbsHP7FeNv9uMyoNleqxwq2i3ewEQMQtWpu49mrtDjxVqo+Y4qtxpHYKRD/xr9SI4FYgzscCrL5sLlvHp7wTElqAGvzzbjHrQHEzd7R0u49rhxn8daqe7kpdKbIitoKuiBQaq79mTrlxQSv+nojRi4lE74yrVppW0BXiiuSCjWCjr+CreqGS4B5A1oH1KwGzURh3G3YPt65aP68Iyv048s3NjrsUGFW5vd0w7Tcc5pnzsvSL6Os4XlnxcbrGUgraKvdj4m++fcOvvnvDOAplPTKfHqnnR9rpM/XwifXxF9bHT6yfP1GePrMeDsyfHv328ROXT59ZPj+yfHxk/fhI+3SkPV3g6Ux7PtMOF+rhjJwXOJ0pzwfa6QCnI+VwpB7PtMsFXRasNrRKjxf2WytehJxmIr178E2ZF4VeIDS4JQfOFfnigtj5P/0+Vx2X4y/01bwXlOto9RKX3IELB4394/ZVIUHDl66m389jdTIaE3Ydq6Rbc6j2lb+D4v6zIkUChUjT7LnxaYCYkZRpcYA8krd7wmZH2O6w7Qbbj4T9SNhmbApochtbiwrmlbz2rsFHEy8qLpHwW21d+tklJt5h9CVdcH/kq1q8RS88LTZq4IX2ILFnsnUT/doJpESlRrzwJB/FJPmSQMN1pf7/Ze/PYmXbsvQ87JvN6qLZ3enuvdlUXypRFiWxESiKlknBaiDLD7INCYZh6Mlvfrdg6cEWLFjQgwDLsFqTAkkIpAhKgCjJJCXZJKuKfYlVtEusjsyszJu3P+fsPiJWM+f0wz9m7H1uJqWCbGTtBDgz4569Y8eOHbFizbHG+Mc//l9KjVIDUAacF4mEpaKgg5sojOQyUlw6diG1PMGrE4q1zV0Uozk0wUTIqlqLoxkamnWP79QtdW0gtgrg3hWCWYCHbMFo1dNueg77A2VaeDGs+Np2zUXj8Xmi6wMv3ntOt27Zz5OY809oPbngA4pAp9HzlW3HT33lOc9Pe1w6kPa3zLdXLLc3TDdXTFeXzNdvGa/fMt9dMd1cM11dMl5eMV1eMV1dMV9eMV9ds1zfMF9ec/j8DfvPP2f84g3z2yuW62vK/Y6yP1D2B9xhxI0jHA64/YG8O5D2e5hmvPl3+wwhO0JxhKKrobdxCImJPRBGknvAiHCaHi82e6STwVTcEaagHody91JzeIfl8tYLthKP4C1zElCNBSTvIkGKVrqSFyMeVpAiSojetbJ1PuI8hhHVYCiKgco2zYdZN7Bpoe0oTUtu1Cl03Rrfr4jrNe12Q3OyIWxXtGcD7bYjrFv84PCDI/QVd7GOnJeWTYyBaLyqED2+ERZDFA4TG2E0sQ+EXv82q4AfghQXh6CWc+9x3cONFlzNeHptagwHog3Hm+9kCClQX/ytYnba6iSiXMg70zZSKpzLzJImI11qUK9U+RDTZwoxmo2RIzSR2IgHBFZ6B0fsG0IvmkeJCppS2/TgkBeZOXKUrIA8zTPT/R15d89p9HztpOd81dC0jm4dKKEw5ZGua+j79ss77Td1PbngE4Jj5eF553l/23O2CpTpnun+mvnulvnmmvHqhulKpdayO1AOB8p4YLm/Z7nbk/c73DQSl4WwLLhpohz2sN9R7m5I15cs129JV2/JN7fk2zvS3Z2e5zCRdhPlMMO84Bf5vbgpSVphSeTFumUJDRrasGH17jziQ9ahwVw/c0k4o7k7y1JKLbsQflNvlGBUOsOdLBhpml2l0rFsc6ZL5Dx4J5tmF9XBk6ugnp8KnBuuVIcjj3WRWu+6CRAvTm1nX4Nd9NBHfJ2B63pyCIwlyU0jRHLTkpqG3HewXsF6IKx7wrqxmaZAGCS+JWzFypEINAo0LioACecWOOxXkdArmymhkKOD1hF6j+8KvjPA2ABn13r8EIjrFj8E/BCPgSt0gTg0xF4CYKGLeMNiKqFUEiQas/A2H1Zcpusj3aqRfY5LlDyTlkknsBOA/06DIEglodIqinc2ytIq2xUJTWmYEVKL9+Sodp+LmmIzMjY5Z0JxlGVmvr2F/cg2BC6Glveeb3n5YsvF8zXd0LCkkZITw6phWHWPmJa/+euJBZ9CLJmzzvH8pOHFec+8u+Xu7Rv2V5fMtzdMd3fMdzvSOEFKBO9omoa2H+iHDe1qRbta063WtKsVTd/jm0hB3TGyglHa3ZHu71jurplur1nu75hvbphubliub1judpTDJCB7zpQlqas2JcpcKElBp1SFLRtQVNAxxqyVEA6j8Ve2LRiD1lmJod8TtmNpu3XYsKCG3KaOGVbl5+BFosTVLKnOL4lQd3w+7aCH6fcgnaJiTHCpGYpAWYKyJE1aQfAPzqgqZaJkJELEx0jxMKeFKS8sZCbkA0bb4fs1flhrmHfocEPADw1haHCDMhDXmWl5JSw2QThNU3CtI/YBX29DNHNzh+uKksbW9Dkab88nTMfVDKh2sRplW7QyR3dtPP5910fogr5upVJYp9qLK6SSmNMs5nErXesYHb4klsOBNM44NIBakCpjoc76yXlDFAhJwITWWPhRszzZwH+cSJ1EEQabTU/sWyOi2qUtZUpKMM7sLt+S9nu2beR83TKsInEInDw7pRladrsDOSWGoWVzIj/3p7KeUPApUDJn0fND5wNfe2/LunfcvnnL7vKa/fU90/0IcyJ6T9u2DNsVm4szNi+fsXnxjO37Lzj74H1OPviA9fvv0798Sf/iOcPFM9bPn7O6OCcOAz5GtU3TrI7Yfs9yf8dyc0+6ume+vGW5vGW53pPvFYDm3ciym0jTrLILL36QXY0EROejH3hOmlRzRbrAAXmROdvDFddQFmOi5KbsVxOn8ghDEpXfBMQetel1lS3GDXqY+XJBoxbKZgwIRzo9Netx0TpvRnCUmFp119BYBlW7COnUYCp+GrswzlL1+GojOYgLlIOsfFw/4Ic1rl/hhh43DLhVp/m6/tGm74P4QpuWsIo0q4a4bmhWHcHKkdA3uL5RS38diUOL64LwnFavwdnkvu+iglr3UFap1NJ0fxz0PL7voGvIjbcRFJV7worE3HYukdJMyvOxJZ/Imu/LEtnxTnbJLuhSUUrRZcYkWTSwq88xRM3ZudZcREI0+V0Ebh/F/T1xEBUgRInVNyFKB5pMzApAeV5YtYHTTU+3asmh0Aw9xUdu73bkUji72LI5WxtY+TTW0wk+BUgLP/Zsw295dcr7m47BFdahoYyF+bAwjjMpF2Lf0p2uCKdbmhcXNC8v8C/PcM9P4eIM9+wCnj/DvXhBePmK7r0P6L/yFfr3P6B/9R7tsxe0F+e02xOaoRc/JCWYRtL9PfPNHeluR7nbw36E3WjA84SbEixJgcYkP505pfpc8Cnh0qLcJ9ut6EQtZVF7VeFCQG8d7nRyi9DPahl2ZAweMypFpWDSoDrJVabZlL21+dUuFz5UyYh4k+jwNtJBIS+ZxXyvsLGRqk+jaWzDf2xKXtiQiJOuaTXt3jY0q4HQdsR2oF2tCf0aYislyBih7aBb49oVtINworbDdS30EVYNZfCUzilorCJhUBChi2RTlSyNxh58G8TjaQUcu8apDAvKoJTZGGal3rzKl6bgOgetsJ/SFGVOsQgE91KS1HDwg7Ss84nYeLp1R7uW08eSFlKa8UCs5ZET2dUZi7xpB0LTU3wLvqP4HkKPjwPOxmyKk/xG8aag0Fr252DOiaXIsLCgbpz3niY0uFRwKdEEz7DtGc4HXPTc3O356JO3fPbFNfv9jPeek/MtrYmTPZX1dIIPBcrCj7//jB9/dUY4iI/jJph2C/O4aESii7Sna7pXz+hePad9cY6/OMWfbXAnK/zZCne6wZ2eEM7PCecX+GfPCM+e07x4RfvqFd377zG8/wGr996jf/6c9uSEpl+Lv5MLIWXClNRuvx/JdweWmzuWux35MJLHiTSp7PMl44rsZkpaIC24ZcYtixwllXCTc6IUkcRKyTrhsCCBs4Chcku6xlZmIQErX5zkgLIJWhWgGM5UNJYibeuAK3quTMWJrN3uLDNyTlbAk5jfDpQNRpVdeAmllaA5J6Km3kUC13hHMG8w1zaEXnNfmCFh7AYxeavmUQxSj4wtOQ6UMEDoIPbkpqW0rUqdXmVQ7tTlT9GRGk8OkeQ8i4fkHbQSvs+mlyTBLm3gFBREi5fKJCYRm505Wfj6tdr32autX4yrY30CI3xiZYrNZ0WVgcVnMgmyfOFKkbOsi8KZ6lyfyqqO0Az40OFCa62tas0t3Ce0moAPVuoRjWdkmVp5rI5YsmyEcmIaR5EONw3b987oL7Yc5plPP7vml37tO3zzw9fc7xKUKlr/d0iGf/tVFr7y6oKLoWV8e8fN5/fcXe3IU6ZrG7bnG05enrH54CWrr36F4avvE56d4rYDbjPgz9b4szXxdEU82eA3a9hsKNsNbrvFn58Rnj0nvnhB++oV7asXdK9eMLx4SXN+Trc9pVutiU2PKwHGhbLfk+92pJ1uy/29uEDjSDqMpGkiLzNpmnDLrI7EslDSrIyoZI0UFwzzUdr7cCIInKx4jTCeClsbjO2E3zxgS3YmVm0f04quP6/4kdryhgPZAKkyIA0szocDpEKwgdgStWlTlX/wXplAHUkI6rI5L/fO7CB5bLxAgcabJs3DhlKr2AUPJj0amjWh3eDaFa5b2UBvL3mJvsENmqD3Q4frOnXl2kaWQI2H3uN6BataHtVyy3X1fRiN4ShNooBbrAzO6GKWS9aFgQdtobQs5KJhBOeQflPUIU8us5REzhqDUNmlUYrQt/iuww+txk1Mgrc0rXG8OkIr8bpi7XeCN92l7hhUfaPOmz4TlYCxj8qs6nupIxitpztfsX51gl913Nzu2e0T93vYT47DlMkZ5mlif9g/2my/+etpBR8KQ9exHBb2NxNpD3ks9G3g9GzFxatzTr76gvbVc5pnz3Cnp5TVCje0wgIMDyhDwA0Rv27xazly+o20e9x2gz/d4s7W+PMTwsUZ8cUz2mcviRcvaM4uiOsNxEYf2u7AdH9Dvr8l392Qd3e4UWVY3u9Z7u/Juz1lOpCnETdPkBSISDN5mSjLjM8q02xq0IKRACPFA/taXr86HHbVrUsXYj2HcygolYcumffmxHDsolXWc+1gVQDbcIkkxqS37EPkukct9xBMaF+DkcW0bbx1+zFWb/EaJwmd2sLOY+Cu2MUuPkz+a6M10tjuV/hhSxg2uNUat9rg1xuxplcrwmpFWA0mb9vRDB3NRuMcft3RmMZQ7HvisCIMK5phRRg6QtcR205T+iEegfecMiUVK5ut+5jte8xOOWdSNs5RUDBQYInKvLxTXll0/ErJZOeUzXTSd3aDKWM2xpk6zsxV5QXpJ7kYKcGRvFdZaZhP03fEfsA1kTCoW0cDPmpwOARTk2wi4bQlnPTkxnG4H0mzBVkcORXmaWZ/v2d3t7Oz6GmsJxd8xt2O+8s7mDOrtuVsM/D8+QnPXl2wefWM/tkF/mRD6Tu7Eupk1pXRvK9M6iE3DjqHGyJlaClDB+sONgNus8JtV/jtGrfd4s5OiRfPaS6eE88vcKs1JbYaTN3fk3f3lN0dZX9P3t8qGO3u8dNMGUfcPMM4kacDTCNlnmA+UKaRkmbIM74skNWaLbmyFC0Y2Tkhr3hzkzBSmLOfKTyZ44I0OKAKi9ljFIBUlh0f48KxQ+aN0+NiQ+ha4R4mNSLAWRrPxan0cpbtSD42k4sUA6wQMVjJJvQrmc4Ell0wedHGqdUc5S/vKt7T9/i+h05ExdINCoJdp1vbUrqW0kuLyQ0tGJDsh2jgc4sfeujs+boebw6srhWfqQLq3jK7gtjHJVvJTDbHCvMFs27hA4CvrKpZyQfOdQ8CYZLW6In9SvhV21K6Ht+trFxU+VvpDQLyjVdVg1Db0PStApFXd6z4gG+ilbeVfV1UHhqclyjMJBOtVzBNU9IgrvdEV+j7SHAwHybynI/n1FNYTyv4FMf+6p77tzd0BDZd5MXzLafPN/QXJzTnp7iTLa7vhUH4ojrZJD6dsVprqxbbVDkqEOUIOXpy68htIHcNZTXAZo0/PSc8O6d5+YLuvfcZXr2kuzjFdw1pmtm/fct4dQmHHWEcKeNOHbK7O8phTx5VgqVJ82RlHGGecGmCZaQsE2VeKMsMacGXZCe+MhsFClv1/KhR5/i9SrX62Ee/Yet7nVjmUX4c/Yj40BHanrBaQdOx1Dhn2Y53YkVXk0EfI943D9P2rvKB9Pfkv6XMqtrwFK8xA1nvyP2jmB40bYtv9Rp820oPp2vxXUNuW3ITKE1Q4Gkb6KK16Rt8L5eS0LXS2O46/DAoiJlGU2lbStNpjMS0qAnKgGqX0A6NOobeJDWcpuGjTaC7Rp1AopxMXNOYT5cybdqIXw20Fyd056eE7Ya4WhNX+tc1nWU70m464m9BAnIYiB+6jmYYjjNYIjnWgWUFTQH++lxwsq1OObEsC8s8Mt7fsb+9Y54WfHGsYuRk6Dk/2dAEx2SOF09pPbHg4zncH3BzoQ/yMdqcr1k9P6d9do7bbqQ2GBzZJZOBEFiYXSK5RHaFdAQYrbdkHYjkM9nbY7xj8Y4leHLf4rYrwtkp4eKC+Pw57XuvaF5e0D87pdsMBOeY7+6Yrq4ouzvY3ZPvb0m31+TdHj8tuCWrA5GzzYFlfFYpVVINPOawWRIlS5oBI6UJq3kUQEoBpE0MVSpUMLUrWSWD093CYOyqqZpMioYu4og41+B8q6n32OKiODhhtTmWBioDBAz7RjIdzjV43zzMgDlJbODkUe+cYUmPAmb2D2qOer5Gukgm0vY4O/Wt2fk0ylJi2+Fby4xM9C10jdi/XYPvGukdt5HSGkjeSKvaRWnjaB5Bs3IEZRTOlCNDlTsJ7qgGSamEQsQKP75GU39sTAiuM3B9GEQZWK/xJ2vC6QnuZAP9itLaDF80cPkoPKeh3tKYBVO0kRv72nctvlcgDl1nx0nZTwWyfetV5hbD8azUJkPaz9y9vmXaL1A8fYysu0AfHWnJ7G4nDoe/E3z+W5bn7mZPmTObvuXs2QmbFxf0z57jT07JbUeJUtELQQi+sgFJBjifj++ooABUnABFl7PNDtnNSofsNQSZW6f0fruCsxX+fEU83xAutjQXp3SnJ8SmYd4fOFzeMF9dka5vWG5vNA82zoRU8MkLh0HtcJd9NRaXQFQxgLIk2aPkRd0S1NFSOVADjrhESNrY+DzWkrUsSEFIvx8seEn3Rl87m2z3rsHTEFyPo8eFFU2vK7Tvuke20AbYmpFiNVR0jybsXTClRTOyUcZl5Z2p8vnY45oVrllTmhUl9iqDWk/obKIkIKkHG/7EROx902qjW6bDIE4Q1mEToBw0uhI7dc5CC6GV97xXEPJBsqY+tOb30xBcSwitqTNaUKoibcEGfr3uy8GL9Wx8Id8oiLq+JaxWuM0af3pGOD/Frdbkpj2+luJk1IhTAKOOs3QdpWkUhAx4LrGBpiP0A3EYcH1nQUmcrmSduaqiWHzBFU9sI/1qIIaG+9sDbz6/YT8lpiWRyoJ3mZQy97uFZfmeqfJv6npiwUcaBH2MnJ+f8Oy9Z3TPn9GcSyaVVkqCzuuKIsau0wSzqxwIkxv16hg9LG1Kb6WF8yolMJJdCY2yqr7BbTrYrvGnJ8Rn5/QvX9C/eM7q/IImNOyvbth/ccn09i3LzTXz9RXj1RVpP1KWDEnGhixqZ9fRDLdYOz4vKsNSxqUMKZEXgZyPVzbQs1QP81xIaXkESD9gL3U5rJSwDMo7OZZSIo4OT4d3HbiW4lowdUZnUht1IxbbfHWqmyh5Cdd2FB9Yivm6w4MVso/42BPaNTRrXLMmxwHaNa4byG2HW3W4PkAHrnP2tcDputF939AOppi4HgirVvK2neF6lZ0dews6FjhtiDc7SYIUb4JoLoBryARKDUZR2FNoBnzT42NvbXBNemavuarQdvhuIHS9vOH6Fj8MhM2a9vQUf7LFn5ziT04pw5rS9uSmI8eG0na4vhNwvtlQenX16O3WtdC11vkyOdW2FYY0mONIlNqhqAuebAFlWqTG1HQtZM98v9D4hkTGt5n3PjjnKz/0kv08c3l1Q8o6L57SelrBpxT6LnB+vuL05Zb2YoM/WQmTGQQkCpSzmSbUXk7JNmfK2tCWCTiTnBQIgch5BHIJFOS/7lwvfr73lKAUnraT2eDJGc35C9oX79G//wHt8xfE1Zo8J/Zvb5gub/D3O5LNm+XdQVpAcyYfFpbDTN7PlGmRYFnKULWCUsEtCZeLlWrGhq4Bp0jyVSWafk4qkCwogd4zKr0yUi70zpjUhsOAiIrKfiKOBkcELLPx8Zg1+Opjb1fjYmVBjoHSajPR9ZTG2sdNRzFdappO5MFuRenX0G2gW1O6La7bQL/BDWvZFPUtbmhwfZCBXmfDnq1lN22gtAZO9/JUc50Iib4bcI3dYq9baMErAHkv4X1iJGPyIiVSigntl0ihkctEqCqUev8q0VqKC3jfEqNKwNDJ880N0jCi7+V4sl0RtmtYrynrNW69wa226thtt8SzU5rTM9xmA6sVYb3Gr9TNYxhgWOH6AdqeJUaWGMm1Y9YNuLYlt539Xo/rdLGdc2aaFtKyQCrsb/aM9yN9t6LtG04v1nz1x17x/CvnNL2sr5u+o+m7L++4d7HG7/MK683m//DlO79f65/7Z/9Zvv71r+ubUiCNfOfP/Sm241vOX5zSvTwlXJyKr2McCKJS2VLU6ckpk5NlB9ZCLWKVabPOGZYsUKRgcqk2WOkaSpH8hDtmQ0GT4b4xUp5wEN80xBgpOZEOB1gWFR02O4grxCbKStd7s3MRwRAELhcQ5wTDGYwIyNG73aaXrTTUQKq4KBRHzukBX7GrWHFY89wynmPryxrqmokAPB6TybDfKxSKBIGPn0Ep2Uosk3V1NnJhJEXqaEYwPaFQO2eDhPe7VqWQlRYKUrIUdsGBV3fmQX40iL8S1RULbYtvZfFDfBhNqJmNpu0t4Jm8bQjNUaLEeakIuGBs3lIpBVmETa+RFULAufYRLcF0qn2j7K8dCP1gzGxhUDR6f3QtuWvxqxWl71hac/yoWE/T4oYevx6gX1PajtI2pgnem0D/wwApIR7VDlwQnpMRQ9qbLnZeFvy8kHYzZcrqagWVXnd3I1dXO/ZzYsyFdtvhOs+YE7c3e113+47zv/cf4OVv+wcl7WLnz6//+q/zx/+j/8hOgO/vemLB58BHf+H/yWa5YnO2prs4I5xscX0UJmBlVs6OMhfyvJAOk7KL/UTZTyx3e9hPcBhhPGg6fZzgMCkrWZR5lCQRb1ceShNv6bpzEYDgDGh0cv3E1/Zspo2B4Bw5LeqUFEgpHb3BBcRmgqMiUOBUJGkeSwxnDBcoFPvXVkGyCZWMWCste77H1ytvCaxz75aauqiJRe1csIynlmVVXF8Bpz6jniNQsgK8MG+9Ple7YdZWl25xBMsQBKY2ypR8kOVOFUcLSIzZV9zKm3i/Zs/UpZQ3fImyea6ZWLGxjuxVNhlr0bSSjBXs1QlSm1xBHLIyyZwIaBOrLLcOWA2mzvRWnS4evlXLXo4mPa7tcZ1oAb4fcL11CruO3NayqQYTAesCl024LTYUr0xS7rYC7DX6Us0Ezf0kNhKfa+IR9A8+4HIiH0bKYaZMSQL0Rfjbfpy520/cHiQ7PPvM5e6Oy6s7bm92LKkwNZ73f8c/zIvf+jvs+OlM+Vvf+Ab/8X/8Hz86a75/64kFn5Fv/cyfZjVesTnbEk+3hO2gNNxLlqKkQlkcboZ8mFiu75ivrxm/eMvh87dMby6ZL6/J1zcs17eU23vy3Y58fyDvNESaxxmmBWeByFVpDFSqKAjZhg0KPPUkwZnUg6IDyzRSSlEKXLJsdL0jF7vaevlLVbEs5xUoZImMdZGMNaxKy0ouA6ctnKgUo0YlZTUOjV3Yc9XA45zNeVmAK87kNJwNowLO1ASzZWWKadKoycU2qMmzemvVUwOGuWBg7h/O1BF9kAKfJrglko9tdrWyF3Un6wu1trfiW7FgJOyphKDSz7SHiBWzkTJkqX8zNrKocZKuKDooCpY2PExK6hA6OzYGrGeTIqlC/d7KyAoM57bFDYNKvVbaRXQNVI6Zsa41zmEzcCbsT/AKvEEXtFwQc7xSH7CAaYFQLXZl2RphsbZ+lIMsaYF5YrnfS6FzkYd7KupyltiQvONQMvQNSymMh4X9bmZeEv7klJ/6x/9pTn78p0x4Th/C3/gbf4M/8Sf+hH0g39/15ILPR3/x/8V6vmXYDvjNQFgPuMaJCp+kp8NYcGNmubrj8Pkbbj78lC9+9ZtcfvM73H34BXcffsrtx59z9/EXjK8vSTeSy1huJMcx393DYcaNkl3NhxGmxSaLi3XCbKM58TJ8bAhNa+xWBw6WaSLNEz4XSloIJnAOhVwWcpHxmw/GTHZiJQPa4DW1rsOgzpNTBXrAlXQMciobpGDnilIgb+VV9DXg6F8dTrNhtuyqBpxCVQ9Mep/O6lEbPZCZno1uOMtKjNHsnN53sStu8A/ljvfmxmrBj+D0p+0ij/3dYsEOHl6fBNitHIrqsClAmMOqHR/TBlC5ZxcITP5DM7xGY3DqApZSzLUkWaZnpU207Mq3OGf8HyvlfCt77dK10AtkJjak6ElBA6mCANTBKtYdCz6azIm+L95IiMhG2VlJXXPTejHQySHDwCNobhc8HwQ455xI0wE/j4yX98zXI86I8CmLwJljYKSwNLA+WeOj43A/sYwJ13asPnifn/of/9MMX/0R/U17HX/tr/01/tSf+lPag9/n9XSCj8gKfPFzf57tck+/WeHXa8KwUsmDh2lhudqx+/QNN9/+lDe//jGffvMjPv/wU774/Irbm5Hbuz1XtwfeXN9z+faOm+s7bi5vuHl7w+vP3vLxR5/x5tM33H1xyf2nb7j75HNuv/Mptx9/xuHNW8a7O1xaCASa0BJcNHKeme55c7UAckrkNIk0mMVeXuZZm9l4NqHR75dishfUSsqbE6ltNPuZ8i+NP2BAc0maD1PxU/BOs1V1FQxQt8CjssqusvWKLyYQzieKWbu4Y8mlcY86b6aAp2ytUDduMmxLH4WCTVRgqSJjwWyGo/3rNSkuH6sF3ExhBl81jdSVVBVSRcIUHNRhE+emWGAFESVlrOj1zlVLHd+3SHhOx2qaYRap09ln5y3IOJO1wFxkCSr1XKfspkRxh4jhqF3kqvtIowxFJZ8FHa/SzXmTzvDV9tp80IIyaREyK21BAci7Buca1AJsDPBWAFrSzDKN5GmkHEbS7Z7x8p6818Boypk5FyYKu2UiORiGls5F3FSgH/ih3/bb+bF/5Pfx4u/9HcTzF3bsdK782T/7Z/npn/7p47n0/VxPKPgI8/n0r/4sq/mWfr1Wh6DvyS7gsiPd7dl//IbPf/XbfOdXvs03vvkxH35yxReX97y9G7naz7zdT7zdz7zdjbzZjVzfT1zf7rm63vPZ2xu++ckXfOfTN1x+9pa3n37Omw8/49Nf/w4fffNbfPLhd/jkO9/hzedvubm8YbxXieZTJnpHDGrPlqABwaYNarrlibKMMC+kSVPOOEdsO0IFrkulA0gUyuMJlpb74C1wmPFdfigbqOCOk0yDs4ymBhdcxY7sYfY83suLS99ZIDDh6SyzMrvZH3FOXTLtcgNmAZMLLX7BJjPMYK9e4W1o1Tsp7IdE9rP0jb1lO37BuRlYLNPKR1uZCrBiQ6kCp60BEA3ktoDtCkecTKWxAqRXQ8/wI4cv6iSWg8Zc8rIYviIMpYSIayQyp8xDZW/FXSq5UK/jkcZPsGzYyJjOynBPgKzySqoClmna5yL9JTUUHMa9qmWsdeAorcnoBwtgCljBA3mmLDMhQ74/sH9zxXKXoARSchzmhUPOTCUzpkw6zOTdRGw6vvrbfye/7Z/7X/H8d/zDNC+/gmuHmopyOBz4D//YH+MXf/EXj+fP93M9ueDz8V/6c6znO5pVT+4afD9IvHuaGT95w2e/+Df58Nc+4Rc/esNf+fyKv3W75zZB8JF1aFm3HTHopE3Ocyie+yWzS4WbqfD5YeLNYeGL3YEvbvZ8enPLp3cHvvH2mr/5+opf/NYn/MIv/U1+8Rd/hf/Pf/3zfOeXfoX5zRv8/S0+ZXwTabenGm5sAiE6HJLSYMmkaWaZqqpdo8BSFEwwzIGUNZnuBGLXLg1FwQUbu3CYfGmW26rDqMzOU7IyII9tPGeByNxLLR+y61uNYnazwVQe4SDCgh4eo6xHL69UoFZP9gDS2gZRRiCsxYUMbsb5VN3+LPsRCdR5lW4q4QSwa3M+CJSJa2Ob1ZkGdX11xeRo7fgoAFUVQJTrLQtpP8I0Ey1YVwsjtdU10kDTCi8qRtyMZnEco9r/Vjq6YAE2Bk3eRw3hOufF9cxQUsFlT5kdZTap3XmBoobAsQR2TpQPYyg7Z9pM1YzA8DnhYmoKFBLeO9oQSPcH7j+7ZLweIQc1dJfEblq4n2ZShmk3cThkTn/kx/gd/5v/LcPv+n2E8/cUeFD5B/Brv/Zr/IF//9/niy++sA/2+7ueXPD59K/8NOv5jm6tboNvGnyaSW9vePNr3+Y7v/xtPnyz429c7vhoLrim5byNvN91fLDu+GCz4rRrWDfq7OxTYp8y3kc2TcNp13DRd1x0Hc+GgYt+YNV0TAnus+M+Oe4WuN7PfP72hg8//oxvfeOb/Pov/Sof/vKvMF5d82yzoW8bFBcSaZmNXJiFAy0CBB8m0LWJfPCUlKz1e3zXR6A0Z3VnXBGXh2xCZYb5aBjVEpViwLThCMJzbAc6izFOj5EneS3DLIWwVfEjqM/nFZAMsFFQ0tW6eMtSnMBarPwpviowWpnlBSzXQFNfkvIBBbwKtGuOyQJwDT5BWUGxIFhfm8PUIisfCr1eBXEF5LIk3DzjRpVcwenCJP0ccZqcaRcp7yvKKr0jRMlYEIMUS5wFHmNCExyh6QjmOloW654uiwTmpgXmxb63m+GItcRyWcfwWHoVT1kSZTFpVLNJVnJiQTtCDOrWlf2e+89ec//6jjQXfIgUBxOF5AvdWlw4Lp7xW/6Zf5aXv++fwK3OHjpcFnhubm74/b//9/Nn/9yfY57n4/nw/VxPLvi8+fm/zDDf0G8HXNcQcCxXN7z+m9/i41/5Nh99csOHtxOvU8bHyPtDz48OHT+66fnqqufVpuN8aFg1avEeUmacZtYh8PV1zw9tBn54M/C11cBX+o73enmE97EhOM9SMB3jlsVHUmzIY2K5umF+/Za7j77D9PoL/DwSvGM1DCI3Vlw4KQjleSLtD+R5VkYQhZMcMwsrzYrjOMSZC2CtYT1f1QIy4NkJVK3Rx9XWfLFoBHi77+FWH/+oNDPfbmVSyihUxtXnOqY4Kknsiq2rdx1SNSsgIzJavwxI+KDAoOxGr6MGOeeUCR6f2zI24Tx63jq0KixLE//OAHcsOOu16NhpWBTJW8wzYVZnqCzCqfw7rXDD78wh1lwAjs+F6X3rszFLZA/eBjx9DQLLdHQ1YVykq2wql6QkrGlJeCOMBueFr9nrD4hvhc3+kRZ80mflnY6d80UKmL7I2tpBGQ/M1zfcfXrNckjEpsE3cuLwJkXrTtf82O/9vfzU//x/jX/+FbNseljX19f8B//Bf8Af+sN/mOvr63d+9v1cTyz47Pn8v/5Z+vGKfj2oK3E/cvuNj/jW3/gm3/72Gz66PnC/ZE7blp882fB3n2358ZM1P3x+ysuzDUMfSNPE7f7AFzf3jCnzrO/54dM1P3Ky5oOzNS9PN1xsek66yEkXWHnHKnjW0bEyqd8VhdPgeR48z0PgWdtxElvKYeL6s8/44lvfZrx8Sx8dPnqaYWWjHwHnHI1zUjycZ+nvdo1NhyvLcQjjcJjubzBXiarnUzQDlg3I1iZVBqAswMZIXN3ZVqJ5BRVHHfa01MOWSJSqpZwFALCsB7vkFqesx/6nzagAdiRn0hgJ0akziDvO2Xlfu2ZFpUMRLqNXo7+jzSWspU6ay4lVAUrqs9LaOXbHcqFYrLAcSjHVSk1fMuUwwTRRphlXkgUPYUi4qm3tldlYMCCp61czteKoXQFlrtkuBGnRhWWajnpOZZxkZTMupMOsf8eRMklbuSQpWuZ5okyLBSjpPpe04JZFAWzR5+ztWDmXAYmaySjRMqJlptzvmN7cMd4fTLzNk2Nhcgn6wMlP/CS/5Z/+XzD85N8PTf/O5//69Wv+vX/v3+Pf/nf+HV6/fn28/zdjPbHgc+Cz//pnaQ+XNI1nf33Lm7/1EZ/9yrf5/ONLPrvaMS2FV5s1P3l+wt/1bMOPXJzw4mzD2emGbuiYl4nDbs/1fuSztzdQHK/WA++vBp5vezana9ZnG3zfEvuWvm9p2sDQN5yfrPng4oyvXWz56qrjR1c9P7pZ8UOrjq/0LecxchoDXSmkuzu4vSHf3rJaDWzPn9GuNjYJLk+vZX9gGQ80TaNp7SCQFmu5uxosjrox7rhZFYBsFszKDOUxj/AabOMpt7D/KxiAMo3CQ/xxlmkJU7LH1lGOh0/hmKlYWMLZ7x6fSAZURlq0kgyqxR4OA7SNlmDhRgGqZkR6QQpC9r0SInF2XEFlZjYWNlU6Vu+rvj9vgLULyo7cMsM045ICj1QMxb2qg5niWllKZuMszgl70jHT4KZzD5lomhVM8jiTDxN5mlV2zbrlKcG4sOxH5t1Bwc/KsTxNOhf2kuB1y4Kz8izPE8wjeZnkrJJt1i/NlNpJteBeisflgp8WuN5zuLxTvA+wlMyUF/ym54Pf+Xv46j/6T8H2uREotXa7Hf/7f/Ff5D/8Y3+Mm5sbO+6/eetpBZ984PXP/0W6/Ru66Nm9vuKjX/xb3H5yzeFQuJ8zz1Yrfuz8hB87XfNi07LqPaEX4YvgmOeJ+TAaCc5xOgyctfIJX2/X9BenhLMtbrMmrAeZ3K1Wsp49WXF+suHV2Zb3Vz3vrzterVpeDQ3nree08Wy7yGnfcLIe2HpPur7l5s0bbu92NE1H0w2EpiXgSbNY1eKfCNcIoYGiMOKxLk/TgKulmK7IvhTDAESQ8+iKWIsnh5jCGr2w1rXhNMEHcYysdBDfpO7bh8yIYgHpUfBReFDeg23K+rv65nHwMQZ0dWwtSbbBTqUDCqXa3EUYjiAn29g4YRx1DzhPLtlIk8r86viK/nXHhOSYLQUFcO8KLqvc8csiU1SzIgqmM6RgqFa3d/44S+fIRnt4IGQ6vFQGFlhG62JOmWU/s+z38nKbNbeXq033uMBhJo8jpf5slMTutNubppPuZ5lgWsiLOnKBhF8yeZlVsk96bJ4XSI7gW4LvICfCnOF2x+1nbymHiRAcc8osLhNONrz3u34vZ3//74YwPARq4F/71/41/uAf+kOM43i87zdzPa3gs4y8+X//JbrdW4bGMV7ecfPtLzSx6yLrGHhv1fHB2YrNRh2JsBmIq4Fm6LT3XGHoOzb9isFHzrqOk75ntV7TnZ0Sz7e41Qp6Kef5tif0Kxt4HCR9aUJScdXTDB3t0NANkWHVslq3rFcdp6drTtYDm75hud1x851PGC+vcbnQDysDE5WuL+PMuB/J00KaF3KdTLe6yQeVX6WoBJAXeKYsSsvzLJYuJWnzImlSxVcFBGm71A4RULIaY8ewZDmI7d5SM48KTNfhVIQvKQuxnW7tbS21lqURFLVRi3AQhagCSF9JmIoJ3xtGU4qVVEU42TELqQGylCNjW8GnHAl1pdhfOJZsqMuGlU6jxg/cvBguZFlONFwpRKKPOCtfxXrOxhoQ29i7QMmBkjwuRcoM6bDgEvgpk/cj3I/k3Z7p+pbd67eMb69Zru/U2reg4ZaESwKj86xSkGXBGVO5TDNpuiePe3F4pkml2SzZ3TzNlHEmzyr7vM0b5oRsu6fE7vNL5us7vIN5Xiitp33xjK/8g/8Iqx//+94Zo3j79i3/0r/0L3H1m4jxfHk9reCTD7z+hb9IuPoUNx3Yv75i/uKWNsH5uudiO3C+HdieyYTObdc0p2fEzRbXdSQnWctus6VbbYh9z3pzQr89pb+4oLk4J55sNZ3c2ASz6RQTxMeRNIQn4cV2NTp9WPeETU9cr2hONrQnG7rtmrbvYUmEaYHDgfH2VgS3UlRuxZY0Lsz3I37SlblkEfzqieGcNq+rJYZN5tfGlDagUniStrR31p62wINkfyz4PFztdGj1t6T5/CiDqT+2Ta+Sr2YzChyW8jwGWsRLIYKNo9Rn0XsSgVFBTI8XlsUxM3so4R6C46Pky6KM4T2Pfqj/1vdsNwuqbkpwmGCccYt1iZxKQpVmHleUKWbDbyRPosxRIvLoWGbNtqlxoA6WmxfKbsd8I3vt5eaG3edfcHh9yXJ1y3Jzh58WQpGYnLJLBc/atRTrwALSZBK740g62NeLTAeCxdQa8h1Bn7l3ynJLJpRCvr5j9/kbchIozbqn++pX+OAf+kdpv/rj7zCZf/7nf54/8kf/KNNkzqpPYD2t4JMOvP75v4R//THsbil3O/z9xBAiZ6cbTi9OWF+c0p6fwnZDODuju3hOPDnBdz3Ze8Iw0J6eSt6gX+GHDc3qlHB6Stxu8MNAbhpyMMmF4ikEEkXM5VJYUlHnKUZJGgyDgt1qgNUKt1rjVyv8aiB0A7GJ9H3L0ETaGCglM44jKYk5vBwm3DTjZ2UxJWUbs9DmCl6JPmTybN2ueoXL4FIRxyiDR7o+BaAEctb2y1Yi6Sc6WantaTsF6+bVJnsIPtR4ZBueXAiGENfHFs3f2+81snO2EkWr2C3Z6AYWJCwDKfV73QpKY44hqN6HBRsbdMvl0Yyb45jDqSxUZukXKKPKH2djMlhiqYepvEpJjhOkRcL+yTS1UyIjlT9HgOQoS1H7e56Uqex2zFeXTFdXpJsb5psb5qsb3DgRciY4Rwwq8Vw07Ws76hqt0bEIFAWgtMAiOoBLEyUp28kpQ14kCBdEYSgp66JkgniejC+J+fKa648+JeeC6wJ523P+W/8BXv6ef4xw+i6T+c/8mT/Df/lf/Vek9HRMA59W8FlG3v78X8Z/9m38tCMuiZALXdcQT1Z0z84Iz58RTk5NH2VLWK8pTUPyXiLfGzGjS9dD20PsoR8Iw9rkL3tKbCmhwZsUg0hsJkkpDUBxO2IjZ4TVSszbOuRYlehM+pO2JQwSjGo2G3NEzYy399y9fQvTQmM8FFfAlUIaJ/I4shwOdvV9qH904hfZspg/vMtJrVYDZGsW4W38Q3tb21It+orrCJCuYajmCjVW1MccY0d9nvr1caktrsfbMCbB0i303E4i88VZ1mOjIAoc1hFDV2/9W8Fy+wsumCqAqT7ap1Gfvx4jV7y8ylPRiMuSYUr4ueAXY4YfgW1ldZW2IDlbzXspumlDO69jklMhTYU8zhrPGPfk/Y7x7Wt2n31Bur6F/QE3LUQK/WpgOF0znGxp1mvC0BOGlXSRqmh9MPfTEAimwVyWTE7KEtVaV8B16IJVzwnvpKSgWyKEIg+uZWJ6e8Xlh5+wzAulDSznF3z9n/yfcvr3/HZoNsfAs9/v+SN/9I/yC7/wC8dj/RTWEwo+QBp5/Vd/hvzJN3H7e/I0E30grleE01PC+QWst+S2x/UDrus0eGhEN5ooMfLeBK9ig48dznyh6HsFjsr7CJEQTK/Ym5SmTRiHrsM3Lc1qRei6B31kL6lPcUZEViMEm3LWvJAPCghpPzPd3uPmRSaAXq12D6RxZDmIiyLswRmXI6irsaiOqgaBqno08Fnw+GLazNYpq49Re70Glpoh2Wl4zIwEdnsM80FibHbWW5DSLypzqRWi7tdIgEou55SR6F9tZGxmrL4UPcSCjN2pQCQOj/Ka2s16AMOxDpjKy7oUvEqyEjQVygJuKfikPEy/o8d67I6kgJyrkkEpUpQsEmbDC2ty2ZH3owwi7+9Zbq5Zrm44vL6i3N/TUGhjJLYtftUzPD+ne/mM9uKccHpG2JzgN8qwXdfi+544yP4nmLOGZsWUIYXoCW0jIwQzjBTdQt2+nIQRlpzwHkJUGekouP3E1UefcX97z9xGVj/5k3z19/1P6N7/kXe4Pa9fv+b/8m/8G7/prfUvr6cTfIoyn9d/9X7pgFYAAPs0SURBVGcoH38Td3dPmhLdek337Bnh7Aw2W2h7Smuqho1o7j5GYtMQW0kvED0ZCZnHamsydPiukytCiBp78BoNcNVzqmkIbdRzdw2h7yhRGiwlyFJGIlTmgVWn0f2Dzo2mmT2UQHQNfexpY0eIDU3bSxxssY5HLrRVcdCJgu+JeKI6SvijBg+o05NMUqRkbfgQmqOekHOQSm13a8NrQ1uWocQKh1r92tw1ANQMpAinMK2fd2/CmigmA1Eq+bB+oiLhaBgVMLIcxTI+G9lQdLB/j9mY4l4pphtUlCEqKXtUopUCSSJu5Gx/UkEj4MjZ3ltF0a1rWGwEAiPyKfhYxkfNqBxuySy398xX14xv3nL76RfsvnhL2Y20MbI+3dCdn9I9v2B4+YL+1Uviiwv82ZmE5Ldbwnqroej1+ogPNtsNcb2lWa8UjIzq4duO2HfigNnIhtQVZLG0mPWSmgzm0BIEpLc4Lj/9gsvXlyyrLT/1j/3jPP89/wT0W8uMtX76p3+aP/gH/+A7Xc2nsJ5W8Ekjb3/uzxM/+xC/P1AyrC6e0b54gTs5xQ0raDuy81KNayRH4IOcK32Qpa9Eq5xNMbdmrSPBbmeZijdPKU1Oa3iwHP2lJABVr04u2vRyCMpObJJZAcgYtqYpLQkOqev5psU3A86kODX5zLGr5RGYnHOhZImXlewJSF3du9bmf+RQcFRrXLI2kW0e74qNTZhsRM1Y9NcEUlod5bwz3kgNBtqgChDGIn5Uc6kw8tYpcwqKTiWfVBFtM1uAqozcGuweNjaW9khQ7CHo2GOP8h5Wghpn6JgpOeFdPmcJuJVCQIEnFKlW1j9nbUA7ZhZUnGylc9Iog8/2uPwQ0JgTaXcgXd+Rb+6YL29YLnf4JdOtevqLU/r3X9C89wr/4jnh2XP8xQXu9FS39RqGNaXvKV2HX61wqwE/rE2CVd5ipWugkbtpaE1Y38Y/spV+3kMpM/N0C2XGh0KITiW9XaiC9+xv77n87A3u5Xv83f/UP0Pzo38P+Pb4+S3Lwv/uX/gX+PDDD4/3PZX15ILP65/7WdwnH8JuhwuR9atXtBcX5GGgxIYc5QMlS5GHIOCihOQJBV2QjUEcW4q5Dsh2JZhwnXlMeQWgqpRY5T01SKiMhiAWMr7KI1gwMseDEBvJPAQJaPkgESjf6Mrme4mf+0bptSJEJs0z8zITCBpMTKZDfZzx8th1X6XGIj2uMicR3lKCYqWEqxlMsuwE+12VN87ZMXEWAOyQU1RyCR+pGYp4MPW3a8nknGRZVXbV0uuhNNNONt7R49LLlBKLnky4FsaptL+ZseyKLO0fpWxHcmUoBsQmOZGUZKzgVPBZ+I9Llull8YoksSsJ3WTAcplmlnES7WGaSeNIPsyU8UC6u2e6vCHd3pNud+TdREmF4fyMsx/9OsMPfZXua18hvHiBO32GOznHbbaw2eLXW7BGRFyZ/XPfmQ20jBFLlNpjjjovXOyOBgbePMYytYZGigBl0kNaK/mtuZCygvr+9p43n3zBs9/62/iR/9n/EvqzWnMC8HM/93P86//6v/7ksh6eZPD5Kz9D+OTbuMOe0LYML57hTjYkk+10MeBam3r2Ium5AKExAStLSb0NE0okygYGW5Vk9XnCUSNYOI9vhPkcg48R05QB2X3+AS/yUVPrxUnUSlPspvkSG2VeFiSLuULgNcneRGnJ6OIuzZ5spMI0LyyLdIGKh+C8QFUDn/OSKCnLrThnY8MuZseTrAVdN32u+YVlGTUuWZ1mGYj9/x0Mp9SMwRAi6UHXr6ucxKNlwGm20q+Uh2LuYT0udeoMmILSMYuyxzgLUM6sj1w2Ef5cA0/CJSCZXveSNGNVb4sFnGUxwHkRn2acBPSPk3g544Hlfsd0dct0dUvejTBn2mGgOz9n+2M/zMlP/Bjx/fcIL57jTs9xawUct9niho0ymqPfWIfvetzR+WKQ1Gy3xnUdTb8idpKLCW0ddJWkhwueECNNGwhNILbeLKhFbSgYfJV0aShL4vXnn7P6ib+Hr/wP/0kJ4VvwSSnxr/wr/wp/45d+6csfwpNYTy/4/OWfwX36LWIaKdHRnKzxm/VRUNxHVCZ5ZTqqAIplJyLfHfEY0/jFLFWKd2SPGcRVDyQjojm1pyV1YEHHPZoLqnKX0Zw8bfixMm3r3xQqKFFwaobUNEfjuRIcvm2Jw0AcOmLTgDOmMkVzUa5IsTA4ogWsUjJlmVnmibzMZkgo7MKnWbhAWY5mgkocLHNx2BgFFDLJ5oWsD3UMCA4NM9alLpqNO1gOhAUhZ1PZx2exK2upWU8tm+y/Uk3UNzXIVKKh/hYP5aKr0iJGMiwyLqtBCOPDuAK+BHwJ8kVLVo6mLKJfTrhlZpkmdQvTgptnlvsdy+6efNgfra3LOJHvR8Jc8C7Sblas33tJ/8NfofvhrxPff5+02ZL7NbnpKU1H7lphkE0r1wmvC04tveUAIozxaPET5PpBbClNNL1nlfe+age1URl6a4YJUdKxuEhOkLIyVR8Cbdtyu9vx3j/wuzn/Lb/dgGZ9qh999BH/t3/z3+Ty8vL4mT6l9fSCz1/587jPv0UsCzSeuBkI65UM5aJKJh8l4uWCBQpXrXktKIRGk8vWjnZHEFg40FEKAgUhh13ltSeOxYY7AswPAQ1fr0Sm8eKEHR3LP48CVXgQr5Jyns11Bblt0unqGFcreZXHh99XyZJIReJfwen4lGVmHkepJVr5oSC0QJ7weYKUjCW7kJLpMzuBr4Us87k6hFozkGPwsVBSsFTEtG6KU35kFkQqv9Rq93VUoth12fAaBRuZNtbnB4HI2hvaIGq727R+UekloFmyIyULo3FJHuQsMy4tFTYSGzpjhgKzNHSWWd2wZSJPI2m/g/kA04F0v2e6vOVwec1ye89yr65jGhdyTsTVitXLFwzvv8fww19n+NEfJbx8SRoGUmzlRBEbsvNkJyNB37TE2OpCRBWOU3AGnXPOrHmOMqmGERbDHl2UQqJvo9kECSYgeoLZTWOi/plC8UWZdBO5zYH3f+fvZfXBjx9VBjCJ1D/+x/84h8NBx/qJrScXfN783M8S33xEZCH7TLNe05xsjWdjEprGmZAouaQ0fbBgYfq5VFtf09Ytrtq0KAPCyzv7uBEqVwabAbLMB4c5IhiOab+r39fjDOmwQHisX5RReeMPWRZEBbPbgO87wmpNe7Kl3W4ITWCeR5Z5OspylMkGGfd70ihOkHdS6yMtVnLN5GUkWdCpGYI8zCqIrNeurMSwHTvuytzEgDbwphY/hgW5I3GvdpFqKaaMyCILCjzH4PNOYNPjFEcrOFz/ioDqOg/m6s+TDAM4BtmsEYVcrPxy5KWQF2C2cYYkYbc8z6T9DjcfiCkx39wwXV6zf/2W+eaecq/hUOc9zWpg/fwZ2w++wtnXvsbw4gXt2TlltcENK0JswbppLuk1xAJd29LG1lxMlJmSVOIJuyt2vLzJoyorLiYBotgvrE4ZT/NgTmi2ya5t9a/hQjov9RllYPYNL/4Hv5Pnv/Ufhu7k2OUqpfBn/syf4U//6T8tYuUTXE8n+JAhHfjir/4M/osPiXkm4zS3dXKqWtqG/474S6gb3T5fy3CKq7YoprZXHQVcMADZdF1wyoycrlalcBSvqlsH7TX9C8fsp+jzPy5hJIqhxYZEHzZwLc2sK2bdNWVAMsXzbWTJC4fdDhYp8PllYdkdGK/v2V9ds+z2xOBpG9N2KUngtDF28zILbD3yg9QR0yYolGLYhwHBjuoFpva096bRUcytAoHLei4ZMJaCyi67YSe6nkRBpIrTy7FRT5kfqycKfrbSSmWmuE4KSKAyq2SVUD7LbpolifGd0QeyONlIL4WQiwUfSY66eSLvdyx3d5T7HbvP3zBf3uB2MzFBjIHVZsX25TNOPnifk699jdX77+PWJ+zuR24v77j67DWXH3/K2w8/5vLDT7j88Dtcfus7XP76h9x89Cn5fk+6r5/NHYwH8nggjyPpMAprWnQeSbNZGSROn4+hBTrTnLMOq5k1hkiuVspBcq8Pciw6jtOykPoNJz/1u+he/Si4hy7XNE38u//uv8sv/8qvHO97asu9fPWqXra+7+s/+uN/nN/ze36PvikJxit+5d/+V4m/+Bdo5j3ZObrzC/r338etVkfLXDoDir0wiWN0CC3FdSq3XKMBQbvq4BtlLsaTyPUaYVdWsV+tu3IcqIRSFqP3K6D4ivHoh5ZlGDu1QM6ZJVVdFivgsk1gm3yFgpp1oLyjpISfR6ar18yvPydfX8LunnR3y3SzI+8WpmnBxcBwcUL37AzXSf/ZRQMhS8YHh2+EIfiu1zHqG2gjYdVCF0mNvnet+VF5WcmERt5bhGjHL+KKxijqlHky+QkAh3zOlBlpOZ/JZZRWc5lIZdExL8J3QGWU1Bl13H1GoT4rkFI0SuBLpkwLfi64SR0+loybk2FA4sKkOVdHHuuEKeNZbm+5f33J4e0VbtbMl2amnIaGtytWz8/pXzynOTtjTpnd3YHrL95w+fHnTNc78nwQ58Z5suOolACQvWNzdka7WVPaQH9xyvOvv0dzOhjwvCL2A7lb4fs1rh8kCdw24B2+eGunS+c6+6RyVs+u+0uCMpGnHW4c8YcD890tab8jHw7sdjvc2fu89z/652je+8l3gs9nn33O7/qHfhe73e5431NbTyjz0WzX9S/8ReLbj2iRRKrrOsKwImVBmLkkfHTCfkINBCZyhTZO8QJFc87ofFaGQ4FsmQ0lk0WqeLhyFystnAUhwyDsYmX/qaWIvhczWEB1vU/lly75Ol8VvLTRFfyKd7jWyI7ORiJKxjwQ1NUaZ8p+phwSMTuC97RtI/2WPJPqyIUFzeAiwTdyQyiNZtVSYpkPlCwwWlIdxurNVTuoZkPmoOpqxhPxRf9CkFD6I5iaeshKzfyEURW3iLdDkW6zBW6BxpVGYIp/pUrFWqZT9JpU3sh62qeASw63eLBZ0DQn8rSIrDlNlP3Icn/HeHXN/eevufnkU9LtHXFJtM4ztC2deZ6HoaHZ9JQucLff8/rjz/jkV3+dz371m9x/9BnN/cQqFzYusiWwcZ4tka0LnODZ4tkWR7sf4eaWfHnF9Pnn3H/yGdcffsTtx58yvb1kub5lubmX6Ng0kQ4Hlt2efDjAIlA8p1kXDcOI1D80YTmUnera5/C5sIyj4X2Lytf1Gac/8Ttxw+mx5AL4w3/4D/Ff/Jf/5TsXh6e2nljw2XP183+R5u0nBFdEBuzEZBanzhTnXNEMjKneFUxoyWnUAmdIQrartFcJYZ1i66go0OgRj/AJjDCn2HEsFbQna7CrH2gFvCueUpMwYSgPGBFHjClHAdWyX6ndOD2PL440S6Qqm5yGWxJpmvHFEaOn6Vtc4yFoINVhg4dZhoVt2+F9YyWTV/AUvRdXMjFUuVK927wsEjtPSXNSdsxq0HYmZnw8hWuZUGqfq0bm2rFbJCbmCo6kK3gueAsyNfCUnDXFn21g0v6tdAPNtSXzuHe4xeESohnM0shJ+z0cRvLtHfPVFfeff87NR5+ye/2G+XZHGxvOz09ZbVYQPNllss+UxisLzInDzR3jmxvK7Y4uwdq3dA5aZ672XlhPLNDaRFtTNPTbOkdfPH0pDIDfjyzX94xvrji8vuLw+i3jm0vmqyvY7Si7Hfl+T96PhCSRsbLMNDFqBsz4Two6wtOKnac6VjpmeZll2e0D6xdfp//x3w5x9c5F4f/8r/6rT5JY+Hg9seAjwDm8+ZimAE3Edx3evM+dGc95lmOrOJdCLspqioPss4lCVaII0rnxujo7u3Bnp+xHwl3WnnYFWGxMwMovZzM/BbzJe+KCuUTYlLYFl9qydybdWbxJhEYRyYrV7q4xzyjDnuSEYIE0aXN5w3IEaGdySRTviKsWXwmLIRieIrDYh6DWrVPfynl5aeGLrq7BOipdS2hbQtuTj6CxkBhlfeLqLLP93cod8lDcYsG4Bn4dB8WsTCkzpUy4MsuyJtn7SOIj1Slyh4JQTgLI81KdUyUg5g00dtVRdi74WZ28tL9nvrsj3d/jDvekqyumt29Yrq7hMLLqerZnp6zPTomrXhbCZdFnFqPm+6w72bYtq9WK9XbLar1iWA00K2k4NV0kth48ZHMLURZn2tBHcia0XaTvGn12i8ePM3434W7umV+/Zf7iLdPlW9LNDW7c48cJ9gfSYU/TWLOjaDxEmXwxWoQ1GHwQgz8X8jwx7/ccsuf5T/x9+PffLbkA/o//8r/Mfr9/576ntp5Y8Dnw+q/+LP6L79C4RAmqz4ke5wshAC6Ti9J6bDQBzPjNczSqE26jE8NRu1dWHmmvWdmhmzKDBUoNPtUt1DgVtVVfn8/Zdq3yFsYdUgCqWU91YngIPuq4BbKVXrIXVoB0OAmH5aUSli2AiDzp2wa/UhuWRp0PBRmBkd6CW0Gtf98EfPT4xmlwsYv4oSdut/jVhrDd0qw3tBv7d7UW+a3rZEPsbQLbyVrGGznbOZWKdiT0/mvgySOkyW6zum9HIFiaxlg25FKWZXUWIZBlFgaUF0gzfknS6ZkzZVwo4wTTTD4cWO5uybsbyt096e6efLuDOTEMA9uXz9m8eE7YDqQg62UXG+JqIK63dtvQbk5oVmupWW7WNJsVcb0iblfEzYq47QirjhIeZbHuoRta7aBLdIShodusyBg4niHiaQvEJVEOe9LdPW4aCUsipIXD5SXT7TXBFdEpnJFmnTe6RQWrdZydQCLSNLKMI3PKtKcv6d7/MbXx7XzPOfN///2/n7u7O9tbT3M9veDzl3+G+OZjGpfIPuMbh4tOMg0OUllIeVbm460kcEHe6N6p41IlHbJlLVQRLV2paykiS121Zh0LviQoC64s4hgaHqLSIghwdsHEve1V2wki3Mja8Dpj9Lte0/DZO5J15GRc58m+KGgWpW0Cn00FD/DBMKIYabZSYvRDT2nVvdMQq/giCjwKCppbE0OW4CFCGBr8qiesV4TtCazWlH4grjeEfoUf1oR+je9W+KYOwrbEtiW2xv62bqNvrO1rQmKOrG5WrkFnj5sPUuibpwci3zRKG2eeTe1vwRtrG/veTTMsE25e8PMC40Lej+Rxkfrf4UDa3Qt4PexZdnuWw0gTG9qhpz09JZ6f4baasaLtCP1AHDTYGdZb4uk5YaMA7PqBMgziWvUdZehxqx63kvyKX3XE1ZrYt8S20UDo0NGsOpp1j1/3NNuBcLaiPVmTKBzuR/K84HBEp9HgiKOh0DhHzIWYM/P1Fen+js6h45LlC+fbaBcjdK65GoACFFlz52Vmzokl9mw/+AlcuzpiPsuy8Ef/yB/hzdu3x/P0Ka4n1+365f/r/4n21/4q6zBD5zVZ3jYk0zou3pEoMuxrB1zT4xpp9NDKEE6EvUjJAkudizjXUnyj7MPmCV0pBt4J79CHbQS8R8u5qPZ9LU9qoLOyr5QKGD50tLwX4C2Oj5QRi3fE2OCCAlnCfJpyxqVCyJlyd0O5u8WPB9wkJ9SSF7z3NN4zHfZMux1Mk5i7oOBlmjTOe8mIVLvfJkAH/qTFb1b47ZZwckbuenLslZF56QLV2SFlekbew6bMLaMqBbxv8ARp0swLyzSSpgPkA27ekQ43lPGePB8ss5GMhUYcjH6A/Q3Dk4o5N6QsCQmfjd+zFFgcZSq6zWpjMx5Ik7Km4Bu69YbQNtB2NkBsmYDSUn1uyEbHda1kLVCXM1ccKhl6bo6xpSRCybgpUfYCistcu5/KLhMyG/StJzaBw9UNu1//lOnyDjcndddyITtYcibjSMERhpZCIUUH6x62a7Y/+iNsfsuP4997RbM9hdiSvQiL3gfxiaYD0+0l6faSQ4LnP/Hb6X/yd0F80O/Z7Xb8Q7/7d/Ppp5++cx4/tfXkMp83P/czxMuPCGGR53djU+fe40ODj43KK9BEexUDM/1dnCxdXApqcRf/iA5kzBubgVJmZDNDR+Kb6nt9qayJoqu7CiQBt/VWijgyznn7G9pUGh0ownuOHQzhQd7Ii6Armrc5c++KgOYCIcjVEu/F/+g6cmxIzuNCa8dBAcEHGeAlCxTF+ESleqi3gbAa8Js1br3G9StKbMk+ajPwAMq7oNdoRmPHTC1EcycNNlbinPzYnanslQR5wuUDbtpRxh1+HCnzKP3iacbNSeLusw2IpmwZj6kFzrMYzLMcHqQ4KC0bh4ilsWlxzhNCRxw2tCcXDBfPiKcX+K3NW3UroxLUi1MnGkbT4vqVNLwtSBFbYx9HG/TUCERpOlw7aBjUR7KXlXPpOtx6A6sNrNaw3hA2W9x6i+uFoQWnzzNY2VozF7zaAKEosEanzEjuFju8TzRrO7+jJzSaFSxOWaYLjT1dZp4n3OqMkx/5LbjNi3dcKr7zne/wb/5b/9aTUi38XuuJBZ89l3/9Z4nXnxBDsrkWr5muplU50LQiW3kE3tr8kfCYBu9asBYxSLeXYp5Ox7aywGZXshTxchGPxC58+rlTi97u0Aar5DyLHUWdCJuAso6ZnWi1vVwQyVFnlH7uDag9BraaBSTKrNEBZ+9NXTIbzUAZU/Fm/evV3Qu2IVMWa817XSmJkRI9uY2EkzV+u8Fv19D25NAIt7HuYLATW8CmTvZgG95ZICze2r/GlHYezaKhZkDOE6GMMO7gsKeMBwWdKuCVlOH5gs1hmW/VknBpseAjXEigtAVFF4hdR2g7YjPgm07BpdsQhi1+JYG51PQKPN2gnzcaaSihIXet2MNDr4ywEvrs/eGjsqXYyuuq6chNi28HzUsFD7FVidoPuGFtU+wbGNaS1u1XFOcJbUtsWkLT4LwjtA3terAhUslnFO8ZTjYM2w2Q8b4QG3CtI7Hg2kDsFQAxOkbwugB470hpoQxnrL/yE7h2i7RktP7kn/yT/Of/+X9+BMOf6npawSfvuPzrfwl//R2aRgCr9Hc0lFk1dfDq3ByVB0PAuQZKpCyVl2Ib+3EanYpayGDZiKNkj/hv9fFY58ugVCMPVoEnsghz+l5lhBDZ+jY0zlBlQKtoF7ZxtaOEB+WcTNBcV/c6l0VKeg6nlFuvTbesuKh/i7hPoWlpWpEuHerECSsSWO9XPfFCQld0Kxt01FCoOnM6XiFUrMHji5dyowmGFacsyy7fuv7aVDoUSl4oaSSnkTLv4bBnORzUzbLA4hZlmiVbIC8aBHWI8YuRB9XyMaG0piF2vXRvambijAjpW3wrWVvX9dC0lEbgMlXRwORuMblbmkgKgeT9wzgOBtybwmVuGnJsRBYM6owRpFDgGyvtugF6w4qGDlYDoV+RzTHCRZFACa0A7fMz/GZF3GxoTjY0Z2cML57TnG4pjSesO+KqUdOqdbSbFXF7Qmk7zZDFVqMZzo5/KdCfsnr1Izg/WANA58Qf+AN/gF/8b/4bOyGf7tIrfirLgW89oW8IXSSYOqEkTSXuVZxmuHwUoS6EhugjIUgsigxpXkhjIk8myL7oJlsaUfYVZNRZ8NXHyT5AB9YSVtqf6xV5SZRlJi02U1WZ0UsmzYk0JXLV5EmW+VgGVMw1QRozyaQyK5kuw7xoLKCoxVqNb4QpWcAjmw6wSq7kvE7KRoOqzWpF0/dq85v1TnGOsBoI6zXOhNiy8aDw4ExYzQfr4DmLbpbfFRdIkj23CXeVtjhlYxpnqbpHgeJgsQ6kQzrUzhQE9d7VCdK8qbI055w1A7xKvK4ndoNoFm2Pb1t8o6xBVtaBHDWaUnpp5dC2uFaYXgqe5ByLDyw+kEKUImVoSK4h19fuVdIUFzSBHhtS05GbjtS0lNhrgr0boF9ThjVlWFGGNWm1IvVr5mHF0q/I3UDqOthsyZstabPFnV3gnz3HXTynnJ3jnj8jvnxB+9579B9IFyg8u6B79ZLVq1dsXryg6XrKuCPv7ymHW5b9rby9SrKRImOnNx1T1uejE1Zrv9/z0ccfP9zxhNfTCj5wRPtdZ2JdsXmUEpu8xPHkeZDFqPdlxMVJSam+zwpKZZHVLkbUqllJpQMBCgg5C7zNWRmI/SvNYAUvnx9uWHBwxQtMXRJpsdGJOn5pf8DZiIEqHWdA80KYRphGmc0tUukrKZHsVopJTXhHiLpie5NtDV1L7HorS1sdn1yY7vdM40gYBrpn59APJDt5iwvKnOyduyqSZlPs3rAekDyE5Egi2am7puzRylrvyfXx3j9wrlLBZ5uZMxcPstwjqsCXklI5hRTvCG0k9B2x72mGntAPwmtMVVJDmRKIa4aeZrPC9y10dm4YzqVzQplb1d0+vn7LDlAzlOwgBW94jqQyStPgmk6zd22jsZ5+oAwr8npL2WwIJ6f4sxM5p2zW0A/k2OOGNfHsnHB+BqdnuPNz3MW5/j27wJ3rxvkZnJ6StlvyZkNar1n6FXQdKSXGq0vmq0vK7gbmUV3YXJSZ+ohrWk4uXuBN56eut2/f8vaJd7nqelrBx2FiYVX2VFcslQ9yAvBNow6OAaklBnLT4vqBsFkTNwPNMBD7AUJkKcVY/CJokQtpSeRZLOKcZnKeKdn4NaX6YwkUJVWeirXk7euySE2QJcFivtvZQFQT9yrLwrJMlGzWt9Tnn2GeyOOBst9RxgPucMCPI4wjZRrJ86hOV0ryay8Fj0SzpBLrJWJucgsuREopLNPItD8wpYWw2dK/eE48f44btoR2A6EXYB1UUlTdIYtuOBePpeHjdn4+GgUa/mSlLz5aB685Ylo5CTiXXKnkPkMIhKYlRjUNihcArwxKQLZvOpv69ySv0ih5p6DhVW7hg6RuuzqjFsVeDqIzSEvJxlcE5UhqJYiC4KOY8DhpLqkr2CnAtFK8pI3Qenyj4d/SNuSuIfc9ZTVQVmvyYNhPZzNyppi5hEhqW9x6gz/Z4k9OCNsT/PqEsDnDnZxRtiew3sBma4LzW9xqTTzd0p6e0bUd49tLps8+o1xfwU7zXMt0wGVJf+QQaYaNstBHaxxHpifiSPrftZ5W8AFthEaboljtrqu1p4QoEXdziqDvZJOzWslPa72C9ZoydJS+ITcSwsqmfZwt/Xe5GNA5UZK5RKYFZ17ZR9GqKmBV9K8vNgaQTMYzzTCPlGVPWfawjLpvkWKeWya8cVhYFFTKciBPE/kw4sYJP034Ub5eTLL6dSnp9xZ11ioHWV06gd7eqbvnnLI9lWaJtMyUEBievWD1wVdwZy/I7RbiBh83+LjGhzUurAhxjfM9pbRk11LqAK5XJwxvbG3bxcWp51eJmtkrExEA3uBdNDdTp9LWHEe9l9SsyJCuCgOIrxfEbxI4qsxQPGcbaUFgay5iUTsfCK1kSIkNJQZpb1uiRjQLav/AZsdlSshyLg3gGgc2olKCvs6NyIK0Dt9YkGpMnjcqM6JtWJqGFOX7JuzMjllQho4PZB/IbUMeevJqoKw35GFFtpKN7Qn+9BS/2VJWyqLi6Qnx9Jz2/Bn9yRmHmzt2H38K1zeUuxvS/oayHJjHHWk+CL+cJiPFvrueOtBc19MKPg6dxOYm6pveOCsWgIK3q1InG5y+g1ULq47Ut6S2IfcNZWgofST3LblpySGSnCdp2sjcDJS5lGmWh9Y8SoxqqRmP9GEUjGwuaV5glqe2X0wZb1Gr2M0H3HygTHvceIDxoG7PeIBxTzns8dMexhE3HjSlvEy42Zi8i1wxnWkSe46S1OKK8Kjzlq2LZrgMxjcal4WlCXQvX3D2Ez/B+od/lObiBa5Z4cIAfsCHFfge7wec73FuwPsB7wYIg3AO11N8R8FIjKiUk1CVVVD2twuIlRsaOTB4D0mlZ86VoClZ29ha+WTRx9lYifA2A1EBvEpK5yTEH0JrgauKswmvSTGQvPzas1fpJvxIFAAoZBZNjPtM8ZniCznq8dlDtgCUfSaHTPao64BRLhTpJRrWWls+6mKoIRHrTHpJ57rYkI1PRtfjVityb+fragWbNX5zApsT0mpDWa0o6w1lvSX1Pf7klNX5M5bDwuHj17iba8rdDf6wwy33pGVHng4EYMmGHT5aKaXjsPNTX08r+GAAaLTuRRQ3gyiOS44tObaSJegachPF3WhaaCO5DdAGXB9xQ09Yb4hnZzQXz2gvntOenovVOqwU0JwzDolA0LIkyjRZKVV5JjN5GnWVWaQVk6eJMiXKtFAW8+BeZpgOOAs6+bCj7O9Zdjek+xvy/R1lt6Pc3+L2O9xhxB0UfJR12XYuDpLDJWFIFNMntoBTQWxchuOGypTG4bdrVl/7Gid/10/Qfv1rcHZK6Qe11YngWgodjp5CRy4dhQ58T3E9xQ1kBrLrlAl5AcvFiWipVMRZVmHuFQZ+Zy9HEedb4UG+/qxeOALZPlff9ceM1rcNRCc9euu2ee8JQQ2HWs65uqHNpy3VBqOvWVKdxdOMXvbyi1cgqeJmYs0Xl+Ql75PuK/KV17HNLDmJ7JgXkkCw45iMD17bxjuTvNVHVAOQ7Jc6XHw4f3PXkYcHt9uyVrbuVivcWqLzbrWirDb49Qn0a4JryHcj85u3lFuVXn464JaDNJNipFuf4EL3zv7Z7XYcnvhMV11PLPgYqS02R81bormD1kDU9uRGujSllQ5uaZR++6iRgtB1+GFF2JzhT88J589onr9H+/J92uevaM+f47Zn8jfq1rhmwIdWbJUshW63WKYzGQ9lSRTjo7CIDMdiIwH1+zTj0oxLI24WiIyVV2GccPs9ZXeAnd23KNOR6LmE0LM5WS4pi5JkGPjji1kx2YrsEylk5lDIq57hqx+w/fEfo/3gA8rJVsco1MzAxjwsm1Hr/FHHxzcU15Cd/Ys6RpLYcJJDtURLvy/W97HbBabU2EI7HP3VStdR2g6GnmI8m9KZq0MrLWPXtPjYEhoJ+bs6KoIkQxX0gjHNq9Y24l7VifgvLZEgjR5lwaeWdcqMFMSdPU/Joj6ktKiDmc3F1DI9B8KJrJw7ljZOGVIqpt3onC6e1p3LUZ20FBuW2JCNP5Rjo5Z/bKDr8YOOWc3mQmxkr317R766Zr56SznscMuMLxC7gdhvDGd7KLPevHnDze3t8funvJ5Y8LEP2MDDHKKuqKGV9YwFG+yDlSWtuCC+nsRNh2/MHXIYCKs1bnMi36+TM8LZBe2zl3TP36N78T798/fon7+iOX9Gsz3DdwNLccwps0yZNGfKLP6JM0cEdakSbskm8bDIfuUgIXJGYT1uWQhLwk8Lfp5w80QwtwQOe9L+QD6M5EmzTiRFmWInv+QvnToaTqRBomQ5ytAQtiva8y3t8xPis3PCswvyyYpDG5m8JvyTZhG1aaiyH6IFOi/FwoT+LVXR0ZjSR88wF+QG4r2AlaLHYUEgOyyLaYmrNc3mhLg9k53MsJa7w7AhrNfix7S9eDQGeKtciUdgWNxOZSqFog6ZdRWz8bZcFmG0ZNkeVzGy+rrqqmx1y5P0c+NtPWAjlc5gHCMbj6mSLF8etznudcO+JOdrt6puYJiQ4AO555YQ9XnYccNKxhQc+ThsrKDuXSAAbhxxhwNptyePoy50RfwvfR7vri+++OLJD5TW9d2v/jd5Fe/kVGHkrhwCOVb5UQlmVzcIQoePrTmQiiKfg9NsV2wIlgL7VrNfqeko3YrUrSirE8LpM+Lz94gvXtK+fEX34hXds+fE7RlhtcX3A761+SdQlyFV65qk7ljNhJJA69qWz4uA5zyOlCoita8l2Z55tyft5RmV9hPpMJJmuVOWJGucmvWk4inBMsBVTzzb0r64oHn1nObVK/r336N99YyyGZiDN+wik5xd8T2WPdhBduCsI6Qf6t+HkQn7LI6pg2U3Uu83qRB1vDSBbQJuUeMLfrXFn57jTk5tluwEhkGls3XPfGitm9bYLZKRb1UNBOJRydlVXb+q7ifMrmJyIpGqhCplIdcgZIHocehwCFtyKAApvVS55YoCmUZwhBkpaxIZlEqpKHrGlCEXp9LMgrpzVo76QIgtsRVHLbSNgPLYHLGuGieL9yTn7WKrUaFjKZoL5ER0xtJPmvgXTvAom7OVkuRPfhDWkws+eCdf9ODFvwjh4WsbtShVpsK6Lc5JFL4EeWxlb0LxBkwW79UVCQ3Zt6TQkZue1PXkVmSxstrgz85pLp7TvHxF8+w54excrdBhg+81L0RjQQ6ddHWkAofcG7K6VCyJNE4s+z3zbkc5jJTRLFoOo7R+j6WcddZMgxkQ+7aJ0nderQibDeHkjHh+jr84J5+cwPaEtFqxdD1LDKQgI0TFEpuYdwostUQChytqDYWazXhzRHBoctoIhdqDyoo0wV4JmcbxwTptLqhMbjpcv6E9fUE8eU5ZnZGGE5Z+pcAfOjv+UcHUAo/zrfRonEiLGU/J1qXMdUzFmOpZg6ouV9qDSKMkaQOVVAOWBkCPobWI2CMXDNEVlD2pt+ZQpHeYVc+jm56zZlY2x/Y4CBaVzCQoi7l8KCWysQxldDpHbDmTVMF84UIktK2AdGf0gBhIRZZDbdeCK+S8kLMGjvMy1oTuuM7OzhiG4d07n+h6gsFHqWrxzYMAVxQfI3ldLTIWoCztrR+yrsY2GHlkzqpN7JwFoSYQ2odSTS6oHbQrXL/Bb88Ip+f482c0z1/RvHhptxd0L17QXpwTtlvceiUphn4wK9yB3PfQdcKignAqOhnJ+bbT5jSt5ND25qgq8twRL2k0dR1Xa9rthrg9wW03lM2asl2T1uKY0A7MoSWHluwizrcC643tTc0g6jhtUWDJyMe+FNuWxvSuX7+7xMNRsNFVXfNlxs/BNpkBsMU3+H5Le/Kc5vQl8eQlbnVObtaUdosftsR+i2/X6qqFztr6HS706rbRAgpKGhJuBGCbWD3H8kg3byWYWwynM3cLnyuWU0diHhFDa3lb6qS9/QynzLXyvWp24URxKFnPXYpKwYfXk02j6OH7YiJsVmQ9ZFHl4QaWhTpZ67jQ4VyDDz3d5ozu/JS4Hohtp0xpsQZHmknzjpJGaU89+uBOf4CCz9Oa7SozN9/6JcruLcFKr8pcdXXA0WZscBqxwGa7CMqAnNfN28lbfOVfCLvQVLZIddmZC4XXv946OCV4DR+2jchsFRBs5NnkelnghtUKv+pUnnUDvm/NHldzPmFYSQvGdGS8BSk/rIRHdZ1kYvtOLN1OmtVl6KBqzBhQm43J6/reBhMbvJeXu/AYu6w6ju1tpd9Sk6FYlvFIGkQQhbhQ3rIicXgsQ3ImsVFLskeP0c80f+aP5VclJKo7JcpEByjTcSbvWoplVhhgbcA3mPwJAedaBZxiTEG7Th41p7NlDxZMJNVaD4GoCo6H4yF82exsqNhQzXyM620jKVI40HgITthYxcyow8q5VEaTEQ4seyrqptXSrYb/+neKq/cZaF0xIh914QD8tDDfXMMyErsOv17DZkVuIjQi2oZhS1hd4Iezd0DnLz7/gv/Hn/yT3NzcHPfZU11PJ/g4oIzcfPvXcPtLQrTa2conYsA1ktXQPJLZ4phfOt4bAzcSnCjo2ZnTYwii/de/Y4OSkls1lbpgGYJR84+DrLHBdS2u7RUougE/rHFrtU2bzUZyCptB6oCrDX6zxa9OcKsNYb3Brzf4zUYA7GaDX6/te7VdGTqJV60G0QC6HroVrm1Fpqz6NE0kO2eDoAHv2irGYfhLLTOsNDJ/Lcl5iLeDdbl0tyx4wDYA3jpB+r3sNdLhnXCIUjAA2kTZfNZV+1GA0thFxPmOEHUjNno+RXpN4+MMm7GgRSD4oGBYPCXX4ITeh6uvD/v7WCCoWExSsVirYKeg4Iva8BowtmHWrMFhKQkYgF3MnLBkggXu7Oz9egXkWnJqaEZW1SWLgS4/NMnumoezneUKcoJhHpdtlmmZTVFoGry3RsBcmG7v5E3fN/jBOG2NWP2utQxz8xI3nL8TfD795FP+0//sP/2BCD62I5/Oco9o/fJK14evMtqo+K4RRlAp98g9U1fninM4Y+bqylpLMeuT2pyQ2KuuaUk+WFs0aJO3kdx1MKwo/QD9ClZb/MkZ/uSMcHKOPzmjbE/xpyeEkzNhROcXhLML3MUF4eIF7tkLOH9OOXsO588J5y9ozp8Tzy4I5xc0F88I5+eE0zPCySmsVhL6ahpSNRi0aWvnGmUEPM5gFHyqV5fKKWEmNXPxxVOKEVJQsNWmLgZ6VocEfV0f54xXdAR/7Trv8HgilKAgUY97zQOM91OaHr/a0GzPabcXxNUW3681P+Uj2TcSfTMQN89mAJgfchd9rjpNrQ9n54naeKUUvDHQq0yrK5LuIGXKbHysWZpBUlfUeEvIC9FuLAsuTbjZGOmzeF4KFuUor1ulVUqS6JnGcmTaWNKBkvfktKfkiZIPlDxSykjOB91XZmDBs+hrn1EibtwpBDz79Qlxe05cn+K6Qdl4Y6oD3hOMp/blUnmcxidrEvjl9eSCD1GC68XbrI5XAFKmY+3fOlznO7xTnexojF+P8Ae7YhUrE4pR3/V8FSvSc1ftZW2aQPY22tGKIEY7UNqeJfYsjSadaXt8q3JL8gor6BWoSr+GYQ2bNazXuO0avx7wa5Vb9B1uGPCrFX5Y4fo1dCty05KcXgPV4z2qrFS3SVde7xsDgB+Cj7IBCwDHCf0aEB5W7bDo6/pNDTgcN32xK7Ou8fpFi1cqeSxwvdtYqd+o/kkeFi8iKP3woLVjrWd8MNs0uX1m03nWMF7CHzMJuZbIfvkhMJJNgtUUC4rZQwscFpDvc5Fw2aLOZMiVqyV2e53V8/OEn2b8bNKvy0QoUpeUH1ixmT6x4dM8skwHYTAmEZunPWnakaZ70iw2ckmj5vpMWL8wk8tMKgtLmeXUGr01FUXgJARCL5Isa40NxdVaE/5NS6hKldE0mR6t3W7H+Hdmu/77LbUZFYB81EhFMHW9iisozWyhNLgi1m4pjTIiH4Uh8FBG4ByhPk8wHZeaVhtpTN0y8TOIdcZJtxwaUmgoTStphhiNbd1TmgEXeyneNZ2IdW3VmRH3yDWtSiiTNvXtgG96CA05OGUJThlAwcYEGqdU3EDpEL2SNm9YgXWG8IFsM16umDQIhn+VY+h41H4Vba88ymq+fPUE4V9filsGTtsXNfvAyhew51YKVf+bQyEFj2tlDS0DvZXkP1Yr02yyBoE5dlDUraIsJgIn4p83UThMC4msn5MVeAqJlI2mYM4YZZEtMnOSDvScwG5lqt7uC2WclfGYD5ibJ9wkMijTiJtn8bEmOU7k/b0E0/YalWHa2xjNPYySw2DawXKvDIhZzisR/NDSrAeGky3D6Za272nantC0BDvn6UwjaLMhbrYq1btB2FkjXSOCOoSPP6i7u7snbRT4eD254FOvbq76sdsskIKOwEzMxM45cUMoprFsJVip5ZZtUiw7tS1j2YEDZBHjjkHIme2ycWCshCv+Qa+GIPylRIF/RDGsaRV8aFtxkCxrKWabowzGSr0gJcZSX1dxZDJLUkoefMK5BCFrKsKBCwUXtPtzWYQreMMZfFHnLygw18B7LE+dFBCrH5kOdD1lLQt89INjLLFD9fCTR5mSlVreO8s4j7CtpUYKRLnot3IMyhaHNW61xQ8bEUB7YWi+U3aZjcaQS37HIZXyoCyg4V5rcR9LQjMtscwnz1IVyItse8SPqV/bcy1J83TTolm9OcmA8DCTDxP5XuS+tNuR7u/lu7Xf4/Z7/Dji5glv83v+sMcddvhxhzvYbdxRxj3poIn0xWVc3zOcnNGfndFuN+KhxaBmnjmlgBjpbhg0jtFL6kO6RGL+P5zv7679fs88z1+++0muJxd8MPhSX1rpZIxckCi8QE21jUGbwCHZU/FU9BgVDcIPitHfse4ODvNDUtfHGXGu1tSSDzW5CW+ayDbBLWVFnQQ5eOMX2WNc5RTJsqXa5RR7Th9MX8a5RwiGjQhkea6TJ3ALxSUSM8Uv4BbzFJvBL7rPL+BnslssuEa1rl1DIpBQcBbQbJ09p66Lqk87do8DicmjPg7YwonV01HA1P90+tTyrn4ujwKQMxVI5xWOgsf1HWFY4+zWnpzSn13Qnp7TnpwRt6e4YU2OnUpgVyk1RjS0skw6Szpu3nHsLCkLkk5SVSYotcxaNKtX5sna1g+yKM6Y6sVUCMqoIOQOI/4w4Q573GGPPxxkfzPNJoEy4UbJocRpJowzfpxx44ybEm6B4AOx6ehXW4btOWHYUJreaBKeJWfJoh7b705s6NiwhIbZexbLzDV61BBi++WaF8yj/SHLfdrryQWf2rxUV8U2p3WnSpWQMDlR6mYwqR7tmoCjtczIdFseX77tS01AqxxRB0l4dC3HssPKMHXWsnNHvlB2OhGKAeLZQz4ONeo5i9neqJOjr4sB6fXk8CEoA1kWyW+kBZdHSh7xzBQ3UhjBzeAWslvIbqY4mRpmZgqLYSJY0GkoWClK1M2JWiC8xDQJ/zYnaH1txxzJoXEXxzH7c/a+C1g7XDdfU7njsm+yBSpnWWDfCusaNOEtO5szmvML4vkzohE8/fYU+o34UTbu4DIKQtY10qs1Jne24LNMRxdWlgzLTJonStKQsHAb2fyUNEnT6YgXWet+zoQswXs3T/g5SQA/ZULS/YwTjCMcZsq4GFhdTOWiIRFJoaXdPmM4f0W3fo4LPcucmfcTy27PvN8z7fekaaLkQsIwn1bKDiIdeg2a1Oy2amp/j5m2lBLhe4xdPMX1xF6lgF/NHFnZ44Vr1LJLYlE6+BWzAfvXebJtNldJhUr6HzaCtXVUgSjQVQsXAah6HkURPbZ4YSDOS6Ddef28HMmMUZwiw2FqlkbtLFlJkovEUZPTfs0pkceJNO6ZDztyOoht6zK5zDjzJ8MJz3AuqbYImeKTnCN8tsDnNAxKfJTxKDUvLspG2rJAe9vftXRoavCvD6gcnsobUhZUn6SWCXqv9pnVn5mqoUNByQ6z5Dc6E4Fve3LbU/oVbDR/50/FNI9nF4STc5rzZ8TTc/xmQ+laBX/T0s55kdpjNkJgHblICximUxbpI/kk0JgkNrkkVIyRXme6qnRKEiBdFsOJpkUGhlNSJ2xeFIBm/TzPi2REksPFFe3mnPbkGcOz91g9f4/+5ILiPYfdyOH6hvH6mv3lJfvLSw53t8z7vby+ig2VNp1mwoy3hil3YrQHFxod50fBvpao32vm6ymuJ/YqH524KAgULJNwNvHu1XqVMZ5efnVSqO30YtPYOUuC9Ego0xYxolo5fnjVh0k3TH5BVsH194rtK2c6MDhr5YcGHzpC6Ewf56HrVvWJ6wZV0NI7zQWWceZwd8f+9prpsAMkB5GSqSq6QnA2ee0zhKLArD8PTu9dr89beSOujYKPAlItM93xNTwcDx6dtFoPxwEw8qE+g3qv8CPLTu13lKk+DlQWrIrIds6E+LGs0sUW38ttgr4ntx257SXKvlpLAfDsnPjsOe2LF7Qv36N98Yr2/IK4OcF1vbICA85J8nbPi2yayzyrhC3qerliagXYWEXKJig3q7tm5VlVoxRjWiWZnwtutrJsmlnGiWWZJQGLp4SW5FuW2BK2ZwzP36O9eEn/8n36F6/I3ZpDcewPoy4yh1H40e6etLsXZpSTMKukoVFvQmUutspci3hbGTvPa6B/+KgELdhQ8g/CemLBR+uITXiUXhoRTbcH0hfKSx6wk6KUothVPBed/NVD68hsdWYSd7zJuI/8iPb+XatyjcyXy6FSrHiKZRq4eJQCca7q4BTRi2zDOxO6KqWQxgPLbkceR3xW2p+x1nPN0I4nl+EsXkzmY2logeNx+LC0zvSsK/dHhyeVcsRpnPNkJxC7+AwVdKcGNpvnsievWaSCqb5+d32pxMWONcrSRMTDOnQmY9q25EayG6VtKW0P3Rr6DX5zRjg5w51c4E6fES5eEJ49Jz5/QTi7kJxpbMnZkXKRkFbKksm1EQpXp97r52pjGcLYqknAJPeNZSLNykTTdMCZsL+kdnUQUi6q5FyE9Qnh4jnhxQva996nf++rDF/7Gu3770s4/uSUpR2YfWReMg5HcI5AZWnXOTW7GLqayYvH4x8ByxUdVLlspIrvkeHs93vS3wk+/z2XRfRj+WLf1wyiXoFr4BdgbFcAK2eKzX6pXXy8Xlu2o42tbf6wKnb05aWT9stX+keb/ZiJeAuIwjaKk5C9nVOWcdUMoJDHkflegScWiKGyknVldgXpxGQNfCpvsec8vgqt7/Gyj8vXjMUpsCg59HZYFODqE6hEVDBydjxKTVe+6+/Yu6qPe+dn9oiCQf4cg6ejWlc7DehG6XW7rsf1vQWhRp2vtie1A6lfkVdr2JzgzhSE/PPnxGcviM+e4yo+tDmBYSNSaNdLyKsxlnjXkZvHMh6R5GBJ6eFWYM6Z2fSUprwwlyLh/b6Hjab125cvWH/t66x+6Efof+iHGb72dYav/RDd175KePEStmfkYQvDg4Fh7FeE1dokRzb02w39Zku72sgAINQhX31OBFlU+1izHJ1fzqszqovou8HeOcfNzc0PDMnw6YxXUKBM3H7yt3DjFT4oumhuqSrcSdy8llcYaByCNqWphSsDqfR59Pk8lD6Ps4WHDy7bh2cPP96OT2Db6+G+Ctra9Hcx/6+SSUmBJi+Wxmel/d6yGeaZw80d49UVTCNdE2i6jgwsywQOmq7TSIUpBSq4Vab2w6tQx0rAsvAdb128itFY0Ay1u2cB0t5D5Tx5UwlQ4NHvFIcVwN6CkB2j459/+LoGn/o39dPaMKiP5yHrqkHIY75rzuae0KS3lYvFC+g/DhxHDRqXpiUMA/12Q1gNNOsVzXarDd6vCY9m6OJmra/7lblSGN7UdBKMjxoCzqHBxY7QDcT1mubkhHh2RnvxjObiGc2z5zQXF/QvXhKfPxMovtlKCnUlAF3iaTIddLETxyvEo8ecj5HYiAcWGiMKxmgYj40TeSfKCTYrVhZ1KKO8xRTMTgnDMwirh+PtHP/Jf/Kf8At//a8/PuBPdj0dr3YypFs++Wv/BeXyb9EGdZucl/5v7TThqzSnSFYO4SAayTA5UFptQsuKBEBr0zlZPyiNtp871M15J/hYhnG8qjvdJ3M7dct8xRuKfNnlwll1ZkzfuSzCHZxhTTmRdnvu3rxlub6modD1Pb5tmJaRcdzRtJHuRC6YsvNtBCOFmolkez8Va4lkejLdsZum92I4jFeGIgKis5LQMhHrgnnz4KpllUoyfTL1uKiMfDjR69d/2+VU8hyPkxOhkqLO1RGbyJoKp0gLqWQxkx8vFWxOAdwYzD4tuHk0sf75qLNdJnW6cl4opWhImeodpo2s4yeErBRz28hFGYhlRrEb8P0gAbsokqnmBWUI6KLKx4xMGtWU0IiEgH1z0Sho1ss84X3JuDxTppHlMJJMICx408B2MihIy45l2ZHTBG7GBwh9T1yfEc++Tnf+YxBP34nu//w//8/zp/70n3586J7senplF3VDG0BZsQ+q05wp3JkJn8qax4w9vSX3aKO889z2/Mek6EsPMQhEX7/7I1t6PSWbMWDiKOgueQa1fOUNJgELUiLNavemcWQ57CHNhCbQDhKbKkhnx2cvDlMWeTK4TgOkThPhem16DQ/5BviiwQjPdweF46MLKB/RRv6ud3h8ui+VmH+bkvS/ez2UBQryWob82Os0zKlmVjyUacebBdKCU9s5SM87NR1zO5C6DUu/JQ0nlO0ZnF3gzs4I588IZ8/kFrE5xZ2e4c8u4PQZnF3A2TnlVHhSfPaS+OI9OH8OF8/g/Bn59Jx5e0LenpG2J6SVPLvSasXS96ROhgX0vUim7QPDXSRUc7doGonStR256yn9Q0nphpWxvgc5rgbDdxy6ODZeDhrhIdvPIFmT77F9P/nkky/f9WTXd7/63+R15HKYbClZLOSqgSIxJSnLeWzozzaWTtHj6f6lZ9aqlU9dOZs0p/3we/2Ws6BUg2I2SYfja12SBOZr5lOB7GwC9IvseebDjmW/ZxlHyFkC6U0rJTtz9JRdcXy4OY2NOCNN/kZWLSvhex2GxwDNd/3wuPRW67jEu8s5zX79xtZ3BzhXN1e9o5ZgppVTwfb6MzUNeAiK3ksR0Tf4ZjhqMdFvyP2G3K3Iw4bUrcn9mtKuWNpe9/crymr9zgyeW28pw4ay2uA2p7DaiujYD6SmZ2k7cjso84kNKUoXKht+VBnsD0x2eYupVHyQcCEaS74ODIeoQNpocLgEc5M1IuyxO2qlsYK1mP2h6U1q5N3j+8UXX7zz/VNev7Gz+fu4jtKW1M4McgKtm79eHYtYr7qOWuQpPOrA2GMfyQ3o6q37dfV4dEmv2cuXNpUv6PWYWJSwGx7JeZpwfM64XGVUJ1zSPFGaZpbDxHI4sNztWXY7yjQRXaRpNCCYgSXNksCs7h0mm/EYn6mawl8+4Y7ry2nco+UecGU4HoUvLff42Enxz6JsPWIG1tujvhyAHjlI1Cz1cUdMj373d9RRcxZcJdsBJnbvAtlrKFi4n3mJ4Ql447/Ih70GhhJbqQK0GvZ17YrSrQRgx1aT9k1vNswrXDtA2+H6AdfLWcM1nR5r5VUybvniBAS7EI1rowBTvGExVdol2OBzCASiWQOp9HfOKTmmqFvpnX63kVOIeG4KOsUVk/EwvSWjl/jYCjb40vHf7/eM0/TOfU95Pb3gUzeZDQsqrqhNW3EGj9fGeKTFW09awB6r56unfoUyHy9DTY7fFxMo1wYT4CfQz1qbVEU7I7UdsQr9K5U5We/kZSZNE+kgKdXl7p50tyPd73ApC2xsbfbL3DSdtx6c0QsszMq/PevtPQRQk/x8vJmPXz7kf959CSCuq3zvslSUAA1mFqfuFMXa07aE1VSS38OtZi3FHq+PyMoERXYL8LoHjA7hRNQsRUdZioAqP5X5PeZ41Q2q8ZfyaOauxOZBLdKcREvXyuetHQxkVlmU214uEk1nHCPN5uW2k9VNKwfSmqHgBBZ7G20IsTUAudGUuZcpoljtFav0R3pBwo5JKqTqWe9sJAcZImqUyI6MfW7OmaW3w5ovNsJy7K4+rNvb2x+YiXaeYvBR6a9dFlwwcPDBU/3LV1ud6AYEf+m+XMzVoFjosd8tpRyB44cNYc9bCsn8xB9vKrICUK46LtVmuU5hm22OuCMzeZ5I08gy7kl390yXV5T7e9ySiSEQG82HZdfoSpgFCIfarq/vBY66yu+soiBRA6OWe/S4R8ej3vPdsea/db17pN8JXRbsv/yIh6Uw8mi989ByfGcYga4oDZD+cakBqADSIqoXBuAYjLAyzPmaFVQGvLzlaSK+NRnbrid0g5jVxh4O3SCspV2Z3MdK6pFtb6164TWh7Yl9K0OCpsG3UmkM0UwQQyAEzQXWm3PumN18+UA4547KnE5R5Tg7iDH3sQYH2SyLsEDkpNoQQvtdwef169c/MFbJfPcZ/RRWrW3rrW48BYsvZyr1SlozEWVNOnFdUjnlClYWIaEqo/3XsktVgoS/XfFHLo5LxWaD5FiRlyoYLnIYeaEsM0wTfpHVMdMkWv40k8c9Zben3N+Tr+8o00QTvWQkWnmWR99AceRpFr2+vnNLtZ1zpCMY+6hDhF5/LohQRy0Njc37/VgOy8AMWP/yj48l6rtRr768XLlPFshKyeQ5UaZCmQpMhTxJIuOd369PUJT75Sp4b+dKcepEUTd0lF43TSudbLPtKTFK6rURXkM037C2xXetZG7bRvfZz0q0YOfVFlc2piDqfNW7fjerLDVg1v/Zz0otu7wFIE376pec3k/J3pJrZcM+tITQ4eNwZNLX9cu//MtMPyAT7TzJ4PNoxso5BYeSHVRZq0cEQeecfW0M1qLgQlEwUTfKVPpq37gGrezMnkZlXgU8a7DiCHobdT9piroGpRp03LKYDoy+z4c9ab+Xz9L9nnR9Tbm5xo+TglpsCI10WTTw6SGbze1iGjTGyC6PAizoNVFLw2zzTbXsSY8M9I4b+jeydAqUkr6LeKlVHmE4laFdb3XjVBueL/2msbAfHXoFq4otuZqNKdgXk8og2bEcF5jl917f2zuZ76PymrqZXX1SC0begxknFrNVktqAt8HhB0eUEmXVVF1SFHTk116CnVr1b5hTivAdG0C2bKyWj1TTQzuXsxX/Clb2GFfpEMerDsHa9aV4Y297cgkU30Ec8N0W36xMy8feeyn8hb/wFx4Oxg/AenrBB222nLXBnLFkKTX622yO/au5LG3UfBS+qxiQnu84MWHDiJVqX69Azro3uunnKS2i6RcFp5zkZlmWBx93UrXHOWg6eXdg2R/I+x3p7o50fc1y+Zb5+gafE10vM8MS24dORS7HrEol3qPMJqtjpg37CE959DqPQeMRwKtxiN9w9HnIJR9v7O+59HMFRh3339j67kcXsM+ufmfZnneUtFAmc3ydp6M/VylGcbDg/L3KSGe8pRrZnFkw1zJHQnUeogKIgpKCTQV0VQ5ZKdc0CkTepFYsQ3HewF/7t3KpcJW4qZ/pNdlFpGY3x9f6cJEt9fro5OFVatChgRLxYSCENSFuCe0Wmndtkm9vb/nZP//n37nvqa8nFnzMjcCyjoIAyVIcuQaeeokocgmowUqOA5URamWTnfHOeDfaAcX+zuPypdiMl/CcbLKZHotoRSWbW4xAmCSt4JYE1kbP40QZR5gOlPtbuLkmX16Sr27wuRC6lvbkhDisBGBSW7AaIgzeiHAFew+WaaCByJyEXek9GQ6lIySejD3e26bW8fj/bXnyYzI1PA5U8F3BR0qD1iF8tErJuuofA6TuUxC1gErGB41/sEws+zvK4Q7Ge/JhL6nTgpW72RQO9XvOpFcqqdQ5SeJW2dzaVToyh01/ieAoqgvV2g5yRHFeppNH6V0Duf1RVcHrdfqiYd+grwXXGQDuAe+k32SBRZ/QQ4MV+14XQafnd5ZBGaPfV1skr1LLtxt8s7Gs5+GJfvVXf5XvfOc7D0/8A7CeWPDhKARfZS7E65kfSpEiIzksjihIKRugaCOqbKoDo3bVTNlsjmtpVShm2lfMgbQkCZHXAFNMOuEoq7kk/KxJaGfymyya12KZKeMedvfky7eMH33I9PGH5HFPf3LC6oMPCCdbeYT5YFdPKTXWLkoTIh65OoBKPJWEKjtyVnZEKWJqH2srvXdXNIl/HGv4UhD4/8f68lP+7QLO4+Wc2OA62eopV1v22eANf9QydiTSdE8e70i7W/L+jjKOCvj2mVfbZMyQ9aFMV0mowGAbvQ7LAs4FvIPgnQKeBQgfBVRLEbJ5sHD2wUosBSzv1Zks/qH8xIJL0QSM3p1TYKulnQtqmRd0sVMBZoHHYsix01o0QuS8JwR11HzT4rs1Pg6iBzzauikl/uJf+kssy3K87wdhPbngo2xZn0aWKpM+LJs+x67q0m+x37F/S3FGYVcA8llOBqVoYryY3IA/tsktaOVsMgo14CRYFkKaJfK1LDBLyzebzm+eJ/I4Skx83JPu78i31+Q3b8hffMbyxefk23va1ZrVqxd0Fxf4fm12wdbRCA7fiCdSnGPOsGRhKXo/WMan711B2sT1tR+vmt/9r32jfx7u+d5LVS3UK/Oj2zsPwvCzR+vhse80/R8tez+O7/FKNMUFyjxkWYSUGtOeZbwljbcqweaJNI84cyHN6XH2p1V5UHqldgBtPfzlYnwbZTLHY2tZktQoOQYH4TUGFvuq3/QINLZnDVZ64bALi33tlG3V5zpmZ49wsiPJ9fHnV/G0aD5dbW/Gk4NY04/W3d0dP//zP2/H4wdnPbngk21zqYwwTKM8MJ2xrECBw5Tcip1oRQGolCKpArBuSrbsSRhKyeadlGcTlzKrlGWWfUqSmLgsVgR+MklaM+0PTHsp0CXzXU/3d6Tba8rlW6aPP2L+9FPC4cBqvWbzwXu0z5+R2oZZANbx5HTeCRM1O90jHmXUAoBSMkvOVm3oyuiKdfWO57RtBEvfa1rv6uYwAL8ubR59XRkHdc6tAqrFGZBcf+0Ioj5svIffN8bRoyBmPz3+neMIDIbLlfpbUn/Ea3q/BI9vIqEJUGbcfIBRxMw8S3snmz1OLdveoUTY8+sceLh5lH09ZIvKPJ1Xd0x5WC3ZDC+qN9VQOGcc86LHgn7mKuP7iHVnnDczRa9y0Afw0SnT9VXo34KytcxrwKKK4HmnbLA1TfCmF5P6SyXX559/zje/+c3j9z8o64kFH2U4GgisWjvakM4ExEuaIMuGhJKPG/Lo6Z0K4djirf/KPO6IhZSkblVaNJxoA6A+LfglK9BM8lUvs076PM2keSRNI+kgIfG0P8B+T7m/xd1ckt58Tn79Ofn6kuAKzcUJ7YsLyqYjNZ7kIJv6YK1VissQM7HVVd/ZwCqAt7JLqXhRFKmbrN7eOQ2/TDtU8PY2OyXcozzCOQRUFzvnBXhq4yhoKJo4VCYqmHyPq6srBnj/7Vd2RYqLJgehOKn7pO9o2z80xH5N2w9SCNztmA/S10nTQQHoGFTUANBAr+bsyI5cNJrjbETHKy7o/RVPKkYOKF4Gh+Z24iwr9S4QCPji8aWOtdiwKFUyNtikr3mk2fmmLMeOh5Vm9ViXYq6mTi/oIVirjBbkU3AhExpkZBkUgFwTibGVdrgKzeOx/fa3v82nn3766Gj/YKwnFnyQ+VuVuixFIlQk1Hwo8jdyCe8SMOExkl9lGRd1pXKW9W2xFnQpWUCxBTFPwpcF0ojPJom5LLhlIZSCT/r9PC92xZ3N6+lAGQ/kwz1lf0O6vYKrt/D2Nfnzz0lv3lDmibDuiC/OcJuO2WeyW8AnXMi4IClU6THLiaKEJOWIUNN0J/sqCzL13+NkuqX//23r3TTcNkX9zkqC7woZSn2OV3a1rtH3llmBMic9/xFGfef28NdqMDQnUttxytzs9bhiGat1dwxYdSUw3R90ERgPcpow8a2Si3C8ImVZXVyUKdbmQsUDixFH3aP3bS/tuLxpbeu9vZvduUeqRCA9JO+9HFaPZVh9LCon7TksidLPXCEb47leVJzPeEkYAhPOz3gzDCh+BpfE8zJ1TrA5MVtpSXzjG9/g7u7ueN8Pynpywafkgs+6fnun8qmUrHIJaRnjFpyTpnFhtg/70dhDUXfLZykU6qbAowC04PMCVbR9mWTuNs+aPp8mDYTOM3laKPNCnpQFlfkA0z2Md7j7a8rVG8rrT0mffUL64jPGyzfErmHz/kvaV+eULrBgbhMxUaK+Lm6mMJGZKH6CsOAalWXa1MJ6jtMbYNnO8ZsvH7r/3qtuNG0Yu6p6d+SgUMcbjvNJygKO5QbVHvghEKnCEkakjqW99MwRe6Po3xoki/Oa42oH/OqU2K3JUyLtFIAE9Mvuhnm2JkG9wFRg3ja2nQfKiHXxSdaEOJZoVmYeA2otuyzYHwNLzXuOIxP2+CJiqljpxeCAd8O5szKbx8HYKeB6TOXSZwhyIsFN4Cf7eib5RfGmWkH5d7OecRr5xje+8QNjl/N4Pa3gUzg6SJIMmwF9qC5LQB211x9PupdiqXctRXK2aRq5PLiSTFdH9rYlCbzMaSIluU/mSRlOXhaWaWYcRxbDdJb9geUwUg4j5bCn7HeUm0vc9RvKF58wffIR6fPPyLfXhOhon5/TffUV4eyEJSoFzzVgkshuJptzZSm6uhVfzKvMBMOL6cHUjlflNlFP9N/Yerhie7TfLNAccYzKINdJXbGeKlurGauH73XT5qs4iEDbGrTU5vYPqY+xn42L9Ghz5mxb3l5XCF5aObGjWW+I/UrV1X4PhwPsR/lo7XcwHnDzZFrNSY6lWfhdpVHkYrhYqZIrEnw7vt5sAcQFnTIFAnqcjo+9XxsmrSVWfa9SHXgQd8vFSthHmck79k7O4ZxdVD3C1IqVvyY1K0wq4XyC+KBN7kNrs10Pzw0wjiO//q1vfSnL/cFYTyv4oKv+EXi11Fzpq11ZyHKByIUKBTpL/0syQa8jVmJdkZzwOUEaKcuesozktCfPe5Z5JC8WeKZEGhfZrMw185nJhxEOkwLPzQ35zRvK6y+YPv4O82cfsXzxGePbN+RxZP3shNVXX+Euzlham3h28skSGdB2pZEDs90n8NlTopi32TmzS7H39qVz68vff6/1TjnwpVKiZijW/BVIanyZ+nuuKiKq/233W8CyDMm5KI+zd5774W/oc3hUyhX7jDOAHD2OuJ5tUnzA9wNxu8U3DXk/stzestzfMd5esdzfsOzvyYcDZR4py2jqAg8DvyXVjma2FrYOmvb9Q0iuh1GqlBaYa63kasn5UGo9bH4ngwFXgRu7X6nUd63vOj7O5DJw+hyOxxz7j16TBo7VkBDm8AA2l1K4vrnhm9/4xrvP/QOynk7wOV4lH8C7ujl05bRNYv/9/7L358G2bdlZH/ibzVpr96e57XsvX6YyUykkJIQLATLCYGxsOhNhIgpEBfxVUa4oKEe5HGUCF5Sj7AgCAiKACCKsAhQSrQVGGIMCC7sKUAJlW0ql2pSUfff6e99tTre7tdacc9QfY8x9zs0UlCRAui/zzRf73XP33Wc3a6815hjf+Mb31c6A1v5YRwPrBGXV6clath2GQUsPMlDKHsmj2vDmkTT25N6sc0cDm4deSy3rcsl2i1xeImdnlEcPGd58g/6tN8hPHhF3W+h7nVyeT/DHC8q0pRjTFRwlC7nydA40AcMkvDq0uqYaDBq5jevg8Wyw+bK20s9hXZ/8ddL9+mQ3oNRhpcP1sT4MbrprnRlxxiTSbVmdFSx7uvk+D2C5bQSaFlgWYm4b3AgAehnqkEf2njCb08znpGFgOL+gXF5o1rm3TGjQMoxkg7xZSzGS2SdXHpBUomllx18D+dT2vB3o6+FVDVA3Wc03DiHcnNbXR5osyLNBpm6mUMlQ9dPan16DjQ8mGaJ/tSB80+G2GlU+O1Lx5htv8ODhw8N976T1/AQfOGQ2OK3ZVbOkBphy2FW0e2H2J2K7dam1fNFgkwZKGkg5k0sil4GUR8Y0kPOgHllpgFFp/PnGrewHynYP2x62e/x2g5xfUN5+RHrrLfrXXmd8+Dbl7By/3xNFaGNDO5sxuXtKXC3V9teObr0gq85zuQEkY6etC8GYt8GIaqIl5mGuqth4iZYFHH69nuxfctI/87dnV7GTWw+n4TqiJZaS8PTP6jSqy8oqK8N0cluDznV5plmoK2rqV7tpuKo+qbiQXthGAEW/S48BxaZGkHH46Yx2dYLDMV6tCZstYbtGrta6GWx3yH6HG675WKFoN9PnrLhedYEVLXlr6Sei7XcHes4cOqy6YSFmzHgDk3pm/XO6e1+a+DgvhGB32iDs4d8O2ZDxp26UxRrkVUYj+EZZz+FZ8bCcM5/5zGfY7XaH+95J6zkLPrqUDetwuegkeZYDP12ynSg2QKlXs/29DFpOlT1FekR6pOyRolhOSSqVIangkqjQ16CllfR7ym6H7NQCl90et90gV+eUp0+Rtx9SHjxgfPMt8tuP8ZcbmlFo8LTTlvZ4wfTF20xeeBG/XJLQ3f6w61nX5cBiNZVGZ17xlWkbYsH5jA8jzqeDW6lz2dLBgJMGSsAVr5iFaAYi1KhznaHU4KAntWUe2vDVxxl24X1jwmvadhbDl27ycw5LnHVdNPhoDNTXwkGWqoOkf9ZjUOkTSNJZdHtaZxefBift6IHHNx3dcoVvGsbNhrK+gPNz5OwMubggb67Iuy1lv1MiYtISjHE0KkXW0jmromROSb9/82tXJvk1HUMzUj2vdFhXS3zNWLXxUb8/OEA9FjVqXKg/iwbaWvJpZLnxvdRjpv9WB4SvNxQ1KNDMM+J8Y5nR9SWbUuLHfvzHD39/p63nLvh4LEW2MQhNhmqKDF5sGj1ndfxMNo9VkgHIO4rsKezIaCDKaW9t8wKDIIOj9IXcm73tkJHeptT7HrfvCUOPbDZwcQ5PHiOP3mZ88ID85Aluu6cRR9c0NNMZLKaEW0vae7dxJyf0LpCyjXlQMSzdLbW60RNTiY5m/UtBXVISuB5xvXY+ql2yL3qhZwfF4ySCaLDwxasUSA1CFmgOnau6W1qdVVwtfzT4aGmgQeAmnvPs7eYyeqBcv4aWYZrD6EWmv+YA54t2dMzmuXYqtYGgDQPF7UBMJK0IlBCJ8zntfK6P224YnzxhfPyY8ekT8uUFst3CWO2PEy71kAd8lTspoypMimYzlRldyyOpbXiLGVqq6WNSrp5diZRGHTYuhVyU5FlqcDWniRpos6jMr479aHfvJhFSKz/lI+m8mc2dGQ+NUqz6tQyU67mvm2u73fKJT3zimfveSeu5Cz5yQ75C56asHWuaLlK0tVoDUG3bupKVESsjTgac9DjZ40qPE/XpJmXVwxwEGT1u8EivILNmPwPst5TtFWzW+PUV/vICd/6Y8fHb9E8fE8aRru1o5kua1THh+IhwfEq4fRt/ekLuWsbDDl+7dbqUPFiuJUqNm0S2uS3JWn64rFkbA0LCG50AMMW/hiIRJOCyaTxbd8wedCPeaBZxaJt7FSHFPOedUylQFfXyePFKsLuhFVMvop+tltOs5ssDlF3aWjqKqAOrfXbxlXCo5VZwAecglwRFFQVEMgkI8znT42N8jJrlrC9xmyvc5RVcrXE760IOA/QDbkiEpM4WQbTR4FEcMOfr0q92TbFzp5Rk/LJRs5w84qVqRNW5OjP5Q8tI59SqWkcxbNarMkTteGULOPWmXbdroB3LfB3GeLclaIDSAeRog7I3JIFFePz4MW+/Q/Eens/gUwW7jKuRlL1KUdsTzWrFyqxrDZsq8uUk4cpgZLQEZcDlQVuw5tfts+h8lpVcjIO1cjfIdgNXV5Tzc8rZU/L5U9LFOWVzRSOFtpvQHR3RnZwSjtUdwZ+c4I+OkOmUJHqhqgaNAjOl1CxOdZ5dLurFVFQXun6Om5yXQ9rubPzAKfjuahtYPFI0+5FSAd8bk9s3sg/dmbHSzFsHLlippSCplmUWqOquLAqIXw88/izRpy57MX2ccZTsQkPEykO7uKzrdOimHdrQCrArvu1U3Gsyg+lchb1w+H4g7Pa49RYu17jNFnY7ynZH2fdKCu1H8pAoQ8LlZLwgJZD6fE2pIFlJdtjMLNCkgVJGSh4tWzJOkQWgyqbPh+6qlmS54pRFz0+FB4o+Tky7uZILsQhTFPzWjegAA1qnKygQbbeb8V1EeP2NN96R5MK6nrvgU7sMRdTviWKAstg3IxZoimZI2lqt3CB1j5CUYOwNBxiRpERCl5QsWAYV/3LDiBsSfsi4oYfdFrfeIFdXyKUGn/HpGWW7pYmR2XLF5OSUcHQCyyNYrpDlEiYL6GYqeF7LxXpumRSGiO6wNVOTUW8lp0Pw1N3zZodL79Pswk7OCsIf4oAFDdFMxRtILNYQq0FHA0NlG19jPxwCjx37WrJVYpwlPT/3VV/YaVAzFw7EOkHiVf79wBlSroz3QXk+lrU5VwcrG8JyyfToiDIk+stL0uUl+eIMOVPZErfZEizrkT6RTRVSxhEZM2kYcMOAq9ntoMGkGDaUqxCbdcEopl5ZO6Jimc9BWjeTDbMTw4YoYhmTkV0tqxHR+7V5YsfEAm89r125dj255kHVSONUH/pLhklLKbz6yivvKOXCL13PXfBRYM++kHrR6ZyBzmQV7YpI0hT9WgKjaABKWl6VwabTx4QMo7bS971yQ/odZehxORPGhOv3uE0P6x2sr3CXF3BxCZsNrh8IXrGHeHyKWx2rNe98CXM19pO2Q3wDNNdYgnPaRpeMLwVfVfhEsx7NcjTVF+usgJYjmqfUk1CXHo8aBhw6fRTwh9cDvCdT57JUP6dgXCE78b11pURQxNTXQORxvnLIReeVnAaJUMl21hr/5y19exYM8VBuuLkSKEQgIq4B1x70iMXGPHS8QiNmrUqzCHG1opkv2Ww3lM2OcnFBenKGnD0hvf0IeXqOrLeUzZ68V+WBPPSqPDAMh8yHcTRGe1KhsjrfV7PkZLhR/Y7Iyoq2TFwPqzYLKuYoBhEUy2IPMrYF7U7WERCs20YGp5tn5ViJqGDcdWZ5/T1rSWwuHV8CNn/hC194RzKb6/oXn02/2Evsf/aF10BTv3By7Uro2SkWhMS6GWUcDrNYkkZNv20SXfamjDf0SN/j9jvcdge7HW6zQ9Yb1Vper5H1JfR7fCk0XUuzWBCWK1iucKsTZHmCWy5hvsBP5mrdUjs04g/TBmIlY9UKIisnRW89JY1KjqsdMVMr1BPyS/ONG23aegwKODn0pCxo1VNX34/ljTeyGv0dJ/Y8oh2ZClXULtSzpZCWcF/6jr501azpcPMadBwBJwFXIo4GVyKeiIgxuQkUgmVsOsNUipCSArxuOmVyfMJktiQ4R9n1lKsr8tkZ+ekTxkePSE/PyOsrxs2GtN2Rh0QeMzIKPhXcmPBjwg8JN5qKgTHpsRJLM2ob2ShFh1ZH3eSkZPKNWUHscTmNZCuvKlBdKR8HfMmwI83eDetBQXB9TA1aoniSNSi002VYj38WbN7tdrz22ms/y3nyzlnPV/CBA9gsNpGssqVVzF2QpNu8mLRpzXzIKtoug4GPgwK51FmgflBa/lZLK9ZX5Iszyvk5brMhDj1h1yPbARJ4Ik03Jy5WhNURfnWMWx0jixVutYTlCqYzSuzILpIlUgpQjIWaPYzoUGrKdlOZDhlHnbauQVQMlLWlJ5S1u433ovdpNuLMy+mALx/+bwHmxvmoomz6XFYNXgf52uG58dr1eWugOqwKWP+cVn2cdsD0fZmMRJWSuNEpA72/auXIIZChHbVmQrtc0i2PiG2neNowINs1rC/I5091oPfqCrYbtU8eMj6j59CoG4FuSgMuJ0LORlBU7SZuDCBTTLdbdCN0FmwqjqiBSgMKohtLSdfdrHr7kgNu2azaJSvtQEu6Wm65+tr2SHHaWlcjyWeDz8XFBW89ePBu8PlXtgT9UrOKex3q8KwuBmVIpEF5OpL0MfrFj8jYa9psJ1MZRpM2zbg+w24P6zVyeUY+e0R+8pj89DHl/IxytUa2PWTwviHEGXF2hF+eEFan+KMTZLlC5ktYLGA6pTQdEidkKyHwHYWGXCK+dEgKlAFKD6kfSX1P3u8pyex1rKysLWZLfDTxMyxB+XDqwqGsbzk4tmrLmutsqQLSGGfICdFpUVZb/t4Aa+w+Zye6Vl5mYndIXKx17lXkS4mdJoJW3zAcSIegJcnNwKfvGQVbcRTjBakhoE64l8qaFjlYBFUrHDUJtFETH2DSUhp1/gjewzCSN5qp+u0av77Aba5gvzU3EcEldZTVDa1mLwOMA5J6XLYuV8Xjsp5v2HCyg0NDQIOD0SOSdiJ1XlB/v2bl9djq8+VDsJcaYNxoHnBaih3KLyM3agNRj4P3Dc43hyCObRYPHz58R7mT/mzr+Qo+N1bVYHFFTEkwIWPBpXItiFuDz2gTz2nEp0FT636E/YjbJUKfacZE2K3h8gly/gQuzpCLc/LlpRr5FcH5hjBdEFanuNUt3JHeZHGEW6yQ2YTcNGTfUlxUge/iQRqEiHMT8J2SAJNDRiEPWfGmg2SHnYAk1S4yHEt3W834DoTKG/dlAzt1d866QZoAGN6bu6UGHYfiDDpYaemTrQN4bTcRHWeoQ5iF6jhhXZl/3sZqw65ir/HlOZHhPnj8IZbdfN1rwt6BRVwvXAOkg9csr4gwijDGiJ/PcF0H3msrfFB6BOtLyvkZcnmO32y0gTAMWjpZUCmpGFVjJKfeTB6160jV5zbgXwQlWUr9rJblYFQPK7u4kX1r52xUWscBh7RN1PSFdENVmRi1+1a8R7/wGveV1+NcUP1m1wDXbfacM6+++ipPnzz50oP+jlrPXfBxRTGSkjMuCy4Va5lmZEjIfsT1CQb9uxsTsSR8GpFhT97tKJs1sr6C9Qa3WZMvz8hnT5Czx3DxBK7OkO0VcRgIIsQYVaZyNiMsj4kntwmnt/DHt3GrY9x8gUwn6mTZNGrhK1CqNU9R3AIsaIxi789S+9HavaUo23oYdKdEwWgVvrK0Pesu7UwSROeSrKt3I8VWXMCkK7Sbre3eG10YcrKyrmrd6O57XcbV7MU0kS0AiGVEts8eXhMUh6ipfjHCXck3ZqXqstcDzZi+9Hn0Aq/Bpj7GAq49l6BRS4qQncfN54TVkjBfEKZTnTQvBdePpKtL0vk55eKScnEGl1fk9Zq03ahx47hXDk8ayKOy3skjkvdqApD36jaba0Cqn63UD6OdraJkSUdWZr2ouH8pFcszTfCb6oq1HLMyuwYhkWQZkI16HK5G3VS8M/PDUDMfXX3f87GPfYzdfn+47524nrvgU0SDjxPtcnkphFJwY8EPI34YkV2P2w/4YYBexyFcP+D7PezWyPoCLs/h7BHp0ZukB6+ze+OL7B+8Tr44h/1eZ39ipJlMCbM5bj7HG6hc5nPKdEaZTsjdlBQnSNMhMartioM8pmtA2S6YYlY6427HaMQ3lxO+FHMxVc0gySY+PybNiLIK2ysHSblAYhdAba0fnDwrM1nQbppdqNejCtflm14z1h20wFN3WVUGuCZxHgKWgaMUkyQRMwR0mq25Spy8MRvFNWfbQG+NKAfc5mdLn+qcpQUeZ+xeDUaWcVmpJyK4rsMtFsTjW4SjE8J8gesmhBD1gt/t1a7o/Ix8dsZw9piyucQNWxh25H5DGdaUcUvJe6T05NyThh0lbSHtIe1Ur6lmLqXgMjZmUXk7dZTH6BHFjknFgIqduwce2o0syQJ87aDVYK+lmHW/jGLgXMCFFh8npl54vZ48ecJHPvKRZ4P9O3A9d8HH2W5/qLFtOlm5EAWfRmLJhJwIacQPA37UcqspiaaMxHEP6zOGR28yvv0m/cPXKU8f47c7fMqE4AmTCWE2xy9WhPkKN53DZI50HTk2JB9IPpCDp4Qqbq5M4VI7bUVJZu7w/rKC3VYClrGHlDSg5KqsqB2WYsCzJJMCTVl5P0YLKKNxVew1DjtmHfESkKQnMtiFalkEtXtlIl4166h7pyv1Qr/embXboqMNiJYnFOOd1IzMdmxnHRwR9QqltvRFLJREHGZzXJxevFlVBg63IjoDZhlFLTdqRoSNKxRJCKh7w3QJi2PC6V3iyR384kg3hVLwKeH7Pc0w0PQDbrfD7zeEcU8Yd7i0Q9IO0h4Zt5S8xUmP5B153JLzFsl7XBlMGVPLJjl0Wq37mhOujBqEDO+5Frqzz5O1o2j1K5iSipbZFWzWY+dMNE8Dj9IinHf42OBiS4iTZ8Yqcs586tOf5pOf+tThvnfqeu6CjxgGUHdiKaa/nItKoKaMjD0+94rvlAGXe2TcU/otftjhxx3p6inp6SPc1Tlx3xNyJsZA7Dr8dEazWBEWC/xshkwmSNchUe11K/BaXDGXCY+o9tRB4N5hmEet9c211JnLhaQBV0ZcTuSigUQ/k4KeJWfr8gqlz5TB2Nxmz+yygssqqnbd7j0M0VasJEMZry9i3X3tGKIJi1iwqWm/7riKMUixssJupf6ubapa3llOcwi6Fsw00h2e03FIfw4zVPq7/4JVd+9aFiJ6cVZ8JOvv+9AQp3P88hh/chs5vYNb3cJP56RS6Ndr0voS6U1obLdDNmvS5TlpfY70G2Tcwbi14dM9knfaESg9kvaUtKekyv+pWJxmLSVbZ8zGf1S4TBnU+j4tU6ofx47R4biJZZVipo71uNbMSLJmjVVrOwRc7CB0dpnq1rHf7/lH//Af0r+DPNn/eev5Cz6HTlC9WPQ+ME4GI15GrdOT/lmGHXm3Jm3X5O0laX1OXl+Rtxv8MNIEaKeRbjElLufExRw3n+AnLa4LEB3ZhL2KJJxLeF9HG5IJbemFooFRA0m9QJ1lHSQDv8e9EhdHwwHGUUFJqdbLINkfpvUlg4zVtke0nBPdDWtLtpTqTKpDjAf3hnqS5xtYwuFWSwM5AKEqrlaPq2Y8tRN0mJcTLSGlYhV2oRxwpkpkdHWY0soKy9JUO8neg4iNFlwDy3oDpRNooZYR5cuIWCteP0uuwdQ5/GQC0zmyOoaT2/jT28TlifptDT1pvSZdXZLXl7BZk6+uyJcXjOsr8m4N/c6MHXvKsKcMO4oBz3noyaknZ/25DMOhBV8pH9pq1w3AS8JXJco6vFq0e1lKJYpWdrvxeSyYHbLHG9llLoksyY6tV1azv+Fsa+vRo0f80Ec+cvj7O3k9d8GHKgiO8lUMNaB2CESu5UgDyu9xacCPe9isSedX7B89hc2eqW/VQHISiYsJYTHBzxrcJJiDRNa2p+vxbsDZrYjq54ag09haZijorUEEG5K0DMhVzCIrn2izoWyu9NbvtCRIlVciSLI2bgGXnXJ5UibvdQbN56KPPRDaRHGIokC8lkKWGZRCHgc9kaWWTwZm2yiK1KludGCy3iij/l5WHOqAYdSO0JgOEqXe5tU86hZKUZauJCDr3JaY3EmpF1VRzE5xEMU3rm/GTi+m61Pkhtypw9ls1AGvch4JDUw6ZDqDxQqOTmB1QpwuCKFBxpF0dYWs17DeIOs1ab2BbY9sE3lrSpW9jlkcSt+ctQs5ZuWHjZrBymBBBS1jtfTU+1wekDSYm8qgnJ2i4LOzMvVgrV2sNBfFg/SxWrZBQkqvMr+lWNka8K7VFvuNwCMifPrTn+bhO3iY9OZ6joKP1vmugpvmvFlHERToVMM/rcGFZHNbfsy4/UhebxjOryjrHoai0pdtQ+gaXNeSvSNVfRYZyWVPyVty2uLKDic7HBqIhAHcgPcmMlUznWKZmNnxHNqlFpxk6GG/g90Gt93iN2slNe72+CERU6ERpQmojkxBajcs6SiIVI2hIVNGBaxVTF+Ba2XWmpe8lQKqBqDzQV7qBZ3MraO6b+h9GNtauzK6O+sFk9SuJ9dgoVlMGhPZ9G9y1unwkotyZmrZUEu6SpMQxZZyrlmYHT+pf9YyS59X7CIFBdwV6K7nhS0fcG0HXQOzKW65pLl1i+7efZrjI53U3w+MlxeUzSVst4R+xI+qz+4GQfYFRj1/SAU3CrJXXljuTTZ3SMigRpEyJCu3zGwyjyrHm/c4RlUcEAWTi5FFa9anmbIGz8rdkqLHGBu5QUwrqBRN9lDVQpyNVdwIPjlnPv3pT7PZbK6PyTt4PUfBR5cUQcbabrZd29LXWlKQCiVpt8llQYZE3g4MF3vSZY/stEvhnMM3gRIaxAVyEUouJFM5zOYB5mUPsjP5jR5X9jh69QfLWjIpBuFxBXxxUI0IDXCk6AUdUsbXIdXtFayvKFeX5IsLytUlbqfKeyEbs3Yc8SlbZqRMbAadSdJANJCNJe2SZgL1YtAWr05SK4ak7hsla5fNmTurl4I/jHYYTlGntOuxKIMxbVUy4rpE0KAiNsdULOAdhLkqBmSZja9SpZax6XtAnUQqNlQn3C0LOuAkopllLeU0w8uaATsFYX1s8V1HnE3wixn+6Ij27l0md+7hpzNyToybNcPZU2S9IfYjoVe5DUbN9JQtj5JAR8tEk+gs4KAbgB5/1QnSruWIS1aCWRbqyogXs2Oym1Q80ErimvH5Q1ZaVHnBlB1LscBV9CA453XmzccvK7nGceTVV199R89z3VzPV/AxHELLDfVoV3+tukMowauMWbs+xSF9YdwO5N2A22fcIERxBO9xIdhsjNL3vQsHMp2m0gUx4akoCS89sfR4p7NX6umlpY+vxnB2cYnhAFKUgVwxF58zbhzwqcePPW6/x223uK2OdrDZ2hzZVlnX/YAfa8cuEcZMyJmQxUYxEtKPlP1ggmdKVJSSDYasAK1mhyIaEIsFQ0k6SqBZkWYVviix7nARid5KHshJBzMl28zRoctmn9kcYevNiwU3Kaa/XbOXTJ3s8th7y8meR4P1ASsrtazW71+zBk8p+vrkpARKr1w73wToIjJtGbpAnk3wJyd0t2/hp1NEhNzvKPsN9D3BVA5cGoiHcrFAX5BBkEGDkU+K22nmKIrzjCPBSITkkWD2S0osvAbEXSkKtlt5pJmOQ50iq2mlfm4NRKbCYMFbQ09QbaZYWc3PjlRsNhtefYfPc91cz1fwgUN5JUWnjbGyQMHRusMWcpVP6EfGyz3jxY68HfGjynDGpsFFT3bOPqa2yD0oaHgg82WkjOTa9Sh7yDsTIzMyoAVEGS0Fv5GFOBsadSIaJOtz9yOy28N+j+x2uH2P3+0p6w354oL09IxyfolcrbVMG3u7MLTbxagSIN522zJm8xTryQaGllHBUskjJfUHjEbHTzLZWLtl1EzHZ9USIid8HgiSrxm+9jlK0mxT7D5tN9fSIGtGlTXD8bZZaMlgsqP2M4i1oxXA1ucrlnlV4FaDt4Ld9u9FS9JD8LSuGRR8E/AxQPAQA27S4mYT0qQjL+Z0t2/THR/TTDqCc0i/J+82SL/ToVLz/WJQtjwZZLDZL4PAXPIamIpZMtfvt1i2coPXowC9fl8aMNGWaO38iYCpGpQyHMrgUoZDuavdQcV5cFGdU4kE35pGtmY+IsLZ2Rlvvvnml14y79j13AUfPZn1xFRwtxCquzB60kvKyH4kb/eUyx3j+Zr92Za0SUhW6Qhl/qpchOAolW9Ry4iiRDstnxJF9CZiXu2lR1LVAlavrzIoCU3nyKwcSyOuArZZgUSHZhKSBrNW3pK3G8pWp+ZZb+FqTT57Sjo7I11dkbc7LcGKip9raaTBTsyjnKRi6JJ6yrhDxv7wdwU1rXNlJZnSAOyCscBWn9eVQsgGHh8CcQW3r3lLSAVQrbSkdtmsrMqGRRXFO7DRCf3T2tQ3XF/rcSoHztNopYkFoKTBsmovS8mHKXvvvQpsNY1iedOWZrkgHh0TT08Ip7doTk9x0yngSPsdw/qcslvjhx2Y26zrB/x+tEwyI32B0VOSIydBrOMoebTSerBs0qbfrROYDWsT2yA0oNp3lUdcUTxIRL9X7Yjp9LxYOaaHSufago+E0OFcB655xianlMJrr7/+jp/nurmeu+DjQ1Df6npHVgXDkhJi6SuGj+S1Bp7xfIdsR537Moiy6uI6POqQU5TwVolfh1V/VpBbAQYtCbBumow9MuxxZYcve3zujYzW40k4nwlOW/TOWvSIdUXs5seest9pC36/JWy1HGO7UXmPagd8CGJ1cNayrVGHIRl7JPd6YhctDbU7VfEfKIf5t2usRksnxSMCHLCdWj4oNoQGP7swFMfQgILTYKK4Rd39RzLJvNb1eNUdvWJRIjVw6XtRbowFyVSDpX7mPO6VmFkfU65b+6pXJLjoVOKmcbi2wc8mhNUct1zgjk8It27THB3jugYpmbS5ZDx7TLq6wO32+O1Og/9uj9uPmqEOSvTUYGCbUR6vTQikp0hPkVHpGE4zEeNMWDDWwOIPEr4DjgGH/pyleovZplVLtpzxqMC/86rbI6GxkYrrsqvvez71yU9yeXl5uO+dvp674ANq0IZTboh2dHQ3z0Mm9SNuyLAbGJ9cMTxew3rAJ0fTtITGQ6Oat861OGmQ5MkJnDT40uBpCLQEaQ9Ke97kPhU7EbwrBDLejXj2BNnhS4+THd7vCb4nsCM4+zkM+DAS/EhwIyKDtZzNIz5nfJVr3e+RYWvs2x439Lg6mZ81aPmc9HdShqzZjWQDxfOekjaQdriiXBX9PQ0yUkSBYcscck7mX68XVS6DKfPpRX7ImlJSmY9cy8frwKBZlHW7it0q4HwYqtSS7wCGJxsfsWwwVHC2aOblinb4yqjcGkmaYVwDzaqLXJzyfHJ1fwgR1zTQBPykw82myGKJrFa4k1Pae/eIx8fKSB8HnXy/WqshQK/4muutKTCMBHsfSu7U96WuJzuEPcKeLFuK7MgyKFCcqzxqzQIL5AGX97pBscOzxckW2EHeU7KeE9q80Bk7bQLaBugDIXSEMMWF7plr4vLyko9+9KOklJ65/528nr/gY1IOOMCZkHlRLgxj0dmpyw3bt8/YPDgjnW2hL0TviW3Adw3SRCTopLnQUGjwJardDC2uNFBakAZKg5NgtbfoiW/yE8EJ3qmAe/QD0e3xDDh2ODQI+dCD2+Ncrx0yt0fcQPB64Sj2YbrAw0Deq92v9HuVdN33akq470n7nd43KqbjkjKkQy7mQaXln7PMq2R1X3VFeT7OSoC6q0pWZw+MH3SYTbJSTAOG3sTa5jUYkRWP0bLNMh4rgzX7MapALko5KGpHVAl5jPrenYG0Wnboc3jR+yUrXhVyJhSd4fOVh2RdTqzkUmmPiARzgQ0NEhukaWAyxS+W+NWKcHoLbt8inp7i51PNvHp1m2VvAH/S0Rw3DOrdZtgWRQdESzGqRemRsqNIr3NtByscDTqlFMbRAruVwiltSGlDyVsNXmWHlD1e9Ds6lMLZMkPTN5QqKRvMHPCGeFjJhbfeeosf/uhHn7lU3unr+Qs+FgMw1yjnos4ojaJyqFdb0sWG8ekatx7xoyPiiUHBSB8joWnwoQEJSPUaJ1gFUVReweaNKg4kRUmNupNhM0jXtbskJYI5GRSdFJ0BUiH4ShjTwIUD3zTEptP3E0wMKtvFmessl5HchpE8DEg/kHu9QFTm09riacTlTMxZp/cNh3I5Hdi5UnEVa99LNm0jK3UkDYc5spxN/Cpfg8U5K4VBimYAvoKs5Trz0d29ZkXGbUKxGkkZrNPmRpUudfb+FdupALJhWfb+DxrbNqqgWZ8J/mcDq50z3osqHuIjJSr2IzFC0+AmU2Q+p6yWuONbhFu3CUfHuMmUVBLDdst4dUnabin9ntIPlm0OkK5pBrW8rMeFqsEjltlZxlis9FRQ2nA0y+yCTbyXetxS1Xyux9CUBbChLzvP1ZG0wzWTZ/CeYRz4yEc+wttvv/2ll8o7ej1fwUd7rXoNF9UAzqNyeRgSeb0lr3uGiy2yHQlF5UMR9VDCqfNntYvxPmiLFu2o5GEgjSpbqv7sCVH81DpstfVpGYHxbYqVBNnwCM0cjI9SNXGqhIIOP1BQ91EfW1yMhCZqcAwKmjqvAGrwHmeDkZJGpO+RsScNJrNatYfHdJiSZ1ShtFrWSFKpiJLUoUMDiKr2YQ4NCiTXwKefP6eRbFiHdmf0YtPWeC0XlSPkbTq/PoZDiz/hSIjNsWlHzbCurAOyjOYQYgFIweekvJmUEfPdKslE35N2mlzRL8eZ8SEhQtD5O+fVUsaFiIsRYkDaljKb4U9PiffvM3n5ZWYvvagERGDc7RiuLin7Hd6wF33PWS2XXFbsRTkfdrPjaV25UgNpUra6gu1VpuQ6mIsFdopSEjRjevZ2YHPj8b7FhxbvO+P3XK+Liwt+4Ad+4MvVJd/h6/kKPpX66rTrVTLkMZH2A2mzY7zYMJ6vGc63SF/wpkUsQBEh5cyYR7NIHlUSgkJJI6nfkfY7yKN6eksi24klokHjcGLYrp6zWSsfsgbd/RwGOJoshNhbd7VktFRasW2nqXRs8E2Lazt8q90aF4N2cFC8KRiQLv1A6XvdoYceGQcLQgk36M2nDKPiKmQjXRbNcDBx/domFuuSZduBdSev3a3atbKWesVusgYGclZdoVJ0UFasi1N3cePEBOesc1axKxNtNyH3PIzkNFgpaJlZzuqPWgqhKEFTA1T1bNP3VfFshwMflDqDR6rnWDQMqGsJs5k6ity6TXzhRdr3vIfZvfs0qyUAw3pLf36B7HY0QCjqbOINLPf6zJb11c+omU/l6GiKbKerdU9dtcgBxSeN6qDsbcXGDme5nWfa1FBSYQgd+A5Ca7vwdaD53Oc+x2c+85nD379SVpgvFv/Vl975i7V+77d/O+9973vtbwJlz/lPf5Rw/oCIhyKUIVH2e/LVhuHsivGsp2wzoahsukJDnth4SoBRNHg5sw+WrNYpKfVIycQm4GLAxbpret1ofFbDN1EvcZU3qPiGtYEPu2G9WaJm9HqHNc2K/psKp2vrX+U4ggYnr5pAqousZEjv7f0ezmpMEqPo7yOEOm/piv2+4MQjzutrEcxorr4xbXnjFKsAxaGkDm/WdYNprGqIuhvjUSM8k36gXhYGBOv9liUlLfvyWAd+DUhOVTgNDW52QUtS0FZb9CYLUvTCdDiCOWfo8QpgfmQVE1RXVs0xvTUp9DPquxSv799bYPIhQBHSbsf28ooyJkL0moEG5Q6Jc4QQbDMaD+5Czqt+ku0w9as/HI9DJDIsDNvIapCSYqxxy4ux4+nsuw/NDD+ZE9oVvl3ifHd45nEc+Qf/4B/wD//RP1KLn6+g9ZxlPrq0lNHsg6It6rLtYZfwQ6ExZ03QlrpOAauGTHCO4Ly5whRrbw5aNqCkNxccoW2IXQvBaQZUJQ4s1cZGEw78EyM/6olWKfR1R6wBQym73koCXNTJZNeCmyC2s7nY4ttWL4pWyzGCafZibNhiRMNBMQlJA9kcOpwxb91QSx0lsmmppY/RLG1EsspFSN5Txh3F2tl53FvWpCWQDpgq3lNyJufxOgO52aq3FrziG9c6RXnsycMeRvNKHwZKvyf3CrCn/Zrcb8j9ljJsVUNnVAujMqYDmbCekO6me8YhyKHfTz3aJjav1YvDxaCyKFaCsVjhbt0m3H+B+OKLtPfu0c4XBHGkiwvWr77B9o03SU8ek87OYbOBfocf99qZNOC/YjragUvK+5GkkqpGP0D0nNBSVOcSXVEMTcmJdg6VG9m2CD40+HaCjxPFe8J14BERLi4u+KEf+qGvCAmNL13PZ+Zz8ZAoenHn3U5JeOdbyjopg7mKljudKPfBK/u1iTjvCMFrux4t23I/QBZC1xC6jjCdEKYzaLxalotNfKfx0ImoJ7ueNKqPjPd4r+4OurGZ/KidLOrOoCp04HAStZNGY5mJOTQEh48OH5wGHq87sB4GTd11F6/C6rbP1hS/ik/pqyoor/v/oRwsYjgMhZL32smREW+aPRwwilo3asbm7KSvWdz1NHo57P6HkQsjH6ZR58/KOFh5JpRRZSu0m2RcqcrITgPZykUR7fjoRwmId/gQCT5SPIdMpxgnSUsw2yScDuZebwT2eVyxrBJcDCp7i+DxRCc0CLLbszk7I+92jMMeh6NpWxXzMjExvFTrMWo2E0K4IXeqWbJ3GNdJj59Dzw2VYtHNTL9e+96cIB58bGimS5rJMa47Ik5PtPSyEJxS4qd+6qf483/+z7/jJVN/tvXcBZ8nP/kRwsVbeCeEIqTNhuHJFcPZnrIv6r5gzpsi1pL3DvGQSmFMiWQndR6TdpFSQiiErsNNJ8TZAte16oxgdHdE2as6bqEgbMU1BMEFr1VTMNF2OAQHDTV1cNJmn7KH7PXPKrTsAuLUKcLZ6HdxlUSnmVMt2XBWGGmcMOKe7agVM1AdQbuAa9mmQUqHGot1oHqQ3vSC9d+rZIleC7pj21+UFV60ZK1EQaziqRdYxYc0G9NMR4mDCuyrO4R2lLwBzmJdOclZN4PQEELExaDgfIh2nBVcdt7cVy3YuKLzZVZRabsf+56sYZDTqAHJeb3IUZVFb88TvCd6rwzq/V7B+3EA0QZADAFhtDa/BjEX9H0oy1rPOfVlR8vkg5V1VSU0dQbRn+uBrqqPIBA8oZsSuiVheos4vQVxZoFHz6HHjx/zHd/xHfzoj/1YvWS+otbzVXYJpHEkDUqYE1T2YNwkhn2hSCCJZzTBv9pVSkW0QkhKRKzDmOpQqTwUh+2iIUAwE7ySyeNA7nv1+e57cr+39vdwGOysUAMKRdoFb3jK4YRCJTJzucEu1lZ+SYXUJ0oqhgEF1aepuFQV5SomOoVlGxpJ8GIzVam+r0HdVkUHWdWHXNvb3uQ56s0nc+nMAz6r+BqjatlQZ6ysfe5EtGU/qJd5HdPIKZGzZoUlC3nMOkeW9TEUzT4Uy9FukLbmsx6aXGUsIPpA9JGm0VtoIqFtCLFRyxwjmNbI61zNQvU4eNHnr+MiyjBWTlLNUrV8U/SsOHAhIF1LWC5wR0vc0Yrm5Ijp8YpJ19JkUeWB8zPSxVPYrHH9TikDJvWh3Cctw1X03zp6Sp/Xm+hxOlATrCtaM1YR0YTIG1rpPL6ZEibHFniup9jHceQjH/kI3//933/jAvnKWs9X8AFSP6jYk+3ekmEYCtshs06ZbcnsEHqE3gmDCGMWhiGRRlEmc1bhq2DzYMHZlPuhbFLxr5JG7Srt9qTdntKr3IVariQNYslOJKp4e80YdDf2RrUXK0/E5r0wNUIRzWZEjFtkYwe6fepuigUzzYJAqHgHegzE8JZctJs1qka0K9qR8jmr/3jfQ9/rRWMyErLvVVa036vWUK+WMpXjoi6vg2rYjNqGz2kwTosB0ejxykldQA8aQqOREg2r8ba7e6/ZnfeR2Eaabko7WzCZLWgmM5rZjHa2oJlMCF2Lj0EDhMPAdWflrDUPDD8hJ3UbEVFSohiH6eZIih3vnNOho5bLoJK40VOaSO4iYbmgO1rRzicK5O93DOZ+4fZb3NhDHggmWlcJkoz2ehZkydpl1FLcysE61yaVuqF/6nLqbusj3jpcLkxNu+d6PXjwgL/61/4a293umfu/ktZzF3wohbxPjLuRNBRy8QzFcTEkHu56HvUjF2PiKmW2Y2KbEruUWPcjm35gSIlkBLpSRdmT4SjBE3yELORhUJud3Yay2ZDWV3pRmhREnW8S0QvCu8rNqX0i5WjoY6w2slKtJAUUMVsVQEXrgzlz1hPVcCSp/ltwoyPm7OIzEFOMGTtmpB/J+4G802zNDSNhSPheXT3Y9cbo7fW225H3O2Sn+saMyqqumkHFspdirGKVucjXzpwi2pFPmtmUMZOH8ZAZlVTISchZyXklFyXJhUDxkdy0SDdBZlOYTKHVW2k7aLTr6KNxdywb9NqHhtotsnJUg3tSjClZlnFga6ukSCmJlHrN1g4SI4lUBsRnXKP+X361xM/n+KY6YGzJm0uV4ki9luBJg7MblQ19cCEpJvJWsywxRrY1K/Smx6Nig1nMlcK1hHZOOz3Bt6sv82EH+N7v/V5+9Ed/9Jn7vtLW8xV8KlaYNUX3Etj3iatRuMDz1jDyVj/wJGUuUuEyFTZZ2JXCUE9+sUykoIOkSUHIGCI+RkQKud+p1u/lJePZJenyCnZ7wihqVheCBpyaKQVvoxKGxQgqGyoo7pRRdnAFq4uCt1V3WSgUVxAvSEBxBHOkxDsbLNSbOFMT9YoWOKcBTYHfmv1YBypltdsxMbIwZPw4EsaBaAaKIat7RpMKYUyqGzTquINPtiPXjCxnsu3UNZurc0yStPSoDOWctDQr1laXrOWpWDnhgo4KEFpc00IzwTVTXDfFdRNoW8QHxZdMecA74z3VQCyq9udtvMYXnSPLSUXBpM6UFdMxMtxOyoAwKnYjgw78MmpgCA4xN2vpOuJ8TpxNaEMgpKy2TCkTXCAIWtL2qlzAOOhU/GgcIOP3VNKpgt9GbVDDNTtXlA8WRL24nOsI7Yo4vUMzv2vB53p98ZVX+O6/9JfYfQVnPTx3wQfo1zvyrieKDjG+dXbJj771mJ++3PLKkHk4FB6PmbMxcZkz65zps4D3BBcVrjM/cCccOkyxa/Ee8rhnv7livLpkuLggXV1Rthp4gmtoYqcDqdGkLENTiwlr+6Kps/2JBJBAyc4MBJ1Zxsi1BEQMyvPxDmedLeX92PNYuRG8x8dAiJpl4TWQ2pavs1TF4cXjRYdhVSXQ/hSbTi+FWAohZ5tj0uDkcyFUM8JUCMUpS9cA4Nr5OnS11GbhcCt1nIBaburOL6IC+87p5/NewePQaBuZOME1HcQOoh5bMY5LDUCgWIizkhNMiL0ow90VLWU0vF0HRsV8TO7CMjcRndGCARh0Ps9l8x1LOkLhBGLET6bEyRTnUHvt/YAvHu8apETKoN4FMTsVjRvreEnR7MsyG2/ZbwXvb3YSK9FTS0dRS+72CDc5gTA54DwAV1dX/PE//sd5+vTp4b6v1PV8BR8J9Ns9w2bHsF1T8sj5fuSjZ5f86Hbgc0PmQcqcpcJVLlylwnrM7AxDiT4QnVesR0THBIAQg067S1EOzG7HeHlFvlrDftRJbnHqix1n+G4BYYaLE4QGcREp/vqGBhlLUVReVSKSI2R97KHdbsHmoORxKKm0La64qrVpneCDJ8RIiF6V+7QGMm6NQHGUrBldGavImJYc2hEyEbasuJCYHCiDimiVfa/EzaQe90oGzORBW98UxVkQLYG143c9n3XALwQwX3Ul4VXZC0doI75pCU1H7DrCpMW1Lb5pVSoitJoV2ZiERi6VlQALuDZTpVmFDr1WEFff0zXDWkHda1Y6kgih6PtOOj+nAHG1MMrWfPBqUdMoAx1BzR77jM8eiqkglIjLATdaljsac9xEz7TU1Ownm+a4ZpKi2FDSUROScayyw09OcO380N0CKKXwAx/+MD/wj//xM5fFV+p6foKPAbnjkEnVWUAKJQT2MXARWp64wJU4NgJbEdYZtkkYciGLcn5iiHjvKaWQxVGco1jmQE64cUTWO8rVDnqVkAgx4rsZvpsjTasu2tlRitf2r/MI14LpB/3ipF2cMjpIDk+DiE0nu0gWsZJARbvcDU1fEZvYrniRLW8Zj2ZZ2k3TtriniEMIZOuejfuRvBvI2z15t6f0e+XRGJ9GHVLraIiKobvBwOlBHRxIJl4/jjDqvJte4DXfM1kNkwdRrEoHIr3XYONCUOJktPmkYKMjTaP4ShsJXSS0Ad94fFT8C7vsFKy+bucHZ63xoh3AnEdSTmovg5CrpK5oN1EDgfq5Sa8t/0DAiyfvetJuZ9ba2s2TUUF0HzzSBMJ0QjPRDCRtB/bna4aLDTIUXPZIcpRe9O+jAu0y1GNl2Rn6XYb6nRZtfDAKoTjaUghpTxpHwmxFs7xtgmHXWc+TJ0/4K3/lr7D+ChGI//+3np/gY6sMmWQmek6UMDjtZhAjg4uUGEkozrMrhT3QFyho+l+KMI7CmISUtAuBQL8fSNs948WWcbOn9IkgEJtG6/7VCjefk11kHG1A0NJ7zT70z2wDpnnsFd8Rh8druVV03AFjX9fTSmzwVHNwLK3QjEdb9l/e5cpF54KqsIKm8YoZxBDxglm/2BjDbqtM4t2GPOx1CDWNpimtin2uakIPauUsabRZsdHmyrLxcpRdXSyjUgjYPlClE4h6d6k2tpI6NRmqow2e4qsfmuFw9t+haNW0Tz+/iLp+SialxNDvFVfKlX1e3T71tfV3MlJG/d1kQPyuhyERCVpWDhn2ibK37C9riYtzSiCMGoDctMU3EY9jf37J7uk5stniUoLR5rNyUYrCoJuYz8k4H9fZoGRPKV4tkcThiyOkRCxC8A3d6h6LFz8EsU6u1+9X+K7v+i5+6Id+6HDfV/p67oKPw7PfJNYXW2QotKGhQxj3A30q4CN9cVp2lcxOCknxXuX8ZGFMxTrdNpNTQPpE2Q6U7Qi7RCj6am7S0hwfE1crpJuSxVk6j02O2U5GOeAJUq5bvLWj4Qx4vt7HbN7I6UUanNeWsTMDQlfZveYSqpulvrTR8jUpsgBoJZyS2hR70pEHG8EYdBBVvet7a72bBY85NyiHR/lLbhhUUKu25tOITyMhKRu5tvIV1L3RMhbd5b2zbp+YwJfToFO8R7yCyMXsf28GjpIzKY1mEKj3iSgon0si2eBvSSa/cfh3yxAPwVrfCw486ioi+4TrEzGh2kJjwfUZ1yfcPiGD8o6cq7L2KK+oa/GzTvlG4nD9SLlaw3qN69VdxBnVobb8ZbSs2TqjkkUxv+SgEqSLxxVRtxMCKR4ze+GXweS2cXqu14c//GG+67u+yzapr4713AWf6AOMQtok1mdrlX4omf04sHOFR2Pi7VR4kgqX48hQCkl0P02laPDJiX5MjDkjWXAFyi6T1gNll/DJeCltpF0saY5W+MUSCQExZrS6e+pApHMFb0p8SjpLh+nnuuuWks23qX4SBZ51czccxep6EeMwFbNOQbtaCpRWEXe92DTwqIUuQUW1sHxBNahFSyKzy/Gp6FzVoOxd6XX0ofJSXBElHSbNeNzYawfH/MZcfz3XVPoe6bWdrdPZRposRcsKBXks29N5NlWhVPrAtVe7icIb/UEDS1GwO+n344sK8Dv7/MUUGIu1t3WA1AiXUvlFHMTyXQY/Fvx+xO1HQiow6HfthoLsRg1C1jErJhuL0xGMMJ0RZh3iinp4rbeMV1eq250H3RkoWhJ67LvXACjZxNvGAiO4pO9L9bczgmdXOsLdryOcvNfKretL78GDB/zRP/pHv2rKrbqev+DTtqQkXFz2PHjrCbkfOe6meMnsKLydRx6XzLoUelPJLc6RELLAWDJ9EoZUGMbCOGZSn8h9pvRF7VFEtaK7+ZxmMcO1LQVv2jaFYPT2CvTWUYJx7FVJsE5po4BjMSNC3Y9rJ8YshQExvzA5eKhbSxa7ACzD8aZeV4NTKcoFOsQzC1L1eWtLOuAVCM0qfO5sILSComSlBTgJBMsSyNouDqUQRQ5M6DoGUYaBbJpBZTS5VVA3zRIOWU8NQN4Af++DXtCa3h2yt4Npno1gKK/I7jcDQpUl1d/V418/p8dr7aa/X3kzo5VlVW4kq7No2m0Y11e4cSBgVIJRhdRk1HGQsd8bdpeV0NgE4nyKnzQUKaTdjrLdwqADtqWMejqAfm6v3c9iLXfE9JKSvhc/msAant7Pmb33lzN78ZdBrCCzrmEY+It/8S/y2uuvH+77alnPXfApzrFNwuU2cX6+o/Mt95cLVm1LAtbBs4meIQSS09GKIQvmM0gWYcyFMYvipsmEB0fLJlBcgibiJx3SNow5K45jfBWpMhZ1atr0iIsxn5FykFsoFPDgYxUJ05NSEZybYUOXwyCkZ2a07P46oW9iaM7I1JjvWE2r9P1dD7JqcuQO/BxMGoN64RJxJZgvlImVmxi/N+Qhgjlyqg6QulI41UzKThm+NcAVMazLHEHEWnnZqcyJItFaKtpkuvdmp5ySlrHZBOWtM+TAPMH0OOn7rkx0DVyVs1UzjZxVxsNVc0Sbq5Khp396BvteM5SqU5SUmKiicDbsaprR4iFMG+JiggtOgfq9ZoUlKa6kn8eoATeoEoK5n9aGxqgibpIz2TfE05do3vMNMFFX1ZvrIx/5CP/N93zPV5Q28891PV/Bx6lC8pP9wJM+8/bVluga3nv3NquuIXhHwjMIDCpowFAS+zyyL4lUMRPdJAHM2kQHUgM6JOhbT5y0mmYH7YwpG1p3uVxsR7TdkqTa0dicU5FCFh1YdNUlwybrDZ0AsfJEFDnyggpumVOBZkf6RrX0Eu0c2TCk86r3cljGrq5T9XW5okL7gmZYIvr+aqB1opwn71q8ixqA7D0pq4bDIKRYUMDejnNaMklxGsBN5QTR19KDbdmVVNlZxYdcVUfE4aQKpulxwLp+zjppOgtmZZo4StH3psfQqSTpYG6sYzJfLR138MXoE0lLYScZUs9weUnebA5yI8pM1t8vfQ/D/iDlWkoml4RrPX4accFRxsKw3THut1AS3mgQ4oKa+sUGGgtCRfQx+doVllx0kLibMbnzEu5nCTxvvvkmf+AP/IGvKEeKn896foKPbf/z01uktuHtXc9WIv2YOVosSMMOMbAyiVCMGYuDGILOboGOQNiuqZoM+hGd/S9ERzufEOcT9f32QYHiyla1QcCcRsZqW2x6MyVrixnbzWtnR4Flk7NwDjCQtGir/XrpPollOfWuIsXcVXXeq2YttfRQprXJcWAMYhvALPaZ8eZVZqWO8kx0rKRmJTcbbvrUh33bOEh6Ez2Q+oPzStSkXmQ6RKruGLWEUgqC0hlMYtQIgpKVmKiViWYrOSk3STcFox6UygxHX090st4J1xlTUZVJLZ2UJiCDzqqpXKyNNIwjebtmd/6UcbPWTuB2i+y2FPu72iHtSPuNMt57a4N7T/ABL4687Rk3W3LfG2FVj7Xib1FF4ECzwqSBRyVEknZGfaA5vkN76wVjMV/vGk+ePOGP/NE/yuMnTw73fbWt5yf4oN/N8viIOJ/xcLfnUSq8dbllt96xbCJT72iDZg5FtL5vXKD1ns4HoncEh8kmhGvGLNeT0q4NhGlDmHW41nRwxFlnxchrUuU8TUQK0ZMyKO+nMpaVyWsOmsZSdlj8qeMYFmx45oK3EsvwIec8PmhWdtD1qY/xquRXSYviMCJiIDaNdmi6ltjqzxhpTwOMDbPWTlo21rAFtZzNQcFdBzoVa1d2uGYq9VNdv3cFkTWApMqxKUpazKYjnbP9fEOaVYOMlbBZJV2r77uUYsiRZjwiaJYoWGZksqyjaVOPvQqq5axOGMOgwLCJuPuxZ7g8Zzh7AusrZL1G1lfki0vK1ZU6x27WGpT2O8puz369pt/ubJREcKlQtjuk31s5LlpWh6jHOGvny+cRX0ZkVBujUjLZe+jmNLdexE2Xz1xqIsLf+Tt/hw9/+MOH+74a13MXfCbzjuPbR4xd5HNXaz759JLz8ytutR2nIbKMkWCEwsZ7prFl6iNNvWAATyEGR3S6M2FfuG8iYdbiJy3SRLIxj0VsFsxmnNwBsdCOhmq4qBxH7Fp1zGwaHYg0UqPCHjrPU9nPVdDscGFbJpRzIiXVkC4uazovYoCr2jqDZkAHDMnIfNrWRrMgK/V0jiqaWL0GRg2O3nSCavtW319dzjudxbrBTaIKhZlOERVAL44ixmcSdZQoaKYjVm5IUr3rkjUAqfuots3zcD2K4LSegpJJY7ZJeZWi9YYTKTVB308pRXV3dltkv4ehV2LkoJ5nYVCagBuHg+lhyAm/35HPz0kXZ3B5wXh2Tnpyxvj4nPHJOflqjdvvkf0O2e7IVzvyZkRG5QPJmMmbPWWzxY07zfCMcyRFHWTpB6TfIcNOP39OujFOlkzvv4fZnfeYLvP1Oj8/5//15//8V6Q64c9nPV/BB3BOOF1Mec/pMW2IPO0Hnmy2hBKYlkKTE43zNM4x8Y7Osh1nred8AEQNX7BkVxwQBaLDtS00DVZAKLnNOkOq0KflU/SeJgTlqgSdildcpk6nVw6yMmYxHEe1hkVnuKxEUxqQlTiWfRRBcYAbQbCUrIxs9NvxtcSrc1MmtiVBW9r4oM4NNfsKKk+h79X+3fhBhkbpe3POZtac8Wg0ONaMRwc2LfDU4GW/LmDzc97a3SqjWgbFVVTH2bLG6rBRvbEESrJjbK8nRWwy3i5ue91SCilpxiFJiY8y9LDrKZsNst3BbqdusrXcyTqGEpzHp0ReX5EuLkiXV6TzC8aLK/LVhrLZ6fT/dodsdshuwO0Lsk/aOUSdU7ZnV2weP9UAZIOs2V6HnNUld7AuYRpIeUSmc9o7LzO9937c/OjLyIR/+k//ad56663DfV+t6/kKPgJpv2PiCl+zmnN3OmGXCm9ebRiyMPORRlD7mKLC4c66RlmEsQhJyrN9pkMdhMppxoDrGlwbasVlaobaMgfd5b0NPvoYDxPnzluJJtoJ0imDGxcSCgZrs+pGu/hGu9yubQWPbeiUYALpkhHUvgWvUpvUIGKKevhI8VrqlRgOZZavQcdATXEo09gCl9j8mCj4Yu9G79NfsPtLUX3iA0Dk9Q0bkdJgIQCVszUagTftJFdE58XStQOojNc60EFAiro76OiJvm6xTaMC5RqcBYwl7AR8FkIS/NATdgN+P+D6EZey6RKNh+/Be31vebcnb7aU7c7GUIy7tB8p20TZjuTtQN6OpN1IHoRSdFPJBXKf6S+uSFcbk4hNxvVSjlL9nDKYn1oILN/zIZbv+wbi6XuM03O9Pvaxj/FX/9pfe+a+r9b1fAUfVMiqi3DSeY66wNUw8Ma251KEJngikIqwz8I+K8FQOT5GMhTNMAyE0QvFFc1crL1eDNgFJQwiIyKqYyOiGQQu4MzxVGhwLuqUcwlIDtr1ydq5QZTJW6qmtI/Kd7kJBJtPl/Oq2+xiJLSRpouE6PAmw+C9av9KEHyjes+1xCo3OmviTZvYBxvS1NKLCERvnmHx8PrilUV8SF/qIajt/loOIXinUqOHiFks0xENVA73TFbpqRwjyzxsTAPDdFSISwNbyUbME30dLBPUrpmVcEYCRCBYuNMWflRX1tEGZ0dlGpfRDAaNOyTO6fFwgeADASFYGdl6r+z2DGUsjPvEuMuMfSInEDyjwDYLm5To+8TuYsN4tUXGwYaWHTJmyphx2dtGJMSmpTu5z/z9vxJ3+j4bobi+xC4uLvjO7/xOxnE83PfVvJ6v4ONAgmdxvOL28ZKucVykxJtDz4U4RoFoXaXBwag0EyshlLqX0HLGYeWY05PRtw3tck4zm0ETKCREBkT2IAnV7tL2sHemJ+xbRFqcmyBlSskTJHVIaig5KHO3OCXeeeXlaEmmpRnW/Kqll4+BECL+GXmNaiRYRzH0FrxTvWgTm3f2eAnXHBPFoRyu8fg24FuvVkBmUFgjg/iCD2oFdBjPqCMaot0anSLXvwf7U7M6Y1GLtXsqP4n6IP3qiqkIunGg7Pcm9WpuGAYq51GdPrxNix3KOruVSkI0XRxn5WAuOh+GCcFjXTFBsyjNmKz9L+BQZQAsWw1tS+wami6odZJX+5v9PrHbJXa7zL4v9FnYZrjIhadD4kk/cj6ODENmWO/Iw6gZnmjwqoFHk8RA7k5Yff2vwZ289GUCYWlM/N2/+3f5xz/wA4f7vtrX8xV8gHY6ZXp6yvxoxXTeId6x9ZF1jOxMoSV7TzICnnfmWGWDjaUYPoICzyGgvJ7FhLiYITHq3BEFkVHFWjBFOgscwQeCbxCvFrY+TPF+RnBTgpvg3RRPe+DwYAEmRhsvQLtBWlJYIlXLn6DteWelVgIrL/SBxSxZVIzKQOGgJSMWrBTn8RCcYljR46IGoTo97qI+xgdHbCzjajToiZU1khRcR0xvOmvZpDNcisdoAKh6OtdZC6CgqzGbnKAt9jFR9lv8mFBJNmykwrhHVuUFMf8rey5npbGWf4YNVQKic+ACxelQS6kdp0o3sMnyQ+kIJpURcW1HO58Spw2+DfrZnWPIwnZIrPeJyz5zOWSe7kfe3g+83fc8GkeeJuHJfmDXK9XiQFQtSs50NlO6z54raegXL+Lvfh2EawcK/UjC//g//Y/86T/zZzg7Ozvc/9W+nrPg45HY4GYz2uWck/mCe7OO4B29c1zhuHTCEGqBgILC3hPNoaCY4FStrJx3xElDu5hC06CDEfXVNOgEezKHVxua0KiZm5UzuKiiV15JeloMRJW3kNqeNm6KiAlZVWFz5bjULIXaUne17ikkKSTbwQuF4jLZ+DbFOXPm9CaGHtWH3kX1BvNRsZ3gcUG7cMSoRLhGbYQVuwrE2Ojz2LgDlrHo9W4DrgZ2KD/HgmfVRE5Jfd6LZkkAJesu4NCMwKeCGzKy3+NyUeDXq6HfdWmnx6MG5WCmiTpqUjE0bQeoMJdpBTl3+Dw1e/NGgQjO40WPqQSHbxrCdEqYTsk+MDhIHpLSuhhLYSyObYGrMXM2ZN4eEg+HgQd94uEw8ngc2Yhm482kU583Z3QL6zxm1+AWd+k+8C3c+ubfQFg8OzSac+bv//2/z//jv/gvePTo0eH+d9dzF3wAH/BNy2S14PRkxb3pFCmJdR7ZOugBvApteSlE74jOHWalqp2K8sA8oQvEeUucd2AYCM5oOOI16oiYDY8/pOoExU3EK9aij9XdmsIzj9c/Nahpt0aHMKUoziKuaDfLV3DZMq/aa6sdLmun+xDt8R4JjRHaGkJsVWisaYldR+wm+NhQvIeojyuoOqDKWkR81EDqY3N4befVPcOSEEVULDOroVlJl0agMzayKviZj7plOyI2ZHr4PS3bStXDdlqOZhFSvn6sc9cZo3YOla4goKC+bS5YgHLBQ4yEtiU0rTnOalCtGJsPWuqK1OAzwU2m5NBQzM9dB18roOwYLPg86gce7kfe7AceDom3h8zTYSB5Tzud0E6mEBu1vvbKucpjZpsd0xfez91f+5uZvPR1EKb6wWx94fNf4M/82T/Lw4cPD/e9u3Q9f8HHOUrQIb9bt064O+/weWDT79iVRDaFvwnaateGuWYwXQjM2obGe3AFHx3NrKFddBANvEVxAu3qiB4CAz59UKErJRK2iAm+azavJYmGIPu7MY0Pu3LFL7LNHxUFoJWYpsHMOW9jGfXjOpUbbRpc1xC7Ca5tiV1LmExwTav+TtMpfjJFGr2QJDTqzBkCxAaJLSUGSlQwWrMfM1KMqh5YqFiRvo8DOdJ7neyOSp7DiIwc8kTLWop2rdTpVAcnDxkQ+ro1g/HG8dGRdSNL3qAb1GNWqQSuynHUqIQO//pGyytxGpgxmoRvOg3MPprZIDi8lYZaDLbTOd1yQZxPjZ8VcY2Vqd4ximY/m1R4OmQejZrxPBpGnoyJ8yFrRopTcXsfNWj1e7bn5zw9PyN3CxZf+ytwq/tfJomac+a//o7/mk984hOH+95d1+u5Cz5SiuIeTeT09gkv3T7m7nKGp3DZ96y3W/xYWDnPcWyY4GkcdNEzi4FZCEwaT9t5mDjCvMN1QUXDy6gGgdaqr3NIBzC1tqxjtAsBstP2t57OlvZQ9KIyNwLdTS2PsWl0bZkXfKgyrgHt1GfLhKrsqKdpp8RuRuymuIm6qYbZDD+d42dz3HSKm06R6RQ3UwF2N5lA20HXIV1HCVouqmC7sp19axKhTYeLLaHtcLHBtw3eZE1921hgDrWiNN9yLQGzaKbjTdZU/bKM/W3qhhpNtFzSTpNmICWNeFMM1OwkQs1uLNsqzjCs2kGzwKHXsFNVSHt/4qMqUzaR3EZKbJRuEKumEOZXryqWtC1+YseqaTWTjZ5QaRYiDCWzE9iJYyOOrXg2BLYCo3UuY6sbgY+RvNlx/trrPPz0p0kZXvqVv4b2hQ98mfVN3/d853d+J3/7v/vvrvGsd9cz6zkLPoIwkMoe3zrmqxl3T1a8ZzZjBYx9z7Dv6Urhdmi4FSPL6JnHyLRtmE0i09YznzZM5h3NrKVER/YG5JYRST0l7ZHUI0mHFTHyG7VsQoeKDkJYddq9mPwCaDnhtTNlV5/ef2hGWf0RBN8WbaG7QcVe7PlxdlHGRvWNY8S1LW4yxU1nlMmEMpmQJx1logHILxawmONmM/xigV8s9PHdBGk7fNvha3YQO80UJhOYTnGTGX4yg7bBdS1+0qiLRNOQY6DY60u0DMSJVmoBpNIAxPRuhoQYWbB2xvQ/k1UVVMhsGJRU7US7d17LVO0mRtyBsW3a1k6PnYqTgQs60oB1+pRA2Sgu1zZIEynBaxlmJZWSLx0lOP2ssSE7j8RI7NQrTLNRzbgOv+Mc3geCdwTnaILTkZ1pR5ypm+hwfsnF51/h6rWH0C6YvvQBaCZWR+rKOfM3/sbf4M/82T/7VTmt/nNdz1HwEXAZQXk3LhbaaeDFeyd88GjOXe9onRBDYBoiyxCYxcDUB6Ztw3w6ZTrtmMwaunlLO2vx0xZnk+YO1CQva+ZTRh0BkKTDpNFjvtqG05hTQxCn3ZdDS1eDjJgcxeG9o/waFx2+dcTW4RsBnyhkxCec1w6bcxnnFCQNxs9xIeJii8QO301w0wVhscAt5jCfq+fVYo7M5sh8TpnPYaHSr242Uz+sboI0DRIbpGmRpqWEDtqO0uh9dFP8dA7TCW46w82nuNkEpi1MWui0nMs2cSE+I06tg4uCQCr4ZUG78ndq/BWn8iLihDz0pP1eJWel6ACt11JKggqOHfhPtfyqgciWYl9Ou3eGY0nQQEKjAcg3Hb5ptItYMR2n+CFtg592BLPsidMZrtHgE5yjMcwwIDTO0Xk9pxbBsQyRrg3MTo7pVgvSvufy9be4eOsxLky588FvhPnxM6UWwD/7Z/+MP/bH/hhXV1fP3P/uenY9R8FHU/cyjuR+y7jfgCRunyz42pMF7511HIWIJCGXCuqa44NzhCbSTju65ZQ472xwtFESHk4lM8Smnq10cGI2MlKFrlRZUL2fqtSDsVmt9YzxUZzUbKda9NZyzNjL0VujTMBrUNXAY0Ji2ibTz+2ULOibltBNYDIlzOYwW+CWlt3M58hkRp5OkPkUljPKdILMZrjZAqYafErTUZrukAnRtEjocM0cugVubrfFElnMYbGA+Rw/n8N0inQddC2ujUij2Ye4ggsF8+nRjE+H4ZQZXrPComqOBcFFVYVMw15BaleMYFkxHuv+2fMXu1VC9c3lnHF2zMMdHykhaADyBqRXTMhAfedUQ1pixHdTLWXbOW4yJXQTXGwIzhFxtA467+icoxVh4uA4Ru5MOu7dPuXkxfswnbJbX3H51kOyNLz0q389d/833wbt/Jms5/Hjx/yhP/SH2Gy3z3yGd9eXr+cs+DhyPyDbnrzZIWNP4zLvP5nzDbeOuNM2UGA7qmHgOo9sxsR6HNmMA0MpZIR9ygw5aRlQ1CZGiir3qWxGsa6V+VAVsRJsT+735KGnjHqTsScP6lqpNig6MFktc8WcM1WkaiSXTHZC8VUl58YuLmJaxkpMlOKVyp80c8gEJERKiKQQFNMILbmdUdoppZvAZK4Zy2wJswUyXeDnC/xiCbM5brbQINV05K5VPGgypcxmyGwOsxliP7v5AmYzmGvm5CZTUmyQtoGugTbiGm8grQZS8ZqhOq/SspXq7cnqdIFiRq4NhC7iAoqZOfDBwN7GI0EQXyg+X+NfehIonqazKxqo0ONWGeLirPOoT0q40ckjVCWAayDbVTysaSEo7hWaeLBaipYBtd7TeKGRwtTB6WzKe+7do5tNWW/XbJ+eMaw3zO69zJ3f+Ftw999r9Ivr7/h7/sbf+KpUJfyFrOcs+EDeDowXG/ZvP+XqrYfkzRUnrecDt4641XgkDWxy4rJkzsfC0zHxZLfnwdk5D5+ccXm5ZbfeMux1itqBel5lVZpT0W/NYGrXq97kEFRUx6cMOi+k/lcjpR/IgyrhlTSS7E9nM0wkYwlTW/MRJxpkdDLBVAUJxgmqrheQzXAQp+TG5CLZNxRahEDxWpIRm0NbXWJUXlTXwUQB6TKZIFaCuW4K0xqs9MZ0CrMpMm2RaUeZaKYjk5Yy6QjzqWJEkw43aZEuIg2IzhVowDADPkGdQB0jYFmdK0goFrQ8RAeoo6jzGRcKzhe9D82IFBT60nzn2eVMgE1th5UkUPk/Siu4NiDUJkBUXSen9AOiOqQW70iG2wXniE5Z88EY8d6YSA6YTBoWqynDbssXP/U5PvOJz3K+Txx98OuZvf8bvoxM+Nrrr/N93/d97wLMP8f1fAUfPGk7MFzs2D+5ZP3wMbvzc9rgmEdhIZkG2I4jT3LmrAhnKfN06Dnb96z3A5JgElui87gsBx8qSSqiXg5T1tXcTbOiXEzPB9WlKeNgwlWqZyzDnjJsyfsNeb8l93vKsFcP9GRWOkn9ssiCGupEvDQ4CbgS8DngJOKKR7JHsgqeSYlICYhEDUbZq+yp9qMR8XjURlgB2oppaIuc2Cj+0XXaFesm5HaCTBfIVMu10k4orWY1rm2gbbR08Z5iQ6oSPNLoc9E2SBtxrce1ypx20escWnSGzalBH2VUML+MOKdzctkVOIx0ZEruKdXG2IB3caN1EhNOFd3Aggra69LhVZQL5CoNwDpqSjasM28qLULQjpjT6V6lSTid9q+zbuoWYlwlY2HX1y0Ifc4MaWS6mNBOOh6//iaf+NGP8dnPvcFmesx7vvXX445vWZdOVymFv/f3/h6f/exnD/e9u/7F6zkKPg7wTKZzZrMjVke3WK2Omc1mTFdz5m3gxVnLUefpS+LBfs/bY2IMDRIazobE+X5kM4wmEyGkUf3EMTnUnFQIvYwahPJwbUZXGckqA6FdmjJYV6xa0ux7yn5L2e8p/Y4yXAegvN+yX18xbDekfqvBaxTIaiio/j5QRiijV0nSrO6jrkQke0iOMjryIKR9ouwTJHBjlXlVgFwZwOriEMM1QzjEhtjNCNMZzWxBmC9oVkc0y5V1xDp8o4O1xWGMa6G4QiLbUKoNpsaIa3RMw8VIiR7f6TCs92qiWCQjpq1a0kAug2kUKZcnWwYgkihZTQzJ6qkumH1wSXbxVwxNKtJtyZDqKQUDk3W8RAmRVFtDZ86jbae2zEGZ3Ko5pFmTAvrafKBO32PdSqdMbp3+0NxnOel47/17QObs7Udsr/acD4XJh76JxTd/i1o/3yi31us1f/Ev/IWveo2en896joKPrtnRLWYnd1ic3uXozn1mJ7doFwtOj1d84HTFe9qWiXekEHTcQmCHZ5OFdT+SxWnrOhonpBTGnEgl6/xXUIp+MK8mP9VSw8863KRRbRzvdZjRhMqdZMtoRrXPKRqcMIthbSmPlGEg7feM2z1pt2Pc7Rk2W4b1hv5qw2jOmToJr84PkqCkgs/gisclhzP7FUYxWQpV1dMJ7t7sf1XIK/cDqR/VeaMOgHqPNJHQTYjTCXHS0Uwn+LYhGdsaZ8wlpyMooRIOa1DySgPA6xiJc+Zd74Iyvn0wdnfNxDSbUCqC/rvKr+qLeesaFrM5rgOkYGC/ZTua5dSL2nAdFMS3u3A2eiKhDtpGXNNRGuX1+G6CC60GJXFkTA3Ae+voa9DRnwvRnrPPmTEn5iHw4vERc+d4/MYDtudrJrHh5M4tPvTrvg3u3D8QU+v6U3/qT/Ho8eNn7nt3/YvXcxZ8AglPih05Tq5vTcN81vHycs4vW8x4oWmIMXIBvLLe8GhMFCOgESKTxYxuuaSZLwjTTu16m0ictjSzlmY1pbtzxPSFO0xevM/khft09+7Q3j6mPVrRLpbKB4kNGInQB02xnfME7xQ8RXkvOtJRaL1To71xpAw9eb8lbTX4DFdr8npL2u0pvbb5deBS2/55UOvjMmR8gpCEMGbCmPBJXRFc0olxzb52mp2lkTzsTWC9ypUaJmLDqUQHAROm1wtYDu/b5q2KjU/U8RQUgxJRWRHnGpzvcL4lhJbYTPFNi4tK3vNNQ4iNzZupxKyzAKQC8oZv5aKuGKjWtNSAeRAuu8Z+BI3TGiaNGW08IiV2KpgsviF7BetziNAo8dKHFucDMTQEb90y+6yNhyZoa30SA433pJJIJXFvPuOF5YK02XL5+AxyZjHruH3nFvc/+LUQ25tJD6+99hp/82/+zes73l0/p/WcBR/IuZBHIYknSSSJ9lGaJnJ73vL1qylfu5gwRXiSMq/2A2d4Qjsh+KCSGrGlWR0xOT2hOzkmLubEqWIeTCaE4xXh7h3iyy/Tvf9riO97mfDSfcL9u/g7twhHK+XYdCoy77uOOJ0py7VrCZMpcTqjWcyJ85nyiaofefA4Z9rEvVo0y66H/Z60VSO63O+QZG4KKZF3e/qrK9J6g2y3yGaLbPb4/QD7vd12pt63RTZrynqN7DbIfgfJVPT6ntTvFAQvilulNJCz8ptUK0e7fuSCSwnpB/V473eU3Y6y35H6kZIGK00AF1TnyAZvfWhxsUFCoEQHjSknBrSMscyu8ncohZy100gRXDarG+HgpPEvWnJQeMwEry4SrlIZTGIkh0DxEWk7ZKJcKd9N8FFLzdB0msnpM+KdowmRrglMQ6ANjuhh0UReWM1pSub87IKcRLWXZhO60xWTl16yrOf6XX//93//u631X8AK88Xiv/rSO3+x1u/99m/nve99r/1NoPQ8/Ykfwz19SLT8unY5fCn4YSCMib44Hg+ZJ7nQF2HWNiycY24nz+rWMZPbp4SjFTRehyMcSp7rWtzREe39F2heeA/h9j3CyW384hi6GTQ6rOmD3kKw4czY4NqWMJ0QZlPCYkaYTwizDrqoejqNjQI4xSac+VDpRLe20513xFbLQpyKUJVRrWG8KHlP0mjEPSM1pgyjBjOGPYwDrhhobsFEtYU101H3U81ucMpnyimRxl7lSHNWX6ps/lL9oEFsGAwfUz1lJ+BK1f1RgzwRs09W1Mc4zTb7JSrMqsmL+ohl41OBkYgNt1FAWLNHQUFkhzGNb4DAigFVVcNahF3fjw28aKmn4y7KiHYHc0I9DAWX9HPm9SXS9wQb9diPhfWo2su35lNeXC5Yr6+42GwoDkoXGI6O+Jp/97fy0q//d/Dd7BB8xnHkL//lv8wnP/nJwzt7d/3c1vMVfNLA04/9COHpIxqvVHc9Ja09nkaalEgZnmwHXt/t2QPiPCGPLIPndNpxeu82i/t36W7fQtpISknLgaaFyYz29h2693wN7QvvxZ/ehcUJYXEMswVxNsc1qtWT0qhtcefwbcTPZvjFXMcalgvcosMvJ/hpS5h2uEnEdS20Wq650OJjxAe9xHxwhBi0De0t6RQlN3pRDyvJ44F/5MRM+4rJdPbVUz3hS8ZJUkU/UUlZ70x8zCtTWJxybyhq8xyK+le5pGCvL5r5+HEgjCN+HPFmHSRmjaNBSLOXYhIhSFESsrP3aWoCygS3oGBBt+YIISj4q7ZACvs6FGvRgKVt8Trhro/TaXqxwFbLScWJqiZAxZjslawjhj2/iHmJpRHZ7ymbNePlBYwjMajp5K7PbIaRzntOph0ljZyvtyTniV0gTVuW3/gr+FW//z+iu/eScXt0vfrqq3z3X/pLPH4X7/l5r+cr+OSBpz/5I4TzRzSmT+N8MAGnQk4jTfAEF9nsB97Y95yNia35eZ2EwIurBXfv3Wbxwn26u7cpbUPOWYXIvYdmQnN6l/aFl+H0HrI8oUxmSDfFdxNoOmJs8C4w9j2lJHx0hK7Bz6eE5RLmMxt76PCLCUwbZNIgkw43UQq/n84I3QwfFQvxTVTXi64jtp0OfPpowLPhLqKgsnbcMiTBl6x4Tr+HflCRrpJx46idolwUgK4uD5V9bQxkb50xRnXoJCV11swJN6gFDcMI44A3Pywdncj6mFLw4vFSLCsb1NlU1IzPiXnYG4akmE6dvVVCpgbWQgyqSFBytoBTuVZopmTWORpwjAZhltJe1F0ELKPj+nMegGvqnxasLANziJaU2zXD2RnD5SUuZxAYsnC569mPhWnT0ITA+fqKzTAS25Y4aRiPlnzdb/ntvPRt/y60z0pmfPgHPszf/G//W3K+6c/27vq5rOcw+Pwo/uwRbdSZHRfCoa2Lh+nqiPlqyXbf85lHT3m4H1iLo2ThtG2407VMu4buaMHxiy/gF3NyKYx9r2S+2NDevkt37yVkeUruJkjUAUvftgZKAmUk7beUscf5gmscfj7BHy0IJ8eE4yP80QKO5oTVnLBc4Jdz4nJJXK2IixV+Mid0E0LX4bsW33W4qY4++KZRXZpGRal8UOxjHAebOcvKmDZ73zz0xi3qdUatOmPaBV5Gc4oYNbMhp0MHToa9ek/1+jO9SZ32exgG3DDg7fnEyr7qk1XG0Uz6esRAdBl6GLX7dwhoyaxkUlF/rVQ7dAquq46zGQyalbCM+pp1Tgzz9apDvGLqA8pC16CjkhnXGVgliDpRHEdLMyUKqpNFITiH7PaUqzXj2QV5s9H34zy7oXC56cl4uiZqiee0tR/aQFjOefHX/Qa++Xf/fsLpvWem18dx5A//4T/8LqP5F7h+SYPPt/+e38P73vc++5sGn/Of/HHCxWOaoJPe6h7hKCUhwTE5PWE6X3J1tePjDx7y+qZnFxvapmUZAgsROslMuobju3cJsxm5CHkYCC4SZzMmp6c0t+4iixXSdMoUNivi4J3yfVJPSVvKuMe7rNKksw5/vKK5c4tweoI/PiIcL4lHJzRHR7j5HD9f4mYLXDfDNRNjJEcdgJx0+ElHmNj0eTfBRQ16vmlwjYp++SbivOo9Y2p9lMK42zHudtdjItnkPQ3ElZStFW9BZBw1qxlG/KCC6340gfdhUAH2YUCMpa3+4ubOYHo9DKOOvAw90u+g38HQgwUjGTT41CDDYNSALIofWYCpt2Lazuo4qhmdUhQUNK9OFK7IQb7DSZU/McKoGD8o3wg+xvpR/EnlOYp5azUiyK4nX1ySLteU3V41n3xkvRtY94NhUYqXzeZTJtMWIrg7t/kV/+G3c/It3wa+NS6Crr/wF/4C3/u3//YNmsC76+ezfmmDz7d/+5cEn56nP/HDxLNHNDHgovlOOdHgQ2F665jQTnj45IIf+9zrvL7Zsw8dXdOqrMPYs6Kw8J7j+Yx2vqCZTMkm8eBixHcTwmKpc05to23zEJT7ERzOWfAZd5C2OhrQBJjNCCcnhNNT3NExfnmEm61gusBNltDNYbLANzNt93oNIioCXy17WvUN61ol/ZnejJ9NicsVcbUizJf42ZxmOcfPriUgQPWO1PVBCHa56UiHHkKMuUtRC5uQTNo0aYByY0YGK9dSMqF3zUrE8CftihVCETCvc5cG3DgQszp+uJJwKeEr3lSB9Sy4rFmHgr3X7XtXfxYtJ6lZWrIysh9xo5r+yTgYxqUe6C7p61VKgBcNwN78wELWnylWwjrRzl4uhJTonz6lf3IBO7VVns4WDClzfrlhLOUgw9EtJnTLKSkWtq2jffllvuG3/y66+++1wKPB59XXXuMP/sE/+C6p8F9iPXfB58lPfAT39AGNVxBR7EQqOZHSwCgZT+D8YsdPfOFVvni5ZR8bmq4lOujInHjHomROpzPa6YRusURcYNztQIRU0Jb7fKn6NU4HFg0C1SaKCWbl/Y6cRkoI+OWK5vQ24eQU5iuYLpHJDJoZtDN8N0NiQwnqXFBKIY82Ie9FByqbYCMOOlNV2g6ZzmC5oDk5IZyc0J6eEo6P8cslLGYanFq9hW6icrCoS8W1Po66MninVsre6e7viwYEdRAtOsSaVW2x5EIpSYmCPuBDg0MtZxSC0iCm4LQa8QWnr+HNwqdyoFzw+vtGRDzwcExm1qmVCM7rTBWlWClWdFg+a7B0ucAwUPY9jMpvKv1gxMpswSZruTeOGsAG8223TMtlDXq+FELK5Is16wdvM15uaEND005oZ3MeP33K+dUVBYdvA/OTJcf3TtmVnk3Zses6Xvq238T7f+NvIcxWh8BTSuGv/tW/yoc//OF3s55/ifWcBZ89T3/0BwlP3qJBp5MLJuhVBkrqScPAfj/y2luP+bFX3uK13Y6+aWmiZxo8Swe3gufIOTrJOBzdfEE3mzHu9lCEJILrpvj5QmUoauvXmTi8U3abL4W83ZPGkaab0J3eojm5g8yPkcmS3EwpsYU4xbedDhqGVtX3vCOngbzfUlKPkFVPejohzFTCwq9WhKNjmpMT2tMT4ukp/vgYd3SKW63wyyV+uSIsVsTlEjdfEGcLFUY3fCpYaYpzmtU1Ov7gPBoAxHAQ8aZ3EyG2lBBwsVXlxNmcZnVMmK90GLVpcUHlSHQ8QX/Xh6qhY4B5ExXHijox7rspvpuZxk5L6DqVhJ10+ElrEicqss8hW3MWhFQvWrOsrMB7snm7lHS0xID4asvjc8KPCZeKOYfa/F7f40umFShXW9LFFf35FaTCbDrDtxO2w8jnXn2F9X5Hu5iyOD3i1kv3GVvHk+0lV64Q3/Neft3v+z+yePlDZoWj68mTJ3zHd3wHr7z66uG+d9fPf/2SBp/f+3t/75cAzj1Pfux/JT55QONVSdBJsdmgRBr3ILDLnn/ysU/yT7/wBk/wlNDQOsc8BKa5cBocp12L2+5xWZgtj5gtj0hjUmdMH+mOj2iOTvCThXppO68ZkGk2kzNp35O3GyRnQjcjrm7jVyfIZIE0M6SZQGzxvtGT00fd5X2g5Eze7xgvzxh3a/UGi0GJi8slYXVCc3ILf3KCPzomHJ8QjvVnv1jBfG5B5wi/PMKfnNLdvkN7+zbxaKn6zSgdgaAjDy6ozrBqOFexehVOp2lxsylhsSAeHxNPjmnunNLdu0977wXauy8a3+kIP18S5gv8fG7guAYO1030/tkMN53hZ3PoZoTpgjBbmeTrTH9vscQv57jZFL9QQD5M5zqFf2A+q/GaiGYqVWWgWNkn1tL3pg0NpjOWR6UYpEwQFbrX8k6B99Lv8cNAudrQn11QrtZIP9J1HWG2oE8jr73+Kq8/fEC3nHLnPfeY3F6Rp5G9yzzdbZi8/0N867f/73nxW34DtNe8HoAf/uEf5ru/+7vfLbn+JdcvbfC52e0SgdTz5Ef+F+KTN2m1X2ET0SqB6inEpuFRn/h///jH+cmnG7Y+IgjBOdrgCCUzESEijMOAEwg+0HUTQtMiLhAmM7qTW0xu3VbBrqgC7joSoJlCGUdk35O3O1wRmumccHwLvzxG2qVS7GOnNjY2Ue1cUIeJ0OCBMuwY12ek3Vo5OSHQWuDxiyPcYqWaOtM5pVNJDFoV9JJ2YrIYqrUj0xl+tsBPTQZVtBS9nrGsQ5cemqg6zZ1Jsk6m+OXSgs4J8cSCz63bhONbhNPbhNNbxNURfrEiLleE1TFxsSDO54TpVEXYj1bEoyPC0TFhsSTMl4TpEj9bwmQOE9UZ8ouFBrDFEjefEeZzwmKhvzOd4UIkDdqlO/i9V1IlpoHtHb5tibOZYmNdq9KpPlg30PAm+91a/gQcPmfGszMuX3ud9RtvMlxcIVmYLI5oVws2w56zsyeMMnD75Rc5evkeWxk5211xVUY4vcOv/l2/j6/5t38HTFaWEevKOfN//yN/hE9/5jOH+95dv7D1fAWf3PP4o/8L8fEbRIoS5ShISYgUYtMyPzri1fMt//inP8vntwNjiHgRGi90jWoHBxFSKWx2A0PRlu+saZgfHTOdL3GTGc3RsQLH3VTHBFCqvogZ/o0D9AN5t6NkCNM5zeqU0s2RZooPnSrmGdahOIfiHSG22jkpA2XY4tKOkgZKcLTLI/zimNLNYLLETWfQTlQIvjG9HpO1cLFVyc9GpVClzlLFBpyWdaUMBJv0dk20UqglzKb4+YywXBKWS/zxMfFYKQKyXMBiiSwW+NUKZisNHrM5YT6H6Qw3VTVF36muj5u0SrCc6S3OTDt6MqXEjhwbpOs0C5qrsmKpwW9m+tPdFFoNzmVI5P1eSyvrYDkTYcMInc3xMe2tW4p9TVWbyLcdJWeGfq+gM4J4G0B1ga5r8DkxPHqbp5/9HOnsApeE2eqY5d07SBu4WJ+TXWK6mnD8nrtwtORC4Lxk3PEtvvm3/i6+5jf8DvzyzjOBR0T4ju/4Dv76X//r1yfxu+sXvJ674PPko/8r4fGbtDYlrSxWR8bjmind8ohXz3f8fz/+OV7fDrimoQueufcsm5ZQ1IAvec9aHOfGV2lz4Wi+oOsmlBgJC8VbpJ1QgloLFzvBkILPhbzvSfsecU5lOJfHuG5OCQ0uREJs1Q/LwFUftOzCAFlkRIYtZdhCGinO0a1OiKsTmKyQdgqN2uEQwsEcsN7Eiwll6RwV3lOCCqUXCmkwIBbRsiR4aCNxNsXP58h8BosFbrmCVVUuVElWN1uoO8Zkhp8ozlP1n1XLp6V4SF7VIQkBaaPxoTqoWtFV1KyJeAt4TKeUZkIxHWlpTVM6NGSnpNG835Gu1goaG3mwBId0DfH0lMmLLzF5z3sId+4RT24RT24TVjr4G9pWZ72GQQHsVrWp6abEpiVvNzz+zGe4eOMtGudY3b7F/O5taCOPHr3NW2+/QV96UlNYk3C3b/O1//Zv5eVv/U18za/9Tbzv1/wmwvLWM4GnlMI//af/lP/nf/lfst/vD/e/u37h6zkbLPW44hQUHgYdksx6cYHHBdUjzi6oPKmop/lqOmUVWxY+0uAZnWftIxex5Q2Bj1+t+fhbD3jrlVfZvP02+XLDuN6Qtj05Jev6gCTFG5S6D84H2tmc6dEJcb6k1IvNJrYxj3iV+tQZNFSUGCEqAN1OcO0EP50SpxP8RC9I104gdohvEBcRF03syqsIYlDh9OKgREGCp8SIb1vNSJYrwvEprFakyZQ8ncBsgp+rKDyLKcxVo1mWc/zyCFksKYsZZabyqWG20KA6nWhpNZlq679T+x6/WOKmS/xiSZlOKW2nKodtQ46e3DRIp8LzigNNkG6CdDPcfEVcHhNXJ7j50UHYjOmC0k4YMctrp5IYvm1V4P3klNnL72P2gQ/Rvu8DNO/5GsL9l4n3X6K59yLh9l2aO3eZ3rpFmHaU6HDzKZP7d5m+eJ9wfMwInJ2fs91skRhZvXif2cmKcdzx5O3XOX/6iPPNOeep59IHXvwV38LLv+G38b5v+/d48Vf+Ovzi9MuscF5//XX+xJ/4E1xcXDxz/7vrF76es+CDTvMklDBnQ4kOdNAztoTYKXu/qCZLLJkJhSWORSksLAPp8axd4NxHvjAMfOLpGa+9+QaPXnmV4clT7YJsdsiYcKKYkXMq9eAFHW0AYjslTuf42RLXTiG2ZjusZnXeDPicaQbrZ1ACW/ERaTq1rGk7XA02PiBNg4vqxODMUtiHQGiqBYwOoR5mwExQixig6wiLFc3xEc3pLQXO5wvcTOfOZL6A+RK/OiYcnRCOTpD5CmYL/GyJn85x3QJpFGNSkXnFrXwt69qOdrGiPToiLJb4+VLdMUIgB0cJlTYQyU1LblpKN0G6KaU1Gdf5QjPMxYo4PyIsjhUfmi4Qs/vxXVQtpfkMv1rS3L5L+9LLhHsv4m/dJ57eoTm9o2D8akWeTklti0ymxPmC0nb44yO6+/fo7t1ncvsWzXJB06kCwezkhPnJMRdXF3zuk5/g0Rtvst9tWd27zzf8xn+fX/Fb/kPufdO34ha3IM6/TBpVRHj77bf5v/wn/wkf+6mfere1/q9wPXfBR1MQmxHK9qco+9hbmzZkYRkDxz5w7BynAreD58QHOinklNmnzCZlNgJPvOeVPPLK1SUPHj3S2Z5+0PGCMdkQIyp96ry+fhoY+54sRbGYbgqxU8+oqMC0KuVpl+zA8nPlYLhHCCrp0E4VC2mnOjISOwteKj6u7CKnGZeYaLoLyqcxAmQwZ1L1rIr4doKbLQmrI/xqhZ8tTFx+TlgcE49OCUcn+NUpzdFtpsd3mB7fYbI6pV0ca2bTTZAYSQQKgUxUEXs0EysuEiZz3HRBaZUUKVGtnIt3SHBIEwjzCe3xkunxLabHp8yOT+hWR8TJnDhd0EwXtPMV3eKI6dEtJqe3mN25QzhawmqOX83xxyvau3dp772AP76DX50i0wWl6cit+oqNXpWjh5IYvVOQfrYgHp3ij04oyzlp2uHmExanR9x/70vcfflF9v2OL3zykzx89TU2l2s2+4E0WfL1v+1388v/g9/H4gO//JkSqy4R4ad+6qf4v/6n/yk/+IM/+KX//O76l1zPWfBRG2HJKrQlYyIPiVKEEHTMIufM/cWS3/5N38Tv+eW/jN/8wn2+cTHjg4sZp5OWIQ082Ww46/dcjj3rcWADvFmEf/b4CT/y1pu89eQxu6dPGS8uCSnhlVWobgmgQ5hmn6P0n6DSnLHR8gfNRBSLEkoRI+6ZfITLiFNFQazEcs0E30115MJwG51CMubyjR1Vf1Y1QAnmQR6cCgcqvxDXNsTFAr84olkda0csRFyr7WQ3XeHmysD282P87AjfLaCZ4oIG0RIaMkG1U6tiIZHgO5wJ2RNafDuhmc4U53EYKRGyF2giYTohzrUzdnBSDS0SWjKBQqS4QEFtnf1sSTw6ojs9oT1eEY4WxJMjmlu3ice3cNMV0kwoLpDNRrkEj0RVA/CxUcLlakVzegsWS8amoy+ZLIltv6c0njvvew/Sej778Z/h6tETAo5tP7AZM266oH3hfTA/+jJJVIDtdsv3fM/38H/6A3+Af/JP/sm7ovD/GtZzF3yqdKmXrCxcw19ASDnT73vuHK/4937Nr+J/+23fyu/6td/Cb/vVv4pf+03fyEt37+BwbFNiPfZscmKXRnY5cybwid3Ix86u+Pibb/LFz36Gx5/7DPtHD2G3NecKDXpOCr5kuq4htqrUV5x2U5y148uNc7GUou1hEdM11jEC59VJkxgVpwqaubigJZvpUiActOIt67GvxWlwKocTv5Z1DnGB2C2I0zlMJriuIzvHKE49zNsOaczBou0oIajaH8GytarMaB7JopbFmoeZhCqW/TQdvpkoSdEJSEJEZWldjIS2I3Qt2SyNcY3dNIMSYz2L8xQXoWuUZHm0wq+WNpS7IhydwHSh772C7lXpEJPjCEqmDJMp8eiEye17sFiRg2ovD9sNpIFuOiE2gUcPH/DwtTdwRX3Xd7kwtFPuf/036WuZflBd2+2W7/u+7+N3/s7fyf/tP/vP+PznP69qAe+uf+XrOQs+HC7cnLOCv1Z6aQu8MOwHpEDbNdw+PeED738fH/q6D/Khr/sQH3z/B3jhzl2mEy0NRgpZhIKnJ3IVIp8fRn7ywUM+9fnP8srHf4ann/kMw6NHhH0PKesUea9M6pSyMnJ9QFBBcuc83un4Ak7wqISqCpGr2l61hcGJlnFOXSZ8bJAYNSB5p0ffV8+qKglhWZUReJzzqLFLxBHVEaNe2D4SZ8rS9l1HaHWIVaIa6lX+kjjIlUMDmuUVFVH3guJc9fjXACca+JzpN4eoSoCCzXDZVLgL5gcfGpzz6lUmaCATRyAQXUOQSCAQjCntuk4tnKuH2GJBmaipnzivm1AxK6I6c2ai7/igWNp8SXN6h+74lNA2yLDj6sGbyGZNQ+Htt97k0Rtv4QV2feJ8u2fnHB/8tb+Or/23/h3NZm8EnqurK/7kn/yT/OH//D/nZz7+8XeznX/N67kLPojp9ZqTiq/aVOLxNMTQ4YoHiTTdjG62UAbz8TF37t7lpTt3Oe5mRHEUEZ1Z8pHiPMkHLrsJn9rt+cmHD/nUZz7FG5/4aXZvvELse5riCLmyqjMiUMRRvDpleh9BPE7U1kaq0iCZQjI/Kw08RVQYrEiy2aZA6Cw4eJ1x0gFIDVzOqUi6c3rRerHOnzjNTAzgFteCa/CuwfkGYkuYzAizGW6qGQiNOjWENuKjuXk6FebyKKbmRIusmu24alNjx1vfG8r89oHYdoRWA5AGMMW6dHi2IVuQdqgNNDidL0MHXb1TLWeH1yzLgPgwW+C6OXRztfwJUVUIDgOkavKo2tSqsCheTQBKO8FN5uQCstsiTx6xf/WLbF99lbe/+CpvfuF1Ls/XrIfE2XZLD8zv3+Nbf/fv4ejrv9kEyK7X937v9/Jd3/3dnJ+fP3P/u+tfz3q+gk+FPazD5Yoo4HxQBeyIviPGOU2c4Zz5XRHxLrKYL7h1dMSqaYn1+ap7gUAWx2WBB8Xxyc2OTz18xCc+/jO8+fGf5urVLyIXFwpE52SC41H1f4OKpiNexwEOs0iCWAminlOCoHYyThKljCrrIEVZ0LE7uG3qm1MipbuR5eiqO64OZlbJUTUa1IBQTQedV4nXEiKhmyr7uWkUi2kUJzMGk6kNZg0KRhN4dt3AnWqxWwAJRgWY2GcwS2LzwhITeEP0eYtlKM5KSX02DWYiWurFZkJo52TfkX1Dtu6glkEqBqbOssq70ol4o0DECF2nTiMlk9aX7N94jaef/BRv/MzH+cLPfIoHr7/NxdWO9W5gM2TGGLn/jd/Ib/4//Ee88M2/ynCe69P/lVde4W/9rb/1rijYL+J6voIPGnhEijpEOMhjIfgJMU7wrjs4KeTqcbXP5F2CDF1oeOnuXb7uxZc4nk7xxpAuRU8owbFPwuM+8YV94nObgc8/fMxnf+YTvPGTP8Hl5z9LubogJHt9r+CyD6psKMWo/0UOJSEH48Fsk/AWbKpucykHS5linBbxgVIzJzFRLPTnYvoYapDn7SuyYFTvN1wGs2MuZl/jGiUA+rah6SYEGzitX7PiSc+WEvU9VDVAfdwzcUipAy7iGwWTfTdVXk5UoNq5gIi+jtIM9D0WqfrKFsy8bSrO4SzYFN+qG6tXZUdxKoOqrPY672Xvp6AdyaYhTJRFPm4uuHrlc7z2gz/Ij/9//jE/89GP8cqrDzjfDlylQm9vYHXnDr/mP/gd/PLf8/uJd1+yD3m9/s5//9/z8U984pn73l3/etdzF3xq00czH03VYzMhNDP1jiJQRiEPhXGXkCFT9iMMhS52fPDFl/k3Xn4fdyYzojOdGQTvBedVSH5bCmc580YWPn+14wtvPuDijddJj97AXZ0T+i3jesO4uVLH0pzU4dLXksxsXmrZVVDxrIxJVWgwUhAa1Sf2ymJ2PlhGo4LncA02i1Zhh4PghINkqD5Q/ycWqECn70vW7pqLAd81+FbLLnzAOadWwIds6nrZqx+80YuD4jQAlooTWfAqLmqrv1USIiaq3zY6LvFMkAQwKdQaxMRKSqm+7LWcPADR13SFjJZdWQoZdZRFCillnHhCaGialgZIj97m4hM/w6sf+WG++InP8PDpFY+2I184u+TxfqBHaIJjenLC0dd9PSxPntFgBvj4xz/On/tzf45xHJ+5/931r3c9d8GndrsME8WHFu8ieSj024FxN5DGhPOeputop3OmyyOmiyMmkzmta4n9yLQUQtILQFDujEY0oXgYvONJznzy7IqffOsxbz16m8u33+Tytc+zefAm2wdv0D9+iFyc4bZrVfzL2QJOUWfOkg7ZUDGNHJWw8Kp5lTQgOZs+d+gkeiUkKrFQRzF8tQOuywLNtRbx4c7rCH3olFUTPy15MlA8+qdwbeR343nFqfeEvmR9PrkObjUTsxso0IuVeGJdOwneAPPrZyjVbeJLVrGsR0QDDCGYM2qrHmkWwByioLvo+wtRO3GSBRkT6XLN5tXXeP2Hf4gf/x/+B378f/qHPPj0F2A/cjpfcTKbE72nT4l9yuxiYPmBD9K+74P6mjfe72uvvcb/+T/+j98dmfglWM9R8NET34nW9qUUhjEheHKB/X5ke7nm6vwKEZgsFsxv3WZ+5y5H91/i6O59lkenTLspR92Uk6ZjVjS7FmuHizi04yNk51g7eBvH57cDn33wNl/4zGd5/Mrn2D18nfz4AcODN+jfep3x8UPK+lz9sUpWf3Erl0pR11IpglVZWkUVPcdLzpQs2gEyUuGhfXwjw/nyckjfq/1FH+/03V8HC8WMfOUNeUd2XLepnQYmcVgXyy7o69h1OO5gBEmfEZcMu7Isz2l5hgPXNCr7aoxtH5pDLBSxd2duqGL31SVYcEZNBWOnqo6+a3DBa4PASkAN8hpwskVTLx4/DAwP3+Lsp3+KV/7pP+OV//l/5vLV1xl2A/Om4/5syv1Jy93FgnnTkLyneekl/s3/3e9j+t73PwMyj+PIf/M938OnP/3pw33vrl+89RwFHwAdJtUr2LIg54jdlOAbxjEx9AOuicqovXPM5NYxbj4h2bzXZDLhdHnMi4sFt6KnEYenYid2oaMXZPaBPgTOxsQrD5/w2S98gUevv0Y+P0fOzsmP3mb36qtcffHz5MePcLs1jDtCyQQnOKfvVbJqCGNBQ9+7UQWq5YwByoJmJ8VKNhEtcQ6BBpQhrfXXdaA5/Gi/I/nwb67+5DBv9WfnziqDW3AU5824pj5pXaLBzGycHUWF8+1WDG8KjSd2rbK8o5ZMXBeGKpEqFVK58d6/dNl7rbNy4tBhUblJ2hRkBF880o+4zYb9g7c4/+QnePgTP8GTT3+KdLUhDYVchOPFjONpSyiZk0nL1BjYL/+b38by3/hVOk9345R//fXX+b7v+753QeZfovWcBR+QPJLTgEgmNoEihdBNWNy5xe33vszJvbt0ixkSIDvBTVQdr+/3DMOAc47jxYKvvX2Pr1sdcTdGunJ9IV+XCEq4S+K5GDOfu9jw+UeXvPbmA548eAD7Pc2YyWfn9G8/YPfGF9i/9Srl/DHs1/jc44r6YgWl/ACqHuhcIPhoXZqRULWhTSajeMtqVPj4EFCu/6OCP/afYjIHnAeda6vl0IEEV3WFTJmxJlM3r30t72p5Y/9qWZgvQjAFR19UmkRtcTJOizgQUZaxzYKJU6YTWMCxz6OfUN97rtHRKkhBMzLnTV7V6ydVs0P9LJJ10Df1A+lqAxcXbL7wOd760R/hlY/+MJ/6kR/hwRsPuNwMXO727MfE1a7nyeWaJMLMun1H73sfX/tv/UaYzg3Av17f9V3fxSuvvPLMfe+uX7z13AWfMibdiZz6ikvJZCnE5ZzZ3Vss792hONhcXbHdbBn6gf1+z7jroRS6puF0teJD9+7woaNj3j+dchwDmhfVi50DypudZ0vglfXIK1d7Xnv4lIuzC1K/h5RpEGK/Y3zykPVrn2f9+hcZnj6krC/xww6X1WlUjf70gAbnaRy4fs+wvjLpB49rAq4JahzoaxpmAcT+E7t469LLV7OSemHXYAVCLjqAq38z7o3T0Q/QIHYTk/n/tfemwbadd3nn733ftdYeznhnDbaRDbJwrBgHJwJsnKExiTFDGAxNKkk1AacSE3CguuiudKfaJNX5gMAhaUICnS9gUp1yVfoTnQ/GVZZtLCHZEkKDr6Q7j2c+Z49rfKf+8F/73HslklR3V+ccy+tRHZ1z9z5nn73XPutZ//F5aLtQd1K/NkckoFVEKd/GibI8oggYZLCQwwls1fqRtXNPJJImRiXkoZz8rA5ELc9fUipJy6Tzh0wrt8dBte+3eHRpTATVWMJ8RrW1yfTia2x85WlefeLzvPbsc2xubjGuG2Y+UCmDU5ppbdnPS2onOe/b3/tt/PWf+wTf9MG/IuJvd+HFF1/k9/7dv+uml48Qx458lDCOzNJEmUtpKpHW0Ikh4Gnygnx3n2YyIVQNrqoJtpZ5XKPpZ4bVnuGMgXMaVlUgi2Jwp3hdu1kpgtbsx8it0rE5rbi9fcBoPCP4gEkSMmPoE+m5BlNMqfc2Kfdu0RzsQDFFuRodPUmEVIEODp/PKDZvUW5toKpK7PC0TDqr5N4lRqVpu3Ft3eWwo3bnxFikZ0GJvGzUonV0h4wWoYcmtrsf8bDYvEjtEKJZ5EVKCeG05BOjmPRJ90u++w21KKRjKMXtAG3RW/6UFs9HHk+1SoMy+S26QB4ZEhQR+oQkEYnURXqoUCgbRMhtMqG8cYv9r73Mjaef5sozX2Hr0hWmoynWK0qlqDV4pQnKUAdZeE0yDUs93vk9H+Lchz4iVthKitYAVVXxqU99qpNBPWIcP/JJtGgda+lOqRhwxRw7K2jmBeV4ymxji/nNLZrdMbr2ZLqP0ZlsfhPQOjJMDacHPR7MNG/vpdyXGXpatZPLdyIL2uHDCsOOjVyYNzx9dYOXL99mvD+D2pOESBojiW3QdU6cHeD3tql3bpLfvk65dRu7v4ObHuAmI/xoH7t1m/z6Fdz2BuQzsSqObVvc+bYqK4ygQNpSXvSIVYzo1gJn8REX0cfhc4+HGxpwV2FZydCi1JhaBmqjmEUVXOpeob1NOoF6ccdhrLXIkVoSPKxSt78vyv1tLCN2Qy0RIjMCcn8EFdtYKsrzXjxUCAHvFxcZcdgw3kOR02xtU125yvy1V9n9kz/h2nN/zI0LlxjN5hQhMicwi4559FQqUKtA4yxJv0d29jTr73sf933XB8VlRN8hnhgjT3zhCzzzla/c83o6/NfH8VIydBV7Tz1Bsnubvm6LmSohmAGmt4zzUI7n5Nv7uLxkMFhh+fQ5+uunMDqF4PFVjiumUM6IdY4ODmM0jYKxtdQhSmoS5areXt+JCprgmVvLwazElzVJ0zBMEoZDUZT2SlrUWnk0Trbf65ImzwllhSsLQpHjJwc0G9epblwmTicMloYM1k6ih0s4JemJUgazEKtXsU1Z5ISUwyGOEyADQJG2HY+QilIKHSPBW3xTi8d7DOg0JR0O0WmbCi0O9qKW0pKd1sjs0iEZyRctDR1+0KZZQn+LtRMZMRDN6EQIDX1IPPK1koFDgHh3GkjrH+/wviZUovKooowlGNtQb28zvXiR6aVLjC5cYOPV82xeu87+ZMqkaShRlDpS6IhXyDP2MuC5cuYU7/vI9/Gen/xbZI/8WUh7i+o3AOPxmF/6pV/iWlfrOXIcP/J58gmSndv0TYo2GSEmBNXDDFbFQQJDEjXD/hL9tRMsnb2fZP0kupdi6wI7nRDLKb6c4sopPaNIEoWNgVFtyZ3HIsuekjTI/+Sk1jQRci8DbTSBIZHVQUa/n6Az0xpUSKqig7h8UjX4vCDM5/jpiHp7g3rjOvXGLfx4TJYkmOESZmVNppCTVLzKFx0e2cQ8fA4LCDHJiR0Pu1Yy+6Ki1Hu8a1pXDye3pwlJXzbQA6KDJD8l9R2lYvu7F2Qj6VdkMfPYKjIqiTxpfze0EdCiG0lEJ9Iip51RWsRqd0rZbdym5F+0pKfwEBpiVRCrHF/X4CNUNfnNm+y++AL7XzvP/quvsHnxIgfb28zLEoumUZo8ekodadpitQJ0CCQ9wzsee4zHPvZxBu96rwiltcV1gPl8zi/+4i/yxS996fAYdzg6HD/y+aMvkuxskukEZVKs17iYkq6s0V8/STZYIkkzWR8YLpOtr8FwCDHSzHPsdIxqCkKVY6s5g0zT72c4H6gaz6RuqMK90zJyxZazLyqNV4qi8eRVhbKWAYHVYUZvmJH2DMa00hIh4BuHiRFtHbEqCfMZfjqCyZg4PqDc2YWqEaLpiZdViODqStrxweMXOkAxCBEtzvu4sPBtiak9iRandrAN3oqzavBWvte0IvLtlrmkPm0MEsVKeDG3E1vGWURTCyx4545ImmoVJR2+qUWTOkRRXtSL6Aw5JsgSa5tjtXUcSccUXnStfUMo5/h8SixLYlliGocfj5m8+ir7X3uZWy+8wNbVa8ynU8raUjqPRVHFQEPEaZHXSLRikBiWej3uf/vb+d6f+mnO/oUPQLbobskLa5qGf/Wbv8mnP/3pOy+0w5Hi+JAPYhq4/eUvYrY3yJQhxhTvFVFn9E+cJF1dETU9pWiaBh8iDEToSmmDLyp8npNGj/I1oanIsoQ0NUQXsFVD7j2l0m361UYWhx9tmqJENa9wnqqs6ONYTQ2DQYZJNBGPD5YYQKOlTuMjqYKESKYCAx2hrqkPRsxHI4JriFmCTlP8woWzbtDOScOr3Rk7tMKJctIqREpEAhepFek28tExiKVzXUkqg4QWOumhTXK4lBkJQmRKfjbKw8t5qYTSFBC0zPmAHItFuVuCpEC0Fa6Y4YscjRfnUdriudbtSpcU9Q87aESMihCdpG2uxM7HNJMx1e4OYTQmzue4vX32X32NnZdeJL9+ncn2DqPZnHndkLtAAzQqyDJrKrKzWZIwSDT9VJMZzYOPPsr7fvBHyO572xuUCb/0xS/xv/6zf0ZZlvfc3uHocHzIJwKuYeepL2G2N0l0iicBnWGGQ9LVNZLlFVSaEnxDPZtSTsb4ENG9ITpJ8TaIJjNBrHWBRCtp19cV0TlK6zmoaibe4VV7Ji6Ip71aRxVkItloXAxyMjUNSXAMEsNgIP5RRqdoTNvkEekNnWWk/RQz6KGTBGUMWa9PbIU3UpOgGoef5cSigKom1DWhtod1Cx1lQBEfCM6Bu+N5nmiFigHlLLaYEvIpqilkMlwZdNJvrXw0GtUOYt8V1iyIJrZxVNsCj7SF4lZf6LBg3ZJICDV+PsaOdnHTfWJdEWMgSUQCwzUN3sp8VgiNaDAFUYP01hG9IzYVvpzjpmPCeEQc7eM2NiiuXmP//Ctsv/AiW69dYLy9y7gomdSWPEJNxLXuIrQrcalW9DX0E8XSsMeJc/fxtj/353nXX/we9HDtnjrPK6+8ws//w0+wubl55yB0OHIcI/KJ4Bp2/+jL6J1tUpUQldizqGyIGS6JeVySEJqa8uCA4mAPdEJv7QTpypq4aiolNjW2wuDxtsaVObYsCE1N4yK7RcFOY2naus89OQe0nR3pGDUxMi0bxnlBKEuWE83Z1RV6gx5aZxA0wcugndIpGI3XCnoDeidOsHz/faw88CDp2pqIyjeReppjpzPsaEK1P0LXNcE2hKaWk9pa9MIWuLGy1uHaz01NbCrsbEy9v029u4Ub70NjUSrBpH10KxfhnBfyiXc6V4sZHwJSNEaIX9r6i7qQRC4SMQUUFlUX+NE29cZ13N42Pp8BAZNm2KbGNSXB1kRXiU10UxGaCt/U+LrClqVYR+dz/GRMMp3htraZvvIaF596iltfO894c4vZZMasqplay9wHyhCo20hN9I6EPI2KJDqSZopTb30r3/czH+fbPvKj9M4+eLjGQqtM+DMf+xivdBvrxw7Hj3yeehK9u0OCOnRTiIl8VkkqU82NpZlOqfI52fIqwzPn6J0+RbayjE4SfF1i8xnKWmyV48sSW8yJVUkMUMbIyHtm1mPbK/zdhd62/XPYDS9jZG4DJkTWEsPppSGDXg+tJDIDg1YpxrRaxSYRKdD+ENsb4noD0rUTLK2cIDhIdcry0hKh8VSjMcVkgisqjLW46Rw/z6FuiHWBn89oxhPcbIIdj2hGB/jpmLC/h9/dot7YoNnZxs1zer0hZrCESlMR5HJOXsqioH24ACsRlcjGLrplNTFY8A58TQyNSNlGi3Y1YT6m3rhGdeMKbm8HmprEiEiat+Ifhq9Q3hGsawnTEa0lWAvWoq2DfI4ajVAHB4wuXOTGCy+xefU626MpB0XFyDZMfaBAUUZFE0U0PjHi3iHF8kiaatJ+SsgyHnn/X+Q7/tufYnD/Q62n+p2LyWc/+1l++7d/+8572+HY4HiRj7fsPfMUZmeTTLV6MG2x1DqPcw5UuyGuFenSMktn76d/3/0kJ9bR/T7eWarZiHo6BluTRFHDMxEypUjbuZaJ9Ww3NdVhu71NO14/zwJEo8RAzwcS5xlYR2YS+lmPNOuLXIZSxCgLnTrpCVHqDEyGSgeoVOxkdH+JdHmV3olT9JZX6Q9XiNYTqopmOsFPZ7jplGZyQJzOsZMx9mCEH41wu7s0W1uErS3Kmzcor12juXGT6uZt7Dwn6w/oLa8RdSLE01iitURn5euWDLytoWkIdUmoC6hzYpPjyjmumuPrHF8XBFsRaini1zu3ya9dor51g1jOMaGd49EyCqCiRwd5r1T04BzKOZSLKOvRzqHrhjiZYrc2GV++wvlnnuPCa5e4Pi24XFZcbRoOgiIPkTwgetRKkRhFZjSJ1rKGYRTpIGP57Fne89/8NT70dz7O0oNvb3Wj77x329vb/Mrjj3Pt2rW739IOxwTHjHwadv/oSczWBmmr39tUDVVRUBYVOjEMT5wgXVmht7ZG/8QpeqfOkKytix2vMbimxs2nhLJEuxpNJFGKRCl62pCgaJxlUlVsNY5Z64i60NYhapm7aU8u1bpURBTWQ1k2+MZjGksvKlZ6PZKkJz5iIIOOWuMI4gahMxFR1+1H64nltURIyWBIf2WFpbU1llZXSJIUV1U04wl2NiPmBeQFzHLs7j5uZ4dmc5P8+k3KazfJr92i2tjBF5XIlJqUaB3NbEYzmePnc0JZ4MucUOTEssDlc1w+w80nhHxKKKa49rMvp/hqjivmNMWUUBW4yYjy9i3qrQ10WZCgMVmP2jk8YAY90fVRSrp3LeFhheyUtYRiTpxMqLY2mFy6yNUXX+L8Kxe5tD/jQlly3UV2oqbQCTWKBkSBstXj6RmDQswdTapYOn2S937or/LdP/o3OPGt7wGTvSF9fvzxx/n93//9bnH0mOLYkc/OH/4haus2mVaoJBVrYKXRWUZvaY3hmbNkaydQfbH6jWmPaDJRwXOBej4lFAWhnBGrEnwt6wPRYYikiaaqa6ZVw7bzlMa0s78SuUi94w7xyHOTulCMisoHpmWJbzy2LOmbhKUskyIwATTSCQOZkUG12sWyXeajDN8FRIMnoAg6QfUydG8g+kTDJQb9Ab00IzUZqdLoEKCx6MZD1WCahljWUDsylRCczOEEa7F5hZ3MsKMRdjLBjSf4+Qw/FTLz8xluNiHmOX4+I5RzKHKoSrCVFIZr8VHXrkE1NTHPwXn6S8sMTp4mW1sjXV4jWVomW1rGpD1iWztSMaJqS2waKCvifEYYjXE7exxcvMz151/g6pXrvLKzzyuzksulZQfNXIHXGmMSpDUPiYr0tCJL5KJAiOhMs/bWt/CdP/wTPPDex9D95XtSrbIs+dVf+zV+81//6454jjGOF/nYhp0vfgG9vUGWphLNLK/QO7HO4OQpeidOkqytQ39IUBlR9/AebFHjyhqXF4SiRNkayhxXTtG+QkWLVgFlQBshn3FesF811ECDonGBEBcDd9JkVkpJJBRBRyN9H6UpgHFlGeUFvipYN4qhgdQoVCIVUXOXaJVWUkAKPqC83CzDdkJyob3Ke5QUq7MU1e+TDcQaJyain9NfXWOwtkp/dZXh2jorp86yft8DrN1/P8P1dZK0JzzpPbqxxKKCqsIXObEoCUVJKEtcWRKrhlhbYmOJVY2vpG4TnUNHSNrWuVaaLE3p9/ri/nnuAfpnz5GsnyRZP0m2skLSH4qfvIfgAq6q8GWJn82I8zn+YMTs1k0mV69z8+XzXLt4hevjOS9M5lxsLNMkodYKGz1GK5bSlEwZshhZMpqeZnF5IHpPujzksb/2Yd77/T9G78Tpe9rqdV3zW7/1W/yLf/kvu6XRY47jRT6uYecPvwibt8iGQ/r33UfvvnOY1XX08jL0BkSTEVVGUBk6yfCVpZ7nVOMpzTwH2xCrkuJgB1dMMLEiuro1ABSFvBAjdVninMOHgEXRKJmCjtCuErTkczjetxDoEsGuKgamlaw0LDvLEEfPgEkU2mghIa0wLXmpACaKrKmWVSeiCu1OliKoVj7UO5lMTkS0KyJLk6SioUMvQw/66KVlkrU10tOn6J05R+/sGfpnzjI8dz+9k6forZ2kt7pKb2WVwdo6wxPr9FbX6K+u0l9dZ7B2guHaCZbWTjFcW2e4epL+8hqD5RWywTK9/pL4caUpJk1Je0P0YAn6S7CIOBNJJUNAVkaCqBKopkFXFWE0we0eMLl2iyvPv8T18xe4fXuTjUnO9cpxLUQOUNRKkWQZy4MBwzQl0zI71SeymmiGGtL2eAUfOPXQ2/mxj/8cyw//mTfY3zz99NN88pd/mTzPD2/rcDxx7Mhn8wtPoLY2WFpdYfjA/aRnz6GXhqgkpS5KmrzEN4BKSXsDES+3sj2dJYae0TSzKeVoG+MLdKylCxNFmU8EvhzROkwI9IyIrFdKU8ZIE7zUf6LQjkB2qhAuIiKb8EGDc4HEBaKTXS8VA8ZE0iwRu5kkRdyrRL1PHsMTom3JUEhOrGUQadYoix+6dcuwzmKDA0WrWKhpNDhtCFlG6KeEwQC1sopZW8esrJGsrWKGSyQry2QrK6TL8tFbXSdZXsYMl9CDAWowRPWGxDTF9AaYXl/S3TQT1UKTEpVoUEcjJoLRJKLhEyPBLdxlLaGqiFWFKgvCwZjdS1e4/rVXufLqZV5+9RLXdg/Yymt2XOCG9Wy5QBEhKEWiNEv9Pv00hSCNhh6wYmCQGk7efxaVZcRgedcHPshjP/63YLByj0bP1uYWP/+Jn+f6jRuHt3U4vjh25LP9pc+jNm+R9TOS9ROka2IF7OuGycYWs609sGB6S7IvlWT4IJO5WZZiNFDNUdWMLFboWBJCTWy7XkpJ6pUmCX2tWev3MAF2ioqRtVRRohHamAek5d5OxMjtSrouPkDtA/OqZjwvmMzmFJM53jakgx7p0hJp1hdXUCUuo7JE6kE59EIwLNLWmRYyFNKd89YSbCNaQUGcUINvXR2EHcFI5ISRYrbVKVZrnFnYDBu8FgVDpzUhaclDa5wSnWffai6LwWLbwTJ3DABjVPgA3smckG8VGiVF88S6JJYVYTalOTig3t9n+9JlXn72T3jh+fNc2Njh/GjM5bziVtVw2zp2Q2QSIpZ2qUzCJ5J2Az2vaxIV6Cfw0ENv5SN/4yf5lm9/H6PxmO/6oR/lvj/3HfdsqzdNwy//k1/m8088cfg+dTjeOIbk8wRq4ya2KvBo0uEyOuvhy5p8a4dmNMMkPUkh1k9h+n2pBoRIajQaj8/H2PkYHUpirMA3UvptSzhaa7I0o5cmDHp9atuwm88ZNZZZCDikKKNoi5ytXAVKvMJlBFEWKr2R1vBe49gsGsZVwzTPyecFymiWV5ZFAN0YTJqhjcaYKM8rukM3zlZgFeUtvmlQLhDqWgYmmwq8RXmxcg7Rt/5bYsYXEPsctMaDLHu2ZEYUidGg4iGZhFYnWSRrxSZahgkRferFYkUUuw9D0po4tnbWwRO9k+fjHXE2w+/vUe9sM9+4zejqdc6/cJ6vvnKZ8wdzrlQ1V2vHbefZ94FJhHkEqzUYI8fTJPSyTIhaG0onE9TDXsb73v8Yf+Un/ybveOwDrL/lrbztPe+jf/KM5K7tNeHJp57i13/917v1ia8jHC/y8Q17T3+ZweSAQZbgopcVhTTBW4stS2KIDFfXydZPkqytkCwviUVxdBjlCXVJOd4lVBN0bJu2amHqJxFMbEWr0jQjMYayLCkbSxkCY+cpgm8rwnI63qn7iOyFTNm2ol5KYXWk1op5jIway2hes7k/Yn88opcoDG0XiEiCSMWqUKGCrFRE62Uwrx3Wi00D3kIjszLBOZR3MgAYLCp4WWZFViNUuxwqkqZRXDHaV0sIEi21BoyKhd2PkB6L2Zw2AJFi+GKDXqYsw8KvzHuia4iuJlQlqqmhLMg3Nhhfucbmhctcefk8F165wss3tnhxf8aFsmbLBybKUGtDo4zobRtFWCyasTAI9FjrKGuRRU1V4P77zvDBv/phvvUDf4n09DnOvu0h+qdOH7p1sBCC/73f48tPPnmvVlOHY43jRT6u4eC5r7BUzlhZHtC4mrqpSZeXSPsD0iyjv7xMtrqGXl4iWVmht9THR48rc3T0eFtg8zHK5qhYA5aIF7vgllCU0miTkpgMtPiCK++wRGbWMa0bbBvxAK2g+uK/xcV2QWbyWTpVUKOZusi4duRlRVPklNMZVV6gbUC5Bl/OoM5RzoGLRCe/HyvDeTghJOUC2geUF0VH5R06eNFYblNIEIEy6fgIjSzGBWJopU19lKpVlKhNiEmBj5hWSEzFIOqCACqgo0IFiSiVl04ktpHJ5XxOmE6Jsyl+NGbn4iVeffZ5LrxyiavXN7k9KbmQN9wIsAOU2mBlxRSUuGyI0aEszoqEhxCp8xEfZLLq5NKAH//oR/mR/+6nWT57P8okIod6V7oFcPnyZX7l8ccZjUaHt3U4/jhe5ONrDp57imy2i6ZhOhsRgmVw6iTpyjIhTdBZRkg0IctIhxnJIMH5mnI+Q+MJTSEiYrEi0Y6IdKSI8ocO0vZO0x5ap3jnid6ig5Wp3BgpfaCMMmHLQtDrru13iSjaSZ42QtDaiP0LimASKmBmhYBms5zx7gH57h5hMoF8iqkLtPNgRTRMB4X2C592hQoRE6QWEr1HeY9BNtnxjhA8qrXsUdq0dsUa3SoGhqAl2nELP3nTCtsbMd7TCYlO0At3jygeYRqITtQWQy1aRaEscfmcMJ8SJhPC7h7lzZvMr91i6+IVLr98gZfPX+Ha3oS9OnKgUq5bz+26oWxNAeU4ttv0CygRLmv/cZjKKq1YSgzvfufD/Pf/w//I/e96VIjnkPpb+o+Rvb09/ud//I959tlnW9Lt8PWCY0c+u195Er1/k2DnFPmEJNUMz5zBrC5DkmKDY15XuBhI+imNa2iamqzfI+v3CL6CpiDUOdGWECwxOlCxtdCRyMe0rpXeBWxTYesC5Sz9NKUJikllmfso9R9FO/9zFyQbewNEikLjlMaimFvHfl6zM8nZP5gyHk+YHIxoZgXGK9JohHiCQQXQi0glakxUaB8PoyAVQpumWRHfCqCCkhZ+0GIxE5R01xY7TkERAqgofvZGiXkhURFcaKvp6lDG1dUNtiixsxl+nmOnU8q9PerdbeqtTUbXbrD56mtceek8l169xMsXrnLh9i47dWA3avaDZmwMWy6Qt6qRi4hMDlAbM7ZKAnJrK6LWWkxnBB667xwf/9mf4zs+9L2Y7F41whgjs9mMZ77yFT71z/85f/AHf9ClW1+HOGbkU7H99BdIDzZIosXWBUmSkJ48QbK8AmlK0zTM8zloRTbo0zgLacLy2bNkSwOaao6bTVC2lBQhNu0wn+x0qfYPXWtNDJoYAloHUhVJVGQpS2kax6ismSuFO1Tou0sDJ7adpj8NSklqsfAFQ5OjGNvAftmwNyvZm+Ts74+ZjOfMpzmutJgo2kDBB5GgcA7feFzliI18BO+ITYNvLNF6cBAqT1NaXNEQmwAevPWAwuhUhActxKDRJOiYEDxCVlGjfNsurxtC2eDzHD+fYycT7PiAMJ1Q7+8xvn6NvatX2bh4meuXrnPp1ibXDuZcndVcnuVsBNioarYby27jmTYeh2qnvBdRZ7uuottUryUSEE37DFjrZyxnhg9/7/fy9z7xDxmunbyz+tLqPj/55JP8xm/8Br/zu7/Lc889100xf53imJFPze7TX8Ts3CYJjqaqRKNmMCRZXiVoQ1PXFGVBNBqd9chWVlk6c47BqdNoo5nt7mAP9jBOCroq2kP5T410raQb1M7cxIjSAaMCwVYkCkJtKZxsVlcRmrYNLQwUgdjWLO4EDgtiWqR20o4H2pkgq6FEM4mw3Tiuz2u2p3Nm0xnz8YRiPKEpauqiItQOW1T4dn1CJpFlvSI2FlxrJ90EXO2IpSM0QlbKR/SCWJSROlIbSemgwQZU4+UxqwZf1djpHD8TnR07HmMPDpht3GJ84wZ7N66zdfU61y9dYXdjm/3RhJvzkvOTggt14Lr13LKOrWCZRCiAwkec0mLlE9t0aoFWDtZow6DXg5b01wc9Tg/7PHhynY/+yA/z0z/7c9z/jm+Wwv9d+OxnP8vP/oN/wLPPPcdkMukinq9jqLPnzh3Zu/d//of/wHd/93fLP0KAasLLv/5PyV79KsPYkM/mKJ2SnLuf5be9HTdcZVaUzKoaNVjm7DseZv3Bh+ivn0EPhoTxATt/8jzN1YtkzRwTSmJTgK+IcbGmuLgaJxBFbEuFAK7ClgUxKK5vHvDS7pyX5jUv5iXXas8U2cliMZezSB/uwmFgJCwk37e4I/r2N4MOkSR4VqLntFGc66WspSlnllc4s7rKmfV1lnspK70hK/0+w6xPP0sZpAmJjhgdpcakZHBRkxCiIiiDyfokgyFmaRmyDOdkcTbpDQg+UpeVtMkReyKiI1iLbwpm0wOcrfChYWPjFtu7O4zKilFVMakaEqUxxrDnAheLkl00hQ/Uov0OC5vkiIisvS48jDGI4aDWh5vqmkDPKM6srvCt73iY7/v+H+AHfuzHWH/LW9sLxJ3HuHnzJj/xEz/BlatX73ncDl+fOH7k86l/Qnr+GYaxocorOXlW1zn58CPE9dMcFBW784Kz3/JO3vEX3k968ixep+gQsbdusPPHzxI2b9L3FSkNvsmJvpbco51fCQv5i4jIiwYPXvaaVAjs7oy5uTfn0qTm2XHJs7OS21Hh7hZ3/0+kXSr+afdJtLSAaJVJxyoJnixGkgBLKE5oxVpqGABrvSHrgz7r/T4nB0NO9DOWUsMgNSz1BywPh6RphjEpoHFeem/pYImk10OnPYqiJMRINhxi0MTG4ZoaHywhOJwXlcFqPuVgvI/FkXvLzb09DuqaXR/ZdZaJF3WATCmmAfZ8YBSkyxaiFIphYUsUD8knRlpt5zspFsi6xCBVrA17nDt1gg9853fxN//23+Fbv/0x0uHKPakWrSjYRz/6Uf74+ee7aOdNgmNEPh6qKS/9yv8i5BMsTVljm0AYDDn1yLvQZ++nIKPoDTj77vdw6s88Ssj61EWBmo0pr1xk/up5zGSEsRUq1EQnm+1ax7blLlfpGJCibdQQIjE4KYsGRzXPGY8LbuxVvDiueWJ/ygulpUTqFWJT/J/DvalCbGeC9BuOtJyo4oQBSYxS+wmQAkkMDI1iLUk5kSacylLWEsNakrCapQxTQ6JMOxUsyoRaKVKTkWU9IFJbS2MdKk1IjSHVhuAcpXcU3mK9TFlbW1M0FU2IzBVsVhXbNpBrQx4DpbeSKmU9gjZMbcOsqdHKtGoAWhpabYSpMK27oJCOWCGLRKuKMEg1Z9cHnFtf5jvf/wH+9k/9XR597INCYq/rWuV5zuOPP87//m//bbcs+ibCMSOfMV97/JNkLz/DIDiCgxA1sb/E0gNvw584Q1g9w/Cb38nyu95NevYstq6YXL9Cc/sq6cEmcW+LMJ9iXIPyDcHVhODEmdO0WsW0QVBEVjM8EGXtQREIdUU+LdnZLzm/W/LZ7QlPzypmmLYAHd5wgtwLmV25OwJaJHx34zArizLXIl9LKVa3t+kYSEOkFyMDo1nSmh6RgZIC7WEfSYFpaylJ6/FFa1PceDEBVAoSY4gxUoVA0VgckBhRcxQ+VlhjmEWYOE+jRRY2xEiWGoaDIcakzIo5la1Jsh7OerxfzEXJzI4I0bdF5SC/u32BGKVZG6R8y9vO8e5H3skP/PBH+csf/kEGKyfecFyLouDxx3+VT//ep7tl0TcZjhH5BKgnPP9r/xRz/jmGADpB6RTVX4HhCmH1FEvf9DBr7/42Bg8/jBoMmW/f4tLTT5KONjmlGsqDbYyvMcHLGoFrhHy0kkVOkHZ1FBqKvjXPC+20MBEdLXVecnBQcnmn4ImNEV/ambDTBKyRQvIbU6s7WMybtL6ffypifH0kJFEQ6MMTF8TlVCslWx4AIWJiwKiIDkKa0nOXpVNNkKHA2NZqtcHFxaxP220KsV2MbXtQrT2zkJhs3julcFE286OW55omKUuDIRCZlQVpLyHt95hOcry7t+O0OAZKKaK/I1GiVKCfJLz1gXN8+6OP8NEf/XG+5yM/RG91YWl8B7dv3+bv/f2/z3PPPddFPG9CHB/yiRFcyRf/zf9GdfkVelqhjUEZkSJ1OqV36iwPvOtRTrz9m0lPn0YZw2Rni1tfe5Fq6zaUU5piQqpUW1B1+OCJTsIchbTbZeYnAuI33jiPt46mrnFO3D/rsmQ6K9gZVbywccALO1O2ywqpHP2XD5la7IP9J3Ao3v7/EIeD121t5fD2uyIGFe+tr6DvrIXQEp+MBNz1EK2P1+H30C6sLh5b1EjQWmO0ISpIsxSAsqpk52vx2Ass6jahHXNo9bIHWcoH3/+d/Mhf/yE+/P0/yKlzD5Bm2Z2fA1566SV+4Rd+ga+dP9/VeN6kOFLy+d3f+R0+/OEP37kheG699ALN5ACtW9tebUAZ0b1JUlZOnmH13Dl02ur1hkBoKorRiL2NmxT5TGQ8W1fN2FoQh9BO6yhIEiPRhNaEELDWUlUVRZ6Tz+fk8xl5XlAUBfOyYdZ4pl4mnl/nQvMNh8XL/3/7R6OUIk0STp9c5+GHH+bdf/bbePejj7K0tHT4Pbdv3+ZnPvYxnn/++Xt+tsObC0dKPp/4xCf4n/7RP+rG4jscYjqd8slPfpL/49//+9ff1eFNhnvbMv+V8bnPfY7znZ9Shxbz+ZzPfOYzPPGFL3Sp1jcAjpR8Ll64wK8+/ji3bt16/V0dvsEwnU753Oc+x//1H/8je3t7XTT8DYAjXa8IMXL58mW+/OSTrJ84wZnTp9/wRxeCdGJCCDjnaJqGqqqYz+dMZzOqqhJlvbuulK9/jA7HG7PZjGeeeYbPfOYzfPWrX6Wu69d/S4c3IY605nM3Tp48ySOPPMI7v+Vhzp47y/LKCkpJNyqGQF3XzGYz9vf32djc5Pbt24xGI1ZXV3nrW97CNz30EG958EFOnTpFv9/HGGkZL3D317H1J1/crrVGG0NijHzd7hN1JPb/L7z3FEXB+Vde4fOf/zyvvfoqrlsS/YbBsSGfBYwxmEMVwbvQ6gwvIqHX1wS01iRJIl2ytq37n8Pd5PP6jwX+S4/R4f8bYoyH0axz7vV3d3iT49iRT4cOHb4xcKQF5w4dOnzjoiOfDh06HAk68unQocORoCOfDh06HAk68unQocORoCOfDh06HAk68unQocORoCOfDh06HAk68unQocORoCOfDh06HAk68unQocORoCOfDh06HAk68unQocORoCOfDh06HAk68unQocORoCOfDh06HAk68unQocORoCOfDh06HAk68unQocORoCOfDh06HAk68unQocORoCOfDh06HAk68unQocORoCOfDh06HAk68unQocOR4P8GM+YtX8K/zU8AAAAASUVORK5CYII=');
                alisonTexture.magFilter = THREE.NearestFilter;
            }
            const alisonMat = new THREE.SpriteMaterial({ map: alisonTexture, color: 0xffffff });
            const sprite = new THREE.Sprite(alisonMat);
            sprite.scale.set(15, 20, 1);
            scene.add(sprite);
            return sprite;
        }

        function updateAlisonsPopulation() {
            const targetCount = Math.min(8, 1 + Math.floor(player.kills / 10));
            while (alisonsList.length < targetCount) {
                const sprite = createAlisonSprite();
                const alisonObj = {
                    sprite: sprite,
                    health: 3,
                    damageTimer: 0,
                    baseSpeed: 15,
                    baseY: 0
                };
                alisonsList.push(alisonObj);
                respawnIndividualAlison(alisonObj, 50);
            }
        }

        function respawnIndividualAlison(alisonObj, distanceMin = 50) {
            let angle = Math.random() * Math.PI * 2;
            let dist = distanceMin + Math.random() * 100;
            
            let ax = yawObject.position.x + Math.cos(angle) * dist;
            let az = yawObject.position.z + Math.sin(angle) * dist;
            
            ax = Math.max(-MAP_LIMIT, Math.min(MAP_LIMIT, ax));
            az = Math.max(-MAP_LIMIT, Math.min(MAP_LIMIT, az));

            alisonObj.sprite.position.set(ax, 10, az);
            alisonObj.sprite.visible = true;
            alisonObj.sprite.material.color.setHex(0xffffff);
            alisonObj.health = 3;
            alisonObj.damageTimer = 0;
            alisonObj.baseSpeed = 15;
        }

        function damageIndividualAlison(alisonObj) {
            alisonObj.health--;
            playHitSound();

            alisonObj.sprite.material.color.setHex(0xff0000);
            
            setTimeout(() => {
                if (alisonObj.sprite) alisonObj.sprite.material.color.setHex(0xffffff);
            }, 100);

            if (alisonObj.health <= 0) {
                alisonObj.sprite.visible = false;
                player.kills++;
                document.getElementById('kills-val').innerText = player.kills;
                
                if (player.kills > 0 && player.kills % 10 === 0) {
                    const level = 1 + Math.floor(player.kills / 10);
                    const msgDiv = document.getElementById('level-up-msg');
                    document.getElementById('level-text').innerHTML = "NIVEL " + level + "<br>COMPLETADO";
                    msgDiv.style.opacity = 1;
                    setTimeout(() => { msgDiv.style.opacity = 0; }, 4000);
                }

                updateAlisonsPopulation();

                setTimeout(() => {
                    if (gameState === 'PLAYING') respawnIndividualAlison(alisonObj, 100);
                }, 2000 + Math.random() * 2000);
            }
        }

        // ==========================================
        // GAME LOGIC & LOOP
        // ==========================================
        let prevTime = performance.now();
        let gameState = 'START'; 
        let footstepTimer = 0;

        const bloodOverlay = document.getElementById('blood-overlay');
        const staminaBar = document.getElementById('stamina-bar');
        const healthBar = document.getElementById('health-bar');

        function checkCollision(nextX, nextZ) {
            if (nextX < -MAP_LIMIT || nextX > MAP_LIMIT || nextZ < -MAP_LIMIT || nextZ > MAP_LIMIT) return true;

            for (let i = 0; i < colliders.length; i++) {
                const col = colliders[i];
                const dx = nextX - col.x;
                const dz = nextZ - col.z;
                const distSq = dx*dx + dz*dz;
                const minDist = player.radius + col.r;
                if (distSq < minDist * minDist) {
                    return true;
                }
            }
            return false;
        }

        function update(time) {
            requestAnimationFrame(update);

            if (gameState !== 'PLAYING') {
                renderer.render(scene, camera);
                return;
            }

            const delta = (time - prevTime) / 1000;
            prevTime = time;

            if (recoilTime > 0) {
                recoilTime -= delta;
                weaponGroup.position.z = -3 + Math.sin((0.2 - recoilTime) * 15) * 1.5; 
                weaponGroup.rotation.x = Math.sin((0.2 - recoilTime) * 15) * 0.2; 
            } else {
                weaponGroup.position.z = -3;
                weaponGroup.rotation.x = 0;
            }

            player.direction.z = Number(moveForward) - Number(moveBackward); 
            player.direction.x = Number(moveRight) - Number(moveLeft); 
            player.direction.normalize();

            let isRunning = false;
            let currentSpeed = PLAYER_SPEED;
            if (player.isSprinting && player.stamina > 0 && (moveForward || moveBackward || moveLeft || moveRight)) {
                currentSpeed *= SPRINT_MULTIPLIER;
                player.stamina -= delta * 20; 
                isRunning = true;
            } else {
                player.stamina += delta * 15; 
            }
            player.stamina = Math.max(0, Math.min(100, player.stamina));
            staminaBar.style.width = player.stamina + '%';
            healthBar.style.width = player.health + '%';

            if (moveForward || moveBackward) player.velocity.z += player.direction.z * currentSpeed * delta;
            if (moveLeft || moveRight) player.velocity.x += player.direction.x * currentSpeed * delta;

            player.velocity.x -= player.velocity.x * 10.0 * delta;
            player.velocity.z -= player.velocity.z * 10.0 * delta;

            const camDir = new THREE.Vector3();
            camera.getWorldDirection(camDir);
            camDir.y = 0; 
            camDir.normalize();
            
            const right = new THREE.Vector3().crossVectors(camDir, new THREE.Vector3(0,1,0)).normalize();
            
            let moveVector = new THREE.Vector3();
            moveVector.addScaledVector(camDir, player.velocity.z);
            moveVector.addScaledVector(right, player.velocity.x);

            const nextX = yawObject.position.x + moveVector.x;
            const nextZ = yawObject.position.z + moveVector.z;

            if (!checkCollision(nextX, yawObject.position.z)) {
                yawObject.position.x = nextX;
            }
            if (!checkCollision(yawObject.position.x, nextZ)) {
                yawObject.position.z = nextZ;
            }

            const groundY = getElevation(yawObject.position.x, yawObject.position.z);
            
            if (!isReloading) {
                if (Math.abs(player.velocity.x) > 0.1 || Math.abs(player.velocity.z) > 0.1) {
                    const bobSpeed = isRunning ? 15 : 10;
                    yawObject.position.y = groundY + PLAYER_HEIGHT + Math.sin(time * bobSpeed * 0.001) * 0.5;
                    
                    weaponGroup.position.x = 1.5 + Math.sin(time * bobSpeed * 0.0005) * 0.1;
                    weaponGroup.position.y = -1.5 + Math.cos(time * bobSpeed * 0.001) * 0.1;

                    footstepTimer += delta;
                    if (footstepTimer > (isRunning ? 0.3 : 0.5)) {
                        playFootstep();
                        footstepTimer = 0;
                    }
                } else {
                    yawObject.position.y = groundY + PLAYER_HEIGHT;
                    weaponGroup.position.x = 1.5;
                    weaponGroup.position.y = -1.5;
                }
            } else {
                // Posición visual mientras recarga
                weaponGroup.position.x = 1.0 + Math.sin(time * 0.02) * 0.05;
                yawObject.position.y = groundY + PLAYER_HEIGHT;
            }

            // Verificar colisiones con balas individuales (plano horizontal XZ)
            for (let i = 0; i < bulletsPool.length; i++) {
                const b = bulletsPool[i];
                const dx = yawObject.position.x - b.position.x;
                const dz = yawObject.position.z - b.position.z;
                const distXZ = Math.hypot(dx, dz);
                if (distXZ < 8) {
                    collectSingleBullet(b);
                }
                b.rotation.y += delta * 2.0;
            }

            // --- ALISON AI UPDATE ---
            let minDistance = Infinity;
            let closestAlison = null;

            for (let i = 0; i < alisonsList.length; i++) {
                const alisonObj = alisonsList[i];
                if (!alisonObj.sprite.visible) continue;

                alisonObj.damageTimer -= delta;

                const sprite = alisonObj.sprite;
                alisonObj.baseY = getElevation(sprite.position.x, sprite.position.z) + 12;
                sprite.position.y = alisonObj.baseY + Math.sin(time * 0.005 + i) * 1.5; 

                const distToPlayer = sprite.position.distanceTo(yawObject.position);
                if (distToPlayer < minDistance) {
                    minDistance = distToPlayer;
                    closestAlison = alisonObj;
                }

                const dirToPlayer = new THREE.Vector3().subVectors(yawObject.position, sprite.position).normalize();

                sprite.position.x += dirToPlayer.x * alisonObj.baseSpeed * delta;
                sprite.position.z += dirToPlayer.z * alisonObj.baseSpeed * delta;

                // Separación para evitar que se superpongan
                for (let j = 0; j < alisonsList.length; j++) {
                    if (i === j) continue;
                    const otherObj = alisonsList[j];
                    if (!otherObj.sprite.visible) continue;
                    const distToOther = sprite.position.distanceTo(otherObj.sprite.position);
                    if (distToOther < 25) {
                        const pushDir = new THREE.Vector3().subVectors(sprite.position, otherObj.sprite.position).normalize();
                        sprite.position.add(pushDir.multiplyScalar(40 * delta));
                    }
                }

                if (distToPlayer < 10) { 
                    if (alisonObj.damageTimer <= 0) {
                        player.health -= 25; 
                        alisonObj.damageTimer = 1.0; 
                        
                        playDamageSound();
                        
                        bloodOverlay.style.opacity = 1;
                        setTimeout(() => { bloodOverlay.style.opacity = 0; }, 300);

                        yawObject.position.add(dirToPlayer.multiplyScalar(5));
                    }
                }
            }

            if (closestAlison && minDistance < 150) {
                const intensity = 1.0 - (minDistance / 150);
                
                if (bgmFilter) bgmFilter.frequency.value = 200 + intensity * 800; 
                
                chaseGain.gain.setTargetAtTime(intensity * 0.15, audioCtx.currentTime, 0.5);
                chaseOsc.frequency.setTargetAtTime(100 + intensity * 100, audioCtx.currentTime, 0.5);

                camera.rotation.z = Math.sin(time * 0.02) * 0.05 * intensity; 
            } else {
                chaseGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.5);
                if (bgmFilter) bgmFilter.frequency.value = 200;
                camera.rotation.z = 0;
            }

            if (player.health <= 0) {
                gameOver();
            }

            renderer.render(scene, camera);
        }

        // ==========================================
        // GAME STATE MANAGEMENT
        // ==========================================
        let heartbeatTimer = null;
        function startLoadingHeartbeat() {
            initAudio();
            if (!audioCtx) return;
            if (audioCtx.state === 'suspended') audioCtx.resume();
            
            function pulse() {
                const t = audioCtx.currentTime;
                
                // First thud
                const osc1 = audioCtx.createOscillator();
                const gain1 = audioCtx.createGain();
                osc1.type = 'sine';
                osc1.frequency.setValueAtTime(60, t);
                osc1.frequency.exponentialRampToValueAtTime(10, t + 0.15);
                gain1.gain.setValueAtTime(0.6, t);
                gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
                osc1.connect(gain1);
                gain1.connect(audioCtx.destination);
                osc1.start(t);
                osc1.stop(t + 0.15);
                
                // Second thud (slightly higher frequency and delayed)
                const osc2 = audioCtx.createOscillator();
                const gain2 = audioCtx.createGain();
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(55, t + 0.25);
                osc2.frequency.exponentialRampToValueAtTime(10, t + 0.4);
                gain2.gain.setValueAtTime(0.5, t + 0.25);
                gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
                osc2.connect(gain2);
                gain2.connect(audioCtx.destination);
                osc2.start(t + 0.25);
                osc2.stop(t + 0.4);
            }
            
            pulse();
            heartbeatTimer = setInterval(pulse, 1200);
        }
        
        function stopLoadingHeartbeat() {
            if (heartbeatTimer) {
                clearInterval(heartbeatTimer);
                heartbeatTimer = null;
            }
        }

        function onStartClicked() {
            const startScreen = document.getElementById('start-screen');
            const menuBg = document.getElementById('menu-background');
            const loadingScreen = document.getElementById('loading-screen');
            const fadeOverlay = document.getElementById('fade-overlay');
            const versionTag = document.getElementById('version-tag');
            
            // Phase 1: Slow 3-second fadeout of start menu, version, and background image
            startScreen.classList.add('fade-out-3s');
            menuBg.classList.add('fade-out-3s');
            if (versionTag) {
                versionTag.classList.add('fade-out-3s');
            }
            
            // Fade the black overlay to fully opaque over 3 seconds to completely hide the 3D scene in the background
            fadeOverlay.style.transition = 'opacity 3s ease-in-out';
            fadeOverlay.style.opacity = '1';
            
            // Programmatically decay background music concurrently to 0 over 3.0 seconds
            let volInterval = setInterval(() => {
                if (menuMusic.volume > 0.01) {
                    menuMusic.volume -= 0.01;
                } else {
                    menuMusic.volume = 0;
                    menuMusic.pause();
                    clearInterval(volInterval);
                }
            }, 100);
            
            // Phase 2: After exactly 3.0 seconds, hide menus completely and show the loading screen
            setTimeout(() => {
                startScreen.style.display = 'none';
                startScreen.classList.remove('fade-out-3s');
                menuBg.style.display = 'none';
                menuBg.classList.remove('fade-out-3s');
                
                // Show loading screen
                loadingScreen.style.display = 'flex';
                loadingScreen.classList.remove('fade-out');
                
                // Start procedural heartbeat sound
                startLoadingHeartbeat();
                
                // Set the black overlay fully opaque behind the loading screen to prepare for game fade-in
                fadeOverlay.style.transition = 'none';
                fadeOverlay.style.opacity = '1';
                
                // Keep the loading screen active for 3.5 seconds
                setTimeout(() => {
                    // Phase 3: Loading screen fades out
                    loadingScreen.classList.add('fade-out');
                    stopLoadingHeartbeat();
                    
                    // Transition to active game after loading screen fully fades (1.0s)
                    setTimeout(() => {
                        loadingScreen.style.display = 'none';
                        loadingScreen.classList.remove('fade-out');
                        startGame();
                    }, 1000);
                    
                }, 3500);
                
            }, 3000);
        }

        function startGame() {
            menuMusic.pause();
            menuMusic.currentTime = 0;
            
            document.getElementById('start-screen').style.display = 'none';
            document.getElementById('menu-background').style.display = 'none';
            
            const versionTag = document.getElementById('version-tag');
            if (versionTag) {
                versionTag.style.display = 'none';
                versionTag.classList.remove('fade-out-3s');
            }
            
            document.getElementById('hud').style.display = 'block';
            if (isTouchDevice) {
                document.getElementById('touch-controls').style.display = 'block';
            }
            
            initAudio();
            
            yawObject.position.set(0, PLAYER_HEIGHT, 0);
            pitchObject.rotation.set(0,0,0);
            yawObject.rotation.set(0,0,0);
            
            player.stamina = 100;
            player.health = 100;
            player.ammo = 30;
            player.reserveAmmo = 0;
            player.kills = 0;
            isReloading = false;
            document.getElementById('kills-val').innerText = '0';
            document.getElementById('ammo-val').innerText = '30';
            document.getElementById('reserve-val').innerText = '0';
            
            // Reubicar todas las balas en el mapa
            for (let i = 0; i < bulletsPool.length; i++) {
                respawnSingleBullet(bulletsPool[i]);
            }
            
            for (let i = 0; i < alisonsList.length; i++) {
                scene.remove(alisonsList[i].sprite);
            }
            alisonsList.length = 0;
            
            // Phase 4: Gameplay slow 3-second fade-in (desvanecimiento del fondo negro)
            const fadeOverlay = document.getElementById('fade-overlay');
            fadeOverlay.style.transition = 'opacity 3s ease-in-out';
            fadeOverlay.offsetHeight; // Force reflow
            fadeOverlay.style.opacity = '0';
            
            // Delayed Enemy Spawning: Generate Alison exactly 5 seconds after start
            setTimeout(updateAlisonsPopulation, 5000);

            if (!isTouchDevice) {
                document.body.requestPointerLock();
            }
            gameState = 'PLAYING';
            prevTime = performance.now();
        }

        function gameOver() {
            gameState = 'GAMEOVER';
            if (document.pointerLockElement === document.body) {
                document.exitPointerLock();
            }
            
            if (bgmGain) bgmGain.gain.value = 0;
            if (chaseGain) chaseGain.gain.value = 0;

            const goScreen = document.getElementById('game-over-screen');
            const jsCollage = document.getElementById('jumpscare-collage');
            const goText = document.getElementById('game-over-text');
            const restartBtn = document.getElementById('restart-btn-lose');
            const menuBtnLose = document.getElementById('menu-btn-lose');
            
            document.getElementById('hud').style.display = 'none';
            document.getElementById('touch-controls').style.display = 'none'; // Hide touch overlay
            goScreen.style.display = 'flex';
            
            // Reproducir sonido de game_over
            deathSound.play().catch(e => console.log("Error al reproducir audio de muerte:", e));
            
            goScreen.style.background = 'red';
            setTimeout(() => {
                goScreen.style.background = 'black';
                jsCollage.style.opacity = '1';
                goText.style.animationPlayState = 'running';
                
                setTimeout(() => {
                    restartBtn.style.opacity = '1';
                    menuBtnLose.style.opacity = '1';
                }, 300);
            }, 100);
        }

        document.getElementById('start-btn').addEventListener('click', onStartClicked);
        document.getElementById('restart-btn-lose').addEventListener('click', () => {
            document.getElementById('game-over-screen').style.display = 'none';
            document.getElementById('jumpscare-collage').style.opacity = '0';
            startGame();
        });
        document.getElementById('menu-btn-lose').addEventListener('click', () => location.reload());
        document.getElementById('resume-btn').addEventListener('click', () => {
            if (isTouchDevice) {
                resumeGame();
            } else {
                document.body.requestPointerLock();
            }
        });
        document.getElementById('menu-btn-pause').addEventListener('click', () => location.reload());

        document.getElementById('chars-btn').addEventListener('click', () => {
            document.getElementById('start-screen').style.display = 'none';
            document.getElementById('characters-screen').style.display = 'flex';
        });

        document.getElementById('back-btn').addEventListener('click', () => {
            document.getElementById('characters-screen').style.display = 'none';
            document.getElementById('start-screen').style.display = 'flex';
        });

        document.getElementById('options-btn').addEventListener('click', () => {
            document.getElementById('start-screen').style.display = 'none';
            document.getElementById('options-screen').style.display = 'flex';
        });
        document.getElementById('back-btn-opts').addEventListener('click', () => {
            document.getElementById('options-screen').style.display = 'none';
            document.getElementById('start-screen').style.display = 'flex';
        });

        document.getElementById('credits-btn').addEventListener('click', () => {
            document.getElementById('start-screen').style.display = 'none';
            document.getElementById('credits-screen').style.display = 'flex';
        });
        document.getElementById('back-btn-cred').addEventListener('click', () => {
            document.getElementById('credits-screen').style.display = 'none';
            document.getElementById('start-screen').style.display = 'flex';
        });

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        requestAnimationFrame(update);

        // ==========================================
        // 🥚 EASTER EGG — TITULO X10 CLICKS
        // ==========================================
        (function initEasterEgg() {
            const titleEl = document.getElementById('menu-title-trigger');
            const overlay = document.getElementById('easter-egg-overlay');

            let titleClicks   = 0;
            let closeClicks   = 0;
            let chargeTimeout = null;
            let isEggActive   = false;

            // === Web Audio API para volumen extremo (muy por encima del 100%) ===
            let eggAudioCtx   = null;
            let eggGainNode   = null;
            let eggBuffer     = null;
            let eggSource     = null;       // fuente activa actual
            let eggLoopTimer  = null;       // timer del re-inicio anticipado

            // Pre-cargar el buffer del grito en segundo plano
            fetch('assets/audio/grito_terror.mp3')
                .then(r => r.arrayBuffer())
                .then(data => {
                    // Crear contexto de audio privado para el easter egg
                    const AC = window.AudioContext || window.webkitAudioContext;
                    eggAudioCtx = new AC();
                    return eggAudioCtx.decodeAudioData(data);
                })
                .then(buf => {
                    eggBuffer = buf;
                    // GainNode amplificado al máximo: 8.0 = ~800% de volumen normal
                    eggGainNode = eggAudioCtx.createGain();
                    eggGainNode.gain.value = 8.0;
                    eggGainNode.connect(eggAudioCtx.destination);
                })
                .catch(e => console.warn('Easter egg audio preload failed:', e));

            // Reproduce el buffer y programa el próximo inicio 0.5s antes de que termine
            function playEggLoop() {
                if (!eggAudioCtx || !eggBuffer || !eggGainNode) return;

                // Detener fuente anterior si existe
                if (eggSource) {
                    try { eggSource.stop(); } catch(e) {}
                    eggSource.disconnect();
                }

                const src = eggAudioCtx.createBufferSource();
                src.buffer = eggBuffer;
                src.connect(eggGainNode);
                src.start(0);
                eggSource = src;

                // Programar el siguiente inicio 0.5s antes de que termine el actual
                const duration = eggBuffer.duration;
                const overlap  = 0.5; // segundos de anticipación
                const delay    = Math.max(0, (duration - overlap) * 1000);

                clearTimeout(eggLoopTimer);
                eggLoopTimer = setTimeout(() => {
                    if (isEggActive) playEggLoop();
                }, delay);
            }

            function stopEggLoop() {
                clearTimeout(eggLoopTimer);
                if (eggSource) {
                    try { eggSource.stop(); } catch(e) {}
                    eggSource.disconnect();
                    eggSource = null;
                }
                // Suspender el contexto para liberar recursos
                if (eggAudioCtx && eggAudioCtx.state === 'running') {
                    eggAudioCtx.suspend();
                }
            }

            // --- ACTIVAR con 10 clicks en el título ---
            if (titleEl) {
                titleEl.addEventListener('click', (e) => {
                    e.stopPropagation(); // No propagar al body listener de música
                    if (isEggActive) return;

                    titleClicks++;
                    titleEl.classList.add('egg-charging');

                    clearTimeout(chargeTimeout);
                    chargeTimeout = setTimeout(() => {
                        titleClicks = 0;
                        titleEl.classList.remove('egg-charging');
                    }, 3000);

                    if (titleClicks >= 10) {
                        titleClicks = 0;
                        clearTimeout(chargeTimeout);
                        titleEl.classList.remove('egg-charging');
                        activateEasterEgg();
                    }
                });
            }

            function activateEasterEgg() {
                isEggActive = true;
                closeClicks = 0;

                // Mostrar overlay
                overlay.style.display = 'block';

                // --- Silenciar COMPLETAMENTE la música del menú ---
                menuMusic.volume = 0;
                menuMusic.pause();
                menuMusic.currentTime = 0;

                // --- Iniciar grito con Web Audio API a volumen extremo ---
                if (eggAudioCtx && eggBuffer) {
                    // Reanudar contexto si estaba suspendido
                    if (eggAudioCtx.state === 'suspended') {
                        eggAudioCtx.resume().then(() => playEggLoop());
                    } else {
                        playEggLoop();
                    }
                } else {
                    // Fallback: HTML Audio si el buffer no cargó aún
                    const fallback = new Audio('assets/audio/grito_terror.mp3');
                    fallback.loop   = true;
                    fallback.volume = 1.0;
                    fallback.play().catch(e => console.warn('Fallback scream error:', e));
                    eggSource = fallback; // guardar referencia para detenerlo
                }
            }

            function deactivateEasterEgg() {
                isEggActive = false;

                // 1. Detener el grito INMEDIATAMENTE
                stopEggLoop();

                // 2. Fade-out del overlay
                overlay.style.transition = 'opacity 0.4s ease';
                overlay.style.opacity = '0';
                setTimeout(() => {
                    overlay.style.display = 'none';
                    overlay.style.opacity = '1';
                    overlay.style.transition = '';
                }, 400);

                // 3. Reiniciar el soundtrack desde el principio con fade-in gradual
                if (gameState !== 'PLAYING' && gameState !== 'GAMEOVER') {
                    menuMusic.pause();
                    menuMusic.currentTime = 0;
                    menuMusic.volume = 0;
                    menuMusic.play().then(() => {
                        // Subir el volumen gradualmente en 1 segundo (20 pasos de 50ms)
                        let step = 0;
                        const target = 0.3;
                        const fadeIn = setInterval(() => {
                            step++;
                            menuMusic.volume = Math.min(target, (step / 20) * target);
                            if (step >= 20) clearInterval(fadeIn);
                        }, 50);
                    }).catch(e => console.warn('menuMusic restart error:', e));
                }
            }

            // --- DESACTIVAR con 10 clicks en el overlay ---
            overlay.addEventListener('click', () => {
                if (!isEggActive) return;

                closeClicks++;
                if (closeClicks >= 10) {
                    deactivateEasterEgg();
                }
            });
        })();