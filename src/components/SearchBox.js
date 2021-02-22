import React from 'react';
import { Input, Form } from 'semantic-ui-react';

const SearchBox = ({ label, value, onChange, placeholder, onSubmit, icon, children }) => (
    <div centered='true' className='search-box'>
        <Form onSubmit={onSubmit}>
            <Form.Field>
                <Input
                    value={value}
                    // label={{ content: label, color: 'purple', basic: 'true' }}
                    placeholder={placeholder}
                    onChange={e => { onChange(e.target.value); }}
                    size='large'
                    icon={icon}
                    className='search-box__input'
                    actionPosition='left'
                    action={{
                        color: 'purple',
                        content: label,
                    }}
                />
            </Form.Field>
            {children}
        </Form>
    </div>
);

export default SearchBox;