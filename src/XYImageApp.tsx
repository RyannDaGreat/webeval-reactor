// @ts-nocheck

import React, { useState } from 'react';

const getClickCoordinatesXY=function(e){
  //Returns normalized coordinates between 0 and 1 in image space
  const rect = e.currentTarget.getBoundingClientRect();
  const scaleX = e.currentTarget.offsetWidth / rect.width;
  const scaleY = e.currentTarget.offsetHeight / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;
  return [x / e.currentTarget.offsetWidth, y / e.currentTarget.offsetHeight];
}

function XYImage({ children, handleClick }) {
  const [coordinates, setCoordinates] = useState({ x: 0, y: 0 });

  const onClick = (e) => {
    const [x,y]=getClickCoordinatesXY(e);
    handleClick(x,y);
    setCoordinates({x,y});
  };

  return (
    <div onClick={onClick} style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }}>
      {children}
      <p>Coordinates: ({coordinates.x.toFixed(2)}, {coordinates.y.toFixed(2)})</p>
    </div>
  );
}

function App() {
  const handleImageClick = (x, y) => {
    console.log(`Clicked at normalized x: ${x.toFixed(2)}, y: ${y.toFixed(2)}`);
  };

  return (
    <div>
      <h1>Click on the Images</h1>
      <XYImage handleClick={handleImageClick}>
        <img src="https://upload.wikimedia.org/wikipedia/en/7/7d/Lenna_%28test_image%29.png" alt="Lenna" style={{ width: '100%' }} />
      </XYImage>
      <XYImage handleClick={handleImageClick}>
        <div style={{ width: '300px', height: '300px', background: 'url(https://upload.wikimedia.org/wikipedia/en/7/7d/Lenna_%28test_image%29.png) center/cover' }}></div>
      </XYImage>
    </div>
  );
}

export default App;
