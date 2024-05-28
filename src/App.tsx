import React, { useState, useEffect } from 'react';
import webeval from './webeval';
import './App.css';

function App() {
	const [files, setFiles] = useState<string[]>([]);
	const [selectedFile, setSelectedFile] = useState<string | null>(null);

	useEffect(() => {
		fetchFiles();
	}, []);

	const fetchFiles = async () => {
		const response = await webeval.exeval(
			'[".."]+[f for f in __import__("os").listdir() if __import__("os").path.isfile(f)]'
		);
		setFiles(response);
	};

	const handleFileClick = async (file: string) => {
		const response = await webeval.exeval(
			"__import__('base64').b64encode(open(f, 'rb').read()).decode('utf-8')",
			{ f: file }
		);
		setSelectedFile(`data:image/jpeg;base64,${response}`);
	};

	return (
		<div className="App">
			<h1>File Browser</h1>
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