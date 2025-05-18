import React, { Suspense, useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, useTexture, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

// --- Configuration ---
const modelsInfo = [
    { path: '/models/VHSTape.fbx', scale: 0.069, rotation: [8, 0, 0.8], applyTextures: true },
    { path: '/models/CD.fbx', scale: 0.009, rotation: [Math.PI / 2, 0, 0], applyTextures: false },  // Example settings for CD
    { path: '/models/book.fbx', scale: 0.082, rotation: [Math.PI / 2, 0, 0], applyTextures: false }

];
const CYCLE_INTERVAL = 5000; // ms
const TRANSITION_DURATION = 0.55; // seconds
const BASE_OPACITY = 0.45;
// --- End Configuration ---

// Helper component to render a single model instance
function ModelRenderer({ modelData, modelInfo, opacity, colorMap, normalMap, isActive, rotation }) {
    const groupRef = useRef();

    // Memoize the cloned model
    const clonedModel = useMemo(() => {
        if (!modelData) return null;
        return modelData.clone();
    }, [modelData]);

    // Apply materials (only when clonedModel/textures change)
    useEffect(() => {
        if (!clonedModel) return;
        clonedModel.traverse((child) => {
            if (child.isMesh) {
                const originalMaterial = child.material;
                const standardMaterial = new THREE.MeshStandardMaterial();
                // Base settings
                standardMaterial.color = new THREE.Color('#7f3fff');
                standardMaterial.transparent = true;
                standardMaterial.depthWrite = false;
                standardMaterial.side = THREE.DoubleSide;
                standardMaterial.roughness = 0.6;
                standardMaterial.metalness = 0.2;
                // Opacity will be set by the effect below based on the prop

                // Apply textures only if specified
                if (modelInfo.applyTextures) {
                    standardMaterial.map = colorMap;
                    standardMaterial.normalMap = normalMap;
                } else {
                    standardMaterial.map = null;
                    standardMaterial.normalMap = null;
                }
                child.material = standardMaterial;
            }
        });
    }, [clonedModel, modelInfo.applyTextures, colorMap, normalMap]);

    // Apply opacity changes dynamically based on prop
    useEffect(() => {
        if (!groupRef.current) return;
        groupRef.current.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.opacity = opacity;
                child.visible = opacity > 0.001; // Keep slight tolerance
            }
        });
    }, [opacity]); // Rerun when opacity prop changes

    // Apply rotation animation using modelInfo config
    useFrame(() => {
        if (groupRef.current && isActive) { // Rotate only if active
            const axis = modelInfo.rotationAxis || 'z'; // Default to z
            const speed = modelInfo.rotationSpeed || 0.01; // Default speed
            groupRef.current.rotation[axis] += speed;
        }
    });

    if (!clonedModel) return null;

    // Use the passed rotation for the group
    return (
        <group ref={groupRef} scale={modelInfo.scale} rotation={rotation} dispose={null}>
            <primitive object={clonedModel} />
        </group>
    );
}


function ModelCycler() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [previousIndex, setPreviousIndex] = useState(-1);
    const [transitionPhase, setTransitionPhase] = useState('idle'); // 'idle' | 'fadingOut' | 'fadingIn'
    const transitionProgress = useRef(0);
    const [currentOpacity, setCurrentOpacity] = useState(BASE_OPACITY);
    const [previousOpacity, setPreviousOpacity] = useState(0);
    // Store a single rotation state (Euler array)
    const [rotation, setRotation] = useState(modelsInfo[0].rotation.slice());

    // --- Load Assets ---
    const loadedModels = modelsInfo.map(info => useLoader(FBXLoader, info.path));
    const vhsColorMap = useTexture('/textures/vhsghost.jpg');
    const vhsNormalMap = useTexture('/textures/VHS_Normal.jpg');
    // --- End Load Assets ---

    // --- Animation and State Logic ---
    // Interval to trigger transitions
    useEffect(() => {
        const intervalId = setInterval(() => {
            if (transitionPhase === 'idle') {
                setPreviousIndex(currentIndex);
                setCurrentIndex((prev) => (prev + 1) % modelsInfo.length);
                transitionProgress.current = 0;
                setTransitionPhase('fadingOut');
                setPreviousOpacity(BASE_OPACITY); // Previous starts full
                setCurrentOpacity(0);              // Current starts invisible
            }
        }, CYCLE_INTERVAL);
        return () => clearInterval(intervalId);
    }, [currentIndex, transitionPhase]);

    // Easing function
    const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

    // Frame loop for transition animation and rotation
    useFrame((state, delta) => {
        // Handle rotation (always advance, even if not visible, for continuity)
        const axis = modelsInfo[currentIndex].rotationAxis || 'z';
        const speed = modelsInfo[currentIndex].rotationSpeed || 0.01;
        setRotation(prev => {
            const next = prev.slice();
            if (axis === 'x') next[0] += speed;
            else if (axis === 'y') next[1] += speed;
            else next[2] += speed;
            return next;
        });

        // Handle fade transitions
        if (transitionPhase === 'fadingOut') {
            transitionProgress.current += delta / (TRANSITION_DURATION / 2); // Half duration for each phase
            const easedProgress = easeInOutSine(Math.min(transitionProgress.current, 1));
            setPreviousOpacity(BASE_OPACITY * (1 - easedProgress));
            setCurrentOpacity(0);
            if (transitionProgress.current >= 1) {
                // Start fading in
                transitionProgress.current = 0;
                setTransitionPhase('fadingIn');
                setPreviousOpacity(0);
                setCurrentOpacity(0);
            }
        } else if (transitionPhase === 'fadingIn') {
            transitionProgress.current += delta / (TRANSITION_DURATION / 2);
            const easedProgress = easeInOutSine(Math.min(transitionProgress.current, 1));
            setPreviousOpacity(0);
            setCurrentOpacity(BASE_OPACITY * easedProgress);
            if (transitionProgress.current >= 1) {
                setTransitionPhase('idle');
                setPreviousIndex(-1);
                setCurrentOpacity(BASE_OPACITY);
                setPreviousOpacity(0);
            }
        } else {
            // Ensure correct opacity when not transitioning
            if (currentOpacity !== BASE_OPACITY) setCurrentOpacity(BASE_OPACITY);
            if (previousOpacity !== 0) setPreviousOpacity(0);
        }
    });
    // --- End Animation and State Logic ---

    // --- Render ---
    const currentModelInfo = modelsInfo[currentIndex];
    const currentModelData = loadedModels[currentIndex];
    const previousModelInfo = previousIndex !== -1 ? modelsInfo[previousIndex] : null;
    const previousModelData = previousIndex !== -1 ? loadedModels[previousIndex] : null;

    // For previous model, use the same rotation (so it doesn't snap back)
    return (
        <>
            {/* Render Previous Model during fade out */}
            {transitionPhase === 'fadingOut' && previousModelData && (
                <ModelRenderer
                    key={previousModelInfo.id + '-previous'}
                    modelData={previousModelData}
                    modelInfo={previousModelInfo}
                    opacity={previousOpacity}
                    colorMap={vhsColorMap}
                    normalMap={vhsNormalMap}
                    isActive={false}
                    rotation={rotation}
                />
            )}
            {/* Render Current Model during fade in or idle */}
            {currentModelData && (
                <ModelRenderer
                    key={currentModelInfo.id + '-current'}
                    modelData={currentModelData}
                    modelInfo={currentModelInfo}
                    opacity={currentOpacity}
                    colorMap={vhsColorMap}
                    normalMap={vhsNormalMap}
                    isActive={transitionPhase === 'idle' || transitionPhase === 'fadingIn'}
                    rotation={rotation}
                />
            )}
        </>
    );
}


export default function VHSModelCanvas() {
    return (
        <Canvas camera={{ position: [0, 0.25, 3.5], fov: 45 }} style={{ width: '100%', height: '100%' }}>
            <ambientLight intensity={0.7} />
            <directionalLight position={[2, 4, 2]} intensity={1.8} castShadow />
            <Suspense fallback={null}>
                <ModelCycler />
                {/* <Environment preset="city" /> */}
                <Environment files="/hdri/potsdamer_platz_1k.hdr" /> {/* Load local HDR */}
            </Suspense>
            <OrbitControls enablePan={false} minDistance={2} maxDistance={6} />
        </Canvas>
    );
}

// Remove GLTF preloading
// useGLTF.preload('/models/VHSTape.glb'); 