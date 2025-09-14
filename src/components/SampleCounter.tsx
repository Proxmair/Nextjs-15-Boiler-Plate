'use client';

import { decrement, increment, reset } from '@/redux/slices/counterSlice';
import { RootState } from '@/redux/store';
import { Button } from '@heroui/react';
import React from 'react'
import { useDispatch, useSelector } from 'react-redux';

const SampleCounter = () => {
  const dispatch = useDispatch();
  const count = useSelector((state: RootState) => state.counter.value);

  return (
    <div className="flex flex-col items-center gap-4 mt-10">
      <h1 className="text-2xl font-bold">Redux Persist Example</h1>
      <p className="text-lg">Count: {count}</p>
      <div className="flex gap-2">
        <Button variant='solid' color='primary'  >Hero UI Button</Button>
        <button onClick={() => dispatch(increment())} className="px-4 py-2 bg-green-500 text-white rounded">
          +
        </button>
        <button onClick={() => dispatch(decrement())} className="px-4 py-2 bg-red-500 text-white rounded">
          -
        </button>
        <button onClick={() => dispatch(reset())} className="px-4 py-2 bg-gray-500 text-white rounded">
          Reset
        </button>
      </div>
    </div>
  );
}

export default SampleCounter