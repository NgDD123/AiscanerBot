import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import FileDropZone from "../../FileDropzone";
import useGet from "../../../hooks/useGet";
import Editor from "react-simple-wysiwyg";


const ViewBlogModal = () => {
    const { blogId } = useParams();
    console.log("here is the location", blogId)
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState({
        mainContent: '',
        image: null
    })

    const { data: blog, loading: fetchingBlogs, error } = useGet(`blogs/by-id/${blogId}`);
    // This effect will only run when the 'blog' data is available
    useEffect(() => {
        if (blog && blog.mainContent && blog.imgUrl) {  // Ensure blog has content and image
            setData({ mainContent: blog.mainContent, image: blog.imgUrl });
            console.log("here is the blog", blog);
        }
    }, [blog]);

    return (
        <div
            className="w-full h-full p-2 text-sm "
        >
            <h2 className="text-[17px] font-medium  text-white my-2">
                Read Blog
            </h2>
            <div className="my-2">
                <FileDropZone
                    existingFile={blog?.imgUrl}
                    fileType="photo"
                    title="Main Blog Image"
                />

            </div>
            <div className=" flex">
                <div className="w-full">
                    <p className="text-white my-2">Announcement</p>
                    <div
                        style={{ whiteSpace: 'pre-wrap' }}
                        dangerouslySetInnerHTML={{ __html: data?.mainContent }}
                        disabled

                        className="text-white glass_morphism  rounded-md border-[2px] border-[rgba(67,67,67,0.09)] w-full px-3 py-2 outline-none h-fit"
                    />
                </div>

            </div>



        </div>
    )

}
export default ViewBlogModal;