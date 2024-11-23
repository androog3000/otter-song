import { useRef, useEffect } from "react";
import * as Tone from "tone";

export const useToneTransport = (setCounter) => {
  const counterRef = useRef(1);
  const transport = Tone.getTransport();

  useEffect(() => {
    transport.scheduleRepeat(() => {
      counterRef.current = (counterRef.current % 8) + 1;
      setCounter(counterRef.current);
    }, "4n");

    return () => {
      transport.stop();
      transport.cancel();
    };
  }, [setCounter, transport]);

  return transport;
};
