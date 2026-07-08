#!/bin/bash
set -euo pipefail

APP_ROOT="$(cd "$(dirname "$0")" && pwd)"
ARCH="$(uname -m)"
if [[ "$ARCH" == "arm64" ]]; then
  NODE="$APP_ROOT/runtime/node-darwin-arm64/bin/node"
else
  NODE="$APP_ROOT/runtime/node-darwin-x64/bin/node"
fi

SERVER="$APP_ROOT/server.js"
DATA_ROOT="$HOME/Library/Application Support/EarthOnlineAchievementPalaceMac"
ARCHIVE_DIR="$DATA_ROOT/achievement-archive"
LOG_DIR="$DATA_ROOT/logs"
PORT_FILE="$LOG_DIR/port.txt"
DEFAULT_PORT=3417
PORT_START=3417
PORT_END=3499

mkdir -p "$ARCHIVE_DIR" "$LOG_DIR"

app_server_running() {
  local port="$1"
  "$NODE" -e "const http=require('http'); const req=http.get({host:'127.0.0.1',port:Number(process.argv[1]),path:'/api/achievements',timeout:250},res=>{res.resume(); process.exit(0)}); req.on('timeout',()=>{req.destroy(); process.exit(1)}); req.on('error',()=>process.exit(1));" "$port" >/dev/null 2>&1
}

port_available() {
  local port="$1"
  "$NODE" -e "const net=require('net'); const s=net.createServer(); s.once('error',()=>process.exit(1)); s.listen(Number(process.argv[1]),'127.0.0.1',()=>s.close(()=>process.exit(0)));" "$port" >/dev/null 2>&1
}

PORT=""
if [[ -f "$PORT_FILE" ]]; then
  SAVED_PORT="$(cat "$PORT_FILE" 2>/dev/null | tr -dc '0-9')"
  if [[ -n "$SAVED_PORT" ]] && [[ "$SAVED_PORT" -ge "$PORT_START" ]] && [[ "$SAVED_PORT" -le "$PORT_END" ]] && app_server_running "$SAVED_PORT"; then
    PORT="$SAVED_PORT"
  fi
fi

if [[ -z "$PORT" ]]; then
  if app_server_running "$DEFAULT_PORT" || port_available "$DEFAULT_PORT"; then
    PORT="$DEFAULT_PORT"
  fi
fi

if [[ -z "$PORT" ]]; then
  for candidate in $(seq "$PORT_START" "$PORT_END"); do
    if app_server_running "$candidate" || port_available "$candidate"; then
      PORT="$candidate"
      break
    fi
  done
fi

if [[ -z "$PORT" ]]; then
  osascript -e 'display dialog "没有可用的本地端口 3417-3499。" buttons {"好"} default button 1 with title "地球online成就殿堂"' >/dev/null 2>&1 || true
  exit 1
fi

if ! app_server_running "$PORT"; then
  ARCHIVE_DIR="$ARCHIVE_DIR" PORT="$PORT" nohup "$NODE" "$SERVER" > "$LOG_DIR/server.log" 2> "$LOG_DIR/server-error.log" &
  for _ in $(seq 1 60); do
    if app_server_running "$PORT"; then
      break
    fi
    sleep 0.1
  done
fi

echo "$PORT" > "$PORT_FILE"
open "http://127.0.0.1:$PORT"
