// @ts-nocheck
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import { CustomProvider, Container, Header, Content } from 'rsuite';
import Editor from '@monaco-editor/react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

function App() {
  const [jsonCode, setJsonCode] = useState('{\n  "key": "value"\n}');

  const handleEditorChange = (value) => {
    setJsonCode(value);
  };

  const prettifyJson = (json) => {
    try {
      const parsedJson = JSON.parse(json);
      return JSON.stringify(parsedJson, null, 2);
    } catch (error) {
      return 'Invalid JSON';
    }
  };

  return (
    <CustomProvider theme="dark">
      <Container className="app-container">
        <Header>
          <h2 className="app-header">JSON Editor</h2>
        </Header>
        <Content>
          <PanelGroup direction="horizontal">
            <Panel>
              <Editor
                height="400px"
                defaultLanguage="json"
                value={jsonCode}
                theme="vs-dark"
                onChange={handleEditorChange}
                options={{
                  minimap: { enabled: false },
                }}
              />
            </Panel>
            <PanelResizeHandle />
            <Panel>
              <Editor
                height="400px"
                defaultLanguage="json"
                value={prettifyJson(jsonCode)}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                }}
              />
            </Panel>
          </PanelGroup>
        </Content>
      </Container>
    </CustomProvider>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
