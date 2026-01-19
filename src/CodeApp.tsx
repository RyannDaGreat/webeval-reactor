// @ts-nocheck

import React from 'react';
import { useState, useEffect } from 'react';
import 'rsuite/dist/rsuite.min.css';
import { toaster } from 'rsuite';
import { Button } from 'rsuite';

import ReadyRoundIcon from '@rsuite/icons/ReadyRound';
import SaveIcon from '@rsuite/icons/FileDownload';
import LoadIcon from '@rsuite/icons/FileUpload';
import ReloadIcon from '@rsuite/icons/Reload';

import { IconButton, ButtonToolbar } from 'rsuite';
import { Toggle } from 'rsuite';
import { Modal } from 'rsuite';
import { Loader } from 'rsuite';

import { InputNumber, InputGroup, Notification } from 'rsuite';

import webeval from './rp';

import Editor from '@monaco-editor/react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

const exeval_toaster = async (
    code,
    { squelch, sync, vars } = {
        squelch: true,
        sync: false,
        vars: {}
    }
) => {
    try {
        const result = await webeval.exeval(code, vars, sync);
        return result;
    } catch (e) {
        toaster.push(
            <Notification type="error" header="Python Error" closable>
                {`An error occurred:`}
                <pre style={{ fontFamily: 'monospace' }}>
                    {e.message}
                </pre>
            </Notification>,
            { placement: 'topEnd', duration: 10000 }
        );
        console.error(e);
        if (!squelch) {
            throw e;
        }
    }
};

const initPythonCode = `import rp

def glob_search() -> list:
    """
    Returns a list of objects (arbitrary Python objects).
    Each object will be serialized via rp.object_to_base64 for transfer,
    and displayed in the UI via repr().
    """
    # Example: return list of file paths as strings
    # paths = rp.get_all_files("/some/folder")
    # return paths

    # Or return arbitrary objects like tuples, dicts, etc:
    # return [(path, metadata) for path in paths]

    return []

@rp.memoized
def load_image_bytes(obj: object) -> bytes:
    """
    obj is an arbitrary Python object from glob_search().
    Process it and return image bytes.
    """
    # Example for simple path strings:
    path = obj
    image = rp.load_image(path, use_cache=True)
    image = rp.resize_image_to_fit(image, height=512)
    title = '\\n'.join(str(path).split('/')[-3:])
    image = rp.labeled_image(image, title, size=60)
    return rp.encode_image_to_bytes(image, 'jpg', quality=95)
`;

exeval_toaster(initPythonCode, { sync: true });

const initHiddenPythonCode = `
def load_image_bytes_raw(obj_b64: str) -> bytes:
    obj = rp.base64_to_object(obj_b64)
    path = obj if isinstance(obj, str) else str(obj)
    return rp.file_to_bytes(path)

def _obj_to_repr(obj) -> str:
    return repr(obj)
`

exeval_toaster(initHiddenPythonCode, { sync: true })

// Object item: { b64: string, repr: string }
// b64 is the base64-encoded Python object, repr is the repr() string for display

interface ObjectItem {
    b64: string;
    repr: string;
}

const PathSearcher: React.FC = () => {
    const [pythonImageCode, setPythonImageCode] = React.useState(initPythonCode);
    const [objects, setObjects] = React.useState<ObjectItem[]>([]);
    const [isSearching, setIsSearching] = React.useState(false);

    const updateObjects = async () => {
        setIsSearching(true);
        const result = await exeval_toaster(
            `[{"b64": rp.object_to_base64(obj), "repr": repr(obj)} for obj in glob_search()]`,
            { squelch: true }
        );
        setObjects(Array.isArray(result) ? result : []);
        setIsSearching(false);
    };

    const handleRunCode = () => {
        updateObjects();
    };

    return (
        <PanelGroup direction="vertical" autoSaveId="pathsearcher-panels">
            <Panel defaultSize={15} minSize={5}>
                <div style={{ padding: '8px', borderBottom: '1px solid #333' }}>
                    <strong>Searched Objects [{objects.length}]</strong>
                    {isSearching && <span style={{ marginLeft: 8, color: '#888' }}>Searching...</span>}
                </div>
                <Editor
                    height="calc(100% - 40px)"
                    defaultLanguage="text"
                    value={objects.map(o => o.repr).join("\n")}
                    theme="vs-dark"
                    options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        lineNumbers: 'on',
                        wordWrap: 'on',
                    }}
                />
            </Panel>
            <PanelResizeHandle style={{ height: 6, background: '#444', cursor: 'row-resize' }} />
            <Panel defaultSize={35} minSize={10}>
                <div style={{ padding: '8px', borderBottom: '1px solid #333' }}>
                    <strong>Python Code</strong>
                </div>
                <ExevalEditor
                    code={pythonImageCode}
                    setCode={setPythonImageCode}
                    onRun={handleRunCode}
                />
            </Panel>
            <PanelResizeHandle style={{ height: 6, background: '#444', cursor: 'row-resize' }} />
            <Panel defaultSize={50} minSize={10}>
                <div style={{ padding: '8px', borderBottom: '1px solid #333' }}>
                    <strong>Images</strong>
                </div>
                <div style={{ height: 'calc(100% - 40px)', overflow: 'auto' }}>
                    <ImagesGrid objects={objects} />
                </div>
            </Panel>
        </PanelGroup>
    );
}

const ExevalEditor: React.FC = ({ code, setCode, onRun }) => {
    const handleEditorChange = (value: string | undefined) => {
        if (value !== undefined) {
            setCode(value);
        }
    };

    const handleRunCode = () => {
        exeval_toaster(code, { squelch: true, sync: true });
        if (onRun) {
            onRun();
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 40px)' }}>
            <Editor
                height="100%"
                defaultLanguage="python"
                value={code}
                onChange={handleEditorChange}
                theme="vs-dark"
                options={{
                    readOnly: false,
                    minimap: { enabled: false },
                    wordWrap: 'on',
                }}
            />
            <ButtonToolbar style={{ padding: 8 }}>
                <IconButton icon={<ReadyRoundIcon />} onClick={handleRunCode}>
                    Run Python Code
                </IconButton>
            </ButtonToolbar>
        </div>
    );
};



// Image component now uses ObjectItem { b64, repr } instead of path string
function Image({ obj, cacheKey, isSelected, onSelect, style, onRightClick, ...imgProps }) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    // obj.b64 is base64-encoded Python object, passed to load_image_bytes via rp.base64_to_object
    const url = webeval.buildQueryUrl('/webeval/web/bytes/webeval_image.png', {
        code: `load_image_bytes(rp.base64_to_object(${JSON.stringify(obj.b64)}))`,
        content_type: 'image/png',
        cache_key: cacheKey,
    });

    useEffect(() => {
        setIsLoading(true);
        setHasError(false);
    }, [url]);

    const handleClick = (event) => {
        if (event.button === 0) {
            event.preventDefault();
            onSelect(obj.b64);
        }
    };

    const handleContextMenu = (event) => {
        event.preventDefault();
        onRightClick(obj);
    };

    return (
        <div
            style={{
                textAlign: 'center',
                position: 'relative',
                height: "calc(100% - 4px)",
                width: "calc(100% - 4px)",
            }}
            onMouseDown={handleClick}
            onContextMenu={handleContextMenu}
        >
            {isLoading && (
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 1,
                        color: 'white',
                        textShadow: '0px 0px 10px rgba(0, 0, 0, 1)',
                    }}
                >
                    Loading...
                    <br />
                    <Loader size="xs" content="" />
                </div>
            )}
            <div>
                {hasError && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            color: 'white',
                            zIndex: 1,
                        }}
                    >
                        Error
                    </div>
                )}
                <img
                    src={url}
                    alt={obj.repr}
                    onLoad={() => setIsLoading(false)}
                    onError={() => { setIsLoading(false); setHasError(true); }}
                    loading="lazy"
                    style={{
                        ...style,
                        border: isSelected ? '2px dashed yellow' : 'none',
                        boxShadow: isSelected ? '0 0 5px black' : 'none',
                        height: isSelected ? 'calc(100% - 4px)' : '100%',
                        width: isSelected ? 'calc(100% - 4px)' : '100%',
                        filter: isLoading
                            ? 'blur(5px)'
                            : hasError
                                ? 'grayscale(100%) brightness(40%) sepia(100%) hue-rotate(-50deg) saturate(600%) contrast(0.8)'
                                : 'none',
                        transition: 'filter 0.3s',
                    }}
                    {...imgProps}
                />
            </div>
        </div>
    );
}


function roll(arr, shift) {
    return arr.slice(shift).concat(arr.slice(0, shift));
}
function modulo(x, y) {
    return ((x % y) + y) % y;
}




// ImagesGrid now takes objects: ObjectItem[] instead of paths: string[]
function ImagesGrid({ objects, imgProps = {} }: { objects: ObjectItem[], imgProps?: any }) {
    const [cacheKey, setCacheKey] = useState(0);
    const [numColumns, setNumColumns] = useState(18);
    const [selectedB64s, setSelectedB64s] = useState<string[]>([]); // selection by b64 key
    const [showSelected, setShowSelected] = useState(true);
    const [showDeselected, setShowDeselected] = useState(true);
    const [rollShift, setRollShift] = useState(0);
    const [imagesPerPage, setImagesPerPage] = useState(300);
    const [currentPage, setCurrentPage] = useState(1);
    const [hoverB64, setHoverB64] = useState<string | null>(null);
    const [showHoverZoom, setShowHoverZoom] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalObj, setModalObj] = useState<ObjectItem | null>(null);

    const filteredObjects = objects.filter((obj) => {
        const isSelected = selectedB64s.includes(obj.b64);
        return (isSelected && showSelected) || (!isSelected && showDeselected);
    });

    const handleRollShiftChange = (value) => {
        setRollShift(modulo(value, filteredObjects.length || 1));
    };

    const handleInvalidateCache = () => {
        setCacheKey((prevKey) => prevKey + 1);
    };

    const handleSelectB64 = (b64: string) => {
        setSelectedB64s((prev) =>
            prev.includes(b64) ? prev.filter((p) => p !== b64) : [...prev, b64]
        );
    };

    const handleLoadSelection = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = (event: any) => {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = (e: any) => {
                const loaded = JSON.parse(e.target.result);
                setSelectedB64s(loaded);
            };
            reader.readAsText(file);
        };
        input.click();
    };

    const handleSaveSelection = () => {
        const blob = new Blob([JSON.stringify(selectedB64s)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'selected_objects.json';
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleRightClick = (obj: ObjectItem) => {
        setModalObj(obj);
        setModalOpen(true);
    };

    const rolledIndices = roll(filteredObjects.map((_, i) => i), rollShift);
    const totalPages = Math.ceil(rolledIndices.length / imagesPerPage) || 1;
    const startIndex = (currentPage - 1) * imagesPerPage;
    const paginatedIndices = rolledIndices.slice(startIndex, startIndex + imagesPerPage);

    return (
        <>
            <ButtonToolbar style={{ justifyContent: 'center', flexWrap: 'wrap', gap: 4 }}>
                <IconButton icon={<ReloadIcon />} onClick={handleInvalidateCache}>
                    Reload
                </IconButton>
                <InputNumber
                    prefix="Cols:"
                    value={numColumns}
                    min={1}
                    step={1}
                    onChange={(v) => setNumColumns(v)}
                    style={{ width: 140 }}
                />
                <InputNumber
                    prefix="Shift:"
                    value={rollShift}
                    min={-filteredObjects.length}
                    max={filteredObjects.length}
                    step={1}
                    onChange={handleRollShiftChange}
                    style={{ width: 140 }}
                />
                <InputGroup style={{ width: 150 }}>
                    <InputNumber
                        prefix="Pg:"
                        value={currentPage}
                        min={1}
                        max={totalPages}
                        step={1}
                        onChange={(v) => setCurrentPage(v)}
                    />
                    <InputGroup.Addon>/{totalPages}</InputGroup.Addon>
                </InputGroup>
                <InputNumber
                    prefix="Per Pg:"
                    value={imagesPerPage}
                    min={1}
                    step={1}
                    onChange={(v) => { setImagesPerPage(v); setCurrentPage(1); }}
                    style={{ width: 160 }}
                />
            </ButtonToolbar>
            <ButtonToolbar style={{ justifyContent: 'center', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                <IconButton icon={<LoadIcon />} onClick={handleLoadSelection}>
                    Load Sel
                </IconButton>
                <IconButton icon={<SaveIcon />} onClick={handleSaveSelection}>
                    Save Sel
                </IconButton>
                <Toggle
                    checked={showSelected}
                    onChange={setShowSelected}
                    checkedChildren="Sel"
                    unCheckedChildren="Sel"
                />
                <Toggle
                    checked={showDeselected}
                    onChange={setShowDeselected}
                    checkedChildren="Desel"
                    unCheckedChildren="Desel"
                />
                <Toggle
                    checked={showHoverZoom}
                    onChange={setShowHoverZoom}
                    checkedChildren="Zoom"
                    unCheckedChildren="Zoom"
                />
            </ButtonToolbar>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${numColumns}, 1fr)`,
                    gap: 0,
                    marginTop: 8,
                }}
            >
                {paginatedIndices.map((index) => {
                    const obj = filteredObjects[index];
                    const isHovered = hoverB64 === obj.b64;
                    const doHoverZoom = showHoverZoom && isHovered;
                    const imgStyle: any = { width: '100%', height: 'auto', ...imgProps.style };

                    if (doHoverZoom) {
                        imgStyle.position = 'fixed';
                        imgStyle.top = '50%';
                        imgStyle.left = '50%';
                        imgStyle.transform = 'translate(-50%, -50%)';
                        imgStyle.zIndex = 9999;
                        imgStyle.maxWidth = 'calc(100% - 40px)';
                        imgStyle.maxHeight = 'calc(100% - 40px)';
                        imgStyle.objectFit = 'contain';
                        imgStyle.pointerEvents = 'none';
                    }

                    return (
                        <div
                            key={obj.b64}
                            style={{ height: '100%', width: '100%', pointerEvents: 'all' }}
                            onMouseEnter={() => setHoverB64(obj.b64)}
                            onMouseLeave={() => setHoverB64(null)}
                        >
                            <Image
                                obj={obj}
                                cacheKey={cacheKey}
                                isSelected={selectedB64s.includes(obj.b64)}
                                onSelect={handleSelectB64}
                                style={imgStyle}
                                {...imgProps}
                                onRightClick={handleRightClick}
                            />
                        </div>
                    );
                })}
            </div>
            <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
                <Modal.Header>
                    <Modal.Title>Object Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{modalObj?.repr}</pre>
                    <br />
                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                        {modalObj && (
                            <img
                                src={getRawImageUrl(modalObj)}
                                alt={modalObj.repr}
                                style={{ maxWidth: '100%' }}
                            />
                        )}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={() => setModalOpen(false)}>Close</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}


function getRawImageUrl(obj: ObjectItem | null) {
    if (!obj) {
        return '';
    }
    return webeval.buildQueryUrl('/webeval/web/bytes/raw_image.png', {
        code: `load_image_bytes_raw(${JSON.stringify(obj.b64)})`,
        content_type: 'image/png',
    });
}

const App: React.FC = () => {
    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <PathSearcher />
        </div>
    );
};

export default App;
