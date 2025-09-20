import { useEffect, useRef } from "react";
import * as THREE from "three";

type ThreeCanvasProps = {
    color: number;
    onSceneReady?: (scene: THREE.Scene) => void;
    cubeRef?: React.MutableRefObject<THREE.Mesh | null>;
    sceneRef?: React.MutableRefObject<THREE.Scene | null>;
};

const ThreeCanvas = ({
    color,
    onSceneReady,
    cubeRef,
    sceneRef,
}: ThreeCanvasProps) => {
    const mountRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!mountRef.current) return;
        mountRef.current.innerHTML = "";

        // Scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0);
        if (sceneRef) sceneRef.current = scene;

        // Camera
        const camera = new THREE.PerspectiveCamera(
            75,
            mountRef.current.clientWidth / mountRef.current.clientHeight,
            0.1,
            1000
        );
        camera.position.set(0, 1.5, 5);

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(
            mountRef.current.clientWidth ?? 100,
            (mountRef.current.clientHeight ?? 100)
        );
        mountRef.current.appendChild(renderer.domElement);

        const group = new THREE.Group();
        scene.add(group);

        // Cube
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshStandardMaterial({ color });
        const cube = new THREE.Mesh(geometry, material);
        if (cubeRef) cubeRef.current = cube;
        cube.position.set(0, 0, 0);
        group.add(cube);
        (scene as any).cubeGroup = group;

        // Light
        const light = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(light);

        // Animate
        let frameId: number;
        const animate = () => {
            group.rotation.y += 0.01; // ✅ Rotate whole group
            renderer.render(scene, camera);
            frameId = requestAnimationFrame(animate);
        };
        animate();

        if (onSceneReady) onSceneReady(scene);

        // Cleanup
        return () => {
            if (frameId) cancelAnimationFrame(frameId);
            renderer.dispose();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update cube color when prop changes
    useEffect(() => {
        if (cubeRef?.current) {
            (cubeRef.current.material as THREE.MeshStandardMaterial).color.set(color);
        }
    }, [color, cubeRef]);

    return <div ref={mountRef} style={{ flex: 1 }} />;
};

export default ThreeCanvas;