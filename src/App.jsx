import React, { useState, useEffect, useRef } from "react";
import * as Tone from "tone";
import './App.css';

const App = () => {
  const [counter, setCounter] = useState(""); // Counter for the UI
  const [currentNote, setCurrentNote] = useState("C3");
  const [sequence, setSequence] = useState(Array(8).fill("")); // 8-step sequencer
  const [isRunning, setIsRunning] = useState(false); // Transport state
  const [uploadedSampleName, setUploadedSampleName] = useState(null); // Uploaded sample name
  const [isRecording, setIsRecording] = useState(false); // Recording state
  const [tempo, setTempo] = useState(120); // Default tempo is 120 BPM

  const activeStepRef = useRef(0); // Current step in sequencer
  const samplerRef = useRef(null); // Reference for the Tone.Sampler
  const mediaRecorderRef = useRef(null); // Reference for MediaRecorder
  const recordedChunksRef = useRef([]); // To store recorded audio chunks
  const transport = Tone.getTransport();

  useEffect(() => {
    transport.context.transport.bpm.value = tempo;
    //Tone.Transport.bpm.value = tempo; // Update the transport BPM whenever tempo changes
    console.log(`Tempo updated to ${tempo} BPM`);
  }, [tempo]);

  useEffect(() => {
    // Initialize Tone.Sampler
    samplerRef.current = new Tone.Sampler().toDestination();

    // Cleanup on unmount
    return () => {
      transport.stop();
      transport.cancel();
      samplerRef.current?.dispose();
    };
  }, []);

  const increaseTempo = () => setTempo((prev) => Math.min(prev + 1, 300)); // Max 300 BPM
  const decreaseTempo = () => setTempo((prev) => Math.max(prev - 1, 30));  // Min 30 BPM

  const playNote = async (note) => {
    if (Tone.Context.state !== "running") {
      await Tone.start();
    }

    // Stop any lingering sample sound
    samplerRef.current?.releaseAll();

    // Trigger sample at the desired pitch
    samplerRef.current.triggerAttack(note, Tone.now());
  };

  const startSequence = async () => {
    
    if (Tone.getContext.state !== "running") {
      await Tone.start();
    }

    setCounter(1);
    activeStepRef.current = 0; // Reset active step
    setIsRunning(true);

    //this block was added later for styling the active seq step
    const currentStep = activeStepRef.current;
    activeStepRef.current = (currentStep + 1) % sequence.length;
    setCounter(activeStepRef.current + 1); // Update UI for beat count

    transport.scheduleRepeat((time) => {
      const currentStep = activeStepRef.current;
      const note = sequence[currentStep];

      // Stop lingering audio and play note if present
      samplerRef.current?.releaseAll();
      if (note) {
        samplerRef.current.triggerAttack(note, time);
      }

      activeStepRef.current = (currentStep + 1) % sequence.length;
      setCounter(activeStepRef.current + 1);
    }, "8n");

    transport.start();
  };

  const stopSequence = () => {
    setIsRunning(false);
    transport.stop();
    transport.cancel();
    samplerRef.current?.releaseAll();

    setCounter("");
    activeStepRef.current = 0;
  };

  const clearSequence = () => {
    setSequence(Array(8).fill(""));
  };

  const toggleStep = (index) => {
    const newSequence = [...sequence];
    newSequence[index] = sequence[index] === "" ? currentNote : "";
    setSequence(newSequence);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = async (e) => {
        const audioData = e.target.result;

        try {
          const buffer = await Tone.getContext.decodeAudioData(audioData);

          // Assign buffer to the sampler
          samplerRef.current.add("C3", buffer);
          setUploadedSampleName(file.name);
          console.log("Sample loaded successfully!");
        } catch (error) {
          console.error("Error loading audio file:", error);
        }
      };

      reader.readAsArrayBuffer(file);
    }
  };

  const startRecording = async () => {
    if (isRecording) return; // Prevent double-recording
    try {
      setIsRecording(true);
  
      // Request user media
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
  
      recordedChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
  
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(recordedChunksRef.current, { type: "audio/wav" });
        const arrayBuffer = await audioBlob.arrayBuffer();
  
        try {
          const buffer = await Tone.getContext().decodeAudioData(arrayBuffer);
  
          // Assign buffer to the sampler
          samplerRef.current.add("C3", buffer);
          setUploadedSampleName("Recorded Sample");
          console.log("Sample recorded and loaded successfully!");
        } catch (error) {
          console.error("Error processing recorded audio:", error);
        }
      };
  
      mediaRecorderRef.current.start();
      setTimeout(stopRecording, 10000); // Automatically stop recording after 10 seconds
    } catch (error) {
      console.error("Error accessing microphone:", error.message);
      alert("Microphone access is required to record. Please enable permissions and reload the page.");
      setIsRecording(false);
    }
  };
  

  const stopRecording = () => {
    if (!isRecording || !mediaRecorderRef.current) return;
    setIsRecording(false);
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
  };

  const clearSamples = () => {
    if (samplerRef.current) {
      samplerRef.current.releaseAll(); // Stop any lingering notes
      samplerRef.current = new Tone.Sampler().toDestination(); // Reinitialize the sampler
      setUploadedSampleName(null); // Reset the uploaded sample name
      console.log("All samples cleared.");
    } else {
      console.warn("Sampler is not initialized.");
    }
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
      <div>
      <div style={{ marginTop: "20px", textAlign: "center" }}>
  <h2>Tempo</h2>
  <div style={{ display: "inline-flex", alignItems: "center" }}>
    <button
      onClick={decreaseTempo}
      style={{
        padding: "10px",
        margin: "5px",
        backgroundColor: "#f44336",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
      }}
    >
      -
    </button>
    <p
      style={{
        fontSize: "24px",
        margin: "0 15px",
        color: "#fff",
        minWidth: "60px",
        textAlign: "center",
      }}
    >
      {tempo} BPM
    </p>
    <button
      onClick={increaseTempo}
      style={{
        padding: "10px",
        margin: "5px",
        backgroundColor: "#4caf50",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
      }}
    >
      +
    </button>
  </div>
</div>

        <h2>Upload or Record a Sample</h2>
        <input
          id="file-upload"
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          style={{ marginBottom: "10px" }}
        />
        <button
          onClick={startRecording}
          style={{
            padding: "10px 20px",
            margin: "10px",
            backgroundColor: "#4caf50",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
          disabled={isRecording}
        >
          Start Recording
        </button>
        <button
          onClick={stopRecording}
          style={{
            padding: "10px 20px",
            margin: "10px",
            backgroundColor: "#f44336",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
          disabled={!isRecording}
        >
          Stop Recording
        </button>
        <button
    onClick={clearSamples}
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
    Clear Samples
  </button>
        <p>{uploadedSampleName ? `Loaded: ${uploadedSampleName}` : "No sample loaded"}</p>
      </div>

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
    transition: "border-color 0.2s", // Smooth transition for the border color
  },
  activeStep: {
    border: "2px solid yellow", // Bright yellow border for the active step
    boxShadow: "0 0 10px yellow", // Optional glow effect
  },
  noteStep: {
    backgroundColor: "#1e90ff", // Highlighted color for steps with notes
  },
};

export default App;

/* Sampler - works!

import React, { useState, useEffect, useRef } from "react";
import * as Tone from "tone";
import './App.css';

const App = () => {
  const [counter, setCounter] = useState(""); // Counter for the UI
  const [currentNote, setCurrentNote] = useState("C3");
  const [sequence, setSequence] = useState(Array(8).fill("")); // 8-step sequencer
  const [isRunning, setIsRunning] = useState(false); // Transport state
  const [uploadedSampleName, setUploadedSampleName] = useState(null); // Uploaded sample name

  const activeStepRef = useRef(0); // Current step in sequencer
  const samplerRef = useRef(null); // Reference for the Tone.Sampler
  const transport = Tone.getTransport();

  useEffect(() => {
    // Initialize Tone.Sampler
    samplerRef.current = new Tone.Sampler().toDestination();

    // Cleanup on unmount
    return () => {
      transport.stop();
      transport.cancel();
      samplerRef.current?.dispose();
    };
  }, []);

  const playNote = async (note) => {
    if (Tone.context.state !== "running") {
      await Tone.start();
    }

    // Stop any lingering sample sound
    samplerRef.current?.releaseAll();

    // Trigger sample at the desired pitch
    samplerRef.current.triggerAttack(note, Tone.now());
  };

  const startSequence = async () => {
    if (Tone.context.state !== "running") {
      await Tone.start();
    }

    setCounter(1);
    activeStepRef.current = 0; // Reset active step
    setIsRunning(true);

    transport.scheduleRepeat((time) => {
      const currentStep = activeStepRef.current;
      const note = sequence[currentStep];

      // Stop lingering audio and play note if present
      samplerRef.current?.releaseAll();
      if (note) {
        samplerRef.current.triggerAttack(note, time);
      }

      activeStepRef.current = (currentStep + 1) % sequence.length;
      setCounter(activeStepRef.current + 1);
    }, "8n");

    transport.start();
  };

  const stopSequence = () => {
    setIsRunning(false);
    transport.stop();
    transport.cancel();
    samplerRef.current?.releaseAll();

    setCounter("");
    activeStepRef.current = 0;
  };

  const clearSequence = () => {
    setSequence(Array(8).fill(""));
  };

  const toggleStep = (index) => {
    const newSequence = [...sequence];
    newSequence[index] = sequence[index] === "" ? currentNote : "";
    setSequence(newSequence);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = async (e) => {
        const audioData = e.target.result;

        try {
          const buffer = await Tone.context.decodeAudioData(audioData);

          // Assign buffer to the sampler
          samplerRef.current.add("C3", buffer);
          setUploadedSampleName(file.name);
          console.log("Sample loaded successfully!");
        } catch (error) {
          console.error("Error loading audio file:", error);
        }
      };

      reader.readAsArrayBuffer(file);
    }
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
      <div>
        <h2>Upload an Audio File</h2>
        <input
          id="file-upload"
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          style={{ marginBottom: "10px" }}
        />
        <p>{uploadedSampleName ? `Loaded: ${uploadedSampleName}` : "No file selected"}</p>
      </div>

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
    backgroundColor: "#ff6347",
  },
  noteStep: {
    backgroundColor: "#1e90ff",
  },
};

export default App;

*/




/* Synth - modified for timing issues

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

*/




/* Synth - Was working

import React, { useState, useEffect, useRef } from "react";
import * as Tone from "tone";
import './App.css';
//import Keyboard from '../Keyboard';
//import Sequencer from '../Sequencer';

const App = () => {

  //Sequencer and primary App elements
  const [counter, setCounter] = useState(""); // Counter for the UI
  const [currentNote, setCurrentNote] = useState("C3");
  const [sequence, setSequence] = useState(Array(8).fill("")); // 8-step sequencer (empty by default)
  const [sequence2, setSequence2] = useState(Array(8).fill("")); // 8-step sequencer (empty by default)
  const [isRunning, setIsRunning] = useState(false); // State for transport status
  const activeStepRef = useRef(0); // Reference for the current step in the sequencer
  const activeStepRef2 = useRef(0); // Reference for the current step in the sequencer
  
  const transport = Tone.getTransport();

  //synth elements
  const synthRef = useRef(null); // Reference to the synth object

  //sampler elements
  const [uploadedSample, setUploadedSample] = useState(null); // Stores the uploaded sample
  const samplerRef = useRef(null); // Ref for the Tone.Sampler

  useEffect(() => {
    // Initialize the sampler
    //samplerRef.current = new Tone.Sampler().toDestination();

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
      if (samplerRef.current) {
        samplerRef.current.dispose(); // Cleanup sampler on unmount
      }
    };
  }, []);

  const playNote = async (note) => {

    if (Tone.BaseContext.state !== "running") {
    console.log("Resuming AudioContext...");
    await Tone.start();
    console.log("AudioContext started!");
    }

    //Tone.start(); // Ensure the audio context is running
    synthRef.current.triggerAttackRelease(note, "8n", Tone.now());
    //samplerRef.current.triggerAttackRelease(note, "8n");
  };

  const start = async () => {
    // Ensure AudioContext is resumed
    await Tone.start(); 
    console.log("AudioContext started!");
  
    // Reset counter and sequence
    setCounter(1);
    //counterRef.current = 1;
    setIsRunning(true);
  
    // Start the sequence and the transport
    //sequenceRef.current.start(0); // Start at the beginning
    transport.start();
  };

  const startSequence = () => {
    Tone.start(); // Ensure AudioContext is started
    setCounter(1);
    activeStepRef.current = 0; // Reset the active step
    setIsRunning(true);

    // Schedule the transport to run the sequencer
    transport.scheduleRepeat((time) => {
      const currentStep = activeStepRef.current;
      const note = sequence[currentStep];
      const note2 = sequence2[currentStep];

      // Stop any currently playing note
      synthRef.current?.triggerRelease();

      samplerRef.current?.triggerRelease();

      // Play the note if the step contains one
      if (note) {
        synthRef.current.triggerAttackRelease(note, "8n", time);
      }

      if (note2) {
        //play sampler
      }

      // Update the active step and counter
      activeStepRef.current = (currentStep + 1) % sequence.length;
      setCounter(activeStepRef.current + 1); // Update UI for beat count
    }, "8n"); // Steps align with eighth notes

    transport.start();
  };

  const stopSequence = () => {
    setIsRunning(false);

    // Stop transport and clear sequence playback
    transport.stop();
    transport.cancel();
    synthRef.current?.triggerRelease();

    // Reset UI
    setCounter("");
    activeStepRef.current = 0;
  };

  const clearSequence = () => {
    setSequence(Array(8).fill("")); 
    setSequence2(Array(8).fill("")); 
  };

  // const handleFileUpload = (event) => {
  //   const file = event.target.files[0];
  //   if (file) {
  //     const reader = new FileReader();
  
  //     reader.onload = async (e) => {
  //       const audioData = e.target.result;
  //       try {
  //         // Create a Tone.AudioBuffer from the audio data
  //         const buffer = new Tone.AudioBuffer(audioData);
  
  //         // Assign the buffer to the sampler
  //         samplerRef.current.add("C3", buffer);
  //         setUploadedSample(file.name);
  //         console.log("Sample loaded successfully!");
  //       } catch (error) {
  //         console.error("Error loading audio file:", error);
  //       }
  //     };
  
    //   reader.readAsArrayBuffer(file); // Read the file as an ArrayBuffer
    // }
  // };
  

  // const playUploadedSample = () => {
  //   if (samplerRef.current) {
  //     samplerRef.current.triggerAttackRelease("C3", "4n"); // Play the loaded sample
  //   }
  // };

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
      <div>
  <h2>Upload an Audio File</h2>

  <p id="uploaded-file-name" >
    No file selected
  </p>
</div>

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
              playNote(note); // Play immediately
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

*/