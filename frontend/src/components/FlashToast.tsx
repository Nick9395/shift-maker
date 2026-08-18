import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const FLASH_DURATION_MS = 2500;

export function useFlash(durationMs = FLASH_DURATION_MS) {
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<number>(0);

  const showFlash = useCallback(
    (text: string) => {
      window.clearTimeout(timerRef.current);
      setMessage(text);
      timerRef.current = window.setTimeout(() => {
        setMessage(null);
      }, durationMs);
    },
    [durationMs],
  );

  useEffect(() => {
    return () => {
      window.clearTimeout(timerRef.current);
    };
  }, []);

  return { flashMessage: message, showFlash };
}

/** 重ね表示の成功メッセージ。文書フローに入らないのでレイアウトは動かない */
export function FlashToast({ message }: { message: string | null }) {
  if (!message) return null;

  return createPortal(
    <p className="flash-toast" role="status" aria-live="polite">
      {message}
    </p>,
    document.body,
  );
}
