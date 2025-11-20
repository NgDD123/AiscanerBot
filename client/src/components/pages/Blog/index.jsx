import EditBlogCard from "../../card/EditBlog";
import useGet from "../../../hooks/useGet";
import "../Admin/AdminDashboard.css";
import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { auth } from "../../../firebase";
import { ClipLoader } from "react-spinners";

const BlogManagement = () => {
  const { data: blogs, loading: fetchingBlogs, error } = useGet("blogs/all");
  console.log("here are the fetched blogs", blogs);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [blogToDeleteId, setBlogToDeleteId] = useState(false);

  const handleCreateBlog = () => {
    window.location.href = "/blog-create";
  };

  const handleDelete = (id) => {
    setIsModalOpen(true);
    setBlogToDeleteId(id);
  };
  const handleDeleteConfirm = async (e) => {
    e.preventDefault();
    setIsDeleting(true);
    const token = await auth.currentUser.getIdToken();

    axios
      .delete(
        process.env.NODE_ENV === "production"
          ? `https://freedombot.online/blogs/delete/${blogToDeleteId}`
          : `http://localhost:8001/blogs/delete/${blogToDeleteId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .then((res) => {
        console.log("Blog deleted", res);
        toast.success("Blog deleted successfully!");
        setIsModalOpen(false);
      })
      .catch((err) => {
        console.error("Error deleting blog", err);
        toast.error("Error deleting blog!");
        setIsModalOpen(false);
      })
      .finally(() => {
        setIsDeleting(false);
        window.location.reload();
      });
  };
  return (
    <main className="w-full flex flex-col">
      <p className="text-white font-sans ">
        Got some thing on Your mind, Just jot it down and share it with your
        peers for a fair improvement in the affair!
      </p>
      <div className="w-full flex justify-end">
        <button
          className="flex gap-x-4 bg-[#ca217ebb] border-none outline-none rounded-xl text-white p-3"
          onClick={handleCreateBlog}
        >
          Create New Blog
        </button>
      </div>
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        {Array.isArray(blogs) &&
          blogs.map((blog, index) => (
            <EditBlogCard
              handleDelete={handleDelete}
              blogId={blog.id}
              blog={blog.data}
              key={index}
            />
          ))}
      </div>
      {isModalOpen && (
        <div className="modal">
          <div className="glass_morphism p-4 flex flex-col gap-y-6 w-[36%]">
            <p className="text-white flex justify-center  font-semibold">
              Delete Blog
            </p>
            <p className="text-white text-center font-light">
              Are you sure you want to delete this blog!
            </p>

            <div className="flex justify-center">
              {!isDeleting ? (
                <button
                  onClick={handleDeleteConfirm}
                  className="p-4 py-2 rounded-lg bg-red-500 text-white text-center"
                >
                  Confirm
                </button>
              ) : (
                <div className="p-4 py-2 rounded-lg bg-red-500 flex justify-center items-center">
                  <ClipLoader color="white" size={15} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
export default BlogManagement;
