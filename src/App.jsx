import { useEffect, useState } from 'react';
import FireMap from './FireMap';

const App = () => {
  const [timeSeries, setTimeSeries] = useState([]);
  const [step, setStep] = useState(0);

  useEffect(() => {
    fetch('/fireData.json')
      .then(res => res.json())
      .then(setTimeSeries);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(prev => (prev + 1 < timeSeries.length ? prev + 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeSeries]);

  return (
    <div>
      <FireMap timeSeries={timeSeries} step={step} />
    </div>
  );
};

export default App;
