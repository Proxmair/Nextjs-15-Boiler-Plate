import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as THREE from "three";
import { RootState } from '@/redux/store';
import {
    addGrid, addGround, addLights,
    createCamera, createControls,
    createCubeGroup, createRenderer, createScene, createFurnitureMesh
} from "../helper";
import { addCube, changeCubeColor, removeCube } from "@/redux/slices/cubeSlice";
import { addToast } from "@heroui/react";
import { OBJLoader } from "three/examples/jsm/Addons.js";

type ThreeCanvasProps = {
    color: number;
    onSceneReady?: (scene: THREE.Scene) => void;
    sceneRef?: React.MutableRefObject<THREE.Scene | null>;
};

const ThreeCanvas = ({
    color,
    onSceneReady,
    sceneRef
}: ThreeCanvasProps) => {
    const dispatch = useDispatch();
    const cubes = useSelector((state: RootState) => state.cubes.cube);
    const selectedColor = useSelector((state: RootState) => state.cubes.selectedColor);
    const mountRef = useRef<HTMLDivElement | null>(null);
    const colorRef = useRef(selectedColor);
    const selectedMeshRef = useRef<THREE.Mesh | null>(null);
    const selectedMeshesRef = useRef<Set<THREE.Mesh>>(new Set());
    const outlineMapRef = useRef<Map<THREE.Mesh, THREE.LineSegments>>(new Map());
    const ghostMeshRef = useRef<THREE.Mesh | null>(null);

    // Keep colorRef updated
    useEffect(() => { colorRef.current = selectedColor; }, [selectedColor]);

    useEffect(() => {
        if (!mountRef.current) return;
        mountRef.current.innerHTML = "";

        // Setup scene, camera, renderer
        const width = mountRef.current.clientWidth ?? 100;
        const height = mountRef.current.clientHeight ?? 100;
        const scene = createScene();
        if (sceneRef) sceneRef.current = scene;
        const camera = createCamera(width, height);
        const renderer = createRenderer(width, height);
        mountRef.current.appendChild(renderer.domElement);

        // Add cubes, lights, grid, ground
        const group = createCubeGroup(cubes);
        scene.add(group);
        (scene as any).cubeGroup = group;
        // Expose camera and renderer for drag/drop calculations
        (scene as any).camera = camera;
        (scene as any).renderer = renderer;
        addLights(scene);
        addGrid(scene);
        addGround(scene);

        // Controls
        const controls = createControls(camera, renderer.domElement);

        // Handle click to add cube or select mesh
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        // Load existing furniture objects
        const loadExistingFurniture = async () => {
            for (const cube of cubes) {
                try {
                    const furnitureObject = await createFurnitureMesh(cube.color);
                    furnitureObject.position.set(cube.x, cube.y, cube.z);
                    group.add(furnitureObject);
                } catch (error) {
                    console.error("Error loading furniture object:", error);
                }
            }
        };
        loadExistingFurniture();


        const removeOutline = (furnitureObject: THREE.Object3D) => {
            const outline = outlineMapRef.current.get(furnitureObject as THREE.Mesh);
            if (outline && outline.parent) {
                outline.parent.remove(outline);
            }
            if (outline) {
                outline.geometry.dispose();
                (outline.material as THREE.Material).dispose();
                outlineMapRef.current.delete(furnitureObject as THREE.Mesh);
            }
        };

        const addOutline = (furnitureObject: THREE.Object3D) => {
            if (outlineMapRef.current.has(furnitureObject as THREE.Mesh)) return;
            
            // Create a bounding box outline for the furniture object
            const box = new THREE.Box3().setFromObject(furnitureObject);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            
            const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
            const edges = new THREE.EdgesGeometry(geometry);
            const outline = new THREE.LineSegments(
                edges,
                new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 2 })
            );
            outline.name = "selection-outline";
            // Prevent raycasting from selecting the outline
            (outline as any).raycast = () => { };
            outline.position.copy(center);
            outline.rotation.copy(furnitureObject.rotation);
            group.add(outline);
            outlineMapRef.current.set(furnitureObject as THREE.Mesh, outline);
        };

        const clearAllSelection = () => {
            selectedMeshRef.current = null;
            selectedMeshesRef.current.forEach(m => removeOutline(m));
            selectedMeshesRef.current.clear();
        };

        const handleCanvasClick = (event: MouseEvent) => {
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);

            // First try selecting an existing object in the group
            const groupIntersects = raycaster.intersectObjects(group.children, true);
            if (groupIntersects.length > 0) {
                // Find the parent furniture object (not individual child meshes)
                let furnitureObject: THREE.Object3D | null = groupIntersects[0].object;
                while (furnitureObject && furnitureObject.parent !== group) {
                    furnitureObject = furnitureObject.parent;
                }
                
                if (furnitureObject && furnitureObject.parent === group) {
                    const additive = event.ctrlKey || (event as any).metaKey;
                    if (!additive) {
                        clearAllSelection();
                        selectedMeshesRef.current.add(furnitureObject as THREE.Mesh);
                        selectedMeshRef.current = furnitureObject as THREE.Mesh;
                        addOutline(furnitureObject);
                    } else {
                        if (selectedMeshesRef.current.has(furnitureObject as THREE.Mesh)) {
                            selectedMeshesRef.current.delete(furnitureObject as THREE.Mesh);
                            if (selectedMeshRef.current === furnitureObject) selectedMeshRef.current = null;
                            removeOutline(furnitureObject);
                        } else {
                            selectedMeshesRef.current.add(furnitureObject as THREE.Mesh);
                            selectedMeshRef.current = furnitureObject as THREE.Mesh;
                            addOutline(furnitureObject);
                        }
                    }
                    return;
                }
            }
            clearAllSelection();
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Delete" || event.key === "Backspace") {
                selectedMeshesRef.current.forEach(mesh => {
                    // Remove mesh from scene
                    mesh.parent?.remove(mesh);

                    // Remove outline if exists
                    const outline = outlineMapRef.current.get(mesh);
                    if (outline && outline.parent) outline.parent.remove(outline);
                    if (outline) {
                        outline.geometry.dispose();
                        (outline.material as THREE.Material).dispose();
                        outlineMapRef.current.delete(mesh);
                    }
                    dispatch(removeCube({
                        x: mesh.position.x,
                        y: mesh.position.y,
                        z: mesh.position.z
                    }));


                });

                // Clear selection
                selectedMeshesRef.current.clear();
                selectedMeshRef.current = null;
            }
        };
        renderer.domElement.addEventListener("click", handleCanvasClick);
        window.addEventListener("keydown", handleKeyDown);
        // Animation loop
        let frameId: number;
        const animate = () => {
            renderer.render(scene, camera);
            controls.update();
            frameId = requestAnimationFrame(animate);
        };
        animate();

        if (onSceneReady) onSceneReady(scene);

        // Cleanup
        return () => {
            if (frameId) cancelAnimationFrame(frameId);
            renderer.dispose();
            renderer.domElement.removeEventListener("click", handleCanvasClick);
            window.removeEventListener("keydown", handleKeyDown);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update all selected meshes' colors when color prop changes
    useEffect(() => {
        if (!selectedMeshesRef.current) return;
        selectedMeshesRef.current.forEach(mesh => {
            // For 3D objects, we need to traverse and update all child meshes
            mesh.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                    const meshChild = child as THREE.Mesh;
                    const mat = meshChild.material as THREE.MeshStandardMaterial;
                    if (mat && mat.color) {
                        mat.color.set(color);
                    }
                }
            });
            const index = cubes.findIndex(c => c.x === mesh.position.x && c.y === mesh.position.y && c.z === mesh.position.z);
            dispatch(changeCubeColor({ index, color }));
        });
    }, [color]);

    // Canvas container
    // Enable drag-over/drop to add items from the palette
    const handleDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
        const types = Array.from(e.dataTransfer.types || []);
        if (!types.includes("application/x-furniture")) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";

        // Update or create a ghost mesh at the raycast hit point
        const scene = sceneRef?.current as any;
        if (!scene) return;
        const camera = scene.camera as THREE.Camera | undefined;
        const group = scene.cubeGroup as THREE.Group | undefined;
        const plane = scene.children?.find((c: any) => c.name === "ground") as THREE.Mesh | undefined;
        if (!camera || !group || !plane) return;

        const canvas = mountRef.current?.firstChild as HTMLCanvasElement | null;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2(nx, ny);
        raycaster.setFromCamera(mouse, camera);
        const hit = raycaster.intersectObject(plane);
        if (hit.length === 0) return;
        const { x, z } = hit[0].point;

        // Lazily create ghost furniture object
        if (!ghostMeshRef.current) {
            createFurnitureMesh(colorRef.current).then((furnitureObject) => {
                furnitureObject.traverse((child) => {
                    if ((child as THREE.Mesh).isMesh) {
                        (child as THREE.Mesh).material = new THREE.MeshStandardMaterial({
                            color: colorRef.current,
                            transparent: true,
                            opacity: 0.35,
                            depthWrite: false,
                        });
                    }
                });
                furnitureObject.name = "ghost-furniture";
                group.add(furnitureObject);
                ghostMeshRef.current = furnitureObject as THREE.Mesh;
                
                // Position the ghost after it's created
                const ghost = ghostMeshRef.current;
                if (ghost) {
                    ghost.visible = true;
                    ghost.position.set(Math.round(x), 0.5, Math.round(z));
                }
            }).catch((error) => {
                console.error("Error creating ghost furniture:", error);
            });
        } else {
            // Update existing ghost
            const ghost = ghostMeshRef.current;
            // Update color for all child meshes in the furniture object
            ghost.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                    const meshChild = child as THREE.Mesh;
                    const mat = meshChild.material as THREE.MeshStandardMaterial;
                    if (mat && mat.color) {
                        mat.color.set(colorRef.current);
                    }
                }
            });
            ghost.visible = true;
            ghost.position.set(Math.round(x), 0.5, Math.round(z));
        }
    };

    const handleDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
        e.preventDefault();
        if (!sceneRef?.current) return;
        const payloadStr = e.dataTransfer.getData("application/x-furniture");
        if (!payloadStr) return;
        const payload = JSON.parse(payloadStr || "{}");

        const scene = sceneRef.current as any;
        const group = scene.cubeGroup as THREE.Group;
        const camera = (scene as any).camera as THREE.Camera | undefined;
        const renderer = (scene as any).renderer as THREE.WebGLRenderer | undefined;

        // Fallback: compute using the internal refs created earlier in effect
        // We will raycast using the plane that was created and stored on the scene
        const plane = scene.children.find((c: any) => c.name === "ground") as THREE.Mesh | undefined;
        if (!plane) return;

        // We need a camera and renderer bounds to convert mouse pos
        // As we did not store them on scene, we approximate by using the target element bounds
        const container = mountRef.current;
        if (!container) return;

        const rect = (container.firstChild as HTMLCanvasElement)?.getBoundingClientRect();
        if (!rect) return;

        if (!camera) return;

        const localX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const localY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2(localX, localY);
        raycaster.setFromCamera(mouse, camera);
        const hit = raycaster.intersectObject(plane);
        if (hit.length === 0) return;
        const { x, z } = hit[0].point;

        if (payload?.type === "square") {
            // Check for collisions with existing furniture objects
            const newPosition = { x: Math.round(x), y: 0.5, z: Math.round(z) };
            
            // First create a temporary furniture object to check its bounding box
            createFurnitureMesh(colorRef.current).then((furnitureObject) => {
                furnitureObject.position.set(newPosition.x, newPosition.y, newPosition.z);
                
                // Calculate bounding box for the new furniture object
                const newBox = new THREE.Box3().setFromObject(furnitureObject);
                
                // Check for intersections with existing furniture objects
                let hasCollision = false;
                group.children.forEach((existingObject) => {
                    if (existingObject.name !== "ghost-furniture" && existingObject.name !== "selection-outline") {
                        const existingBox = new THREE.Box3().setFromObject(existingObject);
                        if (newBox.intersectsBox(existingBox)) {
                            hasCollision = true;
                        }
                    }
                });
                
                if (!hasCollision) {
                    // No collision, add the furniture object
                    group.add(furnitureObject);
                    dispatch(addCube({ x: newPosition.x, y: newPosition.y, z: newPosition.z, color: colorRef.current }));
                } else {
                    // Collision detected, show error and dispose of the temporary object
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
                    
                    addToast({
                        title: "Cannot place furniture",
                        description: "Furniture would intersect with existing objects. Please choose another location.",
                        color: 'danger',
                    });
                }
            }).catch((error) => {
                console.error("Error creating furniture object:", error);
                addToast({
                    title: "Error",
                    description: "Failed to load furniture object. Please try again.",
                    color: 'danger',
                });
            });
        }

        // Clear ghost after drop
        if (ghostMeshRef.current) {
            group.remove(ghostMeshRef.current);
            // Dispose of all geometries and materials in the furniture object
            ghostMeshRef.current.traverse((child) => {
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
            ghostMeshRef.current = null;
        }
    };

    const handleDragLeave: React.DragEventHandler<HTMLDivElement> = (e) => {
        const scene = sceneRef?.current as any;
        const group = scene?.cubeGroup as THREE.Group | undefined;
        if (ghostMeshRef.current && group) {
            group.remove(ghostMeshRef.current);
            // Dispose of all geometries and materials in the furniture object
            ghostMeshRef.current.traverse((child) => {
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
            ghostMeshRef.current = null;
        }
    };




    return <div ref={mountRef} style={{ flex: 1 }} onDragOver={handleDragOver} onDrop={handleDrop} onDragLeave={handleDragLeave} />;
};

export default ThreeCanvas;
