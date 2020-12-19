import React from 'react'
import { Form, Button } from 'semantic-ui-react'

function Search({searchDisabled, handleInput, handleSubmit}) {
    
    return (
        <div>
            <Form>
                <Form.Field>
                    <label>Domain</label>
                    <div className="ui search">
                        <div className="ui icon input">
                            <input className="prompt" type="text" placeholder="www.mysite.com" onChange={handleInput} />
                                <Button className="buttonSearch" disabled={searchDisabled} onClick={handleSubmit}><i className="search icon"></i></Button>
                        </div>
                        <div className="results"></div>
                    </div>
                </Form.Field>
            </Form>

        </div>
    )
}

export default Search
