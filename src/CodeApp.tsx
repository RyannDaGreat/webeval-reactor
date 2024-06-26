// @ts-nocheck

import React from 'react';
import { useState, useEffect } from 'react';
import 'rsuite/dist/rsuite.min.css';
import { toaster } from 'rsuite';
import { List, Grid, Row, Col } from 'rsuite';
import { Button } from 'rsuite';
import { Accordion } from 'rsuite';

import ReadyRoundIcon from '@rsuite/icons/ReadyRound';
import SaveIcon from '@rsuite/icons/FileDownload';
import LoadIcon from '@rsuite/icons/FileUpload';
import ReloadIcon from '@rsuite/icons/Reload';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';

import { IconButton, ButtonToolbar } from 'rsuite';
import { Toggle } from 'rsuite';
import { Modal } from 'rsuite';
import { Loader } from 'rsuite';
import { Pagination } from 'rsuite';

import { InputNumber, InputGroup, Notification, InlineEdit, Highlight, Input, TagInput } from 'rsuite';

import webeval from './rp';

import { CustomProvider, Container, Header, Content } from 'rsuite';
import Editor from '@monaco-editor/react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { text } from 'node:stream/consumers';

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
import glob

def glob_search(query: str, replacements: dict) -> list:
    """
    Query is like "/path/to/{x:05}/image_*/{y}.png"
    Replacements is like {"x":5,"y":100}
    Returns a list of globbed paths
    """
    query = query.format(**replacements)
    paths = glob.glob(query)
    paths = sorted(paths)
    return paths

@rp.memoized
def load_image_bytes(path: str) -> bytes:
    image = rp.load_image(path, use_cache=True)
    image = rp.resize_image_to_fit(image, height = 512)
    # image = rp.rotate_image(image, 45)
    title = '\\n'.join(path.split('/')[-3:])
    image = rp.labeled_image(image, title, size=60)
    image_bytes = rp.encode_image_to_bytes(image, 'jpg', quality=95)
    return image_bytes

    # return rp.file_to_bytes(path) #Just loads the file raw
`;

// """
//     Some notes: 
//         /efs/users/mingmingh/Code/Data/precache/structured_data/vps05_2023/vps05_zorianna_2023112803/precache/olat/pose_{pose:04}/frame_{frame:04}/cam_{cam:04}_distorted.png
//         Vars: cam, frame, pose
//         /efs/users/mingmingh/Code/Data/precache/structured_data/vps05_2023/vps05_mary_2023112106/precache/diffuse/*{pose:04}*norm*png
// """

exeval_toaster(initPythonCode, { sync: true });


const initHiddenPythonCode = `
def load_image_bytes_raw(path: str) -> bytes:
    return rp.file_to_bytes(path) #Just loads the file raw
`

exeval_toaster(initHiddenPythonCode, { sync: true })

interface IntegerControlProps {
    value: number;
    min?: number;
    max?: number;
    onChange: (value: number) => void;
}



const IntegerControl: React.FC<IntegerControlProps> = ({ value, min = -Infinity, max = Infinity, onChange, onSave }) => {
    const handleChange = (value: string | number | null) => {
        if (value !== null && value >= min && value <= max) {
            onChange(value as number);
            onSave();
        } else {
            toaster.push(
                <Notification type="warning" header="Error" closable>
                    {`Value must be between ${min} and ${max}.`}
                </Notification>,
                { placement: 'topEnd' }
            );
        }
    };

    return (
        <InputNumber
            value={value}
            onChange={handleChange}
            min={min}
            max={max}
            step={1}
            size="md"
            style={{ width: 'max(60pt,10%)' }}
        />
    );
};

interface TagTextInputProps {
    value: string;
    tags?: string[];
    onChange: (value: string) => void;
}

const TagTextInput: React.FC<TagTextInputProps> = ({ value, tags = [], onChange, onSave }) => {
    return (
        //Disabled the highlighting because it only worked when clicking the checkbox - not the enter key
        <InlineEdit defaultValue={value} style={{ width: '100%' }} onChange={onChange} onSave={onSave} />
    )
    return (
        <InlineEdit defaultValue={value} style={{ width: '100%' }}>
            {(props: any, ref: any) => {
                const { value, onChange: onEditChange, plaintext, ...rest } = props;

                if (plaintext) {
                    return <Highlight query={tags}>{value}</Highlight>;
                }

                return <Input {...rest} as="input" ref={ref} value={value} onChange={onEditChange} onBlur={(event) => {
                    onChange(event.target.value);
                }} />;
            }}
        </InlineEdit>
    );
};

interface IntegerTagControlsProps {
    values: Record<string, number>;
    onChange: (values: Record<string, number>) => void;
}

const IntegerTagControls: React.FC<IntegerTagControlsProps> = ({ values, onChange, onSave, min = 0, max }) => {
    const handleTagChange = (tags: string[]) => {
        const newValues: Record<string, number> = {};
        tags.forEach((tag) => {
            newValues[tag] = values[tag] || 0;
        });
        onChange(newValues);
        onSave();
    };

    const handleIntegerChange = (tag: string, value: number) => {
        onChange({ ...values, [tag]: Number(value) });
    };

    return (
        <div>
            <TagInput
                style={{ width: '100%' }}
                trigger={['Enter', 'Space', 'Comma']}
                value={Object.keys(values)}
                onChange={handleTagChange}
            />
            <div style={{ paddingTop: '16px' }}>
                {Object.entries(values).map(([tag, value]) => (
                    <div key={tag} style={{ paddingTop: '8px' }}>
                        <Control
                            name={tag}
                            type="integer"
                            value={value}
                            min={min}
                            max={max}
                            onChange={(newValue) => handleIntegerChange(tag, newValue as number)}
                            onSave={onSave}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
interface ControlProps {
    name: string;
    description?: string;
    type: 'integer' | 'text' | 'integerTags';
    value: number | string | Record<string, number>;
    min?: number;
    max?: number;
    tags?: string[];
    onChange: (value: number | string | Record<string, number>) => void;
}

const Control: React.FC<ControlProps> = ({ name, description, type, value, min, max, tags, onChange, onSave }) => {
    let output = "Error: Bad Control";
    if (type === 'integer') {
        output = (
            <IntegerControl
                value={value as number}
                min={min}
                max={max}
                onChange={onChange as (value: number) => void}
                onSave={onSave}
            />
        );
    } else if (type === 'text') {
        output = (
            <TagTextInput
                value={value as string}
                tags={tags}
                onChange={onChange as (value: string) => void}
                onSave={onSave}
            />
        );
    } else if (type === 'integerTags') {
        output = (
            <IntegerTagControls
                values={value as Record<string, number>}
                onChange={onChange as (values: Record<string, number>) => void}
                onSave={onSave}
                min={min}
                max={max}

            />
        );
    }
    return (
        <Grid fluid>
            <Row gutter={12} align="middle">
                <Col xs={24} sm={6} md={4} lg={3}>
                    <div style={{ fontWeight: 'bold', color: 'white', textAlign: 'right' }}>{name}</div>
                </Col>
                <Col xs={24} sm={12} md={14} lg={15}>
                    {output}
                </Col>
                <Col xs={24} sm={6} md={6} lg={6}>
                    <div style={{ fontStyle: 'italic', color: '#999' }}>{description}</div>
                </Col>
            </Row>
        </Grid>
    );
};

interface ControlsProps {
    state: Record<string, { type: 'integer' | 'text' | 'integerTags'; value: number | string | Record<string, number>; description?: string; min?: number; max?: number; tags?: string[] }>;
    onChange: (name: string, value: number | string | Record<string, number>) => void;
}

const Controls: React.FC<ControlsProps> = ({ state, onChange, onSave }) => {
    return (
        <div>
            {Object.entries(state).map(([name, controlState]) => {
                const { type, value, description, min, max, tags } = controlState;
                return (
                    <div key={name} style={{ marginBottom: '16px' }}>
                        <Control
                            name={name}
                            description={description}
                            type={type}
                            value={value}
                            min={min}
                            max={max}
                            tags={tags}
                            onChange={(newValue) => onChange(name, newValue)}
                            onSave={onSave}
                        />
                    </div>
                );
            })}
        </div>
    );
};

const PathSearcher: React.FC = () => {
    //TODO: Bubble up state
    // let pathQueryInit = "/Users/ryan/*{x}*"
    // pathQueryInit = "/Users/ryan/Downloads/Unk*"
    // const pathVarsInit = { x: 0 }


    let pathQueryInit = "/efs/users/mingmingh/Code/Data/precache/structured_data/vps05_2023/vps05_zorianna_2023112803/precache/olat/pose_{pose:04}/frame_{frame:04}/cam_{cam:04}_distorted.png"
    pathQueryInit = "/efs/users/mingmingh/Code/Data/precache/structured_data/vps05_2023/vps05_zorianna_2023112803/precache/olat/pose_{pose:04}/frame_{frame:04}/cam_*_distorted.png"
    pathQueryInit = "/efs/users/mingmingh/Code/Data/precache/structured_data/vps05_2023/vps05_zorianna_2023112803/precache/olat/pose_{pose:04}/frame_*/cam_{cam:04}_distorted.png"
    const pathVarsInit = { pose: 14, cam: 35, frame: 54 }


    const pathQueryName = "PathQuery"
    const pathVarsName = "PathVars"

    const [state, setState] = React.useState<Record<string, {
        type: 'integer' | 'text' | 'integerTags';
        value: number | string | Record<string, number>;
        description?: string;
        min?: number;
        max?: number;
        tags?: string[];
    }>>({
        [pathQueryName]: {
            type: 'text',
            value: pathQueryInit,
            description: 'Enter a python f-string, using PathVars as variables',
            tags: Object.keys(pathVarsInit),
        },
        [pathVarsName]: {
            type: 'integerTags',
            value: pathVarsInit,
            description: 'Set numerical values for the path replacements',
        },
    });
    const [pythonImageCode, setPythonImageCode] = React.useState(initPythonCode)
    const [paths, setPaths] = React.useState([]) //list of strings
    const [saved, setSaved] = React.useState(false);


    const updatePaths = async () => {
        const paths = await exeval_toaster(
            "glob_search(query,replacements)",
            {
                vars: {
                    query: state[pathQueryName].value,
                    replacements: state[pathVarsName].value,
                },
                squelch: true,
            }
        )
        setPaths(Array.isArray(paths) ? paths : []);
    }

    const handleChange = (name: string, value: number | string | Record<string, number>) => {
        console.log('IU', name, value)
        setState((prevState) => {
            const newState = { ...prevState, [name]: { ...prevState[name], value } };

            if (name === pathVarsName) {
                newState[pathQueryName].tags = Object.keys(value as Record<string, number>);
            }

            return newState;
        });
    };

    React.useEffect(() => {
        if (!saved) {
            updatePaths();
            setSaved(true);
        }
    }, [saved]);

    const onSave = () => {
        setSaved(false);
    }

    return (
        <Accordion>
            <Accordion.Panel header="Search Options" defaultExpanded>
                <Controls state={state} onChange={handleChange} onSave={onSave} />
            </Accordion.Panel>
            <Accordion.Panel header={"Searched Paths [" + paths.length + "]"} defaultExpanded>
                <Editor
                    height="400px"
                    defaultLanguage="json"
                    value={paths.join("\n")}
                    theme="vs-dark"
                    options={{
                        readOnly: true,
                        minimap: { enabled: true },
                    }}
                />
            </Accordion.Panel>
            <Accordion.Panel header="Python Code" defaultExpanded>
                <ExevalEditor code={pythonImageCode} setCode={setPythonImageCode} onRun={onSave} />
            </Accordion.Panel>
            <Accordion.Panel header="Images" defaultExpanded>
                <ImagesGrid paths={paths} />
            </Accordion.Panel>
        </Accordion>
    );
}

const ExevalEditor: React.FC = ({ code, setCode, onRun }) => {
    // State to store the editor content
    // const [code, setCode] = useState(code, setCode);

    // Handle changes in the editor
    const handleEditorChange = (value: string | undefined, event: any) => {
        if (value !== undefined) {
            setCode(value);
        }
    };

    // Function to handle code execution
    const handleRunCode = () => {
        // Using exeval_toaster function to run the code
        exeval_toaster(code, { squelch: true, sync: true });
        if (onRun) {
            onRun();
        }
    };

    return (
        <>
            <Editor
                height="400px"
                defaultLanguage="python"
                value={code}
                onChange={handleEditorChange}
                theme="vs-dark"
                options={{
                    readOnly: false,
                    minimap: { enabled: true },
                }}
            />
            <ButtonToolbar>
                <IconButton icon={<ReadyRoundIcon />} onClick={handleRunCode}>
                    Run Python Code
                </IconButton>
            </ButtonToolbar>
        </>
    );
};



// function Image({ path, ...imgProps }: { path: string;[key: string]: any }) {
//     const url = webeval.buildQueryUrl(
//         '/webeval/web/bytes/webeval_image.png',
//         {
//             code: `load_image_bytes(${JSON.stringify(path)})`,
//             content_type: 'image/png',
//             sync: false,
//         }
//     );

//     return <img src={url} {...imgProps} />;
// }

function Image({ path, cacheKey, isSelected, onSelect, index, style, onRightClick, ...imgProps }) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const url = webeval.buildQueryUrl('/webeval/web/bytes/webeval_image.png', {
        code: `load_image_bytes(${JSON.stringify(path)})`,
        content_type: 'image/png',
        cache_key: cacheKey,
    });

    const filename = path.split('/').pop();

    useEffect(() => {
        setIsLoading(true);
        setHasError(false);
    }, [url]);

    const handleImageLoad = () => {
        setIsLoading(false);
    };

    const handleImageError = () => {
        setIsLoading(false);
        setHasError(true);
    };

    const handleClick = (event) => {
        if (event.button === 0) {
            event.preventDefault();
            onSelect(path);
        }
    };


    const handleContextMenu = (event) => {
        event.preventDefault();
        onRightClick(path);
    };

    return (
        <div
            style={{
                textAlign: 'center',
                position: 'relative',
                height: "calc(100% - 4px)%",
                width: "calc(100% - 4px)%",
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
                    onLoad={handleImageLoad}
                    onError={handleImageError}
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




function ImagesGrid({ paths, imgProps = {} }) {
    const [cacheKey, setCacheKey] = useState(0);
    const [numColumns, setNumColumns] = useState(18);
    const [selectedPaths, setSelectedPaths] = useState([]);
    const [showSelected, setShowSelected] = useState(true);
    const [showDeselected, setShowDeselected] = useState(true);
    const [rollShift, setRollShift] = useState(0);
    const [imagesPerPage, setImagesPerPage] = useState(300);
    const [currentPage, setCurrentPage] = useState(1);
    const [hoverPath, setHoverPath] = useState(null);
    const [showHoverZoom, setShowHoverZoom] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalImagePath, setModalImagePath] = useState(null);

    const handleRollShiftChange = (value) => {
        setRollShift(modulo(value, filteredPaths.length));
    };

    const handleInvalidateCache = () => {
        setCacheKey((prevKey) => prevKey + 1);
    };

    const handleNumColumnsChange = (value) => {
        setNumColumns(value);
    };

    const handleSelectPath = (path) => {
        setSelectedPaths((prevPaths) => {
            if (prevPaths.includes(path)) {
                return prevPaths.filter((p) => p !== path);
            } else {
                return [...prevPaths, path];
            }
        });
    };

    const handleLoadSelectedPaths = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = (event) => {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                const loadedPaths = JSON.parse(e.target.result);
                setSelectedPaths(loadedPaths);
            };
            reader.readAsText(file);
        };
        input.click();
    };

    const handleSaveSelectedPaths = () => {
        const blob = new Blob([JSON.stringify(selectedPaths)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'selected_paths.json';
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleImagesPerPageChange = (value) => {
        setImagesPerPage(value);
        setCurrentPage(1);
    };

    const handlePageChange = (value) => {
        setCurrentPage(value);
    };

    const handleMouseEnter = (path) => {
        setHoverPath(path);
    };

    const handleMouseLeave = () => {
        setHoverPath(null);
    };

    const handleRightClick = (path) => {
        setModalImagePath(path);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
    };

    const columnWidth = `${100 / numColumns}%`;

    const filteredPaths = paths.filter((path) => {
        const isSelected = selectedPaths.includes(path);
        return (isSelected && showSelected) || (!isSelected && showDeselected);
    });

    const rolledIndices = roll(filteredPaths.map((_, index) => index), rollShift);

    const totalPages = Math.ceil(rolledIndices.length / imagesPerPage);
    const startIndex = (currentPage - 1) * imagesPerPage;
    const endIndex = startIndex + imagesPerPage;
    const paginatedIndices = rolledIndices.slice(startIndex, endIndex);

    return (
        <>
            <ButtonToolbar style={{ justifyContent: 'center' }}>
                <IconButton icon={<ReloadIcon />} onClick={handleInvalidateCache}>
                    Reload Images
                </IconButton>
                <InputNumber
                    prefix="Columns:"
                    defaultValue={numColumns}
                    min={1}
                    step={1}
                    onChange={handleNumColumnsChange}
                    style={{ width: '200px' }}
                />
                <InputNumber
                    prefix="Shift:"
                    value={rollShift}
                    min={-filteredPaths.length}
                    max={filteredPaths.length}
                    step={1}
                    onChange={handleRollShiftChange}
                    style={{ width: '180px' }}
                />
                <InputGroup style={{ width: '180px' }}>
                    <InputNumber
                        prefix="Page:"
                        value={currentPage}
                        min={1}
                        max={totalPages}
                        step={1}
                        onChange={handlePageChange}
                    />
                    <InputGroup.Addon>/ {totalPages}</InputGroup.Addon>
                </InputGroup>
                <InputNumber
                    style={{ width: '200px' }}
                    prefix="Imgs/Page:"
                    value={imagesPerPage}
                    min={1}
                    step={1}
                    onChange={handleImagesPerPageChange}
                />
            </ButtonToolbar>
            <br />
            <ButtonToolbar style={{ justifyContent: 'center' }}>
                <IconButton icon={<LoadIcon />} onClick={handleLoadSelectedPaths}>
                    Load Selection
                </IconButton>
                <IconButton icon={<SaveIcon />} onClick={handleSaveSelectedPaths}>
                    Save Selection
                </IconButton>
                <Toggle
                    checked={showSelected}
                    onChange={setShowSelected}
                    checkedChildren="See Selected"
                    unCheckedChildren="Hide Selected"
                />
                <Toggle
                    checked={showDeselected}
                    onChange={setShowDeselected}
                    checkedChildren="See Deselected"
                    unCheckedChildren="Hide Deselected"
                />
                <Toggle
                    checked={showHoverZoom}
                    onChange={setShowHoverZoom}
                    checkedChildren="Hover-Zoom On"
                    unCheckedChildren="Hover-Zoom Off"
                />
            </ButtonToolbar>
            <br />
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${numColumns}, 1fr)`,
                    gap: '0px',
                }}
            >
                {paginatedIndices.map((index) => {
                    const path = filteredPaths[index];
                    const isHovered = hoverPath === path;
                    const doHoverZoom = showHoverZoom && isHovered;
                    const imgStyle = {
                        width: '100%',
                        height: 'auto',
                        ...imgProps.style,
                    };

                    if (doHoverZoom) {
                        imgStyle.position = 'fixed';
                        imgStyle.top = '50%';
                        imgStyle.left = '50%';
                        imgStyle.transform = 'translate(-50%, -50%)';
                        imgStyle.zIndex = '9999';
                        imgStyle.maxWidth = 'calc(100% - 40px)';
                        imgStyle.maxHeight = 'calc(100% - 40px)';
                        imgStyle.objectFit = 'contain';
                        imgStyle.pointerEvents = 'none';
                    }

                    return (
                        <div
                            key={path}
                            style={{ height: '100%', width: '100%', pointerEvents: 'all' }}
                            onMouseEnter={() => handleMouseEnter(path)}
                            onMouseLeave={handleMouseLeave}
                        >
                            <Image
                                path={path}
                                cacheKey={cacheKey}
                                isSelected={selectedPaths.includes(path)}
                                onSelect={handleSelectPath}
                                style={imgStyle}
                                {...imgProps}
                                index={index}
                                onRightClick={handleRightClick}
                            />
                        </div>
                    );
                })}
            </div>
            <Modal open={modalOpen} onClose={handleCloseModal}>
                <Modal.Header>
                    <Modal.Title>Image Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>{modalImagePath}</p>
                    <br />
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                        <img src={getRawImageUrl(modalImagePath)} alt={modalImagePath} style={{ maxWidth: '100%' }} />
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={handleCloseModal}>Close</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}


function getRawImageUrl(path) {
    if (!path) {
        return []
    }
    const pathsplit = path.split('/');
    const name = pathsplit[pathsplit.length - 1]
    const url = webeval.buildQueryUrl('/webeval/web/bytes/' + name, {
        code: `load_image_bytes_raw(${JSON.stringify(path)})`,
        content_type: 'image/png',
    });
    return url
}

const App: React.FC = () => {
    // const [state, setState] = React.useState<Record<string, { type: 'integer' | 'text' | 'integerTags'; value: number | string | Record<string, number>; description?: string; min?: number; max?: number; tags?: string[] }>>({
    //     A: { type: 'integer', min: -999, max: 999, description: 'The first one', value: 123 },
    //     Bobobo: { type: 'integer', max: 999, description: 'The second one', value: 456 },
    //     Text: {
    //         type: 'text',
    //         value: 'React Suite is a set of react components that have high quality and high performance.',
    //         description: 'Edit the text and see the highlighted tags',
    //         tags: ['h', 'high performance'],
    //     },
    //     TagIntegers: {
    //         type: 'integerTags',
    //         value: { foo: 10, bar: 20 },
    //         description: 'Create tags and assign integer values to them',
    //     },
    // });

    // const handleChange = (name: string, value: number | string | Record<string, number>) => {
    //     setState((prevState) => {
    //         const newState = { ...prevState, [name]: { ...prevState[name], value } };

    //         if (name === 'TagIntegers') {
    //             newState.Text.tags = Object.keys(value as Record<string, number>);
    //         }

    //         return newState;
    //     });
    // };

    return (
        <div style={{ padding: 20 }}>
            <PathSearcher />
            {/* <Controls state={state} onChange={handleChange} /> */}
        </div>
    );
};

export default App;
