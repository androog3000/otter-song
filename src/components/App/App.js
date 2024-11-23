import './App.css';
import Keyboard from '../Keyboard';
import Sequencer from '../Sequencer';

const App = () => {
  return (
    <div className="app">
      <h1>Transport Counter with Synth</h1>
      <Keyboard />
      <Sequencer />
    </div>
  );
};

export default App;
