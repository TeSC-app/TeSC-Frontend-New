import React from 'react';
import { Input, Form } from 'semantic-ui-react';

const SearchBox = ({ label, value, onChange, placeholder, onSubmit, icon, isRegistryInspect }) => (
    <div centered='true' className='search-box'>
        <Form onSubmit={isRegistryInspect ? () => onSubmit(value) : onSubmit}>
            <Form.Field>
                <Input
                    value={value}
                    label={{ content: label, color: 'purple' }}
                    placeholder={placeholder}
                    onChange={e => { onChange(e.target.value); }}
                    size='large'
                    icon={icon}
                    className='search-box__input'
                />
            </Form.Field>
        </Form>
    </div>
);

export default SearchBox;