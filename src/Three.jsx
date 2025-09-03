import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useLoader, useFrame, useThree } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { supabase } from './supabase';
import { Filter } from "bad-words";


function MyThree() {
    const [position, setPosition] = useState([0, 0, 0]);
    const [keyState, setKeyState] = useState({ left: false, right: false, up: false, down: false });
    const [tiltAngle, setTiltAngle] = useState({ x: 0, z: 0 });
    const [obstacles, setObstacles] = useState([]);
    const [projectiles, setProjectiles] = useState([]);
    const [shipHp, setShipHp] = useState(100);
    const [gameOver, setGameOver] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [showNameInput, setShowNameInput] = useState(false);
    const [playerName, setPlayerName] = useState('');
    const [leaderboard, setLeaderboard] = useState([]);
    const [score, setScore] = useState(0);
    const [obstacleSpeed, setObstacleSpeed] = useState(0.1);
    const [spawnInterval, setSpawnInterval] = useState(2000);
    const positionRef = useRef([0, 0, 0]);
    const tiltRef = useRef({ x: 0, z: 0 });
    const gameStartTime = useRef(Date.now());
    const lastScoreTime = useRef(Date.now());

    // Initialize profanity filter
    const filter = new Filter();



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
                                setShowNameInput(true);
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

    // Leaderboard functions
    const fetchLeaderboard = async () => {
        try {
            const { data, error } = await supabase
                .from('space_shooter')
                .select('*')
                .order('score', { ascending: false })
                .limit(10);
            
            if (error) throw error;
            setLeaderboard(data || []);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        }
    };

    const saveScore = async (name, finalScore, timeElapsed) => {
        try {
            const { error } = await supabase
                .from('space_shooter')
                .insert([
                    { 
                        name: name, 
                        score: finalScore, 
                        time_elapsed: timeElapsed 
                    }
                ]);
            
            if (error) throw error;
            fetchLeaderboard(); // Refresh leaderboard after saving
        } catch (error) {
            console.error('Error saving score:', error);
        }
    };

    const handleNameSubmit = async () => {
        if (playerName.trim()) {
            // Apply profanity filter to the name
            const filteredName = filter.clean(playerName.trim());
            const timeElapsed = Math.floor((Date.now() - gameStartTime.current) / 1000);
            await saveScore(filteredName, score, timeElapsed);
            setShowNameInput(false);
            setPlayerName('');
            setGameOver(true);
        }
    };

    // Load leaderboard on component mount
    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const startGame = () => {
        setGameStarted(true);
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

    const restartGame = () => {
        setGameOver(false);
        setShowNameInput(false);
        setPlayerName('');
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
            {/* Leaderboard - Positioned under HP bar */}
            <div style={{
                position: 'absolute',
                top: '115px',
                left: '20px',
                width: '250px',
                zIndex: 1500,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                border: '2px solid #00ff00',
                borderRadius: '10px',
                padding: '15px',
                color: 'white',
                fontFamily: 'Arial, sans-serif',
                fontSize: '14px'
            }}>
                <h3 style={{ 
                    margin: '0 0 15px 0', 
                    color: '#00ff00', 
                    textAlign: 'center',
                    fontSize: '18px'
                }}>
                    🏆 LEADERBOARD
                </h3>
                {leaderboard.length > 0 ? (
                    <div>
                        {leaderboard.map((entry, index) => (
                            <div key={entry.id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '5px 0',
                                borderBottom: index < leaderboard.length - 1 ? '1px solid #333' : 'none'
                            }}>
                                <span style={{ color: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#ffffff' }}>
                                    {index + 1}. {entry.name}
                                </span>
                                <span style={{ color: '#00ff00' }}>
                                    {entry.score}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', opacity: 0.7 }}>
                        No scores yet
                    </div>
                )}
            </div>

            {/* Start Menu */}
            {!gameStarted && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#000000',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 3000
                }}>
                    {/* Leaderboard on Start Menu */}
                    <div style={{
                        position: 'absolute',
                        top: '20px',
                        left: '20px',
                        width: '250px',
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        border: '2px solid #00ff00',
                        borderRadius: '10px',
                        padding: '15px',
                        color: 'white',
                        fontFamily: 'Arial, sans-serif',
                        fontSize: '14px'
                    }}>
                        <h3 style={{ 
                            margin: '0 0 15px 0', 
                            color: '#00ff00', 
                            textAlign: 'center',
                            fontSize: '18px'
                        }}>
                            🏆 LEADERBOARD
                        </h3>
                        {leaderboard.length > 0 ? (
                            <div>
                                {leaderboard.map((entry, index) => (
                                    <div key={entry.id} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        padding: '5px 0',
                                        borderBottom: index < leaderboard.length - 1 ? '1px solid #333' : 'none'
                                    }}>
                                        <span style={{ color: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#ffffff' }}>
                                            {index + 1}. {entry.name}
                                        </span>
                                        <span style={{ color: '#00ff00' }}>
                                            {entry.score}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', opacity: 0.7 }}>
                                No scores yet
                            </div>
                        )}
                    </div>

                    <div style={{
                        textAlign: 'center',
                        color: 'white',
                        fontFamily: 'Arial, sans-serif'
                    }}>
                        <h1 style={{
                            fontSize: '72px',
                            margin: '0 0 20px 0',
                            background: 'linear-gradient(45deg, #00ff00, #0080ff)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            textShadow: '0 0 20px rgba(0, 255, 255, 0.5)'
                        }}>
                            SPACE SHOOTER
                        </h1>
                        <div style={{
                            fontSize: '24px',
                            marginBottom: '40px',
                            opacity: '0.8'
                        }}>
                            🚀 Navigate • 🔫 Click to Shoot • ⭐ Survive
                        </div>
                        <button
                            onClick={startGame}
                            style={{
                                fontSize: '32px',
                                padding: '20px 40px',
                                backgroundColor: 'transparent',
                                border: '3px solid #00ff00',
                                color: '#00ff00',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                fontFamily: 'Arial, sans-serif',
                                fontWeight: 'bold',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 0 20px rgba(0, 255, 0, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#00ff00';
                                e.target.style.color = '#000000';
                                e.target.style.boxShadow = '0 0 30px rgba(0, 255, 0, 0.6)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                                e.target.style.color = '#00ff00';
                                e.target.style.boxShadow = '0 0 20px rgba(0, 255, 0, 0.3)';
                            }}
                        >
                            START GAME
                        </button>
                    </div>
                </div>
            )}

            {/* Game UI - only show when game is started */}
            {gameStarted && (
                <>
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

            {/* Name Input Screen */}
            {showNameInput && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.95)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 3000
                }}>
                    <div style={{
                        textAlign: 'center',
                        color: 'white',
                        fontFamily: 'Arial, sans-serif'
                    }}>
                        <h1 style={{
                            fontSize: '48px',
                            margin: '0 0 20px 0',
                            background: 'linear-gradient(45deg, #00ff00, #0080ff)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            textShadow: '0 0 20px rgba(0, 255, 255, 0.5)'
                        }}>
                            🏆 NEW HIGH SCORE!
                        </h1>
                        
                        <div style={{
                            fontSize: '28px',
                            margin: '20px 0',
                            color: '#ffff00'
                        }}>
                            Score: {score}
                        </div>
                        
                        <div style={{
                            fontSize: '18px',
                            margin: '20px 0 40px 0',
                            opacity: '0.8',
                            color: '#cccccc'
                        }}>
                            Enter your name for the leaderboard:
                        </div>
                        
                        <input
                            type="text"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleNameSubmit()}
                            placeholder="Your Name"
                            maxLength={20}
                            style={{
                                fontSize: '24px',
                                padding: '15px 20px',
                                margin: '0 0 30px 0',
                                backgroundColor: 'transparent',
                                border: '3px solid #00ff00',
                                borderRadius: '10px',
                                color: 'white',
                                textAlign: 'center',
                                outline: 'none',
                                width: '300px'
                            }}
                            autoFocus
                        />
                        
                        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                            <button
                                onClick={handleNameSubmit}
                                disabled={!playerName.trim()}
                                style={{
                                    fontSize: '20px',
                                    padding: '15px 30px',
                                    backgroundColor: playerName.trim() ? '#00ff00' : 'transparent',
                                    border: '3px solid #00ff00',
                                    color: playerName.trim() ? '#000000' : '#00ff00',
                                    borderRadius: '10px',
                                    cursor: playerName.trim() ? 'pointer' : 'not-allowed',
                                    fontFamily: 'Arial, sans-serif',
                                    fontWeight: 'bold',
                                    opacity: playerName.trim() ? 1 : 0.5
                                }}
                            >
                                SAVE SCORE
                            </button>
                            
                            <button
                                onClick={() => {
                                    setShowNameInput(false);
                                    setGameOver(true);
                                }}
                                style={{
                                    fontSize: '20px',
                                    padding: '15px 30px',
                                    backgroundColor: 'transparent',
                                    border: '3px solid #ff4444',
                                    color: '#ff4444',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    fontFamily: 'Arial, sans-serif',
                                    fontWeight: 'bold'
                                }}
                            >
                                SKIP
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Game Over Screen */}
            {gameOver && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.95)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 3000
                }}>
                    <div style={{
                        textAlign: 'center',
                        color: 'white',
                        fontFamily: 'Arial, sans-serif'
                    }}>
                        <h1 style={{
                            fontSize: '64px',
                            margin: '0 0 20px 0',
                            background: 'linear-gradient(45deg, #ff4444, #ff8844)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            textShadow: '0 0 20px rgba(255, 68, 68, 0.5)'
                        }}>
                            GAME OVER
                        </h1>
                        
                        <div style={{
                            fontSize: '36px',
                            margin: '20px 0',
                            background: 'linear-gradient(45deg, #ffff00, #ffa500)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            textShadow: '0 0 15px rgba(255, 255, 0, 0.5)'
                        }}>
                            Final Score: {score}
                        </div>
                        
                        <div style={{
                            fontSize: '20px',
                            margin: '10px 0 40px 0',
                            opacity: '0.8',
                            color: '#cccccc'
                        }}>
                            🕐 Time Survived: {Math.floor((Date.now() - gameStartTime.current) / 1000)}s
                        </div>
                        
                        <button
                            onClick={restartGame}
                            style={{
                                fontSize: '28px',
                                padding: '15px 35px',
                                backgroundColor: 'transparent',
                                border: '3px solid #ff4444',
                                color: '#ff4444',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                fontFamily: 'Arial, sans-serif',
                                fontWeight: 'bold',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 0 20px rgba(255, 68, 68, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#ff4444';
                                e.target.style.color = '#000000';
                                e.target.style.boxShadow = '0 0 30px rgba(255, 68, 68, 0.6)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                                e.target.style.color = '#ff4444';
                                e.target.style.boxShadow = '0 0 20px rgba(255, 68, 68, 0.3)';
                            }}
                        >
                            PLAY AGAIN
                        </button>
                    </div>
                </div>
            )}

            {/* 3D Canvas - only show when game is started */}
            {gameStarted && (
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
            )}
                </>
            )}
        </div>
    );
}

export default MyThree;
