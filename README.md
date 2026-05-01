# ZYNC Frontend

ZYNC is a real-time chat app with modern UI, direct/group messaging, typing indicators, file/image sharing, and WebRTC voice/video calling.

## Tech Stack

- React + Vite
- Framer Motion
- Socket.IO (real-time events/signaling)
- WebRTC (audio/video peer connection)

## Core Features

- Authentication and profile management
- Group and direct message rooms
- Real-time messages with optimistic updates
- Typing indicator
- Room list with last message and unread counts
- Voice and video calls (WebRTC + socket signaling)
- Call controls: accept/reject/end, mute, camera toggle
- Call summary toast and in-chat call log entries

## WebRTC Notes

A full, simple implementation note is available in:

- `WEBRTC_IMPLEMENTATION_ROADMAP.md`

It includes:

- architecture overview
- signaling flow
- audio/video handling strategy
- reliability fixes applied in this project
- deployment and interview talking points

## Run Locally

```bash
npm install
npm run dev
```

## Deployment Checklist

- Use production backend URL in socket/API services
- Enable HTTPS (required for getUserMedia on non-localhost)
- Configure CORS + credentials properly on backend
- Verify STUN/TURN strategy for production NAT environments
