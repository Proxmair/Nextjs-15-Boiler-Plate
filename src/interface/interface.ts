export interface UserInterface {
  id: number
  name: string
  email: string
  isActive: boolean
}

export interface ButtonInterface {
    value?: string;
    disable?: boolean;
    variant?: 'primary' | 'secondary';
}