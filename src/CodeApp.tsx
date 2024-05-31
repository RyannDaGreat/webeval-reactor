// @ts-nocheck
import React from 'react';
import 'rsuite/dist/rsuite.min.css';
import { toaster } from 'rsuite';
import { List } from 'rsuite';

import { InputNumber, Notification, InlineEdit, Highlight, Input, TagInput } from 'rsuite';

interface LabeledControlProps {
    name: string;
    description?: string;
    children: React.ReactNode;
}

const LabeledControl: React.FC<LabeledControlProps> = ({ name, description = '', children }) => {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 2fr', alignItems: 'center', marginBottom: 10, gap: '12px' }}>
            <span style={{ fontWeight: 'bold', color: 'white', textAlign: 'right' }}>{name}</span>
            {children}
            <span style={{ fontStyle: 'italic', color: '#999' }}>{description}</span>
        </div>
    );
};

interface IntegerControlProps {
    name: string;
    value: number;
    description?: string;
    min?: number;
    max?: number;
    onChange: (name: string, value: number) => void;
}

const IntegerControl: React.FC<IntegerControlProps> = ({ name, value, description = '', min = -Infinity, max = Infinity, onChange }) => {
    const handleChange = (value: string | number | null) => {
        if (value !== null && value >= min && value <= max) {
            onChange(name, value as number);
        } else {
            toaster.push(
                <Notification type="warning" header="Error" closable>
                    {`${name} must be between ${min} and ${max}.`}
                </Notification>,
                { placement: 'topEnd' }
            );
        }
    };

    return (
        <LabeledControl name={name} description={description}>
            <InputNumber
                value={value}
                onChange={handleChange}
                min={min}
                max={max}
                step={1}
                size="md"
                style={{ width: 'max(100pt,10%)' }}
            />
        </LabeledControl>
    );
};

interface TagTextInputProps {
    name: string;
    value: string;
    description?: string;
    tags?: string[];
    onChange: (name: string, value: string) => void;
}

const TagTextInput: React.FC<TagTextInputProps> = ({ name, value, description = '', tags = [], onChange }) => {
    return (
        <LabeledControl name={name} description={description}>
            <InlineEdit defaultValue={value} style={{ width: '100%' }}>
                {(props: any, ref: any) => {
                    const { value, onChange: onEditChange, plaintext, ...rest } = props;

                    if (plaintext) {
                        return <Highlight query={tags}>{value}</Highlight>;
                    }

                    return <Input {...rest} as="input" ref={ref} value={value} onChange={onEditChange} onBlur={(event) => {
                        onChange(name, event.target.value);
                    }} />;
                }}
            </InlineEdit>
        </LabeledControl>
    );
};

interface ControlsProps {
    state: Record<string, { type: 'integer' | 'text'; value: number | string; description?: string; min?: number; max?: number; tags?: string[] }>;
    onChange: (name: string, value: number | string) => void;
}







interface IntegerTagControlsProps {
    name: string;
    values: Record<string, number>;
    description?: string;
    onChange: (name: string, values: Record<string, number>) => void;
}

const IntegerTagControls: React.FC<IntegerTagControlsProps> = ({ name, values, description = '', onChange }) => {
    const handleTagChange = (tags: string[]) => {
        const newValues: Record<string, number> = {};
        tags.forEach((tag) => {
            newValues[tag] = values[tag] || 0;
        });
        onChange(name, newValues);
    };

    const handleIntegerChange = (tag: string, value: number) => {
        onChange(name, { ...values, [tag]: value });
    };

    return (
        <LabeledControl name={name} description={description}>
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
                    <IntegerControl
                        key={tag}
                        name={tag}
                        value={value}
                        min={0}
                        onChange={(_, newValue) => handleIntegerChange(tag, newValue)}
                    />
                ))}
            </div>
        </LabeledControl>
    );
};

interface ControlsProps {
    state: Record<string, { type: 'integer' | 'text' | 'integerTags'; value: number | string | Record<string, number>; description?: string; min?: number; max?: number; tags?: string[] }>;
    onChange: (name: string, value: number | string | Record<string, number>) => void;
}

const Controls: React.FC<ControlsProps> = ({ state, onChange }) => {
    return (
        <List>
            {
                Object.entries(state).map(
                    ([name, controlState]) => {
                        let output="Error: Bad Control"
                        const { type, value, description, min, max, tags } = controlState;
                        if (type === 'integer') {
                             output = (
                                <IntegerControl
                                    key={name}
                                    name={name}
                                    value={value as number}
                                    description={description}
                                    min={min}
                                    max={max}
                                    onChange={onChange}
                                />
                            );
                        } else if (type === 'text') {
                             output = (
                                <TagTextInput
                                    key={name}
                                    name={name}
                                    value={value as string}
                                    description={description}
                                    tags={tags}
                                    onChange={onChange}
                                />
                            );
                        } else if (type === 'integerTags') {
                             output = (
                                <IntegerTagControls
                                    key={name}
                                    name={name}
                                    values={value as Record<string, number>}
                                    description={description}
                                    onChange={onChange}
                                />
                            );
                        }
                        output = <List.Item>
                            {output}
                        </List.Item>
                        return output
                    }
                )
            }
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