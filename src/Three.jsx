import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useLoader, useFrame, useThree } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function MyThree() {
  const [position, setPosition] = useState([0, 0, 0]);
  const [keyState, setKeyState] = useState({ left: false, right: false });
  const [tiltAngle, setTiltAngle] = useState(0);

  function SpaceshipModel() {
    const meshRef = useRef();
    const obj = useLoader(OBJLoader, '/models/spaceship.obj');
    
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
        meshRef.current.rotation.z = tiltAngle;
      }
    });

    return <primitive ref={meshRef} object={clonedObj} />;
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

  useEffect(() => {
    const handleKeyDown = (event) => {
      switch (event.key) {
        case 'ArrowLeft':
          setKeyState(prev => ({ ...prev, left: true }));
          break;
        case 'ArrowRight':
          setKeyState(prev => ({ ...prev, right: true }));
          break;
      }
    };

    const handleKeyUp = (event) => {
      switch (event.key) {
        case 'ArrowLeft':
          setKeyState(prev => ({ ...prev, left: false }));
          break;
        case 'ArrowRight':
          setKeyState(prev => ({ ...prev, right: false }));
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

  useEffect(() => {
    const interval = setInterval(() => {
      if (keyState.left || keyState.right) {
        setPosition((prev) => {
          const [x, y, z] = prev;
          let newX = x;
          if (keyState.left) newX -= 0.05;
          if (keyState.right) newX += 0.05;
          return [newX, y, z];
        });
      }

      setTiltAngle((prev) => {
        const targetTilt = keyState.left ? -0.3 : keyState.right ? 0.3 : 0;
        const tiltSpeed = 0.1;
        return prev + (targetTilt - prev) * tiltSpeed;
      });
    }, 16);

    return () => clearInterval(interval);
  }, [keyState]);

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
