import { addCube } from "@/redux/slices/cubeSlice";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";

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

export function createCubeGroup(cubes: { x: number; y: number; z: number, color: number }[]) {
    const group = new THREE.Group();
    cubes.forEach(({ x, y, z, color }) => {
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshStandardMaterial({ color });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(x, y, z);
        group.add(cube);
    });
    return group;
}