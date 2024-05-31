import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import AppBrowser from './App';
import AppCode from './CodeApp';
import reportWebVitals from './reportWebVitals';
import { Tabs, Placeholder } from 'rsuite';


const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <Tabs defaultActiveKey="1">
      <Tabs.Tab eventKey="1" title="OLAT Explorer">
        <AppCode />
      </Tabs.Tab>
      <Tabs.Tab eventKey="2" title="File Browser">
        <AppBrowser />
      </Tabs.Tab>
    </Tabs>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
