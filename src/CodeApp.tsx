// @ts-nocheck
import React from 'react';
import { InlineEdit, Highlight, Input } from 'rsuite';

const App = () => (
  <InlineEdit defaultValue="React Suite is a set of react components that have high quality and high performance." style={{width:"100%"}}>
    {(props, ref) => {
      const { value, onChange, plaintext, ...rest } = props;

      if (plaintext) {
        return (
          <Highlight query={['h', 'high performance']}>
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
        />
      );
    }}
  </InlineEdit>
);

export default App;