"use client";

import { useRef, useState } from "react";
import * as THREE from "three";
import { Tabs, Tab} from "@heroui/react";
import ThreeCanvas from "./components/ThreeCanvas";
import { useSelector } from "react-redux";
import { RootState } from '@/redux/store';
import ColorButtons from "./components/ColorButtons";
import PaletteObjects from "./components/PalatteObjects";

const FurnitureView = () => {
    
    const sceneRef = useRef<THREE.Scene | null>(null);
    const selectedColor = useSelector((state: RootState) => state.cubes.selectedColor);
    const [selectedTab, setSelectedTab] = useState<"colors" | "add">("add");

    return (
        <div className="flex flex-col h-screen gap-4 p-4">
            {/* Tabs on top */}
            <Tabs
                aria-label="Options"
                color="primary"
                variant="underlined"
                selectedKey={selectedTab}
                onSelectionChange={key => setSelectedTab(key as "colors" | "add")}
            >
                <Tab key="add" title="Add Furniture"></Tab>
                <Tab key="colors" title="Change Color"></Tab>
            </Tabs>

            {/* Three.js Canvas with left sidebar for both tabs */}
            <div className="flex h-full gap-4">
                <div className="flex-1 flex justify-center min-w-100">
                    <ThreeCanvas color={selectedColor} sceneRef={sceneRef} />
                </div>
                <div className="w-56 flex flex-col gap-3">
                    {selectedTab === "colors" && <ColorButtons />}
                    {selectedTab === "add" && <PaletteObjects />}
                </div>
            </div>
        </div>
    );
};

export default FurnitureView;
