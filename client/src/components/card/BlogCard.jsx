import "../pages/on-board.css"
const BlogCard = ({ blog, id }) => {
    return (
        <div className="flex flex-col rounded glass_morphism hover:scale-95 hover:cursor-pointer transition-all duration-300 delay-300 hover:backdrop-blur-lg gap-y-4 ">
            <img src={blog?.imgUrl} className="max-w-full max-h-[13rem] rounded" alt="blog_img" />
            <div style={{ whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: blog.mainContent.length > 90 ? `${blog?.mainContent.substring(0, 80)} ...` : blog?.mainContent }} className="font-sans text-white  px-2 leading-6 h-[20%]">
                {/* {blog?.mainContent.substring(0, 80)}{""}{blog?.mainContent.length > 80 && '...'} */}
            </div>
            <a className="text-[#ca217ebb] p-2" href={`/blog-read/${id}`}>Read More</a>
        </div>

    )

}
export default BlogCard;