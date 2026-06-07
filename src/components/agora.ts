// Platform-specific Agora bridge: Native implementation
let createRtcEngine: any = null;
let ChannelProfileType: any = null;
let ClientRoleType: any = null;
let RtcSurfaceView: any = null;
let RtcConnection: any = null;

try {
  const Agora = require("react-native-agora");
  createRtcEngine = Agora.createRtcEngine;
  ChannelProfileType = Agora.ChannelProfileType;
  ClientRoleType = Agora.ClientRoleType;
  RtcSurfaceView = Agora.RtcSurfaceView;
  RtcConnection = Agora.RtcConnection;
} catch (e) {
  // Safe fallback if native Agora is not linked or mock context is active
}

export {
  createRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  RtcSurfaceView,
  RtcConnection,
};
