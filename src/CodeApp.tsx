// @ts-nocheck

import React from 'react';
import { InputNumber, Notification } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';
import { toaster } from 'rsuite';

interface IntegerControlProps {
    value: number;
    name: string;
    min: number;
    max: number;
    description: string;
    onChange: (name: string, newValue: number) => void;
}

const IntegerControl: React.FC<IntegerControlProps> = ({
    value,
    name,
    min = -Infinity,
    max = Infinity,
    description = "",
    onChange
}) => {
    const handleChange = (newValue: number) => {
        if (newValue >= min && newValue <= max) {
            onChange(name, newValue);
        } else {
            toaster.push(
                <Notification type="warning" header="Error" closable>
                    {`${name} must be between ${min} and ${max}.`}
                </Notification>,
                {placement: "topEnd"}
            );
        }
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10, gap: '12px' }}>
            <span style={{ fontWeight: 'bold', color: 'white', marginRight: 10, width: '100px', textAlign: 'right' }}>{name}</span>
            <InputNumber
                value={value}
                onChange={handleChange}
                min={min}
                max={max}
                step={1}
                size="md"
                style={{ width: "max(50pt,10%)" }}
            />
            <span style={{ fontStyle: 'italic', color: '#999', marginLeft: 10 }}>{description}</span>
        </div>
    );
};

interface IntegerControlsProps {
    state: Record<string, { min: number, max: number, description: string, value: number }>;
    onChange: (name: string, value: number) => void;
}

const IntegerControls: React.FC<IntegerControlsProps> = ({ state, onChange }) => {
    return (
        <div>
            {Object.entries(state).map(([name, { min, max, description, value }]) => (
                <IntegerControl
                    key={name}
                    name={name}
                    value={value}
                    min={min}
                    max={max}
                    description={description}
                    onChange={onChange}
                />
            ))}
        </div>
    );
};

// Example of usage in a demo app
const App: React.FC = () => {
    const [state, setState] = React.useState({
        A: { min: -999, max: 999, description: "The first one", value: 123 },
        Bobobo: { max: 999, description: "The second one", value: 456 },
    });

    const handleChange = (name: string, value: number) => {
        setState(prevState => ({ ...prevState, [name]: { ...prevState[name], value } }));
    };

    return (
        <div style={{ padding: 20 }}>
            <IntegerControls state={state} onChange={handleChange} />
        </div>
    );
};

export default App;