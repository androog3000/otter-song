//export { default } from './Sequencer';
import React, { useState } from "react";
import * as Tone from "tone";
import "./Sequencer.css";
const [sequence, setSequence] = useState(Array(8).fill("")); // 8-step sequencer (empty by default)
const [sequence2, setSequence2] = useState(Array(8).fill("")); // 8-step sequencer (empty by default)
const [isRunning, setIsRunning] = useState(false); // State for transport status
const activeStepRef = useRef(0); // Reference for the current step in the sequencer
const activeStepRef2 = useRef(0); // Reference for the current step in the sequencer

// const start = async () => {
//   // Ensure AudioContext is resumed
//   await Tone.start(); 
//   console.log("AudioContext started!");

//   // Reset counter and sequence
//   setCounter(1);
//   counterRef.current = 1;
//   setIsRunning(true);

//   // Start the sequence and the transport
//   sequenceRef.current.start(0); // Start at the beginning
//   transport.start();
// };

const Sequencer = ({ currentNote }) => {
  const [sequence, setSequence] = useState(Array(8).fill("")); // Empty steps
  const [activeStep, setActiveStep] = useState(null);

  const toggleStep = (index) => {
    const newSequence = [...sequence];
    newSequence[index] = sequence[index] === "" ? currentNote : "";
    setSequence(newSequence);
  };

  React.useEffect(() => {
    const synth = new Tone.Synth().toDestination();
    const seq = new Tone.Sequence(
      (time, note) => {
        setActiveStep(note ? sequence.indexOf(note) : null);
        if (note) synth.triggerAttackRelease(note, "8n", time);
      },
      sequence,
      "8n"
    ).start(0);

    return () => seq.dispose();
  }, [sequence]);

  return (
    <div className="sequencer">
      {sequence.map((note, index) => (
        <button
          key={index}
          className={`step ${activeStep === index ? "active" : ""} ${note ? "filled" : ""}`}
          onClick={() => toggleStep(index)}
        >
          {note || ""}
        </button>
      ))}
    </div>
  );
};

export default Sequencer;
