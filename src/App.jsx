import './App.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthProvider } from './Contexts/AuthContext'
import ZyncLogin from './auth/ZyncLogin.jsx'
import ZyncRegister from './auth/ZyncRegister.jsx'
import { Protected } from './auth/Protected.jsx'
import Chats from './Chat/Chats.jsx'
import { ChatResProvider } from './Contexts/ChatContext.jsx/ChatContext.jsx'
import { MessageProvider } from './Contexts/MessageContext.jsx/MessageContext.jsx'


function App() {

  const router = createBrowserRouter([
    {
      path: "/",
      element: <ZyncLogin />
    },
    {
      path: "/register",
      element: <ZyncRegister />
    },
    {
      element: <Protected />,
      children: [
        {
          path: "/chats",
          element: <Chats />
        }
      ]
    }
  ])
  return (
    <>
      <AuthProvider>
        <ChatResProvider>
          <MessageProvider>
            <RouterProvider router={router} />
          </MessageProvider> 
        </ChatResProvider>
      </AuthProvider>
    </>
  )
}

export default App
