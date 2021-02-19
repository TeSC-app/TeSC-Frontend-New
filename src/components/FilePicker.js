import React, { Fragment, useState, useRef } from 'react';
import { Label, Button } from 'semantic-ui-react';


const FilePicker = ({ label, onPickFile, isDisabled = false, input }) => {
    const fileInputRef = useRef(null);
    const [fileName, setFileName] = useState(input && input.fileName ? input.fileName : '');
    const [content, setContent] = useState(input && input.content ? input.content : '');
    const [acceptedFiles, setAcceptedFiles] = useState(input && input.acceptedFiles ? input.acceptedFiles : ".pem, .txt, .cer, .cert, .key, .sol");

    /* https://stackoverflow.com/a/56377153 */
    const handlePickFile = (event) => {
        event.preventDefault();

        const reader = new FileReader();
        reader.onload = async (e) => {
            setFileName(fileInputRef.current.files[0].name);
            setContent(e.target.result);
            onPickFile(fileInputRef.current.files[0].name, e.target.result);
        };
        if (event.target.files.length > 0) {
            reader.readAsText(event.target.files[0]);
        }
    };

    return (
        <Fragment>
            <Button
                basic
                color='purple'
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
                accept={acceptedFiles}
                hidden
            />
            {!!fileName && <Label basic pointing='left'>{fileName}</Label>}
        </Fragment>
    );
};

export default FilePicker;