import React, { useState, useEffect } from 'react';
import webeval from './webeval';
import { Container, Header, Content, Sidebar, Button, ButtonGroup, Panel } from 'rsuite';
import { FolderFill, ArrowUpLine } from '@rsuite/icons';
import 'rsuite/dist/rsuite.min.css';

const initPythonCode = `
import os
import base64
import rp

def json_scandir(root):
    output = [
        {"name": entry.name, "isDirectory": entry.is_dir()}
        for entry in sorted(
            os.scandir(root),
            key=lambda entry: (not entry.is_dir(), entry.path),
        )
    ]
    return output
`;
webeval.exeval(initPythonCode, {}, true);

function App() {
  const [currentPath, setCurrentPath] = useState<string>('.');
  const [entries, setEntries] = useState<{ name: string; isDirectory: boolean }[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  useEffect(() => {
    fetchEntries();
  }, [currentPath]);

  const fetchEntries = async () => {
    const response = await webeval.exeval(
      'json_scandir(p)',
      { p: currentPath }
    );
    setEntries(response);
  };

  const handleItemClick = async (item: string, isDirectory: boolean) => {
    const fullPath = `${currentPath}/${item}`;
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

  const handleGoUp = async () => {
    // const parentPath = currentPath.split('/').slice(0, -1).join('/') || '.';
    let parentPath = currentPath + '/..'
    parentPath = await webeval.exeval('os.path.relpath(x)', { x: parentPath })
    setCurrentPath(parentPath);
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
            <Button onClick={handleGoUp}>
              <ArrowUpLine /> Parent Directory
            </Button>
            {entries.map((entry, index) => (
              <Button key={index} onClick={() => handleItemClick(entry.name, entry.isDirectory)}>
                {entry.isDirectory ? <FolderFill /> : null} {entry.name}
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