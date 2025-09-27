import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type Cube = { x: number; y: number; z: number, color: number };

const cubesSlice = createSlice({
  name: "cubes",
  initialState: {
    cube: [] as Cube[],
    selectedColor: 0x0070f3 as number,
  },
  reducers: {
    setSelectedColor: (state, action: PayloadAction<number>) => {
      state.selectedColor = action.payload;
    },
    addCube: (state, action: PayloadAction<Cube>) => {
      state.cube.push(action.payload);
    },
    removeCube: (state, action: PayloadAction<{ x: number; y: number; z: number }>) => {
      state.cube = state.cube.filter(
        (c) => !(c.x === action.payload.x && c.y === action.payload.y && c.z === action.payload.z)
      );
    },
    resetCubes: () => {
      return { cube: [] as Cube[], selectedColor: 0x0070f3 as number };
    },
    changeCubeColor: (state, action: PayloadAction<{ index: number; color: number }>) => {
      const { index, color } = action.payload;
      if (state.cube[index]) {
        state.cube[index].color = color;
      }
    },
  },
});

export const { addCube, removeCube, resetCubes, setSelectedColor, changeCubeColor } = cubesSlice.actions;
export default cubesSlice.reducer;
