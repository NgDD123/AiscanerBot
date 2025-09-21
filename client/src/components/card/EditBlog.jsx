import "../pages/on-board.css"
const EditBlogCard = ({ blog, blogId, handleDelete }) => {
    const handleEdit = () => {
        // Redirect to edit blog page with blog data
        window.location.href = `/blog-update/${blogId}`;
    }


    return (
        <div className="flex flex-col rounded glass_morphism hover:scale-95 hover:cursor-pointer transition-all duration-300 delay-300 hover:backdrop-blur-lg gap-y-4">
            <img src={blog?.imgUrl} className="max-w-full max-h-[13rem] rounded" alt="blog_img" />
            <div style={{ whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: blog.mainContent.length > 90 ? `${blog?.mainContent.substring(0, 80)} ...` : blog?.mainContent }} className="font-sans text-white  px-2 leading-6 h-[20%]">
                {/* {blog?.mainContent.substring(0, 80)}{""}{blog?.mainContent.length > 80 && '...'} */}
            </div>
            <div className="flex items-center pl-4 py-4">
                <button onClick={handleEdit} className="px-4 py-2 rounded text-white bg-major-text-style hover:bg-major-text-style-hover transition-all duration-300 ease-in-out">
                    Edit
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(blogId);
                    }}
                    className="px-4 py-2 bg-red-500 rounded text-white hover:text-major-text-style-hover transition-all duration-300 ease-in-out ml-4"
                >
                    Delete
                </button>
            </div>
        </div>

    )

}
export default EditBlogCard;