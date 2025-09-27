import { setSelectedColor } from "@/redux/slices/cubeSlice";
import { RootState, AppDispatch } from "@/redux/store";
import { Button, Card, CardBody } from "@heroui/react";
import { useDispatch, useSelector } from "react-redux";

type ColorOption = {
  name: string;
  value: number; // THREE.js hex
  bgClass: string; // Tailwind background
  textClass?: string;
};

const ColorButtons = () => {
  const dispatch = useDispatch<AppDispatch>();
  const selectedColor = useSelector(
    (state: RootState) => state.cubes.selectedColor
  );

  const colors: ColorOption[] = [
    { name: "Green", value: 0x00ff00, bgClass: "bg-green-500" },
    { name: "Blue", value: 0x0000ff, bgClass: "bg-blue-500" },
    { name: "Purple", value: 0x800080, bgClass: "bg-purple-600" },
    { name: "Red", value: 0xff0000, bgClass: "bg-red-500" },
    { name: "Yellow", value: 0xffff00, bgClass: "bg-yellow-400 text-black" },
    { name: "Orange", value: 0xffa500, bgClass: "bg-orange-500" },
    { name: "Black", value: 0x000000, bgClass: "bg-black text-white" },
    { name: "White", value: 0xffffff, bgClass: "bg-white text-black border" },
  ];

  return (
    <Card>
      <CardBody className="flex flex-wrap gap-2">
        {colors.map((color) => {
          const isSelected = selectedColor === color.value;
          return (
            <Button
              key={color.value}
              className={`${color.bgClass} ${
                isSelected
                  ? "ring-2 ring-offset-2 ring-blue-500"
                  : "opacity-70 hover:opacity-100"
              }`}
              variant="flat"
              onPress={() => dispatch(setSelectedColor(color.value))}
            >
              {color.name}
            </Button>
          );
        })}
      </CardBody>
    </Card>
  );
};

export default ColorButtons;
