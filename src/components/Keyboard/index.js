import React from "react";
import "./Keyboard.css";

const notes = ["C2", "D2", "E2", "F2", "G2", "A2", "B2", "C3", "D3", "E3", "F3", "G3", "A3", "B3", "C4"];

const Keyboard = ({ currentNote, setCurrentNote }) => {
  const playNote = (note) => {
    const synth = new Tone.Synth().toDestination();
    synth.triggerAttackRelease(note, "8n");
    setCurrentNote(note);
  };

  return (
    <div className="keyboard">
      {notes.map((note) => (
        <button
          key={note}
          onClick={() => playNote(note)}
          className={`key ${currentNote === note ? "active" : ""}`}
        >
          {note}
        </button>
      ))}
    </div>
  );
};

export default Keyboard;

import React from "react";

const Keyboard = ({ currentNote, setCurrentNote }) => {
  const notes = ["C3", "D3", "E3", "F3", "G3", "A3", "B3"];

  return (
    <div className="keyboard">
      {notes.map((note) => (
        <button
          key={note}
          className={`key ${currentNote === note ? "active" : ""}`}
          onClick={() => setCurrentNote(note)} // Updates the current note
        >
          {note}
        </button>
      ))}
    </div>
  );
};

export default Keyboard;
