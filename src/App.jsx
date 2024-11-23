import React, { useState, useEffect, useRef } from "react";
import * as Tone from "tone";
import './App.css';
//import Keyboard from '../Keyboard';
//import Sequencer from '../Sequencer';

const App = () => {
  const [counter, setCounter] = useState(""); // Counter for the UI
  const [currentNote, setCurrentNote] = useState("C3");
  const [sequence, setSequence] = useState(Array(8).fill("")); // 8-step sequencer (empty by default)
  const [sequence2, setSequence2] = useState(Array(8).fill("")); // 8-step sequencer (empty by default)
  const [isRunning, setIsRunning] = useState(false); // State for transport status
  const activeStepRef = useRef(0); // Reference for the current step in the sequencer
  const activeStepRef2 = useRef(0); // Reference for the current step in the sequencer
  const synthRef = useRef(null); // Reference to the synth object
  const transport = Tone.getTransport();
  const [uploadedSample, setUploadedSample] = useState(null); // Stores the uploaded sample
  const samplerRef = useRef(null); // Ref for the Tone.Sampler

  useEffect(() => {
    // Initialize the sampler
    samplerRef.current = new Tone.Sampler().toDestination();

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

  const playNote = (note) => {
    Tone.start(); // Ensure the audio context is running
    synthRef.current.triggerAttackRelease(note, "8n");
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

  // const toggleStep = (index) => {
  //   setSequence((prevSequence) => {
  //     const newSequence = [...prevSequence];
  //     newSequence[index] = newSequence[index] === currentNote ? "" : currentNote; // Toggle note
  //     return newSequence;
  //   });
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
  {/* <label for="file-upload">
    Choose File (eventually)
  </label>
  <input
    id="file-upload"
    type="file"
    accept="audio/*"

    /> */}
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


/*

import React, { useState, useEffect, useRef } from "react";
import * as Tone from "tone";

const App = () => {
  const [counter, setCounter] = useState(""); // Counter for the UI
  const [currentNote, setCurrentNote] = useState("C3");
  const [sequence, setSequence] = useState(Array(8).fill("")); // 8-step sequencer (empty by default)
  const [isRunning, setIsRunning] = useState(false); // State for transport status
  const activeStepRef = useRef(0); // Reference for the current step in the sequencer
  const synthRef = useRef(null); // Reference to the synth object
  const transport = Tone.getTransport();
  const counterRef = useRef(1);

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

  const playNote = (note) => {
    if (!Tone.start()){
      Tone.start(); // Ensure the audio context is running
    }
    synthRef.current.triggerAttackRelease(note, "8n");
  };

  const [audioWarning, setAudioWarning] = useState(false);

const start = async () => {
  if (Tone.getContext.state !== "running") {
    setAudioWarning(true);
    await Tone.start();
    setAudioWarning(false);
  }

  console.log("AudioContext started!");

  setCounter(1);
  //counterRef.current = 1;
  setIsRunning(true);
  //sequenceRef.current.start(0);
  transport.start();
};

return (
  <div>
    {audioWarning && <p style={{ color: "red" }}>AudioContext was suspended. Click Start to activate audio.</p>}
    return (
    <div
      style={{
        textAlign: "center",
        padding: "20px",
        backgroundColor: "#121212",
        color: "#fff",
      }}
    >
      <h1>8-Step Sequencer</h1>
      <p style={{ fontSize: "24px" }}>Current Beat: {counter}</p>
      <p style={{ fontSize: "24px" }}>Current Note: {currentNote}</p>
      <button
        onClick={start}
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
    </div>
  );
};
  </div>
);

  const startSequence = async () => {
    if (Tone.getContext.useState !== "running") {

    }
    Tone.start(); // Ensure AudioContext is started
    setCounter(1);
    activeStepRef.current = 0; // Reset the active step
    setIsRunning(true);

    // Schedule the transport to run the sequencer
    transport.scheduleRepeat((time) => {
      const currentStep = activeStepRef.current;
      const note = sequence[currentStep];

      // Stop any currently playing note
      synthRef.current?.triggerRelease();

      // Play the note if the step contains one
      if (note) {
        synthRef.current.triggerAttackRelease(note, "8n", time);
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
    setSequence(Array(8).fill("")); // Clear all steps in the sequence
  };

  const toggleStep = (index) => {
    setSequence((prevSequence) => {
      const newSequence = [...prevSequence];
      newSequence[index] = newSequence[index] === currentNote ? "" : currentNote; // Toggle note
      return newSequence;
    });
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
      <h1>8-Step Sequencer</h1>
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



/*
import React, { useState, useEffect, useRef } from "react";
import * as Tone from "tone";

const App = () => {
  const [counter, setCounter] = useState(""); // Counter for the UI
  const counterRef = useRef(1); // Mutable counter for precise timing
  const [isRunning, setIsRunning] = useState(false); // State for transport status
  const synthRef = useRef(null); // Reference to the synth object
  const sequenceRef = useRef(null); // Reference to the sequence object
  const [currentNote, setCurrentNote] = useState("C3");

  const transport = Tone.getTransport();

  useEffect(() => {
    // Initialize the Synth with a triangle waveform
    synthRef.current = new Tone.Synth({
    oscillator: {
      type: "triangle",
      },
    }).toDestination();

    // Define an eight-step sequence (C4, D4, E4, F4, G4, A4, B4, C5)
    sequenceRef.current = new Tone.Sequence(
      (time, note) => {
        synthRef.current.triggerAttackRelease(note, "8n", time); // Play the note
      },
      ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"], // Notes in the sequence
      "4n" // Step duration
    );

    // Schedule a repeating function for the counter
    transport.scheduleRepeat((time) => {
      counterRef.current = counterRef.current % 8 + 1; // Loop counter 1-4
      setCounter(counterRef.current); // Update the UI
    }, "4n");

    // Cleanup on component unmount
    return () => {
      transport.stop();
      transport.cancel(); // Clear all scheduled events
      if (synthRef.current) synthRef.current.dispose();
      if (sequenceRef.current) sequenceRef.current.dispose();
    };
  }, []);


  const synth = new Tone.Synth({
    oscillator : {
      type : "triangle"
    } ,
    frequency : 220
    }).toDestination();

  const synth2 = new Tone.Synth({
    oscillator : {
      type : "sawtooth"
    } ,
    frequency : 220
    }).toDestination();

  const notes = ["A2", "C3"];

  const playNote = (note) => {
    Tone.start();
    synth.triggerAttackRelease(note, "4n");
    console.log("Playing " + note);
  };

  const start = () => {
    // Ensure AudioContext is started and reset counter
    Tone.start();
    setCounter(1);
    counterRef.current = 1;
    setIsRunning(true);

    // Start the sequence and the transport
    sequenceRef.current.start(0); // Start at the beginning

    // Start the transport
    transport.start();
  }

  const stop = () => {
    setIsRunning(false);
    // Stop the transport
    transport.stop();
    sequenceRef.current.stop();

    // Clear the counter display
    setCounter("");
  };

  const reset = () => {
    setCounter("");
    console.log(counter);
    counterRef.current = 1;

    // Start the sequence and the transport
    sequenceRef.current.start(0); // Start at the beginning
  };

  return (
    <div style={{ textAlign: "center", padding: "20px", backgroundColor: "#121212", color: "#fff" }}>
      <h1>Transport Counter with Synth</h1>
      <p style={{ fontSize: "24px" }}>Current Beat: {counter}</p>
      <p style={{ fontSize: "24px" }}>Current Note: {currentNote}</p>
      <button
        onClick={start}
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
        onClick={stop}
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
        onClick={reset}
        style={{
          padding: "10px 20px",
          margin: "10px",
          backgroundColor: "#700234",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Reset
      </button>
      <div style={styles.keyboard}>
          {["C2", "D2", "E2", "F2", "G2", "A2", "B2", "C3", "D3", "E3", "F3", "G3", "A3", "B3", "C4"].map((note) => (
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
        </div>  
    </div>
  );
};

const styles = {
  stepSequencer: {
    display: "grid",
    gridTemplateColumns: "repeat(16, 1fr)",
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
  }
};

export default App;

*/





/*
import React, { useState, useEffect, useRef } from "react";
import './App.css'
import * as Tone from 'tone'


function App() {

  let actx = new AudioContext();

  const [currentNote, setCurrentNote] = useState("C3");
  const [counter, setCounter] = useState(1);
  const counterRef = useRef(1); // Mutable counter for precise timing
  
  const transport = Tone.getTransport();

  var synth = new Tone.Synth({
    oscillator : {
      type : "triangle"
    } ,
    frequency : 220
    }).toDestination();

  
  //attach a click listener to a play button
  document.getElementById("clock-start")?.addEventListener("click", async () => {
    await Tone.start();
    console.log("audio is ready");
      });

  const beatUpdate = () => {
    console.log("before " + beatCount);
    setBeatCount(beatCount + 1);
    console.log("after " + beatCount);
    if (beatCount == 4) {
      setBeatCount(1);
    }
  }

  const loopA = new Tone.Loop((time) => {
    synth.triggerAttackRelease("A2", "8n", time);
  }, "4n").start(0);

  const start = () => {
    var time = Tone.Time("1n");

    // Schedule the function to be called repeatedly
    transport.scheduleRepeat(beatUpdate, "4n"); 

    // Start the transport
    transport.start();
  }

  const stop = () => {
    transport.stop();
  }

  

  return (
    <div>
      <h1>Otter Steps</h1>
      <div>
        <button id="clock-start">Start Clock</button>
      </div>
      <div>
        <button onClick={start}>Start</button>
        <button onClick={stop}>Stop</button>
      </div>
      <div>
        <p>Beat Count: {beatCount}</p>
      </div>
    </div>
  );
}

export default App;

  /*
  const [count, setCount] = useState(0);

  // useEffect(
  //   //update p demo
  //   () => {document.getElementById("demo").innerHTML = `You done clicked ${count} times?`;
  //   });


  //create a synth and connect it to the main output (your speakers)
  const synth = new Tone.Synth().toDestination();
  const now = Tone.now();

  const playButton = document.getElementById('playButton');

  const playC = () => {
    synth.triggerAttackRelease("C4", "8n");
  }

  const playE = () => {
    synth.triggerAttackRelease("E4", "8n");
  }

  const playG = () => {
    synth.triggerAttackRelease("G4", "8n");
  }

  const playSequence = () => {
    const synth = new Tone.PolySynth(Tone.Synth).toDestination();
    const now = Tone.now();
    synth.triggerAttack("D4", now);
    synth.triggerAttack("F4", now + 0.5);
    synth.triggerAttack("A4", now + 1);
    synth.triggerAttack("C5", now + 1.5);
    synth.triggerAttack("E5", now + 2);
    synth.triggerRelease(["D4", "F4", "A4", "C5", "E5"], now + 4);
  }

  const playGong = () => {
    const player = new Tone.Player(
      "https://tonejs.github.io/audio/berklee/gong_1.mp3"
    ).toDestination();
    Tone.loaded().then(() => {
      player.start();
  });
  }

  const playChord = () => {
    const sampler = new Tone.Sampler({
      urls: {
        C4: "C4.mp3",
        "D#4": "Ds4.mp3",
        "F#4": "Fs4.mp3",
        A4: "A4.mp3",
      },
      release: 1,
      baseUrl: "https://tonejs.github.io/audio/salamander/",
    }).toDestination();
    
    Tone.loaded().then(() => {
      sampler.triggerAttackRelease(["Eb4", "G4", "Bb4"], 4);
    });
  }

  const playOsc = () => {
    const osc = new Tone.Oscillator().toDestination();
    // start at "C4"
    osc.frequency.value = "C4";
    // ramp to "C2" over 2 seconds
    osc.frequency.rampTo("C2", 2);
    // start the oscillator for 2 seconds
    osc.start().stop("+3");
  }

  let tempo = 60.0;
  const bpmControl = document.querySelector("#bpm");
  
  bpmControl.addEventListener(
    "input",
    (ev) => {
      tempo = parseInt(ev.target.value, 10);
    },
    false,
  );

  const lookahead = 25.0; // How frequently to call scheduling function (in milliseconds)
  const scheduleAheadTime = 0.1; // How far ahead to schedule audio (sec)

  let currentNote = 0;
  let nextNoteTime = 0.0; // when the next note is due.

function nextNote() {
  const secondsPerBeat = 60.0 / tempo;

  nextNoteTime += secondsPerBeat; // Add beat length to last beat time

  // Advance the beat number, wrap to zero when reaching 4
  currentNote = (currentNote + 1) % 4;
}

const notesInQueue = [];

function scheduleNote(beatNumber, time) {
  // Push the note on the queue, even if we're not playing.
  notesInQueue.push({ note: beatNumber, time });

  if (pads[0].querySelectorAll("input")[beatNumber].checked) {
    playOsc(time);
  }
  if (pads[1].querySelectorAll("input")[beatNumber].checked) {
    playOsc(time);
  }
  if (pads[2].querySelectorAll("input")[beatNumber].checked) {
    playOsc(time);
  }
  if (pads[3].querySelectorAll("input")[beatNumber].checked) {
    playOsc(time);
  }
}

let timerID;
function scheduler() {
  // While there are notes that will need to play before the next interval,
  // schedule them and advance the pointer.
  while (nextNoteTime < audioCtx.currentTime + scheduleAheadTime) {
    scheduleNote(currentNote, nextNoteTime);
    nextNote();
  }
  timerID = setTimeout(scheduler, lookahead);
}

let lastNoteDrawn = 3;
function draw() {
  let drawNote = lastNoteDrawn;
  const currentTime = audioCtx.currentTime;

  while (notesInQueue.length && notesInQueue[0].time < currentTime) {
    drawNote = notesInQueue[0].note;
    notesInQueue.shift(); // Remove note from queue
  }

  // We only need to draw if the note has moved.
  if (lastNoteDrawn !== drawNote) {
    pads.forEach((pad) => {
      pad.children[lastNoteDrawn * 2].style.borderColor = "var(--black)";
      pad.children[drawNote * 2].style.borderColor = "var(--yellow)";
    });

    lastNoteDrawn = drawNote;
  }
  // Set up to draw again
  requestAnimationFrame(draw);
}

// When the sample has loaded, allow play
//const loadingEl = document.querySelector(".loading");
const playBtn = document.querySelector("#playBtn");
let isPlaying = false;
setupSample().then((sample) => {
  loadingEl.style.display = "none";

  //dtmf = sample; // to be used in our playSample function

  playBtnn.addEventListener("click", (ev) => {
    isPlaying = !isPlaying;

    if (isPlaying) {
      // Start playing

      // Check if context is in suspended state (autoplay policy)
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }

      currentNote = 0;
      nextNoteTime = audioCtx.currentTime;
      scheduler(); // kick off scheduling
      requestAnimationFrame(draw); // start the drawing loop.
      ev.target.dataset.playing = "true";
    } else {
      clearTimeout(timerID);
      ev.target.dataset.playing = "false";
    }
  });
});









  //MDN's synth
  
//   const audioCtx = new AudioContext();

//   const bufferSize = audioCtx.sampleRate * 16;
// // Create an empty buffer
// const noiseBuffer = new AudioBuffer({
//   length: bufferSize,
//   sampleRate: audioCtx.sampleRate,
// });




// //MDN's file sample upload
// async function getFile(audioContext, filepath) {
//   const response = await fetch(filepath);
//   const arrayBuffer = await response.arrayBuffer();
//   const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
//   return audioBuffer;
// }

// async function setupSample() {
//   const filePath = "dtmf.mp3";
//   const sample = await getFile(audioCtx, filePath);
//   return sample;
// }

// setupSample().then((sample) => {
//   // sample is our buffered file
//   // …
// });



// let playbackRate = 1;
// const rateControl = document.querySelector("#rate");
// rateControl.addEventListener(
//   "input",
//   (ev) => {
//     playbackRate = parseInt(ev.target.value, 10);
//   },
//   false,
// );

// function playSample(audioContext, audioBuffer, time) {
//   const sampleSource = new AudioBufferSourceNode(audioCtx, {
//     buffer: audioBuffer,
//     playbackRate,
//   });
//   sampleSource.connect(audioContext.destination);
//   sampleSource.start(time);
//   return sampleSource;
// }



  return (
    <div>
      <p id="demo"></p>
      <p>You clicked {count} times</p>
      <button onClick={
        () => setCount(count + 1)
      }>Click me</button>

      <button onClick={
        ()=> setCount(0)
      }>Reset to zero</button>
      <div id="synthing">
        <button id="playC" onClick={playC}>C</button>
        <button id="playC" onClick={playE}>E</button>
        <button id="playC" onClick={playG}>G</button>
      </div>
      <div id="sequence">
        <button id="playSequence" onClick={playSequence}>Sequence</button>
      </div>
      <div id="sample">
        <button id="playGong" onClick={playGong}>Gong</button>
      </div>
      <div id="chord">
        <button id="playChord" onClick={playChord}>Chord</button>
      </div>
      <div id="osc">
        <button id="playOsc" onClick={playOsc}>Oscillator</button>
      </div>
      <div>
      <label for="attack">Attack</label>
        <input
          name="attack"
          id="attack"
          type="range"
          min="0"
          max="1"
          value="0.2"
          step="0.1" />

        <label for="release">Release</label>
        <input
          name="release"
          id="release"
          type="range"
          min="0"
          max="1"
          value="0.5"
          step="0.1" />
      </div>
      <div>
      <label for="rate">Rate</label>
        <input
          name="rate"
          id="rate"
          type="range"
          min="0.1"
          max="2"
          value="1"
          step="0.1" />
      </div>
    </div>
    
    
  );
}

export default App;

*/