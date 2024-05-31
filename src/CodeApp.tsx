// @ts-nocheck

import React from 'react';
import {useState} from 'react';
import 'rsuite/dist/rsuite.min.css';
import { toaster } from 'rsuite';
import { List, Grid, Row, Col } from 'rsuite';
import { Accordion } from 'rsuite';

import ReadyRoundIcon from '@rsuite/icons/ReadyRound';
import { IconButton, ButtonToolbar } from 'rsuite';

import { InputNumber, Notification, InlineEdit, Highlight, Input, TagInput } from 'rsuite';

import webeval from './rp';

import { CustomProvider, Container, Header, Content } from 'rsuite';
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
import glob
from icecream import ic


def glob_search(query: str, replacements: dict):
    """
    Query is like "/path/to/{x:05}/image_*/{y}.png"
    Replacements is like {"x":5,"y":100}
    Returns a list of globbed paths
    """
    query = query.format(**replacements)
    paths = glob.glob(query)
    ic(query,paths)

    return paths

def load_image_bytes(path):
    name = rp.get_file_name(path)
    image = rp.load_image(path)
    image = rp.rotate_image(image, 45)
    image = rp.resize_image_to_fit(image, 256, 256)
    image = rp.labeled_image(image, name)
    image_bytes = rp.encode_image_to_bytes(image)
    return image_bytes
`;
exeval_toaster(initPythonCode, { sync: true });


interface IntegerControlProps {
    value: number;
    min?: number;
    max?: number;
    onChange: (value: number) => void;
}



const IntegerControl: React.FC<IntegerControlProps> = ({ value, min = -Infinity, max = Infinity, onChange }) => {
    const handleChange = (value: string | number | null) => {
        if (value !== null && value >= min && value <= max) {
            onChange(value as number);
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

const TagTextInput: React.FC<TagTextInputProps> = ({ value, tags = [], onChange }) => {
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

const IntegerTagControls: React.FC<IntegerTagControlsProps> = ({ values, onChange }) => {
    const handleTagChange = (tags: string[]) => {
        const newValues: Record<string, number> = {};
        tags.forEach((tag) => {
            newValues[tag] = values[tag] || 0;
        });
        onChange(newValues);
    };

    const handleIntegerChange = (tag: string, value: number) => {
        onChange({ ...values, [tag]: value });
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
                            min={0}
                            onChange={(newValue) => handleIntegerChange(tag, newValue as number)}
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

const Control: React.FC<ControlProps> = ({ name, description, type, value, min, max, tags, onChange }) => {
    let output = "Error: Bad Control";
    if (type === 'integer') {
        output = (
            <IntegerControl
                value={value as number}
                min={min}
                max={max}
                onChange={onChange as (value: number) => void}
            />
        );
    } else if (type === 'text') {
        output = (
            <TagTextInput
                value={value as string}
                tags={tags}
                onChange={onChange as (value: string) => void}
            />
        );
    } else if (type === 'integerTags') {
        output = (
            <IntegerTagControls
                values={value as Record<string, number>}
                onChange={onChange as (values: Record<string, number>) => void}
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

const Controls: React.FC<ControlsProps> = ({ state, onChange }) => {
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
                        />
                    </div>
                );
            })}
        </div>
    );
};

const PathSearcher: React.FC = () => {
    //TODO: Bubble up state
    const pathQueryInit = "/Users/ryan/*{x}*"
    const pathQueryName = "PathQuery"
    const pathVarsInit = { x: 0 }
    const pathVarsName = "PathVars"

    const [state, setState] = React.useState<Record<string, { type: 'integer' | 'text' | 'integerTags'; value: number | string | Record<string, number>; description?: string; min?: number; max?: number; tags?: string[] }>>({
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
    const [pythonImageCode, setPythonImageCode]  = React.useState(initPythonCode)
    const [paths, setPaths] = React.useState([]) //list of strings


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
        setPaths(paths || [])
    }

    const handleChange = (name: string, value: number | string | Record<string, number>) => {
        setState((prevState) => {
            const newState = { ...prevState, [name]: { ...prevState[name], value } };

            if (name === pathVarsName) {
                newState[pathQueryName].tags = Object.keys(value as Record<string, number>);
            }

            return newState;
        });
    };

    React.useEffect(() => {
        updatePaths();
    }, [state[pathQueryName], state[pathVarsName]]);
    

    return (
        <Accordion>
            <Accordion.Panel header="Search Options" defaultExpanded>
                <Controls state={state} onChange={handleChange} />
            </Accordion.Panel>
            <Accordion.Panel header={"Searched Paths ["+paths.length+"]"} defaultExpanded>
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
            <Accordion.Panel  header="Python Code" defaultExpanded>
                    <ExevalEditor code={pythonImageCode} setCode={setPythonImageCode}/>
            </Accordion.Panel>
        </Accordion>
    );
}

const ExevalEditor: React.FC = ({ code, setCode }) => {
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


const App: React.FC = () => {
    const [state, setState] = React.useState<Record<string, { type: 'integer' | 'text' | 'integerTags'; value: number | string | Record<string, number>; description?: string; min?: number; max?: number; tags?: string[] }>>({
        A: { type: 'integer', min: -999, max: 999, description: 'The first one', value: 123 },
        Bobobo: { type: 'integer', max: 999, description: 'The second one', value: 456 },
        Text: {
            type: 'text',
            value: 'React Suite is a set of react components that have high quality and high performance.',
            description: 'Edit the text and see the highlighted tags',
            tags: ['h', 'high performance'],
        },
        TagIntegers: {
            type: 'integerTags',
            value: { foo: 10, bar: 20 },
            description: 'Create tags and assign integer values to them',
        },
    });

    const handleChange = (name: string, value: number | string | Record<string, number>) => {
        setState((prevState) => {
            const newState = { ...prevState, [name]: { ...prevState[name], value } };

            if (name === 'TagIntegers') {
                newState.Text.tags = Object.keys(value as Record<string, number>);
            }

            return newState;
        });
    };

    return (
        <div style={{ padding: 20 }}>
            <PathSearcher />
            {/* <Controls state={state} onChange={handleChange} /> */}
        </div>
    );
};

export default App;
