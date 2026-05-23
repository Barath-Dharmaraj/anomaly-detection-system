from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Set
import json

router = APIRouter()
_connections: Set[WebSocket] = set()

@router.websocket("/live")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    _connections.add(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping": await websocket.send_text("pong")
    except WebSocketDisconnect:
        _connections.discard(websocket)

async def broadcast(message: dict):
    dead = set()
    for ws in _connections:
        try: await ws.send_text(json.dumps(message))
        except: dead.add(ws)
    _connections -= dead
