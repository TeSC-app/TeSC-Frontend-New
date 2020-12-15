import React from 'react';
import { Tab, Input, Form, TextArea, Checkbox, Container, Button } from 'semantic-ui-react';

import DayPickerInput from 'react-day-picker/DayPickerInput';
import 'react-day-picker/lib/style.css';



const Dashboard = () => {

    return (
        <Container className="content">
            <Form>
                <Form.Group widths='equal'>
                    <Form.Field label='Domain' control={Input} placeholder='www.mysite.com' />
                    <Form.Field label='Expiry' control={DayPickerInput} />
                </Form.Group>
                <Form.Field label='Signature' control={TextArea} />
                <Form.Group grouped>
                    <label>Flags</label>
                    <Form.Field label='DOMAIN_HASHED' control={Checkbox} />
                    <Form.Field label='EXCLUSIVE' control={Checkbox} />
                </Form.Group>
                <Button floated='right' positive>Deploy</Button>
            </Form>

        </Container>
    );
};

export default Dashboard;