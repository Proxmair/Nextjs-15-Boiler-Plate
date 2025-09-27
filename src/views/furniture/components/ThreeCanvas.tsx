import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as THREE from "three";
import { RootState } from '@/redux/store';
import {
    addGrid, addGround, addLights,
    createCamera, createControls,
    createCubeGroup, createRenderer, createScene
} from "../helper";
import { addCube, changeCubeColor, removeCube } from "@/redux/slices/cubeSlice";
import { addToast } from "@heroui/react";

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

        const removeOutline = (mesh: THREE.Mesh) => {
            const outline = outlineMapRef.current.get(mesh);
            if (outline && outline.parent) {
                outline.parent.remove(outline);
            }
            if (outline) {
                outline.geometry.dispose();
                (outline.material as THREE.Material).dispose();
                outlineMapRef.current.delete(mesh);
            }
        };

        const addOutline = (mesh: THREE.Mesh) => {
            if (outlineMapRef.current.has(mesh)) return;
            const edges = new THREE.EdgesGeometry(mesh.geometry as THREE.BufferGeometry);
            const outline = new THREE.LineSegments(
                edges,
                new THREE.LineBasicMaterial({ color: 0xffff00 })
            );
            outline.name = "selection-outline";
            // Prevent raycasting from selecting the outline
            (outline as any).raycast = () => { };
            outline.position.copy(mesh.position);
            outline.rotation.copy(mesh.rotation);
            outline.scale.copy(mesh.scale);
            group.add(outline);
            outlineMapRef.current.set(mesh, outline);
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

            // First try selecting an existing mesh in the group
            const groupIntersects = raycaster.intersectObjects(group.children, false);
            const meshHit = groupIntersects.find(i => i.object instanceof THREE.Mesh) as THREE.Intersection | undefined;
            if (meshHit) {
                const hit = meshHit.object as THREE.Mesh;
                const additive = event.ctrlKey || (event as any).metaKey;
                if (!additive) {
                    clearAllSelection();
                    selectedMeshesRef.current.add(hit);
                    selectedMeshRef.current = hit;
                    addOutline(hit);
                } else {
                    if (selectedMeshesRef.current.has(hit)) {
                        selectedMeshesRef.current.delete(hit);
                        if (selectedMeshRef.current === hit) selectedMeshRef.current = null;
                        removeOutline(hit);
                    } else {
                        selectedMeshesRef.current.add(hit);
                        selectedMeshRef.current = hit;
                        addOutline(hit);
                    }
                }
                return;
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
            const mat = mesh.material as THREE.MeshStandardMaterial;
            mat.color.set(color);
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

        // Lazily create ghost cube
        if (!ghostMeshRef.current) {
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshStandardMaterial({
                color: colorRef.current,
                transparent: true,
                opacity: 0.35,
                depthWrite: false,
            });
            const ghost = new THREE.Mesh(geometry, material);
            ghost.name = "ghost-cube";
            group.add(ghost);
            ghostMeshRef.current = ghost;
        }
        const ghost = ghostMeshRef.current!;
        (ghost.material as THREE.MeshStandardMaterial).color.set(colorRef.current);
        ghost.visible = true;
        ghost.position.set(Math.round(x), 0.5, Math.round(z));
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
            const geometry = new THREE.BoxGeometry();
            const material = new THREE.MeshStandardMaterial({ color: colorRef.current });
            const cube = new THREE.Mesh(geometry, material);
            const index = cubes.findIndex(c => c.x === Math.round(x) && c.z === Math.round(z));
            if (index === -1) {
                cube.position.set(Math.round(x), 0.5, Math.round(z));
                group.add(cube);
                dispatch(addCube({ x: Math.round(x), y: 0.5, z: Math.round(z), color: colorRef.current }));
            }
            else {
                addToast({
                    title: "Cannot place cube",
                    description: "A cube already exists at this location. Please choose another location.",
                    color: 'danger',
                })
            }
        }

        // Clear ghost after drop
        if (ghostMeshRef.current) {
            group.remove(ghostMeshRef.current);
            ghostMeshRef.current.geometry.dispose();
            (ghostMeshRef.current.material as THREE.Material).dispose();
            ghostMeshRef.current = null;
        }
    };

    const handleDragLeave: React.DragEventHandler<HTMLDivElement> = (e) => {
        const scene = sceneRef?.current as any;
        const group = scene?.cubeGroup as THREE.Group | undefined;
        if (ghostMeshRef.current && group) {
            group.remove(ghostMeshRef.current);
            ghostMeshRef.current.geometry.dispose();
            (ghostMeshRef.current.material as THREE.Material).dispose();
            ghostMeshRef.current = null;
        }
    };




    return <div ref={mountRef} style={{ flex: 1 }} onDragOver={handleDragOver} onDrop={handleDrop} onDragLeave={handleDragLeave} />;
};

export default ThreeCanvas;
