import React, { useState } from 'react';
import cfmToErb from './lib';

function Converter() {
  const [mode, setMode] = useState("erb");
  const [erb, setErb] = useState("");
  const [cfm, setCfm] = useState("");

  const bt = (t) => t.replaceAll("		", "  ");

  const handleChangeTaCfm = (e) => {
    const text = e.target.value;
    setCfm(bt(text));
    setErb(cfmToErb(bt(text), mode));
  }

  const handleChangeSelect = (e) => {
    setMode(e.target.value);
    setErb(cfmToErb(bt(cfm), e.target.value));
  }

  return (
    <div className="Converter">
      <div className="select">
        <select value={mode} onChange={handleChangeSelect}>
          <option value="erb">Erb</option>
          <option value="rb">Rb</option>
        </select>
      </div>
      <div className="box">
        <div className="cfm">
          <textarea className="ta_cfm" onChange={handleChangeTaCfm} value={cfm} placeholder="cfm...">
          </textarea>
        </div>
        <div className="erb">
          <textarea className="ta_erb" defaultValue={erb} placeholder={`${mode}...`}>
          </textarea>
        </div>
      </div>
    </div>
  )
}

export default Converter;
