"use client";

import { useCallback, useMemo, useState } from "react";
import { useMediaDeviceSelect } from "@livekit/components-react";
import { Track, type Room } from "livekit-client";

type CameraFacingMode = "user" | "environment" | "left" | "right";

export function useCameraFacing(room: Room) {
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);
  const [cameraSwitchError, setCameraSwitchError] = useState<string | null>(null);
  const { devices, activeDeviceId } = useMediaDeviceSelect({
    kind: "videoinput",
    room,
    requestPermissions: false,
  });
  const cameraDevices = useMemo(
    () =>
      devices.filter(
        (device, index, allDevices) =>
          device.deviceId.length > 0 &&
          !(
            device.deviceId === "default" &&
            allDevices.some(
              (candidate) =>
                candidate.deviceId !== "default" &&
                (!device.groupId || candidate.groupId === device.groupId),
            )
          ) &&
          allDevices.findIndex((candidate) => candidate.deviceId === device.deviceId) ===
            index,
      ),
    [devices],
  );

  const switchCamera = useCallback(async () => {
    if (cameraDevices.length < 2 || isSwitchingCamera) return;

    const cameraTrack = room.localParticipant.getTrackPublication(
      Track.Source.Camera,
    )?.videoTrack;
    if (!cameraTrack) {
      setCameraSwitchError("カメラをオンにしてから切り替えてください。");
      return;
    }

    const settings = cameraTrack.mediaStreamTrack.getSettings();
    const originalDeviceId =
      settings.deviceId || room.getActiveDevice("videoinput") || activeDeviceId;
    const originalFacingMode = isCameraFacingMode(settings.facingMode)
      ? settings.facingMode
      : undefined;
    const currentIndex = cameraDevices.findIndex(
      (device) => device.deviceId === originalDeviceId,
    );
    const nextDevice =
      cameraDevices[
        (currentIndex >= 0 ? currentIndex + 1 : 0) % cameraDevices.length
      ];
    if (!nextDevice || nextDevice.deviceId === originalDeviceId) return;

    setCameraSwitchError(null);
    setIsSwitchingCamera(true);

    try {
      const switched = await room.switchActiveDevice(
        "videoinput",
        nextDevice.deviceId,
      );
      if (!switched) throw new Error("The browser did not activate the selected camera.");
    } catch {
      let restored = false;

      try {
        if (originalDeviceId) {
          restored = await room.switchActiveDevice("videoinput", originalDeviceId);
        } else if (originalFacingMode) {
          await cameraTrack.restartTrack({ facingMode: originalFacingMode });
          restored = true;
        }
      } catch {
        restored = false;
      }

      setCameraSwitchError(
        restored
          ? "カメラを切り替えられませんでした。元のカメラに戻しました。"
          : "カメラを切り替えられず、元のカメラにも戻せませんでした。カメラを一度オフにして再度オンにしてください。",
      );
    } finally {
      setIsSwitchingCamera(false);
    }
  }, [activeDeviceId, cameraDevices, isSwitchingCamera, room]);

  const clearCameraSwitchError = useCallback(() => setCameraSwitchError(null), []);

  return {
    canSwitchCamera: cameraDevices.length > 1,
    isSwitchingCamera,
    cameraSwitchError,
    switchCamera,
    clearCameraSwitchError,
  };
}

function isCameraFacingMode(value: string | undefined): value is CameraFacingMode {
  return value === "user" || value === "environment" || value === "left" || value === "right";
}
