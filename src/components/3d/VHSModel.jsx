import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, useTexture, Environment } from '@react-three/drei';
import * as THREE from 'three';

function VHSModelInner(props) {
    const ref = useRef();
    const gltf = useGLTF('/models/VHSTape.glb');
    const colorMap = useTexture('/textures/vhsghost.jpg');
    const normalMap = useTexture('/textures/VHS_Normal.jpg');

    // Apply textures to all mesh materials
    React.useEffect(() => {
        gltf.scene.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.map = colorMap;
                child.material.normalMap = normalMap;
                child.material.transparent = true;
                child.material.opacity = 0.7;
                child.material.color = new THREE.Color('#7f3fff'); // bluish-purple
                child.material.needsUpdate = true;
            }
        });
    }, [gltf, colorMap, normalMap]);

    useFrame(() => {
        if (ref.current) {
            ref.current.rotation.z += 0.01;
        }
    });

    return (
        <primitive ref={ref} object={gltf.scene} scale={8.2} rotation={[-8, 0, 0]} {...props} />
    );
}

export default function VHSModelCanvas() {
    return (
        <Canvas camera={{ position: [0, 0.5, 3.5], fov: 45 }} style={{ width: '100%', height: '100%' }}>
            <ambientLight intensity={0.7} />
            <directionalLight position={[2, 4, 2]} intensity={1.2} castShadow />
            <Suspense fallback={null}>
                <VHSModelInner />
                <Environment preset="city" />
            </Suspense>
            <OrbitControls enablePan={false} minDistance={2} maxDistance={6} />
        </Canvas>
    );
}

// Required for GLTF loading
useGLTF.preload('/models/VHSTape.glb'); 