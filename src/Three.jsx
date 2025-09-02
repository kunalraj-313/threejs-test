import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useLoader, useFrame, useThree } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function MyThree() {
    const [position, setPosition] = useState([0, 0, 0]);
    const [keyState, setKeyState] = useState({ left: false, right: false, up: false, down: false });
    const [tiltAngle, setTiltAngle] = useState({ x: 0, z: 0 });
    const [obstacles, setObstacles] = useState([]);
    const [projectiles, setProjectiles] = useState([]);
    const [shipHp, setShipHp] = useState(100);
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [obstacleSpeed, setObstacleSpeed] = useState(0.1);
    const [spawnInterval, setSpawnInterval] = useState(2000);
    const positionRef = useRef([0, 0, 0]);
    const tiltRef = useRef({ x: 0, z: 0 });
    const gameStartTime = useRef(Date.now());
    const lastScoreTime = useRef(Date.now());



    function ObstacleSystem() {
        const obstacleRefs = useRef([]);
        const lastSpawnTime = useRef(0);

        useFrame(() => {
            const currentTime = Date.now();
            
            setObstacles(prev => {
                const newObstacles = prev.map(obstacle => ({
                    ...obstacle,
                    z: obstacle.z + obstacleSpeed
                }));
                
                const filteredObstacles = newObstacles.filter(obstacle => obstacle.z < 10);
                
                if (filteredObstacles.length === 0) {
                    
                    const numberOfObstacles = Math.floor(Math.random() * 20) + 1;
                    const newWave = [];
                    
                    for (let i = 0; i < numberOfObstacles; i++) {
                        newWave.push({
                            id: Date.now() + Math.random() + i,
                            x: (Math.random() - 0.5) * 20,
                            y: Math.random() * 6 - 3,
                            z: -Math.random() * 20 - 30,
                            hp: 20,
                            maxHp: 20
                        });
                    }
                    
                    lastSpawnTime.current = currentTime;
                    return newWave;
                }
                
                return filteredObstacles;
            });
        });

        return (
            <>
                {obstacles.map((obstacle, index) => {
                    const healthPercentage = obstacle.hp / obstacle.maxHp;
                    const red = Math.floor(255 * healthPercentage);
                    const color = `rgb(${red}, 0, 0)`;
                    
                    return (
                        <mesh
                            key={obstacle.id}
                            position={[obstacle.x, obstacle.y, obstacle.z]}
                            ref={el => obstacleRefs.current[index] = el}
                        >
                            <sphereGeometry args={[0.5, 16, 16]} />
                            <meshStandardMaterial color={color} />
                        </mesh>
                    );
                })}
            </>
        );
    }

    function ProjectileSystem() {
        useFrame(() => {
            setProjectiles(prev => {
                return prev.map(projectile => ({
                    ...projectile,
                    z: projectile.z - 1
                })).filter(projectile => projectile.z > -50);
            });

            // Check for collisions between projectiles and obstacles
            setObstacles(prevObstacles => {
                return prevObstacles.map(obstacle => {
                    let newObstacle = { ...obstacle };
                    
                    projectiles.forEach(projectile => {
                        const distance = Math.sqrt(
                            Math.pow(obstacle.x - projectile.x, 2) +
                            Math.pow(obstacle.y - projectile.y, 2) +
                            Math.pow(obstacle.z - projectile.z, 2)
                        );
                        
                        if (distance < 0.6) {
                            newObstacle.hp = Math.max(0, newObstacle.hp - 5);
                            // Add 5 points for each hit
                            setScore(prev => prev + 5);
                            // Remove the projectile that hit
                            setProjectiles(prev => prev.filter(p => p.id !== projectile.id));
                        }
                    });
                    
                    return newObstacle;
                }).filter(obstacle => obstacle.hp > 0);
            });
        });

        const shootProjectile = () => {
            const newProjectile = {
                id: Date.now() + Math.random(),
                x: position[0],
                y: position[1],
                z: position[2]
            };
            setProjectiles(prev => [...prev, newProjectile]);
        };

        useEffect(() => {
            const handleClick = () => {
                shootProjectile();
            };

            window.addEventListener('click', handleClick);
            return () => window.removeEventListener('click', handleClick);
        }, [position]);

        return (
            <>
                {projectiles.map((projectile) => (
                    <mesh
                        key={projectile.id}
                        position={[projectile.x, projectile.y, projectile.z]}
                    >
                        <sphereGeometry args={[0.1, 8, 8]} />
                        <meshStandardMaterial color="#00ff00" emissive="#004400" />
                    </mesh>
                ))}
            </>
        );
    }

    function MovementController() {
        useFrame(() => {
            let moved = false;
            
            if (keyState.left || keyState.right || keyState.up || keyState.down) {
                const [x, y, z] = positionRef.current;
                let newX = x;
                let newY = y;
                
                if (keyState.left) newX -= 0.15;
                if (keyState.right) newX += 0.15;
                if (keyState.up) newY += 0.15;
                if (keyState.down) newY -= 0.15;
                
                // Apply boundary checks
                newX = Math.max(-10, Math.min(10, newX));  // Horizontal: -10 to 10
                newY = Math.max(-3, Math.min(3, newY));    // Vertical: -3 to 3
                
                positionRef.current = [newX, newY, z];
                setPosition([newX, newY, z]);
                moved = true;
            }

            const targetTiltZ = keyState.left ? -0.3 : keyState.right ? 0.3 : 0;
            const targetTiltX = keyState.up ? -0.2 : keyState.down ? 0.2 : 0;
            const tiltSpeed = 0.1;
            
            const newTiltZ = tiltRef.current.z + (targetTiltZ - tiltRef.current.z) * tiltSpeed;
            const newTiltX = tiltRef.current.x + (targetTiltX - tiltRef.current.x) * tiltSpeed;
            
            tiltRef.current = { x: newTiltX, z: newTiltZ };
            setTiltAngle({ x: newTiltX, z: newTiltZ });

            // Check for ship-obstacle collisions
            if (!gameOver) {
                obstacles.forEach(obstacle => {
                    const distance = Math.sqrt(
                        Math.pow(obstacle.x - position[0], 2) +
                        Math.pow(obstacle.y - position[1], 2) +
                        Math.pow(obstacle.z - position[2], 2)
                    );
                    
                    if (distance < 0.8) {
                        setShipHp(prev => {
                            const newHp = Math.max(0, prev - obstacle.hp);
                            if (newHp === 0) {
                                setGameOver(true);
                            }
                            return newHp;
                        });
                        
                        setObstacles(prev => prev.filter(obs => obs.id !== obstacle.id));
                    }
                });
            }
        });

        return null;
    }

    function SpaceshipModel() {
        const meshRef = useRef();
        const materials = useLoader(MTLLoader, '/material/spaceship.mtl');
        const obj = useLoader(OBJLoader, '/models/spaceship.obj', (loader) => {
            materials.preload();
            loader.setMaterials(materials);
        });

        const clonedObj = obj.clone();

        const box = new THREE.Box3().setFromObject(clonedObj);
        const center = box.getCenter(new THREE.Vector3());
        clonedObj.position.sub(center);

        const size = box.getSize(new THREE.Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDimension;
        clonedObj.scale.setScalar(scale);

        clonedObj.rotation.y = Math.PI;

        clonedObj.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
            }
        });

        useFrame(() => {
            if (meshRef.current) {
                meshRef.current.position.set(...position);
                meshRef.current.rotation.set(tiltAngle.x, Math.PI, tiltAngle.z);
            }
        });

        return <primitive ref={meshRef} object={clonedObj} />;
    }

    function StarField() {
        const starsRef = useRef();
        const starCount = 800;

        useEffect(() => {
            const positions = new Float32Array(starCount * 3);
            for (let i = 0; i < starCount; i++) {
                // Generate stars on a large sphere around the origin
                const radius = 300;
                const theta = Math.random() * Math.PI * 2; // Random angle around Y axis
                const phi = Math.acos(1 - 2 * Math.random()); // Random angle from top to bottom
                
                positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);     // x
                positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta); // y
                positions[i * 3 + 2] = radius * Math.cos(phi);                   // z
            }
            if (starsRef.current) {
                starsRef.current.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            }
        }, []); // Generate once and never update

        return (
            <points>
                <bufferGeometry ref={starsRef} />
                <pointsMaterial
                    color="white"
                    size={2}
                    sizeAttenuation={false}
                />
            </points>
        );
    }

    function Ground() {
        return (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
                <planeGeometry args={[20, 20]} />
                <meshStandardMaterial color="#666666" />
            </mesh>
        );
    }

    function CameraController() {
        const { camera } = useThree();

        useFrame(() => {
            const targetX = position[0];
            const targetY = position[1] + 2;
            const targetZ = position[2] + 5;

            camera.position.set(targetX, targetY, targetZ);
            camera.lookAt(position[0], position[1], position[2]);
        });

        return null;
    }

    const restartGame = () => {
        setGameOver(false);
        setShipHp(100);
        setScore(0);
        setObstacleSpeed(0.1); 
        setPosition([0, 0, 0]);
        setObstacles([]);
        setProjectiles([]);
        positionRef.current = [0, 0, 0];
        tiltRef.current = { x: 0, z: 0 };
        gameStartTime.current = Date.now();
        lastScoreTime.current = Date.now();
    };

    // Time-based scoring system
    useEffect(() => {
        if (gameOver) return;

        const scoreInterval = setInterval(() => {
            setScore(prev => prev + 1);
            lastScoreTime.current = Date.now();
        }, 1000);

        return () => clearInterval(scoreInterval);
    }, [gameOver]);

    useEffect(() => {
        if (score > 0 && score % 200 === 0) {
            setObstacleSpeed(prev => prev + 0.05);
        }
    }, [score]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            switch (event.key) {
                case 'a':
                    setKeyState(prev => ({ ...prev, left: true }));
                    break;
                case 'd':
                    setKeyState(prev => ({ ...prev, right: true }));
                    break;
                case 'w':
                    setKeyState(prev => ({ ...prev, up: true }));
                    break;
                case 's':
                    setKeyState(prev => ({ ...prev, down: true }));
                    break;
                case 'ArrowLeft':
                    setKeyState(prev => ({ ...prev, left: true }));
                    break;
                case 'ArrowRight':
                    setKeyState(prev => ({ ...prev, right: true }));
                    break;
                case 'ArrowUp':
                    setKeyState(prev => ({ ...prev, up: true }));
                    break;
                case 'ArrowDown':
                    setKeyState(prev => ({ ...prev, down: true }));
                    break;
            }
        };

        const handleKeyUp = (event) => {
            switch (event.key) {
                case 'a':
                    setKeyState(prev => ({ ...prev, left: false }));
                    break;
                case 'd':
                    setKeyState(prev => ({ ...prev, right: false }));
                    break;
                case 'w':
                    setKeyState(prev => ({ ...prev, up: false }));
                    break;
                case 's':
                    setKeyState(prev => ({ ...prev, down: false }));
                    break;
                case 'ArrowLeft':
                    setKeyState(prev => ({ ...prev, left: false }));
                    break;
                case 'ArrowRight':
                    setKeyState(prev => ({ ...prev, right: false }));
                    break;
                case 'ArrowUp':
                    setKeyState(prev => ({ ...prev, up: false }));
                    break;
                case 'ArrowDown':
                    setKeyState(prev => ({ ...prev, down: false }));
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    //   useEffect(() => {
    //     const interval = setInterval(() => {
    //       if (keyState.left || keyState.right) {
    //         setPosition((prev) => {
    //           const [x, y, z] = prev;
    //           let newX = x;
    //           if (keyState.left) newX -= 0.15;
    //           if (keyState.right) newX += 0.15;
    //           return [newX, y, z];
    //         });
    //       }

    //       setTiltAngle((prev) => {
    //         const targetTilt = keyState.left ? -0.3 : keyState.right ? 0.3 : 0;
    //         const tiltSpeed = 0.1;
    //         return prev + (targetTilt - prev) * tiltSpeed;
    //       });
    //     }, 16);

    //     return () => clearInterval(interval);
    //   }, [keyState]);

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
            {/* HP Bar */}
            <div style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                zIndex: 1000,
                color: 'white',
                fontSize: '20px',
                fontFamily: 'Arial, sans-serif'
            }}>
                <div>HP: {shipHp}/100</div>
                <div style={{
                    width: '200px',
                    height: '20px',
                    border: '2px solid white',
                    backgroundColor: 'transparent',
                    marginTop: '5px'
                }}>
                    <div style={{
                        width: `${(shipHp / 100) * 100}%`,
                        height: '100%',
                        backgroundColor: shipHp > 30 ? '#00ff00' : shipHp > 15 ? '#ffff00' : '#ff0000',
                        transition: 'width 0.3s, background-color 0.3s'
                    }}></div>
                </div>
            </div>

            {/* Score Display */}
            <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                zIndex: 1000,
                color: 'white',
                fontSize: '24px',
                fontFamily: 'Arial, sans-serif',
                textAlign: 'right'
            }}>
                <div>Score: {score}</div>
                <div style={{ fontSize: '16px', marginTop: '5px', opacity: '0.8' }}>
                    Time: {Math.floor((Date.now() - gameStartTime.current) / 1000)}s
                </div>
            </div>

            {/* Game Over Screen */}
            {gameOver && (
                <div 
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 2000,
                        color: 'white',
                        fontSize: '48px',
                        fontFamily: 'Arial, sans-serif',
                        textAlign: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: '40px',
                        borderRadius: '10px',
                        cursor: 'pointer'
                    }}
                    onClick={restartGame}
                >
                    <div>GAME OVER</div>
                    <div style={{ fontSize: '32px', marginTop: '20px', color: '#ffff00' }}>
                        Final Score: {score}
                    </div>
                    <div style={{ fontSize: '20px', marginTop: '10px', opacity: '0.8' }}>
                        Time Survived: {Math.floor((Date.now() - gameStartTime.current) / 1000)}s
                    </div>
                    <div style={{ fontSize: '24px', marginTop: '20px' }}>
                        Click to restart
                    </div>
                </div>
            )}

            <Canvas
                camera={{ position: [0, 2, 5], fov: 75 }}
                style={{ background: '#000000' }}
                shadows
            >
                {!gameOver && (
                    <>
                        <ambientLight intensity={0.4} />
                        <directionalLight
                            position={[10, 10, 10]}
                            intensity={1.2}
                            castShadow
                            shadow-mapSize={[1024, 1024]}
                        />
                        <MovementController />
                        <SpaceshipModel />
                        {/* <Ground /> */}
                        <StarField />
                        <ObstacleSystem />
                        <ProjectileSystem />
                        <CameraController />
                        <OrbitControls enabled={false} />
                    </>
                )}
            </Canvas>
        </div>
    );
}

export default MyThree;
