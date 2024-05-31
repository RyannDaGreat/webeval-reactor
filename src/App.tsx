import React, { useState, useEffect } from 'react';
import { CustomProvider, Container, Header, Content, Button, ButtonGroup } from 'rsuite';
import { FolderFill, ArrowUpLine } from '@rsuite/icons';
import Editor from '@monaco-editor/react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import webeval from './rp';
import { InputNumber, Notification, InlineEdit, Highlight, Input, TagInput } from 'rsuite';


const initPythonCode = `
import os
import base64
import rp


def json_scandir(root):
    if not rp.folder_exists(root):
        return []
    output = [
        {"name": entry.name, "isDirectory": entry.is_dir()}
        for entry in sorted(
            os.scandir(root),
            key=lambda entry: (not entry.is_dir(), entry.path),
        )
    ]
    return output

if 'load_image_bytes' not in dir():
    def load_image_bytes(path):
        name = rp.get_file_name(path)
        image = rp.load_image(path)
        # image = rp.rotate_image(image, 45)
        image = rp.resize_image_to_fit(image, 256, 256)
        image = rp.labeled_image(image, name)
        image_bytes = rp.encode_image_to_bytes(image)
        return image_bytes

`;
webeval.exeval(initPythonCode, {}, true);


function Image({ path, ...imgProps }: { path: string;[key: string]: any }) {
  const url = webeval.buildQueryUrl(
    '/webeval/web/bytes/webeval_image.png',
    {
      code: `load_image_bytes(${JSON.stringify(path)})`,
      content_type: 'image/png',
    }
  );

  return <img src={url} {...imgProps} loading="lazy" />;
}


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
  const goToInputPath = () => {
    let output = prompt("Enter the new Path");
    if (output === null || output === undefined) {
      // Exit without doing anything
      return;
    }
    setCurrentPath(output);
  };
  

  const isImageFile = (fileName: string) => {
    const imageExtensions = [
      'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico', 'tiff', 'tif',
      'heic', 'heif', 'avif', 'jfif', 'pjpeg', 'pjp', 'apng', 'jpe',
    ];
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    return imageExtensions.includes(extension);
  };


  return (<CustomProvider theme="dark">
    <Container className="app-container">
      {/* <Header>
        <h2 className="app-header">File Browserator</h2>
      </Header> */}
      <Content>
        <PanelGroup direction="horizontal" autoSaveId="persistence">
          <Panel>
          <div 
      className="current-path" 
      onClick={goToInputPath} 
      style={{ cursor: 'pointer' }}
    >
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
          </Panel>
          <PanelResizeHandle />
          <Panel >
            {selectedFile && (
              <>
                <h3>{selectedFile}</h3>
                {isImageFile(selectedFile) ? (
                  // <img src={`data:image/jpeg;base64,${fileContent}`} alt="Preview" style={{ maxWidth: '100%' }} />
                  <Image path={selectedFile} style={{ maxWidth: '100%' }} />

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
              </>
            )}
          </Panel>
        </PanelGroup>
      </Content>
    </Container>
  </CustomProvider>
  );
}

export default App;