"use client";

import { useRef, useState } from "react";
import * as THREE from "three";
import { Button, Tabs, Tab, Card, CardBody } from "@heroui/react";
import ThreeCanvas from "./components/ThreeCanvas";

// Reusable ColorButtons component
type ColorButtonsProps = {
    onChange: (color: number) => void;
};
const ColorButtons = ({ onChange }: ColorButtonsProps) => (
    <Card>
        <CardBody className="flex gap-2">
            <Button color="success" variant="solid" onPress={() => onChange(0x00ff00)}>
                Green
            </Button>
            <Button color="primary" variant="solid" onPress={() => onChange(0x0000ff)}>
                Blue
            </Button>
            <Button color="secondary" variant="solid" onPress={() => onChange(0x800080)}>
                Purple
            </Button>
        </CardBody>
    </Card>
);

// Reusable AddCubeButton component
type AddCubeButtonProps = {
    onAdd: () => void;
};
const AddCubeButton = ({ onAdd }: AddCubeButtonProps) => (
    <Card>
        <CardBody className="flex gap-2">
            <Button color="warning" onPress={onAdd}>
                Add Cube
            </Button>
        </CardBody>
    </Card>
);

const FurnitureView = () => {
    const cubeRef = useRef<THREE.Mesh | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const [color, setColor] = useState(0x0070f3);
    const [selectedTab, setSelectedTab] = useState<"colors" | "cubes">("colors");

    // Function to add a new cube
    const addCube = () => {
        if (!sceneRef.current) return;

        const group = (sceneRef.current as any).cubeGroup;
        const count = group.children.length; // how many cubes so far

        const geometry = new THREE.BoxGeometry();
        const randomColor = Math.floor(Math.random() * 0xffffff);
        const material = new THREE.MeshStandardMaterial({ color: randomColor });
        const newCube = new THREE.Mesh(geometry, material);

        // offset = how far from center
        const offset = Math.floor((count + 1) / 2);

        if (count % 2 === 0) {
            // even index → place on right
            newCube.position.set(offset, 0, 0);
        } else {
            // odd index → place on left
            newCube.position.set(-offset, 0, 0);
        }

        group.add(newCube);
    };

    // Tab keys array for navigation
    const tabKeys: Array<"colors" | "cubes"> = ["colors", "cubes"];
    const currentTabIndex = tabKeys.indexOf(selectedTab);

    const goToNextTab = () => {
        setSelectedTab(tabKeys[(currentTabIndex + 1) % tabKeys.length]);
    };

    const goToPrevTab = () => {
        setSelectedTab(tabKeys[(currentTabIndex - 1 + tabKeys.length) % tabKeys.length]);
    };

    return (
        <div className="flex flex-col h-screen gap-4 p-4">
            {/* Tabs on top */}
            <Tabs
                aria-label="Options"
                color="primary"
                variant="underlined"
                selectedKey={selectedTab}
                onSelectionChange={key => setSelectedTab(key as "colors" | "cubes")}
            >
                <Tab key="colors" title="Change Color"></Tab>
                <Tab key="cubes" title="Add Cubes"></Tab>
            </Tabs>

            {/* Three.js Canvas */}
            <div className="flex h-full gap-4">
                <div className="flex-1 flex justify-center min-w-100">
                    <ThreeCanvas color={color} cubeRef={cubeRef} sceneRef={sceneRef} />
                </div>
                <div className="flex flex-col justify-between">
                    {selectedTab === "colors" && <ColorButtons onChange={setColor} />}
                    {selectedTab === "cubes" && <AddCubeButton onAdd={addCube} />}
                    <Card>
                        <CardBody className="flex gap-2">

                            {currentTabIndex > 0 && (
                                <Button color="default" onPress={goToPrevTab}>Previous</Button>
                            )}
                            {currentTabIndex < tabKeys.length - 1 && (
                                <Button color="default" onPress={goToNextTab}>Next</Button>
                            )}
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default FurnitureView;
