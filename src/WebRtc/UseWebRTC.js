import { socket } from "../Socket/socket";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export let localStream = null;
export let peerConnection = null;
let candidateQueue = [];

export const getUserMedia = async (calltype) => {
  const callConfiguration = {
    audio: true,
    video: calltype === "video",
  };
  localStream = await window.navigator.mediaDevices.getUserMedia(callConfiguration);
  return localStream;
};

export const createPeerConnection = () => {
  if (peerConnection) return peerConnection;
  peerConnection = new RTCPeerConnection(ICE_SERVERS);

  return peerConnection;
};

export const addTrackToPeerConnection = () => {
  if (localStream && peerConnection) {
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });
  }
};

export const cleanUp = () => {
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
  }
  if (peerConnection) {
    peerConnection.close();
  }
  localStream = null;
  peerConnection = null;
  candidateQueue = [];
};

export const createOffer = async () => {
  if (!peerConnection) throw new Error("Peer connection not initialized");
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  return offer;
};

export const createAnswer = async () => {
  if (!peerConnection) throw new Error("Peer connection not initialized");
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  return answer;
};

export async function setRemoteDescription(description) {
  if (!peerConnection) throw new Error("Peer connection not initialized");
  await peerConnection.setRemoteDescription(new RTCSessionDescription(description));

  while (candidateQueue.length > 0) {
    const candidate = candidateQueue.shift();
    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error("Queued ICE Candidate Error:", error);
    }
  }
}

export async function addIceCandidate(candidate) {
  try {
    if (!peerConnection || !peerConnection.remoteDescription) {
      candidateQueue.push(candidate);
      return;
    }
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (error) {
    console.error("ICE Candidate Error:", error);
  }
}

export function listenForIceCandidates(peerId) {
  if (!peerConnection) return;
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("call:ice", { candidate: event.candidate, to: peerId });
    }
  };
}
