import React from 'react';
import { Input, Form } from 'semantic-ui-react';


const SearchBox = ({ value, onChange, placeholder, onSubmit }) => {
    <Form onSubmit={onSubmit}>
        <Form.Field>
            <Input
                value={value}
                label='TeSC Address'
                placeholder={placeholder}
                onChange={e => { onChange(e.target.value); }}
                size='large'
                icon='search'
                style={{ width: '75%' }}
            />
        </Form.Field>
    </Form>;

};

export default SearchBox;