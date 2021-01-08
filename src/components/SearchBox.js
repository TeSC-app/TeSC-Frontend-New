import React from 'react';
import { Input, Form } from 'semantic-ui-react';

const SearchBox = ({ label, value, onChange, placeholder, onSubmit, icon }) => (
    <div centered='true' style={{ marginBottom: '50px', marginTop: '50px', textAlign: 'center' }}>
        <Form onSubmit={onSubmit}>
            <Form.Field>
                <Input
                    value={value}
                    label={label}
                    placeholder={placeholder}
                    onChange={e => { onChange(e.target.value); }}
                    size='large'
                    icon={icon}
                    style={{ width: '75%' }}
                />
            </Form.Field>
        </Form>
    </div>
);

export default SearchBox;