//export { default } from './Sequencer';
import React, { useState } from "react";
import * as Tone from "tone";
import "./Sequencer.css";

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
