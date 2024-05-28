import React, { useState, useEffect } from 'react';
import webeval from './webeval';
import './App.css';

function App() {
  const [currentPath, setCurrentPath] = useState<string>('.');
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  useEffect(() => {
    fetchFiles();
  }, [currentPath]);

  const fetchFiles = async () => {
    const response = await webeval.exeval(
      '[f for f in __import__("os").listdir(p)]',
      { p: currentPath }
    );
    setFiles(response);
  };

  const handleFileClick = async (file: string) => {
    const fullPath = `${currentPath}/${file}`;
    const isDirectory = await webeval.exeval(
      '__import__("os").path.isdir(p)',
      { p: fullPath }
    );

    if (isDirectory) {
      setCurrentPath(fullPath);
    } else {
      const response = await webeval.exeval(
        "__import__('base64').b64encode(open(f, 'rb').read()).decode('utf-8')",
        { f: fullPath }
      );
      setSelectedFile(`data:image/jpeg;base64,${response}`);
    }
  };

  const handleGoBack = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '.';
    setCurrentPath(parentPath);
  };

  return (
    <div className="App">
      <h1>File Browserator</h1>
      <div className="current-path">
        Current Path: {currentPath}
        {currentPath !== '.' && (
          <button onClick={handleGoBack}>Go Back</button>
        )}
      </div>
      <div className="file-list">
        {files.map((file, index) => (
          <div key={index} className="file-item" onClick={() => handleFileClick(file)}>
            {file}
          </div>
        ))}
      </div>
      {selectedFile && (
        <div className="image-preview">
          <img src={selectedFile} alt="Preview" />
        </div>
      )}
    </div>
  );
}

export default App;