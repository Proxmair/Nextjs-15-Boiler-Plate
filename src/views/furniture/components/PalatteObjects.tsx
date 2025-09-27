import { useRef, useEffect } from "react";
import * as THREE from "three";
import { Card, CardBody } from "@heroui/react";
import { createScene, createCamera, createRenderer, addLights } from "../helper";
import { useSelector } from "react-redux";
import { RootState } from '@/redux/store';

const PaletteObjects = () => {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const selectedColor = useSelector((state: RootState) => state.cubes.selectedColor);

    const handleDragStart: React.DragEventHandler<HTMLDivElement> = (e) => {
        const payload = { type: "square" };
        e.dataTransfer.setData("application/x-furniture", JSON.stringify(payload));
        e.dataTransfer.effectAllowed = "copy";
        // Hide the default browser drag image
        const transparent = document.createElement("canvas");
        transparent.width = 1;
        transparent.height = 1;
        e.dataTransfer.setDragImage(transparent, 0, 0);
    };

    // mini 3D cube preview
    useEffect(() => {
        if (!mountRef.current) return;
        mountRef.current.innerHTML = "";

        const width = 72;
        const height = 72;
        const scene = createScene(0xf7f7f7);
        const camera = createCamera(width, height);
        camera.position.set(1.6, 1.6, 1.6);
        camera.lookAt(0, 0, 0);
        const renderer = createRenderer(width, height);
        mountRef.current.appendChild(renderer.domElement);

        addLights(scene);

        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: selectedColor, roughness: 0.6, metalness: 0.1 });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);

        let frameId: number;
        const animate = () => {
            cube.rotation.x += 0.01;
            cube.rotation.y += 0.02;
            renderer.render(scene, camera);
            frameId = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            if (frameId) cancelAnimationFrame(frameId);
            renderer.dispose();
        };
    }, []);
    return (
        <Card>
            <CardBody className="flex items-center gap-3">
                <div
                    draggable
                    onDragStart={handleDragStart}
                    className="w-18 h-18 rounded-sm cursor-grab flex items-center justify-center bg-transparent"
                    title="Drag to canvas to add a square"
                >
                    <div ref={mountRef} />
                </div>
                <span>Square</span>
            </CardBody>
        </Card>
    );
};


export default PaletteObjects