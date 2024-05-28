import React, { useState, useEffect } from 'react';
import webeval from './webeval';
import { Container, Header, Content, Sidebar, Button, ButtonGroup, Panel } from 'rsuite';
import { FolderFill, ArrowUpLine } from '@rsuite/icons';
import 'rsuite/dist/rsuite.min.css';


const initPythonCode = `
import os
import base64
`
webeval.exeval(initPythonCode, {}, true)

function App() {
  const [currentPath, setCurrentPath] = useState<string>('.');
  const [folders, setFolders] = useState<string[]>([]);
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  useEffect(() => {
    fetchFiles();
  }, [currentPath]);

  const fetchFiles = async () => {
    const response = await webeval.exeval(
      '[f for f in os.listdir(p)]',
      { p: currentPath }
    );

    const updatedFolders = [];
    const updatedFiles = [];

    for (const item of response) {
      const fullPath = `${currentPath}/${item}`;
      const isDirectory = await webeval.exeval(
        'os.path.isdir(p)',
        { p: fullPath }
      );

      if (isDirectory) {
        updatedFolders.push(item);
      } else {
        updatedFiles.push(item);
      }
    }

    setFolders(updatedFolders);
    setFiles(updatedFiles);
  };

  const handleItemClick = async (item: string) => {
    const fullPath = `${currentPath}/${item}`;
    const isDirectory = await webeval.exeval(
      'os.path.isdir(p)',
      { p: fullPath }
    );

    if (isDirectory) {
      setCurrentPath(fullPath);
    } else {
      const response = await webeval.exeval(
        "base64.b64encode(open(f, 'rb').read()).decode('utf-8')",
        { f: fullPath }
      );
      setSelectedFile(`data:image/jpeg;base64,${response}`);
    }
  };

  return (
    <Container>
      <Header>
        <h2>File Browserator</h2>
      </Header>
      <Container>
        <Sidebar>
          <div className="current-path">
            <strong>Current Path:</strong> {currentPath}
          </div>
          <ButtonGroup vertical block>
            {currentPath !== '.' && (
              <Button onClick={() => setCurrentPath(currentPath.split('/').slice(0, -1).join('/') || '.')}>
                <ArrowUpLine /> Parent Directory
              </Button>
            )}
            {folders.map((folder, index) => (
              <Button key={index} onClick={() => handleItemClick(folder)}>
                <FolderFill /> {folder}
              </Button>
            ))}
            {files.map((file, index) => (
              <Button key={index} onClick={() => handleItemClick(file)}>
                 {file}
              </Button>
            ))}
          </ButtonGroup>
        </Sidebar>
        <Content>
          {selectedFile && (
            <Panel header="File Preview">
              <img src={selectedFile} alt="Preview" style={{ maxWidth: '100%' }} />
            </Panel>
          )}
        </Content>
      </Container>
    </Container>
  );
}

export default App;