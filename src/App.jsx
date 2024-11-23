import React, { useState, useEffect, useRef } from "react";
import * as Tone from "tone";
import './App.css';

const App = () => {
  const [counter, setCounter] = useState(""); // Counter for the UI
  const [currentNote, setCurrentNote] = useState("C3");
  const [sequence, setSequence] = useState(Array(8).fill("")); // 8-step sequencer
  const [sequence2, setSequence2] = useState(Array(8).fill("")); // Second sequence
  const [isRunning, setIsRunning] = useState(false); // State for transport status
  const activeStepRef = useRef(0); // Reference for the current step
  const transport = Tone.getTransport();

  const synthRef = useRef(null); // Reference for the synth object

  useEffect(() => {
    // Initialize the Synth with a triangle waveform
    synthRef.current = new Tone.Synth({
      oscillator: {
        type: "triangle",
      },
    }).toDestination();

    // Cleanup on component unmount
    return () => {
      transport.stop();
      transport.cancel(); // Clear all scheduled events
      if (synthRef.current) synthRef.current.dispose();
    };
  }, []);

  const playNote = async (note) => {
    if (Tone.BaseContext.state !== "running") {
      console.log("Resuming AudioContext...");
      await Tone.start();
      console.log("AudioContext started!");
    }

    synthRef.current.triggerAttackRelease(note, "8n", Tone.now());
  };

  const startSequence = async () => {
    if (Tone.BaseContext.state !== "running") {
      await Tone.start();
    }

    setCounter(1);
    activeStepRef.current = 0; // Reset active step
    setIsRunning(true);

    // Schedule the sequencer with precise timing
    transport.scheduleRepeat((time) => {
      const currentStep = activeStepRef.current;
      const note = sequence[currentStep];
      const note2 = sequence2[currentStep];

      // Stop any previously playing notes (optional, depending on your needs)
      synthRef.current?.triggerRelease();

      // Play the note if the step contains one, using the passed `time`
      if (note) {
        synthRef.current.triggerAttackRelease(note, "8n", time);
      }

      if (note2) {
        // Additional logic for sequence2 (e.g., second synth or sampler)
      }

      // Update active step and UI counter
      activeStepRef.current = (currentStep + 1) % sequence.length;
      setCounter(activeStepRef.current + 1); // Update counter for UI
    }, "8n"); // Steps align with eighth notes

    transport.start();
  };

  const stopSequence = () => {
    setIsRunning(false);
    transport.stop();
    transport.cancel(); // Stop transport and clear all scheduled events
    synthRef.current?.triggerRelease();

    // Reset UI and step index
    setCounter("");
    activeStepRef.current = 0;
  };

  const clearSequence = () => {
    setSequence(Array(8).fill(""));
    setSequence2(Array(8).fill(""));
  };

  const toggleStep = (index) => {
    const newSequence = [...sequence];
    newSequence[index] = sequence[index] === "" ? currentNote : "";
    setSequence(newSequence);
  };

  const toggleStep2 = (index) => {
    const newSequence2 = [...sequence2];
    newSequence2[index] = sequence2[index] === "" ? currentNote : "";
    setSequence2(newSequence2);
  };

  return (
    <div
      style={{
        textAlign: "center",
        padding: "20px",
        backgroundColor: "#121212",
        color: "#fff",
      }}
    >
      <h1>OtterSong</h1>

      <p style={{ fontSize: "24px" }}>Current Beat: {counter}</p>
      <p style={{ fontSize: "24px" }}>Current Note: {currentNote}</p>
      <button
        onClick={startSequence}
        style={{
          padding: "10px 20px",
          margin: "10px",
          backgroundColor: "#4caf50",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
        disabled={isRunning}
      >
        Start
      </button>
      <button
        onClick={stopSequence}
        style={{
          padding: "10px 20px",
          margin: "10px",
          backgroundColor: "#f44336",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
        disabled={!isRunning}
      >
        Stop
      </button>
      <button
        onClick={clearSequence}
        style={{
          padding: "10px 20px",
          margin: "10px",
          backgroundColor: "#008CBA",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Clear Sequence
      </button>
      <div style={styles.keyboard}>
        {[
          "C2",
          "D2",
          "E2",
          "F2",
          "G2",
          "A2",
          "B2",
          "C3",
          "D3",
          "E3",
          "F3",
          "G3",
          "A3",
          "B3",
          "C4",
        ].map((note) => (
          <button
            key={note}
            onClick={() => {
              setCurrentNote(note);
              playNote(note);
            }}
            style={{
              ...styles.key,
              ...(currentNote === note ? styles.activeKey : {}),
            }}
          >
            {note}
          </button>
        ))}
      </div>
      <div style={styles.stepSequencer}>
        {sequence.map((stepNote, index) => (
          <button
            key={index}
            onClick={() => toggleStep(index)}
            style={{
              ...styles.step,
              ...(activeStepRef.current === index ? styles.activeStep : {}),
              ...(stepNote ? styles.noteStep : {}),
            }}
          >
            {stepNote || ""}
          </button>
        ))}
      </div>
      <div style={styles.stepSequencer}>
        {sequence2.map((stepNote2, index2) => (
          <button
            key={index2}
            onClick={() => toggleStep2(index2)}
            style={{
              ...styles.step,
              ...(activeStepRef.current === index2 ? styles.activeStep : {}),
              ...(stepNote2 ? styles.noteStep : {}),
            }}
          >
            {stepNote2 || ""}
          </button>
        ))}
      </div>
    </div>
  );
};

const styles = {
  stepSequencer: {
    display: "grid",
    gridTemplateColumns: "repeat(8, 1fr)",
    gap: "0.5rem",
    marginBottom: "1rem",
  },
  keyboard: {
    display: "grid",
    gridTemplateColumns: "repeat(15, 1fr)",
    gap: "0.5rem",
    marginBottom: "1rem",
  },
  key: {
    padding: "1rem",
    backgroundColor: "#444",
    border: "1px solid #666",
    borderRadius: "4px",
    color: "#fff",
    fontSize: "0.9rem",
    cursor: "pointer",
  },
  activeKey: {
    backgroundColor: "#005f99",
  },
  step: {
    padding: "1rem",
    backgroundColor: "#666",
    border: "1px solid #999",
    borderRadius: "4px",
    color: "#fff",
    textAlign: "center",
    fontSize: "1rem",
    cursor: "pointer",
  },
  activeStep: {
    backgroundColor: "#ff6347", // Bright color for the active step
  },
  noteStep: {
    backgroundColor: "#1e90ff", // Highlighted color for steps with notes
  },
};

export default App;
