"use client";

// No audio engine - purely silent portfolio experience
export function playCyberClick() {}
export function playTactilePop() {}
export function playGameMoveSound() {}
export function isAudioMuted(): boolean {
  return true;
}
export function setAudioMuted(_muted: boolean) {}
export function toggleAudioMute(): boolean {
  return true;
}
