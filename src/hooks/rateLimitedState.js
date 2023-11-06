import { useState, useEffect, useRef } from "react";

function useRateLimitedState(defaultValue, rate = 1000) {
  const [realInternalState, setRealInternalState] = useState(defaultValue);
  const [displayedInternalState, setDiplayedInternalState] =
    useState(defaultValue);

  const rc = useRef(defaultValue);

  useEffect(() => {
    rc.current = realInternalState;
  }, [realInternalState]);

  useEffect(() => {
    const updateInterval = setInterval(() => {
      setDiplayedInternalState(rc.current);
    }, rate);

    return () => {
      clearInterval(updateInterval);
    };
  }, []);

  return [displayedInternalState, setRealInternalState];
}

export default useRateLimitedState;
