import React from 'react'
import { Form, Button, Icon } from 'semantic-ui-react'
import '../styles/SearchComponent.scss'

function SearchComponent({searchDisabled, handleInput, handleSubmit}) {
    
    return (
        <div>
            <Form>
                <Form.Field>
                    <label>Domain</label>
                    <div className="ui search">
                        <div className="ui icon input searchContainer">
                            <input className="prompt" type="text" placeholder="www.mysite.com" onChange={handleInput} maxLength="253" />
                                <Button className="searchButton" icon disabled={searchDisabled} onClick={handleSubmit}><Icon name="search"/></Button>
                        </div>
                    </div>
                </Form.Field>
            </Form>

        </div>
    )
}

export default SearchComponent
