import React, { useState, useEffect } from 'react';
import webeval from './webeval';
import './App.css';

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
		<div className="App">
			<h1>File Browserator</h1>
			<div className="current-path">
				Current Path: {currentPath}
			</div>
			<div className="folder-list">
				{currentPath !== '.' && (
					<div className="folder-item" onClick={() => setCurrentPath(currentPath.split('/').slice(0, -1).join('/') || '.')}>
						..
					</div>
				)}
				{folders.map((folder, index) => (
					<div key={index} className="folder-item" onClick={() => handleItemClick(folder)}>
						{folder}
					</div>
				))}
			</div>
			<div className="file-list">
				{files.map((file, index) => (
					<div key={index} className="file-item" onClick={() => handleItemClick(file)}>
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