import { useState } from "react"
import { socket } from "./socket-client"
import { Route, Routes } from "react-router-dom"
import { Form } from "./pages/form"
import VideoRoom from "./pages/room"


function App() {



  return (
  <>
   <Routes>
    <Route path="/" element={<Form/>} />
    <Route path="room/:id" element={<VideoRoom/>} />
   </Routes>
  </>
  )
}

export default App
