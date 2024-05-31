// @ts-nocheck

import React from 'react';
import 'rsuite/dist/rsuite.min.css';
import { toaster } from 'rsuite';
import { List, Grid, Row, Col } from 'rsuite';

import { InputNumber, Notification, InlineEdit, Highlight, Input, TagInput } from 'rsuite';

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
            <br />
            <br />
            {Object.entries(values).map(([tag, value]) => (
                <Control
                    key={tag}
                    name={tag}
                    type="integer"
                    value={value}
                    min={0}
                    onChange={(newValue) => handleIntegerChange(tag, newValue as number)}
                />
            ))}
        </div>
    );
};
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
        <List>
            {Object.entries(state).map(([name, controlState]) => {
                const { type, value, description, min, max, tags } = controlState;
                return (
                    <List.Item key={name}>
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
                    </List.Item>
                );
            })}
        </List>
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
        setState((prevState) => ({ ...prevState, [name]: { ...prevState[name], value } }));
    };

    return (
        <div style={{ padding: 20 }}>
            <Controls state={state} onChange={handleChange} />
        </div>
    );
};

export default App;