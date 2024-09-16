import { useEffect, useState } from 'react';

interface CountdownHook {
  seconds: number;
  startCountdown: (duration: number) => void;
  resetCountdown: () => void;
}

const useCountdown = (): CountdownHook => {
  const [seconds, setSeconds] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((prevSeconds) => prevSeconds - 1);
      }, 1000);
    } else if (seconds === 0) {
      setIsActive(false);
    }

    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const startCountdown = (duration: number) => {
    setSeconds(duration);
    setIsActive(true);
  };

  const resetCountdown = () => {
    setIsActive(false);
    setSeconds(0);
  };

  return { seconds, startCountdown, resetCountdown };
};

export default useCountdown;
