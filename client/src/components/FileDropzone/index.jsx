import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import '../pages/on-board.css'

const FileDropZone = ({ fileType, onFilesSelected, title, existingFile }) => {
    const [selectedImage, setSelectedImage] = useState(null);

    const onDrop = (acceptedFiles) => {
        onFilesSelected(fileType, acceptedFiles);
        const file = acceptedFiles[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setSelectedImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };
    useEffect(() => {
        if (existingFile) {
            setSelectedImage(existingFile);
        }
    }, [existingFile]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/png': ['.png', '.PNG', '.jpg', '.JPG', '.jpeg', '.JPEG'],
        },
    });

    const handlePaste = (e) => {
        const items = e.clipboardData?.items;

        if (items) {
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();

                    const reader = new FileReader();
                    reader.onload = () => {
                        setSelectedImage(reader.result);
                    };
                    if (blob) reader.readAsDataURL(blob);
                    onFilesSelected(fileType, [blob]);
                    break;
                }
            }
        }
    };
    return (
        <div
            {...getRootProps()}
            className={`dropzone ${isDragActive ? 'active glass_morphism 10,82,0.1)]' : ''}`}
            onPaste={handlePaste}
        >
            <input disabled={selectedImage != null} {...getInputProps()} />
            {selectedImage !== null ? (
                <div className="glass_morphism w-fit rounded-md border-[2px] border-[rgba(67,67,67,0.09)] flex flex-col gap-5 justify-center items-center max-h-[18rem] ">
                    <img
                        src={selectedImage}
                        alt="Selected"
                        className="w-full h-full object-contain rounded-lg"
                    />
                </div>
            ) : (
                <div>
                    {isDragActive ? (
                        <div className="glass_morphism h-[300px] rounded-md border-[2px] border-[rgba(67,67,67,0.09)] flex flex-col gap-5 justify-center items-center p-2 ">
                            <p className="text-white  text-[28px] font-semibold">
                                Select or Drop/Copy the file here
                            </p>
                        </div>
                    ) : (
                        <div className="glass_morphism h-[300px] rounded-md border-[2px] border-[rgba(67,67,67,0.09)] flex flex-col gap-5 justify-center  items-center p-2">
                            <p className="text-white text-center text-[28px] font-semibold">
                                Drag & Drop or Select/Copy
                            </p>
                            <p className="text-[rgba(73,73,74,0.78)] text-sm font-medium">{title}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FileDropZone;