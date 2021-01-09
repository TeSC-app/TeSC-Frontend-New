import React from 'react';
import { Input, Form } from 'semantic-ui-react';
import '../styles/SearchBox.scss'

const SearchBox = ({ label, value, onChange, placeholder, onSubmit, icon }) => (
    <div centered='true' className='searchBoxContainer'>
        <Form onSubmit={onSubmit}>
            <Form.Field>
                <Input
                    value={value}
                    label={label}
                    placeholder={placeholder}
                    onChange={e => { onChange(e.target.value); }}
                    size='large'
                    icon={icon}
                    className='searchBoxInput'
                />
            </Form.Field>
        </Form>
    </div>
);

export default SearchBox;