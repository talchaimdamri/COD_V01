import React from 'react'
import Canvas from '@/components/canvas/Canvas'
import Sidebar from '@/components/sidebar/Sidebar'

const MainPage: React.FC = () => {
  return (
    <div className="flex h-full w-full">
      <Sidebar />
      <main className="flex-1 relative">
        <Canvas />
      </main>
    </div>
  )
}

export default MainPage