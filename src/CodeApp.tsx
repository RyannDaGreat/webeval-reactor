// @ts-nocheck
import React from 'react';
import { InlineEdit, Highlight, Input } from 'rsuite';

interface TagTextInputProps {
  tags: string[];
  value: string;
  onChangeValue: (newValue: string) => void;
}

const TagTextInput: React.FC<TagTextInputProps> = ({ tags, value, onChangeValue }) => (
  <InlineEdit defaultValue={value} style={{ width: '100%' }}>
    {(props, ref) => {
      const { value, onChange, plaintext, ...rest } = props;

      if (plaintext) {
        return (
          <Highlight query={tags}>
            {value}
          </Highlight>
        );
      }

      return (
        <Input
          {...rest}
          as="input"
          ref={ref}
          value={value}
          onChange={onChange}
          onBlur={(event) => {
            onChangeValue(event.target.value);
          }}
        />
      );
    }}
  </InlineEdit>
);


const App = () => {
    const tags = ['h', 'high performance'];
    const initialValue = 'React Suite is a set of react components that have high quality and high performance.';
  
    const handleChangeValue = (newValue) => {
      console.log('New value:', newValue);
    };
  
    return (
      <TagTextInput
        tags={tags}
        value={initialValue}
        onChangeValue={handleChangeValue}
      />
    );
  };
  
  export default App;