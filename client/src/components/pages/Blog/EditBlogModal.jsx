import { useParams } from "react-router-dom";
import useGet from "../../../hooks/useGet";
import FileDropZone from "../../FileDropzone";
import { useEffect, useState } from "react";
import { ClipLoader } from "react-spinners";
import { auth } from "../../../firebase";
import axios from "axios";
import { toast } from "react-toastify";
import Editor from "react-simple-wysiwyg";

const EditBlogModal = () => {
  const { blogId } = useParams();
  console.log("here is the location", blogId);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    mainContent: "",
    image: null,
  });

  const {
    data: blog,
    loading: fetchingBlogs,
    error,
  } = useGet(`blogs/by-id/${blogId}`);
  useEffect(() => {
    if (blog && blog.mainContent && blog.imgUrl) {
      // Ensure blog has content and image
      setData({ mainContent: blog.mainContent, image: blog.imgUrl });
    }
  }, [blog]);

  const handleCancel = () => {
    window.history.back();
  };

  const handleEditBlog = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("mainContent", data.mainContent.toString());
    formData.append(data.image.name, data.image.image);
    setLoading(true);
    const token = await auth.currentUser.getIdToken();

    axios
      .patch(
        process.env.NODE_ENV === "production"
          ? `https://freedombot.online/blogs/update-blog/${blogId}`
          : `http://localhost:8001/blogs/update-blog/${blogId}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )
      .then((res) => {
        toast.success("Content updated Successfully");
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
        toast.error("Error Updating the Blog content");
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
    <form onSubmit={handleEditBlog} className="w-full h-full p-2 text-sm">
      <h2 className="text-[17px] font-medium  text-white my-2">Edit Blog</h2>
      <p className="text-white my-2">Blog Image</p>
      <div className="my-2">
        <FileDropZone
          existingFile={blog?.imgUrl}
          fileType="photo"
          onFilesSelected={handleFilesSelected}
          title="Main Blog Image"
        />
      </div>
      <div className=" flex">
        <div className="w-full">
          <p className="text-white my-2">Announcement</p>
          <Editor
            containerProps={{ style: { background: "#fff", color: "#000" } }}
            onChange={(e) => setData({ ...data, mainContent: e.target.value })}
            value={data?.mainContent}
          />
        </div>
      </div>

      <div className="my-10 flex flex-row gap-10">
        <button
          onClick={handleCancel}
          className="glass_morphism text-white rounded-md  border-[2px] border-[rgba(67,67,67,0.09)] px-5 py-2"
        >
          Cancel
        </button>
        <div>
          {!loading ? (
            <button
              type="submit"
              className="bg-[#ca217ebb] rounded-md text-white px-5 py-2 cursor-pointer"
            >
              Update Blog
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
export default EditBlogModal;
