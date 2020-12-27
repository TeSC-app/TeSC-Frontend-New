import React, { useState } from 'react'
import { Accordion, Icon, Header, Grid } from 'semantic-ui-react'

function FAQ() {

    const [activeIndex, setActiveIndex] = useState(0)

    const handleClick = (e, titleProps) => {
        const { index } = titleProps
        const newIndex = activeIndex === index ? -1 : index
        setActiveIndex(newIndex)
    }

    return (

        <div>
            <Header as='h1' content='FAQ' className="headerFAQ" />
            <Grid columns={3}>
                <Grid.Row>
                    <Grid.Column>
                        <Header as='h2'>
                            <div className='headerGridFAQIcon'><Icon name='info circle' size='huge' /></div>
                            <Header.Content className='headerGridFAQText'>
                                What is TeSC?
                            <Header.Subheader>TeSC = TLS/SSL-endorsed Smart Contracts<br />
                            TeSC uses TLS/SSL certificates to establish secure bindings between domains and Ethereum Smart Contracts</Header.Subheader>
                            </Header.Content>
                        </Header>

                    </Grid.Column>
                    <Grid.Column>
                        <Header as='h2'>
                            <div className='headerGridFAQIcon'><Icon name='info circle' size='huge' /></div>
                            <Header.Content className='headerGridFAQText'>
                                Why use TeSC?
                            <Header.Subheader>
                                    1) To establish a secure binding between your domain and your Smart Contract<br />
                        2) To ensure that transactions are sent to your Smart Contract, not to the Smart Contract of an imposter<br />
                        3) Hackers cannot steal your money by replacing the Smart Contract address on your website
                    </Header.Subheader>
                            </Header.Content>
                        </Header>
                    </Grid.Column>
                    <Grid.Column>
                        <Header as='h2'>
                            <div className='headerGridFAQIcon'><Icon name='info circle' size='huge' /></div>
                            <Header.Content className='headerGridFAQText'>
                                How to create a TeSC?
                            <Header.Subheader>Prerequisite: your website with domain is publicly available (via the internet)
                                <Accordion>
                                        <Accordion.Title
                                            active={activeIndex === 4}
                                            index={4}
                                            onClick={handleClick}
                                        >
                                            <div style={{textAlign: 'center'}}><Icon name='dropdown' />
                                        See instructions</div>
                                        </Accordion.Title>
                                        <Accordion.Content active={activeIndex === 4}>
                                            <ol>
                                                <li>Create a new Smart Contract that implements the TeSC and ERC165 interfaces (Link to Remix with code).</li>
                                                <li>Compile your Smart Contract to generate the JSON file.</li>
                                                <li>Go to (Link to TeSCNew page).</li>
                                                <li>Enter your domain, choose an expiry date, and select flags.</li>
                                                <li>Upload the private key of your domain‘s TLS/SSL certificate to automatically create a signature or paste your manually created signature.</li>
                                                <li>Upload the JSON file from step 2.</li>
                                            </ol>
                                        </Accordion.Content>
                                    </Accordion>

                                </Header.Subheader>
                            </Header.Content>
                        </Header>
                    </Grid.Column>
                </Grid.Row>

                <Grid.Row>
                    <Grid.Column>
                        <Header as='h2'>
                            <div className='headerGridFAQIcon'><Icon name='info circle' size='huge' /></div>
                            <Header.Content className='headerGridFAQText'>
                                Account Settings
                            <Header.Subheader>Manage your preferences</Header.Subheader>
                            </Header.Content>
                        </Header>
                    </Grid.Column>
                    <Grid.Column>
                        <Header as='h2'>
                            <div className='headerGridFAQIcon'><Icon name='info circle' size='huge' /></div>
                            <Header.Content className='headerGridFAQText'>
                                Account Settings
                            <Header.Subheader>Manage your preferences</Header.Subheader>
                            </Header.Content>
                        </Header>
                    </Grid.Column>
                    <Grid.Column>
                        <Header as='h2'>
                            <div className='headerGridFAQIcon'><Icon name='info circle' size='huge' /></div>
                            <Header.Content className='headerGridFAQText'>
                                Account Settings
                            <Header.Subheader>Manage your preferences</Header.Subheader>
                            </Header.Content>
                        </Header>
                    </Grid.Column>
                </Grid.Row>
            </Grid>
            <Header as='h2' icon='question circle outline' content='FAQ' />
            <div></div>
            <Accordion styled>
                <Accordion.Title
                    active={activeIndex === 0}
                    index={0}
                    onClick={handleClick}
                >
                    <Icon name='dropdown' />
                    What is TeSC?
                </Accordion.Title>
                <Accordion.Content active={activeIndex === 0}>
                    <p>TeSC = TLS/SSL-endorsed Smart Contracts</p>
                    <p>TeSC uses TLS/SSL certificates to establish secure bindings between domains and Ethereum Smart Contracts</p>
                </Accordion.Content>

                <Accordion.Title
                    active={activeIndex === 1}
                    index={1}
                    onClick={handleClick}
                >
                    <Icon name='dropdown' />
                    Why use TeSC?
                </Accordion.Title>
                <Accordion.Content active={activeIndex === 1}>
                    <p>
                        1) To establish a secure binding between your domain and your Smart Contract<br />
                        2) To ensure that transactions are sent to your Smart Contract, not to the Smart Contract of an imposter<br />
                        3) Hackers cannot steal your money by replacing the Smart Contract address on your website
                    </p>
                </Accordion.Content>

                <Accordion.Title
                    active={activeIndex === 2}
                    index={2}
                    onClick={handleClick}
                >
                    <Icon name='dropdown' />
                    How does TeSC work?
                </Accordion.Title>
                <Accordion.Content active={activeIndex === 2}>
                    <p>
                        1) Smart Contracts using TeSC implement the TeSC interface and store an endorsement<br />
                        2) The endorsement contains a signature that was created with the private key of the linked domain‘s TLS/SSL certificate<br />
                        3) Users can verify that the endorsement is valid, i.e. that the binding between the domain and Smart Contract exists
                    </p>
                </Accordion.Content>
                <Accordion.Title
                    active={activeIndex === 3}
                    index={3}
                    onClick={handleClick}
                >
                    <Icon name='dropdown' />
                    What is the role of the TeSC registry?
                </Accordion.Title>
                <Accordion.Content active={activeIndex === 3}>
                    <p>
                        1) Add your TeSC to the TeSC Registry to prevent downgrade attacks<br />
                        2) Look up all contracts that are tied to a certain domain<br />
                        3) View analytics
                    </p>
                </Accordion.Content>
            </Accordion>
        </div>
    )
}

export default FAQ
