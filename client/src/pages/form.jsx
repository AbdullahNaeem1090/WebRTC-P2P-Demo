import { useState } from "react"
import { socket } from "../socket-client"
import { useNavigate } from "react-router-dom"


export const Form = () => {

    const [name, setName] = useState("")
    const [roomId, setRoomId] = useState("")
    const navigate = useNavigate()

    function handleFormSubmit(e) {
        e.preventDefault()
        socket.emit('room-join', { name, roomId })
        navigate(`room/${roomId}`)
    }

    return <form className="form" onSubmit={handleFormSubmit}>
        <input type="name" placeholder="Username" value={name} onChange={(e) => setName(e.target.value)} />
        <input type="text" placeholder="Room id" value={roomId} onChange={(e) => setRoomId(e.target.value)} />
        <button type="submit">Join</button>
    </form>
}