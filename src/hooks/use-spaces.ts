"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { SpaceSummary, ApiResponse } from "@/types";

// Remember last path per space
const PATH_MEMORY: Record<string, string> = {};

export function useSpaces() {
  const [spaces, setSpaces] = useState<SpaceSummary[]>([]);
  const [currentSpaceId, setCurrentSpaceId] = useState<string>("");
  const [currentSpaceType, setCurrentSpaceType] = useState<"personal" | "shared">("personal");
  const [currentPath, setCurrentPath] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pathMemoryRef = useRef<Record<string, string>>(PATH_MEMORY);

  const fetchSpaces = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/spaces");
      const data: ApiResponse<SpaceSummary[]> = await res.json();
      if (data.success && data.data) {
        setSpaces(data.data);
        // Set initial space (personal if no current)
        if (!currentSpaceId || !data.data.find((s) => s.id === currentSpaceId)) {
          const personal = data.data.find((s) => s.type === "personal");
          if (personal) {
            setCurrentSpaceId(personal.id);
            setCurrentSpaceType("personal");
            setCurrentPath(pathMemoryRef.current[`personal:${personal.id}`] || "");
          }
        }
      } else {
        setError(data.error || "加载空间列表失败");
      }
    } catch {
      setError("网络错误");
    }
    setLoading(false);
  }, [currentSpaceId]);

  useEffect(() => {
    fetchSpaces();
  }, []);

  const switchToSpace = useCallback(
    (spaceId: string, spaceType: "personal" | "shared") => {
      // Save current path
      if (currentSpaceId) {
        pathMemoryRef.current[`${currentSpaceType}:${currentSpaceId}`] = currentPath;
      }

      setCurrentSpaceId(spaceId);
      setCurrentSpaceType(spaceType);

      // Restore last path for this space
      const saved = pathMemoryRef.current[`${spaceType}:${spaceId}`];
      setCurrentPath(saved || "");
    },
    [currentSpaceId, currentSpaceType, currentPath]
  );

  const navigateToPath = useCallback((path: string) => {
    setCurrentPath(path);
    if (currentSpaceId) {
      pathMemoryRef.current[`${currentSpaceType}:${currentSpaceId}`] = path;
    }
  }, [currentSpaceId, currentSpaceType]);

  const currentSpace = spaces.find(
    (s) => s.id === currentSpaceId && s.type === currentSpaceType
  );

  const isOwner = currentSpace?.role === "owner";

  return {
    spaces,
    currentSpace,
    currentSpaceId,
    currentSpaceType,
    currentPath,
    isOwner,
    loading,
    error,
    switchToSpace,
    navigateToPath,
    fetchSpaces,
  };
}
