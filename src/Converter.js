import React, { useState } from 'react';
import cfmToErb from './cfmToErb';
import cfmToRb from './cfmToRb';
import cfquery from './cfquery';

function Converter() {
  const [mode, setMode] = useState("erb");
  const [cfm, setCfm] = useState("");

  const bt = (t) => t.replaceAll("	", "  ");

  const handleChangeTaCfm = (e) => {
    const text = e.target.value;
    setCfm(text);
  }

  const handleChangeSelect = (e) => {
    setMode(e.target.value);
  }

  function convert_text(text) {
    if(mode === "erb")
      return bt(cfmToErb(text));
    if(mode === "rb")
      return bt(cfmToRb(text));
    if(mode === "cfquery")
      return bt(cfquery(text));
  }

  return (
    <div className="Converter">
      <div className="select">
        <select value={mode} onChange={handleChangeSelect}>
          <option value="erb">Erb</option>
          <option value="rb">Rb</option>
          <option value="cfquery">cfquery</option>
        </select>
      </div>
      <div className="box">
        <div className="cfm">
          <textarea className="ta_cfm" onChange={handleChangeTaCfm} value={cfm} placeholder="cfm...">
          </textarea>
        </div>
        <div className="erb">
          <textarea className="ta_erb" defaultValue={convert_text(cfm)} placeholder={`${mode}...`}>
          </textarea>
        </div>
      </div>
    </div>
  )
}

export default Converter;
