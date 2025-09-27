import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type Cube = { x: number; y: number; z: number };

const cubesSlice = createSlice({
  name: "cubes",
  initialState: {
    cube : [] as Cube[],
    selectedColor: 0x0070f3 as number,
  },
  reducers: {
    setSelectedColor: (state, action: PayloadAction<number>) => {
        state.selectedColor = action.payload;
    },
    addCube: (state, action: PayloadAction<Cube>) => {
      state.cube.push(action.payload);
    },
    removeCube: (state, action: PayloadAction<number>) => {
      state.cube.splice(action.payload, 1);
    },
    resetCubes: () => {
        return { cube: []  as Cube[], selectedColor: 0x0070f3 as number };
    },
  },
});

export const { addCube, removeCube, resetCubes, setSelectedColor } = cubesSlice.actions;
export default cubesSlice.reducer;
