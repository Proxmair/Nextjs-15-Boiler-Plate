import * as THREE from "three";
import { OrbitControls, OBJLoader } from "three/examples/jsm/Addons.js";

export function createScene(background = 0xf0f0f0) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(background);
    return scene;
}

export function createCamera(width: number, height: number) {
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 1.5, 5);
    return camera;
}

export function createRenderer(width: number, height: number) {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    return renderer;
}

export function createControls(camera: THREE.Camera, domElement: HTMLElement) {
    const controls = new OrbitControls(camera, domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.target.set(0, 0, 0);
    controls.update();
    return controls;
}

export function addLights(scene: THREE.Scene) {
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);
}

export function addGrid(scene: THREE.Scene) {
    const gridHelper = new THREE.GridHelper(50, 50, 0x000000, 0x888888);
    scene.add(gridHelper);
}

export function addGround(scene: THREE.Scene) {
    const planeGeometry = new THREE.PlaneGeometry(50, 50);
    const planeMaterial = new THREE.MeshStandardMaterial({
        color: 0xdddddd,
        side: THREE.DoubleSide,
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = 0;
    plane.name = "ground";
    scene.add(plane);
    return plane;
}

export function createFurnitureMesh(color: number): Promise<THREE.Object3D> {
    return new Promise((resolve, reject) => {
        const loader = new OBJLoader();
        loader.load(
            "/3dobjects/sofa/Koltuk.obj",
            (object) => {
                object.traverse((child) => {
                    if ((child as THREE.Mesh).isMesh) {
                        (child as THREE.Mesh).material = new THREE.MeshStandardMaterial({
                            color: color,
                        });
                    }
                });
                resolve(object);
            },
            undefined,
            (error) => {
                console.error("Error loading OBJ:", error);
                reject(error);
            }
        );
    });
}

export const loadExistingFurniture = async (cubes: { x: number; y: number; z: number, color: number }[], group: any) => {
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


export const removeOutline = (
    furnitureObject: THREE.Object3D,
    outlineMapRef: React.RefObject<Map<THREE.Mesh, THREE.LineSegments>>
) => {
    const outline = outlineMapRef.current?.get(furnitureObject as THREE.Mesh);
    if (outline && outline.parent) {
        outline.parent.remove(outline);
    }
    if (outline) {
        outline.geometry.dispose();
        (outline.material as THREE.Material).dispose();
        outlineMapRef.current?.delete(furnitureObject as THREE.Mesh);
    }
};

export const addOutline = (furnitureObject: THREE.Object3D, outlineMapRef: React.RefObject<Map<THREE.Mesh, THREE.LineSegments>>, group: any) => {
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