import React from 'react';

export default function Browserish() {
  const w = window.innerWidth;
  return <div className="browserish">width:{w > 0 ? 'positive' : 'zero'}</div>;
}
