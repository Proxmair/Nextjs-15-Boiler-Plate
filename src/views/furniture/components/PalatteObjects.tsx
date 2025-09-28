import { useRef, useEffect } from "react";
import * as THREE from "three";
import { Card, CardBody } from "@heroui/react";
import { createScene, createCamera, createRenderer, addLights, createFurnitureMesh } from "../helper";
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

    // mini 3D furniture preview
    useEffect(() => {
        if (!mountRef.current) return;
        mountRef.current.innerHTML = "";

        const width = 72;
        const height = 72;
        const scene = createScene(0xf7f7f7);
        const camera = createCamera(width, height);
        camera.position.set(2, 2, 2);
        camera.lookAt(0, 0, 0);
        const renderer = createRenderer(width, height);
        mountRef.current.appendChild(renderer.domElement);

        addLights(scene);

        let furnitureObject: THREE.Object3D | null = null;
        let frameId: number;

        // Load the furniture object
        createFurnitureMesh(selectedColor).then((object) => {
            furnitureObject = object;
            scene.add(object);
        }).catch((error) => {
            console.error("Error loading furniture for palette:", error);
        });

        const animate = () => {
            if (furnitureObject) {
                furnitureObject.rotation.y += 0.02;
            }
            renderer.render(scene, camera);
            frameId = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            if (frameId) cancelAnimationFrame(frameId);
            if (furnitureObject) {
                // Dispose of furniture object
                furnitureObject.traverse((child) => {
                    if ((child as THREE.Mesh).isMesh) {
                        const meshChild = child as THREE.Mesh;
                        if (meshChild.geometry) meshChild.geometry.dispose();
                        if (meshChild.material) {
                            if (Array.isArray(meshChild.material)) {
                                meshChild.material.forEach((material: THREE.Material) => material.dispose());
                            } else {
                                meshChild.material.dispose();
                            }
                        }
                    }
                });
            }
            renderer.dispose();
        };
    }, [selectedColor]);
    return (
        <Card>
            <CardBody className="flex items-center gap-3">
                <div
                    draggable
                    onDragStart={handleDragStart}
                    className="w-18 h-18 rounded-sm cursor-grab flex items-center justify-center bg-transparent"
                    title="Drag to canvas to add furniture"
                >
                    <div ref={mountRef} />
                </div>
                <span>Sofa</span>
            </CardBody>
        </Card>
    );
};


export default PaletteObjects