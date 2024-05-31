// @ts-nocheck
import React from 'react';
import { InputNumber, Notification, InlineEdit, Highlight, Input } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';
import { toaster } from 'rsuite';

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
                style={{ width: 'max(50pt,10%)' }}
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

const Controls: React.FC<ControlsProps> = ({ state, onChange }) => {
    return (
        <div>
            {Object.entries(state).map(([name, controlState]) => {
                const { type, value, description, min, max, tags } = controlState;

                if (type === 'integer') {
                    return (
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
                } else {
                    return (
                        <TagTextInput
                            key={name}
                            name={name}
                            value={value as string}
                            description={description}
                            tags={tags}
                            onChange={onChange}
                        />
                    );
                }
            })}
        </div>
    );
};

const App: React.FC = () => {
    const [state, setState] = React.useState<Record<string, { type: 'integer' | 'text'; value: number | string; description?: string; min?: number; max?: number; tags?: string[] }>>({
        A: { type: 'integer', min: -999, max: 999, description: 'The first one', value: 123 },
        Bobobo: { type: 'integer', max: 999, description: 'The second one', value: 456 },
        Text: {
            type: 'text',
            value: 'React Suite is a set of react components that have high quality and high performance.',
            description: 'Edit the text and see the highlighted tags',
            tags: ['h', 'high performance'],
        },
    });

    const handleChange = (name: string, value: number | string) => {
        setState((prevState) => ({ ...prevState, [name]: { ...prevState[name], value } }));
    };

    return (
        <div style={{ padding: 20 }}>
            <hr/>
            <hr/>
            <Controls state={state} onChange={handleChange} />
            <hr/>
            <Controls state={state} onChange={handleChange} />
        </div>
    );
};

export default App;