import FireSimulationMap from './FireSimulationMap';
import timeSeries from '/public/fireTimeSeries.json';

function App() {


  return (
    <>
      <FireSimulationMap timeSeries={timeSeries}/>
    </>
  );
}

export default App;
