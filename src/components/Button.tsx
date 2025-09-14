import { ButtonInterface } from '@/interface/interface'
import React from 'react'

const Button = ({ value = 'Click me', disable = false, variant = 'primary' }: ButtonInterface) => {
    return (
        <button disabled={disable} className={`px-4 py-2 rounded ${variant === 'primary' ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white'}`}>
            {value}
        </button>
    )
}

export default Button