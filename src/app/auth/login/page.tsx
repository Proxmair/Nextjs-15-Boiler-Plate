import LoginView from '@/views/login/LoginView'
import { NextPage } from 'next'

interface Props {}

const Page: NextPage<Props> = ({}) => {
  return <div><LoginView/></div>
}

export default Page