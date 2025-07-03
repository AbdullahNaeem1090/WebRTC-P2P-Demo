import { useEffect, useState, useCallback } from "react";
import { socket } from "../socket-client";
import { peer } from "../webRTC";

const VideoRoom = () => {
    const [myStream, setMystream] = useState()
    const [remoteStream, setRemoteStream] = useState()

    useEffect(() => {
        if (!myStream) {
            setLocalStream()
        }
    }, [])

    async function setLocalStream() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            setMystream(stream)
            addTracksToConnection(stream)
        } catch (error) {
            console.error("Error accessing media devices:", error)
        }
    }

    function addTracksToConnection(stream) {
        if (!stream) {
            console.log("Couldnt add tracks")
            return
        }

        // Check if tracks are already added to avoid duplicates
        const senders = peer.peer.getSenders()
        const trackIds = senders.map(sender => sender.track?.id).filter(Boolean)

        stream.getTracks().forEach(track => {
            if (!trackIds.includes(track.id)) {
                peer.peer.addTrack(track, stream)
            }
        });
    }

    async function userJoined({ id }) {
        console.log("user joined", id)
        // Add tracks first
        addTracksToConnection(myStream)
        // Wait a bit to ensure the other user has also added their tracks
        setTimeout(async () => {
            const offer = await peer.getOffer()
            socket.emit("make-call", { to: id, offer })
        }, 1000)
    }

    async function handleReadyForCall({ from }) {
        const offer = await peer.getOffer()
        socket.emit("make-call", { to: from, offer })
    }

    async function recieveCall({ from, offer }) {
        // Ensuring tracks are added before creating answer
        addTracksToConnection(myStream)
        const answer = await peer.getAnswer(offer)
        socket.emit("call-recieved", { to: from, answer })
    }

    async function callAccepted({ by, answer }) {

        await peer.setRemDescription(answer)

        // Force a renegotiation if no remote stream is received after a short delay
        setTimeout(() => {
            if (!remoteStream) {
                console.log("No remote stream received, checking connection state...")
                console.log("Connection state:", peer.peer.connectionState)
                console.log("ICE connection state:", peer.peer.iceConnectionState)
                console.log("Signaling state:", peer.peer.signalingState)
            }
        }, 3000)
    }
    async function handleIceCandidate({ candidate }) {
        if (candidate) {
            try {
                await peer.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (error) {
                console.error("Error adding ICE candidate:", error);
            }
        }
    };

    // Set up ICE candidate handling
    useEffect(() => {
        socket.on("ice-candidate", handleIceCandidate);

        return () => {
            socket.off("ice-candidate", handleIceCandidate);
        };
    }, []);

    // Peer connection event listeners
    async function handleTrack(ev) {
        const remoteStream = ev.streams[0];
        if (remoteStream) {
            setRemoteStream(remoteStream);
        } else {
            console.log("No remote stream in track event");
        }
    };

    // Handle ICE candidates
    function handleIceCandidateEvent(event) {
        if (event.candidate) {
            socket.emit("ice-candidate-exchange", { candidate: event.candidate })
        }
    };

    // Handle connection state changes
    function handleConnectionStateChange() {
        console.log("Connection state changed:", peer.peer.connectionState);
    };

    function handleIceConnectionStateChange() {
        console.log("ICE connection state changed:", peer.peer.iceConnectionState);
    };

    useEffect(() => {

        peer.peer.addEventListener("track", handleTrack);
        peer.peer.addEventListener("icecandidate", handleIceCandidateEvent);
        peer.peer.addEventListener("connectionstatechange", handleConnectionStateChange);
        peer.peer.addEventListener("iceconnectionstatechange", handleIceConnectionStateChange);

        return () => {
            peer.peer.removeEventListener("track", handleTrack);
            peer.peer.removeEventListener("icecandidate", handleIceCandidateEvent);
            peer.peer.removeEventListener("connectionstatechange", handleConnectionStateChange);
            peer.peer.removeEventListener("iceconnectionstatechange", handleIceConnectionStateChange);
        };
    }, []);

    // Set up socket event listeners
    useEffect(() => {
        socket.on("user-joined", userJoined);
        socket.on("ready-for-call", handleReadyForCall);
        socket.on("incoming-call", recieveCall);
        socket.on("call-accepted", callAccepted);

        return () => {
            socket.off("user-joined", userJoined);
            socket.off("ready-for-call", handleReadyForCall);
            socket.off("incoming-call", recieveCall);
            socket.off("call-accepted", callAccepted);
        };
    }, [myStream])

    return (
        <div className="room-container">
            <h1 className="room-title">Room Page</h1>
            <p className={`room-status ${remoteStream ? "connected" : "disconnected"}`}>
                {remoteStream ? "✅ Someone is in the room" : "❌ No one in the room"}
            </p>

            <div className="video-grid">
                {myStream && (
                    <div className="video-box my-stream">
                        <h2>🎥 My Stream</h2>
                        <video
                            autoPlay
                            muted
                            playsInline
                            ref={(video) => {
                                if (video) video.srcObject = myStream;
                            }}
                            style={{ width: "100%", height: "200px", borderRadius: "10px" }}
                        />
                    </div>
                )}

                {remoteStream && (
                    <div className="video-box remote-stream">
                        <h2>Remote Stream</h2>
                        <video
                            autoPlay
                            muted={false}
                            playsInline
                            ref={(video) => {
                                if (video) video.srcObject = remoteStream;
                            }}
                            style={{ width: "100%", height: "200px", borderRadius: "10px" }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoRoom;