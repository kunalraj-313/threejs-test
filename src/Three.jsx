import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useLoader, useFrame, useThree } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function MyThree() {
  const [position, setPosition] = useState([0, 0, 0]);

  // SpaceshipModel component defined inside MyThree to share state
  function SpaceshipModel() {
    const meshRef = useRef();
    const obj = useLoader(OBJLoader, '/models/spaceship.obj');
    
    // Clone the object to avoid modifying the original
    const clonedObj = obj.clone();
    
    // Center and scale the object
    const box = new THREE.Box3().setFromObject(clonedObj);
    const center = box.getCenter(new THREE.Vector3());
    clonedObj.position.sub(center);
    
    const size = box.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z);
    const scale = 2 / maxDimension;
    clonedObj.scale.setScalar(scale);
    
    clonedObj.rotation.y = Math.PI;

    // Enable shadow casting for the spaceship
    clonedObj.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
      }
    });

    // Update object position using shared state
    useFrame(() => {
      if (meshRef.current) {
        meshRef.current.position.set(...position);
      }
    });

    return <primitive ref={meshRef} object={clonedObj} />;
  }

  // Ground component defined inside MyThree
  function Ground() {
    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#666666" />
      </mesh>
    );
  }

  // Camera controller to follow the spaceship
  function CameraController() {
    const { camera } = useThree();
    
    useFrame(() => {
      // Update camera position to follow the spaceship
      const targetX = position[0];
      const targetY = position[1] + 2; // Stay 2 units above the spaceship
      const targetZ = position[2] + 5; // Stay 5 units behind the spaceship
      
      camera.position.set(targetX, targetY, targetZ);
      camera.lookAt(position[0], position[1], position[2]); // Look at the spaceship
    });
    
    return null;
  }

  // Handle keyboard input in the parent component
  useEffect(() => {
    const handleKeyDown = (event) => {
      setPosition((prev) => {
        const [x, y, z] = prev;
        switch (event.key) {
          case 'ArrowLeft':
            return [x - 0.1, y, z];
          case 'ArrowRight':
            return [x + 0.1, y, z];
          default:
            return prev;
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas
        camera={{ position: [0, 2, 5], fov: 75 }}
        style={{ background: '#222222' }}
        shadows
      >
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[10, 10, 10]} 
          intensity={1.2} 
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <SpaceshipModel />
        <Ground />
        <CameraController />
        <OrbitControls enabled={false} />
      </Canvas>
    </div>
  );
}

export default MyThree;
