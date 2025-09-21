import React, { useState } from 'react';
import { ClipLoader } from 'react-spinners';
import Editor from 'react-simple-wysiwyg';
import FileDropZone from '../../FileDropzone';
import "../../../components/pages/on-board.css"
import { toast } from 'react-toastify';
import axios from 'axios';
import { auth } from '.././../../firebase';
import withAdminAuth from '../../ProtectionHOCs/withAdminAuth';
const BlogCreation = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState({
        mainContent: '',
        image: null
    })
    const [html, setHtml] = useState('my <b>HTML</b>');

    function onChange(e) {
        setHtml(e.target.value);
    }



    const onSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('mainContent', data.mainContent.toString());

        formData.append(data.image.name, data.image.image);
        setLoading(true);
        const token = await auth.currentUser.getIdToken();

        axios
            .post(process.env.NODE_ENV === "production" ?
                `https://freedombot.online/blogs/create` : 'http://localhost:8001/blogs/create', formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    }

                })
            .then((res) => {
                toast.success('Update the  Blog Content Successfully');
                setLoading(false);
            })
            .catch((err) => {
                console.log(err)
                setLoading(false);
                toast.error('Error Updating the Blog content');
            });
    };
    const handleFilesSelected = (filetype, files) => {
        const newImage = {
            name: filetype,
            image: files[0],
        };
        setData({ ...data, image: newImage });
    };

    return (
        <form
            onSubmit={onSubmit}
            className="w-full h-full p-2 text-sm"
        >
            <h2 className="text-[17px] font-medium  text-white my-2">
                Create a new Blog
            </h2>
            <p className="text-white my-2">Blog Image</p>
            <div className="my-2">
                <FileDropZone
                    fileType="photo"
                    onFilesSelected={handleFilesSelected}
                    title="Main Blog Image"
                />

            </div>
            <div className=" flex">
                <div className="w-full">
                    <p className="text-white my-2">Announcement</p>
                    {/* <textarea
                        onChange={(e) => setData({ ...data, mainContent: e.target.value })}
                        value={data?.mainContent}
                        placeholder="Enter Content of the blog"
                        className="text-white glass_morphism  rounded-md border-[2px] border-[rgba(67,67,67,0.09)] w-full px-3 py-2 outline-none"
                    ></textarea> */}
                    <Editor  containerProps={{ style: { 'background': '#fff', color: '#000' } }} onChange={(e) => setData({ ...data, mainContent: e.target.value })}
                        value={data?.mainContent} />
                </div>

            </div>


            <div className="my-10 flex flex-row gap-10">
                <button className="glass_morphism text-white rounded-md  border-[2px] border-[rgba(67,67,67,0.09)] px-5 py-2">
                    Cancel
                </button>
                <div>
                    {!loading ? (
                        <button
                            type="submit"
                            className="bg-[#ca217ebb] rounded-md text-white px-5 py-2 cursor-pointer"
                        >
                            Create Blog
                        </button>
                    ) : (
                        <div className="bg-[rgba(82,56,115)] rounded-md text-white px-5 py-2 cursor-wait">
                            <ClipLoader color="white" size={15} />
                        </div>
                    )}
                </div>
            </div>
        </form>
    );
};

export default withAdminAuth(BlogCreation);