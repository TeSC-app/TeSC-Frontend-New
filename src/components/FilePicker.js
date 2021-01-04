import React, { Fragment, useState, useRef } from 'react';
import { Label, Button } from 'semantic-ui-react';


const FilePicker = ({ label, onPickFile, isDisabled=false, }) => {
    const fileInputRef = useRef(null);
    const [fileName, setFileName] = useState('');

    /* https://stackoverflow.com/a/56377153 */
    const handlePickFile = (event) => {
        event.preventDefault();

        const reader = new FileReader();
        reader.onload = async (e) => {
            setFileName(fileInputRef.current.files[0].name)
            onPickFile(e.target.result)
        };
        if(event.target.files.length > 0){
            reader.readAsText(event.target.files[0]);
        }
    };

    return (
        <Fragment>
            <Button
                content={label}
                labelPosition="left"
                icon="file"
                onClick={() => fileInputRef.current.click()}
                disabled={isDisabled}
            />
            <input
                ref={fileInputRef}
                type="file"
                onChange={handlePickFile}
                accept=".pem, .txt, .cer, .cert, .key"
                hidden
            />
            {!!fileName && <Label basic pointing='left'>{fileName}</Label>}
        </Fragment>
    );
};

export default FilePicker;