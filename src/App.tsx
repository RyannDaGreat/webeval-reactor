import React, { useState, useEffect } from 'react';
import webeval from './webeval';
import { Container, Header, Content, Sidebar, Button, ButtonGroup, Panel } from 'rsuite';
import { FolderFill, ArrowUpLine } from '@rsuite/icons';
import Editor from '@monaco-editor/react';
import { CustomProvider } from 'rsuite';


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
  const [fileContent, setFileContent] = useState<string | null>(null);

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
      if (isImageFile(item)) {
        const response = await webeval.exeval(
          "base64.b64encode(open(f, 'rb').read()).decode('utf-8')",
          { f: fullPath }
        );
        setSelectedFile(fullPath);
        setFileContent(response);
      } else {
        const response = await webeval.exeval(
          "open(f, 'r').read()",
          { f: fullPath }
        );
        setSelectedFile(fullPath);
        setFileContent(response);
      }
    }
  };

  const handleGoUp = async () => {
    const parentPath = await webeval.exeval(
      'os.path.abspath(os.path.join(p, ".."))',
      { p: currentPath }
    );
    setCurrentPath(parentPath);
  };

  const getEditorLanguage = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    return extension;
  };

  const isImageFile = (fileName: string) => {
    const imageExtensions = [
      'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico', 'tiff', 'tif',
      'heic', 'heif', 'avif', 'jfif', 'pjpeg', 'pjp', 'apng', 'jpe',
    ];
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    return imageExtensions.includes(extension);
  };

  return (
    <CustomProvider theme="dark">
      <Container className="app-container">
        <Header>
          <h2 className="app-header">File Browserator</h2>
        </Header>
        <Container className="app-content">
          <Sidebar className="app-sidebar" width={250} collapsible>
            <div className="current-path">
              <strong>Current Path:</strong>
              <br />
              <span className="path-text">{currentPath}</span>
            </div>
            <ButtonGroup vertical block>
              <Button onClick={handleGoUp}>
                <ArrowUpLine /> ..
              </Button>
              {entries.map((entry, index) => (
                <Button key={index} onClick={() => handleItemClick(entry.name, entry.isDirectory)} block>
                  {entry.isDirectory ? <FolderFill /> : null} {entry.name}
                </Button>
              ))}
            </ButtonGroup>
          </Sidebar>
          <Content className="app-main-content">
            {selectedFile && (
              <Panel header={selectedFile} bordered>
                {isImageFile(selectedFile) ? (
                  <img src={`data:image/jpeg;base64,${fileContent}`} alt="Preview" style={{ maxWidth: '100%' }} />
                ) : (
                  <Editor
                    height="400px"
                    defaultLanguage={getEditorLanguage(selectedFile)}
                    value={fileContent || ''}
                    theme="vs-dark"
                    options={{
                      readOnly: true,
                      minimap: {
                        enabled: true,
                      },
                    }}
                  />
                )}
              </Panel>
            )}
          </Content>
        </Container>
      </Container>
    </CustomProvider>
  );
}

export default App;